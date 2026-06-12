// recall/notion.ts — the Story -> Notion writer + the Notion-direct recall fallback (REST, no SDK).
//
// Architecture (docs/AIRBYTE-RECALL.md, REVISED): each grounded sayhello story becomes ONE Notion
// page in a database "sayhello stories". Airbyte's Notion connector then syncs that DB into the
// Context Store so an agent can recall it. Notion is the durable memory surface; Airbyte makes it
// agent-queryable.
//
// FAIL LOUD: every entry point throws a clear, actionable error if NOTION_API_KEY is unset. There is
// NO silent stub — a missing key surfaces as "set NOTION_API_KEY", never a fake success.
//
// Env:
//   NOTION_API_KEY        (required) — Notion internal integration token (secret_… or ntn_…).
//   NOTION_DATABASE_ID    (preferred) — the "sayhello stories" database to write into / query.
//   NOTION_PARENT_PAGE_ID (optional)  — if no DATABASE_ID, ensureDatabase() creates the DB here.

import { log } from "../logger.js";
import type { StoryRecord } from "./storyRecord.js";

const NOTION_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

export const DB_TITLE = "sayhello stories";

export class NotionConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotionConfigError";
  }
}

function apiKey(): string {
  const key = process.env.NOTION_API_KEY;
  if (!key) {
    throw new NotionConfigError(
      "set NOTION_API_KEY — the Airbyte recall add-on needs a Notion integration token to write/query " +
        "the 'sayhello stories' database. Create one at https://www.notion.com/my-integrations, share " +
        "your target page with it, then add NOTION_API_KEY (and NOTION_DATABASE_ID or NOTION_PARENT_PAGE_ID) to .env.",
    );
  }
  return key;
}

export function notionConfigured(): boolean {
  return Boolean(process.env.NOTION_API_KEY);
}

