// recall/recall.ts — the GTM-memory recall engine behind GET /recall?q=…
//
// Three-tier, demo-safe (docs/AIRBYTE-RECALL.md "Demo-safe"):
//   1. PRIMARY  — Airbyte Agent MCP context_store_search (once the connector has indexed Notion).
//   2. FALLBACK — query the Notion DB directly (works the instant stories are written, before
//                 Airbyte indexing finishes).
//   3. OFFLINE  — the local normalized records from data/leads/*.json, ranked by the same plain-
//                 language matcher. ALWAYS available, so the panel never shows an empty demo.
// Every answer is cached to data/recall/<slug>.json so the panel can replay offline if the network
// is down at demo time. The response is honest about which tier answered (`via`) — no silent stubs.

import fs from "node:fs";
import path from "node:path";

import { log } from "../logger.js";
import { airbyteConfigured, airbyteSearch } from "./airbyte.js";
import { notionConfigured, queryStories } from "./notion.js";
import { loadAllRecords, RECALL_DIR, searchableText, type StoryRecord } from "./storyRecord.js";

export type RecallTier = "airbyte-context-store" | "notion-direct" | "offline-cache" | "cache-replay";

export interface RecallResult {
  rec: StoryRecord;
  /** 0..1 relevance to the query (local matcher; airbyte rows default 1). */
  relevance: number;
}

export interface RecallResponse {
  query: string;
  via: RecallTier;
  /** honest note on WHY this tier answered (e.g. "airbyte unconfigured -> notion -> ok"). */
  note: string;
  count: number;
  results: RecallResult[];
  /** which tiers were attempted, in order, with their outcome. */
  trail: string[];
}

// ── plain-language matching ────────────────────────────────────────────────────
// Maps loose query words to record fields. Not NLP — a keyword/industry/intent ranker that makes
// queries like "which real-estate leads have we storied?" and "what pains recur for marketing
// agencies?" return the right rows.

const STOP = new Set([
  "which", "what", "have", "we", "has", "this", "that", "the", "a", "an", "of", "for", "to", "do",
  "did", "does", "is", "are", "any", "our", "us", "with", "and", "or", "show", "me", "find", "list",
  "all", "leads", "lead", "storied", "story", "stories", "touched", "reach", "reached", "recur",
  "recurring", "across", "about", "their", "them", "who", "where", "when", "ever", "before",
]);

const INDUSTRY_HINTS: Record<string, StoryRecord["industry"]> = {
  "real-estate": "realestate",
  "real estate": "realestate",
  realestate: "realestate",
  realty: "realestate",
  property: "realestate",
  properties: "realestate",
  marketing: "marketing",
  agency: "marketing",
  agencies: "marketing",
  brand: "marketing",
  branding: "marketing",
  experiential: "marketing",
  gtm: "gtm",
  saas: "gtm",
  software: "gtm",
};

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9\- ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w));
}

function detectIndustry(q: string): StoryRecord["industry"] | null {
  const lq = q.toLowerCase();
  for (const [hint, ind] of Object.entries(INDUSTRY_HINTS)) {
    if (lq.includes(hint)) return ind;
  }
  return null;
}

/** Score one record against the query. 0 = no match. */
function score(rec: StoryRecord, q: string, tokens: string[], industry: StoryRecord["industry"] | null): number {
  const hay = searchableText(rec);
  let s = 0;
  if (industry && rec.industry === industry) s += 0.5;
  for (const tok of tokens) {
    if (hay.includes(tok)) s += 0.4;
    // person/company name hit is worth more
    if (rec.lead.toLowerCase().includes(tok) || (rec.person ?? "").toLowerCase().includes(tok)) s += 0.4;
  }
  // a generic "what do we have" query (only stopwords) -> everything is mildly relevant.
  if (tokens.length === 0 && !industry) s = 0.2;
  return Math.min(1, s);
}

/** Rank the local corpus. Returns ALL with relevance>0, or (for an empty query) everything. */
export function rankLocal(records: StoryRecord[], q: string, limit = 25): RecallResult[] {
  const tokens = tokenize(q);
  const industry = detectIndustry(q);
  return records
    .map((rec) => ({ rec, relevance: score(rec, q, tokens, industry) }))
    .filter((r) => r.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance || (b.rec.groundingScore ?? 0) - (a.rec.groundingScore ?? 0))
    .slice(0, limit);
}

