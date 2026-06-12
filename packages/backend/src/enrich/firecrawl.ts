// enrich/firecrawl.ts — Firecrawl v2 scrape + search (sponsor: Firecrawl, docs/KEYS.md row 1).
//   scrapeUrl: POST /v2/scrape {url, formats:["markdown"]} -> markdown.
//     SUCCESS writes/updates the cache file data/leads/<domain>.json (builds the demo fallback).
//     FAILURE falls back to that cache (visible "cached" notice), else throws (fail LOUD).
//   searchWeb: POST /v2/search — the reenrich node's evidence hunt (fabricated claim text as the query).
// Seam logs: status + markdown length. NEVER the key.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FIRECRAWL_BASE = "https://api.firecrawl.dev/v2";
// repo-root data/leads (src/enrich -> src -> backend -> packages -> sayhello)
const LEADS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../data/leads");

function apiKey(): string {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) throw new Error("[firecrawl] FATAL: FIRECRAWL_API_KEY env var is required (read from .env)");
  return key;
}

export function domainOf(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/[^a-z0-9.-]/gi, "_");
  }
}

interface CachedLead {
  url: string;
  domain: string;
  scrapedAt: string;
  markdown: string;
}

export interface ScrapeResult {
  markdown: string;
  cached: boolean;
  /** Visible provenance note: "live firecrawl 200 (N chars)" or "CACHED <file> from <ts> (live failed: …)". */
  note: string;
}

async function firecrawlScrapeOnce(url: string, timeoutMs = 90_000): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const resp = await fetch(`${FIRECRAWL_BASE}/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey()}` },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
      signal: ctrl.signal,
    });
    const body = (await resp.json().catch(() => null)) as {
      success?: boolean;
      data?: { markdown?: string };
      error?: string;
    } | null;
    const markdown = body?.data?.markdown ?? "";
    console.log(
      `[seam] firecrawl scrape -> ${url} -> status=${resp.status} markdown=${markdown.length} chars -> ${
        resp.ok && markdown ? "ok" : "FAIL"
      }`,
    );
    if (!resp.ok || !body?.success || !markdown) {
      throw new Error(`[firecrawl] scrape ${url} -> ${resp.status} ${body?.error ?? "no markdown"}`);
    }
    return markdown;
  } finally {
    clearTimeout(timer);
  }
}

/** Live scrape; on success update the cache; on failure read the cache (visible notice) or throw. */
export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const domain = domainOf(url);
  const cacheFile = path.join(LEADS_DIR, `${domain}.json`);
  try {
    const markdown = await firecrawlScrapeOnce(url);
    // Build the demo fallback: every live success refreshes the cache.
    try {
      fs.mkdirSync(LEADS_DIR, { recursive: true });
      const cached: CachedLead = { url, domain, scrapedAt: new Date().toISOString(), markdown };
      fs.writeFileSync(cacheFile, JSON.stringify(cached, null, 2));
      console.log(`[seam] lead cache write -> ${cacheFile} -> ${markdown.length} chars -> ok`);
    } catch (cacheErr) {
      console.error(`[seam] lead cache write -> ${cacheFile} -> FAIL (${(cacheErr as Error).message})`);
    }
    return { markdown, cached: false, note: `live firecrawl 200 (${markdown.length} chars)` };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    if (fs.existsSync(cacheFile)) {
      const cached = JSON.parse(fs.readFileSync(cacheFile, "utf8")) as CachedLead;
      const note = `CACHED data/leads/${domain}.json from ${cached.scrapedAt} (live scrape failed: ${reason})`;
      console.warn(`[seam] firecrawl scrape -> ${url} -> falling back to cache -> ${note}`);
      return { markdown: cached.markdown, cached: true, note };
    }
    throw new Error(`[firecrawl] scrape failed AND no cache at data/leads/${domain}.json: ${reason}`);
  }
}

export interface SearchHit {
  url: string;
  title: string;
  description: string;
}

/** Firecrawl /v2/search — the reenrich evidence hunt. Returns [] on no results; throws on HTTP failure. */
export async function searchWeb(query: string, limit = 3, timeoutMs = 45_000): Promise<SearchHit[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const resp = await fetch(`${FIRECRAWL_BASE}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey()}` },
      body: JSON.stringify({ query: query.slice(0, 480), limit, sources: [{ type: "web" }, { type: "news" }] }),
      signal: ctrl.signal,
    });
    const body = (await resp.json().catch(() => null)) as {
      success?: boolean;
      data?: { web?: unknown[]; news?: unknown[] };
      error?: string;
    } | null;
    if (!resp.ok || !body?.success) {
      console.error(`[seam] firecrawl search -> "${query.slice(0, 60)}" -> status=${resp.status} -> FAIL`);
      throw new Error(`[firecrawl] search -> ${resp.status} ${body?.error ?? "unknown"}`);
    }
    const raw = [...(body.data?.web ?? []), ...(body.data?.news ?? [])] as Array<Record<string, unknown>>;
    const hits: SearchHit[] = raw
      .map((r) => ({
        url: String(r.url ?? ""),
        title: String(r.title ?? ""),
        description: String(r.description ?? r.snippet ?? ""),
      }))
      .filter((h) => h.url)
      .slice(0, limit);
    console.log(`[seam] firecrawl search -> "${query.slice(0, 60)}" -> ${hits.length} hits -> ok`);
    return hits;
  } finally {
    clearTimeout(timer);
  }
}