async function notionFetch<T>(pathname: string, init: RequestInit & { method: string }): Promise<T> {
  const resp = await fetch(`${NOTION_BASE}${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await resp.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!resp.ok) {
    const msg =
      body && typeof body === "object" && "message" in body
        ? String((body as { message: unknown }).message)
        : text.slice(0, 300);
    const err = new Error(`[notion] ${init.method} ${pathname} -> ${resp.status} -> ${msg}`);
    log.error("recall.notion.http_error", err, { pathname, method: init.method, status: resp.status });
    throw err;
  }
  return body as T;
}

// ── property mapping ─────────────────────────────────────────────────────────
// Notion rich_text values cap at 2000 chars per text object; keep our chunks well under.
function rt(text: string) {
  return { rich_text: [{ text: { content: text.slice(0, 1900) } }] };
}
function title(text: string) {
  return { title: [{ text: { content: text.slice(0, 1900) } }] };
}
function joinClaims(claims: string[], max = 1800): string {
  if (claims.length === 0) return "—";
  const joined = claims.map((c, i) => `${i + 1}. ${c}`).join("\n");
  return joined.length > max ? `${joined.slice(0, max)}…` : joined;
}

/** Map a StoryRecord -> Notion page properties (matches the schema ensureDatabase creates). */
function recordToProperties(rec: StoryRecord): Record<string, unknown> {
  return {
    Lead: title(rec.lead),
    Person: rt(rec.person ?? "—"),
    Industry: { select: { name: rec.industry } },
    Category: rt(rec.category ?? "—"),
    Angle: rec.angle ? { select: { name: rec.angle } } : { select: null },
    "Grounding Score":
      rec.groundingScore === null ? { number: null } : { number: rec.groundingScore },
    Verdict: rec.verdict ? { select: { name: rec.verdict } } : { select: null },
    "Key Fact": rt(rec.keyFact),
    Pains: rt(rec.pains.length ? rec.pains.map((p) => `• ${p}`).join("\n") : "—"),
    "Grounded Claims": rt(joinClaims(rec.groundedClaims)),
    "Fabricated Claims": rt(joinClaims(rec.fabricatedClaims)),
    "Record Id": rt(rec.id),
    Source: rt(rec.source),
  };
}

// ── database lifecycle ─────────────────────────────────────────────────────────

/**
 * Resolve the target database id. Order:
 *   1. NOTION_DATABASE_ID (use as-is — assumed to be the "sayhello stories" DB).
 *   2. else NOTION_PARENT_PAGE_ID present -> create the DB under that page, return its id.
 * Throws (FAIL LOUD) if neither is set.
 */
export async function ensureDatabase(): Promise<{ id: string; created: boolean }> {
  apiKey(); // fail loud early if no token
  const existing = process.env.NOTION_DATABASE_ID;
  if (existing) {
    log.info("recall.notion.db.use_existing", { databaseId: existing });
    return { id: existing.replace(/-/g, ""), created: false };
  }
  const parent = process.env.NOTION_PARENT_PAGE_ID;
  if (!parent) {
    throw new NotionConfigError(
      "set NOTION_DATABASE_ID (an existing 'sayhello stories' DB) OR NOTION_PARENT_PAGE_ID (a page the " +
        "integration can edit, under which the DB will be created). Neither is set.",
    );
  }

  const created = await notionFetch<{ id: string; url?: string }>("/databases", {
    method: "POST",
    body: JSON.stringify({
      parent: { type: "page_id", page_id: parent },
      title: [{ type: "text", text: { content: DB_TITLE } }],
      properties: {
        Lead: { title: {} },
        Person: { rich_text: {} },
        Industry: {
          select: {
            options: [
              { name: "gtm", color: "blue" },
              { name: "realestate", color: "green" },
              { name: "marketing", color: "purple" },
              { name: "unknown", color: "gray" },
            ],
          },
        },
        Category: { rich_text: {} },
        Angle: { select: {} },
        "Grounding Score": { number: { format: "number" } },
        Verdict: {
          select: {
            options: [
              { name: "emit", color: "green" },
              { name: "regen", color: "red" },
            ],
          },
        },
        "Key Fact": { rich_text: {} },
        Pains: { rich_text: {} },
        "Grounded Claims": { rich_text: {} },
        "Fabricated Claims": { rich_text: {} },
        "Record Id": { rich_text: {} },
        Source: { rich_text: {} },
      },
    }),
  });
  log.info("recall.notion.db.created", { databaseId: created.id, parentPageId: parent });
  return { id: created.id.replace(/-/g, ""), created: true };
}

interface NotionPage {
  id: string;
  url: string;
  properties: Record<string, unknown>;
}

/** Find an existing page for this record id (so re-seeding UPDATES, never duplicates). */
async function findPageByRecordId(databaseId: string, recordId: string): Promise<NotionPage | null> {
  const res = await notionFetch<{ results: NotionPage[] }>(`/databases/${databaseId}/query`, {
    method: "POST",
    body: JSON.stringify({
      filter: { property: "Record Id", rich_text: { equals: recordId } },
      page_size: 1,
    }),
  });
  return res.results[0] ?? null;
}

/** Upsert one StoryRecord as a Notion page. Returns the page url. */
export async function writeStory(databaseId: string, rec: StoryRecord): Promise<string> {
  const props = recordToProperties(rec);
  const existing = await findPageByRecordId(databaseId, rec.id);
  if (existing) {
    const updated = await notionFetch<NotionPage>(`/pages/${existing.id}`, {
      method: "PATCH",
      body: JSON.stringify({ properties: props }),
    });
    log.info("recall.notion.story.updated", { recordId: rec.id, pageId: updated.id });
    return updated.url;
  }
  const created = await notionFetch<NotionPage>("/pages", {
    method: "POST",
    body: JSON.stringify({
      parent: { type: "database_id", database_id: databaseId },
      properties: props,
    }),
  });
  log.info("recall.notion.story.created", { recordId: rec.id, pageId: created.id });
  return created.url;
}

// ── recall fallback: query the Notion DB directly ───────────────────────────────

/** Read a rich_text/title property back to a plain string. */
function readText(prop: unknown): string {
  if (!prop || typeof prop !== "object") return "";
  const p = prop as { title?: { plain_text: string }[]; rich_text?: { plain_text: string }[] };
  const arr = p.title ?? p.rich_text;
  return arr ? arr.map((t) => t.plain_text).join("") : "";
}
function readSelect(prop: unknown): string | null {
  const p = prop as { select?: { name: string } | null };
  return p?.select?.name ?? null;
}
function readNumber(prop: unknown): number | null {
  const p = prop as { number?: number | null };
  return typeof p?.number === "number" ? p.number : null;
}

function pageToRecord(page: NotionPage): StoryRecord {
  const props = page.properties;
  const splitLines = (s: string) =>
    s
      .split("\n")
      .map((l) => l.replace(/^\s*(?:\d+\.|•)\s*/, "").trim())
      .filter((l) => l && l !== "—");
  return {
    id: readText(props["Record Id"]) || page.id,
    lead: readText(props.Lead) || "(untitled)",
    person: readText(props.Person) === "—" ? null : readText(props.Person) || null,
    industry: (readSelect(props.Industry) as StoryRecord["industry"]) ?? "unknown",
    category: readText(props.Category) === "—" ? null : readText(props.Category) || null,
    pains: splitLines(readText(props.Pains)),
    angle: readSelect(props.Angle),
    groundingScore: readNumber(props["Grounding Score"]),
    verdict: readSelect(props.Verdict),
    keyFact: readText(props["Key Fact"]),
    groundedClaims: splitLines(readText(props["Grounded Claims"])),
    fabricatedClaims: splitLines(readText(props["Fabricated Claims"])),
    source: readText(props.Source) || "notion",
    sourceFile: "notion://" + page.id,
    notionUrl: page.url,
  };
}

/**
 * Query the Notion DB and return matching records. Notion has no free-text "search the whole row"
 * filter, so we pull the DB (paginated) and rank locally against `q` (same plain-language matching
 * the offline cache uses). databaseId required.
 */
export async function queryStories(databaseId: string, limit = 100): Promise<StoryRecord[]> {
  const out: StoryRecord[] = [];
  let cursor: string | undefined;
  do {
    const res = await notionFetch<{ results: NotionPage[]; next_cursor: string | null; has_more: boolean }>(
      `/databases/${databaseId}/query`,
      {
        method: "POST",
        body: JSON.stringify({ page_size: Math.min(100, limit), ...(cursor ? { start_cursor: cursor } : {}) }),
      },
    );
    for (const page of res.results) out.push(pageToRecord(page));
    cursor = res.has_more && res.next_cursor ? res.next_cursor : undefined;
  } while (cursor && out.length < limit);
  log.info("recall.notion.query.ok", { databaseId, records: out.length });
  return out;
}