// ── cache ──────────────────────────────────────────────────────────────────────
function slugify(q: string): string {
  return q.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "query";
}
function cachePath(q: string): string {
  return path.join(RECALL_DIR, `${slugify(q)}.json`);
}
function writeCache(resp: RecallResponse): void {
  try {
    fs.mkdirSync(RECALL_DIR, { recursive: true });
    fs.writeFileSync(cachePath(resp.query), JSON.stringify(resp, null, 2));
    log.info("recall.cache.write", { file: path.basename(cachePath(resp.query)), count: resp.count });
  } catch (err) {
    log.error("recall.cache.write_failed", err, { query: resp.query });
  }
}
function readCache(q: string): RecallResponse | null {
  try {
    const p = cachePath(q);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8")) as RecallResponse;
  } catch (err) {
    log.error("recall.cache.read_failed", err, { query: q });
    return null;
  }
}

// ── the engine ───────────────────────────────────────────────────────────────────
/**
 * Recall stories for a plain-language query. Walks Airbyte -> Notion -> offline, caching the answer.
 * `forceTier` (test/demo) pins a single tier.
 */
export async function recall(q: string, opts: { limit?: number; forceTier?: RecallTier } = {}): Promise<RecallResponse> {
  const limit = opts.limit ?? 25;
  const trail: string[] = [];

  // 1) PRIMARY — Airbyte Context Store
  if (!opts.forceTier || opts.forceTier === "airbyte-context-store") {
    if (airbyteConfigured()) {
      const rows = await airbyteSearch(q, limit);
      if (rows && rows.length > 0) {
        const ranked = rows.map((rec) => ({ rec, relevance: 1 }));
        const resp: RecallResponse = {
          query: q,
          via: "airbyte-context-store",
          note: "airbyte context_store_search -> ok",
          count: ranked.length,
          results: ranked,
          trail: [...trail, "airbyte: ok"],
        };
        writeCache(resp);
        return resp;
      }
      trail.push(rows ? "airbyte: 0 rows (index not ready?) -> fall through" : "airbyte: unreachable/error -> fall through");
    } else {
      trail.push("airbyte: unconfigured (no AIRBYTE_MCP_TOKEN) -> fall through");
    }
    if (opts.forceTier === "airbyte-context-store") {
      return { query: q, via: "airbyte-context-store", note: "forced airbyte tier returned nothing", count: 0, results: [], trail };
    }
  }

  // 2) FALLBACK — Notion direct
  if (!opts.forceTier || opts.forceTier === "notion-direct") {
    if (notionConfigured() && process.env.NOTION_DATABASE_ID) {
      try {
        const all = await queryStories(process.env.NOTION_DATABASE_ID.replace(/-/g, ""), 100);
        const ranked = rankLocal(all, q, limit);
        if (ranked.length > 0) {
          const resp: RecallResponse = {
            query: q,
            via: "notion-direct",
            note: "airbyte not ready -> queried Notion DB directly -> ok",
            count: ranked.length,
            results: ranked,
            trail: [...trail, `notion: ${all.length} pages, ${ranked.length} matched`],
          };
          writeCache(resp);
          return resp;
        }
        trail.push(`notion: ${all.length} pages, 0 matched -> fall through`);
      } catch (err) {
        log.error("recall.notion.query_failed", err, { q });
        trail.push("notion: query failed -> fall through");
      }
    } else {
      trail.push("notion: unconfigured (no NOTION_API_KEY/NOTION_DATABASE_ID) -> fall through");
    }
    if (opts.forceTier === "notion-direct") {
      return { query: q, via: "notion-direct", note: "forced notion tier returned nothing", count: 0, results: [], trail };
    }
  }

  // 3) OFFLINE — local normalized corpus (always works; the demo never goes empty)
  const records = loadAllRecords();
  const ranked = rankLocal(records, q, limit);
  const resp: RecallResponse = {
    query: q,
    via: "offline-cache",
    note:
      trail.length > 0
        ? `live tiers unavailable (${trail.join("; ")}) -> answered from local grounded corpus`
        : "answered from local grounded corpus",
    count: ranked.length,
    results: ranked,
    trail: [...trail, `offline: ${records.length} records, ${ranked.length} matched`],
  };
  writeCache(resp);
  return resp;
}

/** Replay the last cached answer for a query (offline demo safety net). */
export function recallFromCache(q: string): RecallResponse | null {
  const cached = readCache(q);
  if (cached) {
    log.info("recall.cache.replay", { query: q, count: cached.count });
    return { ...cached, via: "cache-replay", note: `replayed cached answer (${cached.note})` };
  }
  return null;
}
