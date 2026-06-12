// enrich/composio.ts — Composio NO_AUTH news search (sponsor: Composio).
// EXACT live-verified shape from scripts/preflight.mjs (2026-06-12):
//   POST https://backend.composio.dev/api/v3/tools/execute/COMPOSIO_SEARCH_NEWS_SEARCH
//   headers { x-api-key }, body { user_id, arguments: { query } }
// The slug MUST be the _SEARCH-suffixed one — bare COMPOSIO_SEARCH_NEWS 404s (Tool_ToolNotFound).
// Seam logs: status + result count. NEVER the key.

const COMPOSIO_EXECUTE_URL =
  "https://backend.composio.dev/api/v3/tools/execute/COMPOSIO_SEARCH_NEWS_SEARCH";
const TIMEOUT_MS = 20_000;

export interface ComposioNewsHit {
  title: string;
  url: string;
  snippet: string;
}

/** Largest array of objects anywhere in the nested response (Composio shapes vary by action). */
function largestArray(result: unknown): unknown[] {
  if (!result || typeof result !== "object") return [];
  const stack: unknown[] = [result];
  let best: unknown[] = [];
  let depth = 0;
  while (stack.length > 0 && depth < 1000) {
    depth++;
    const node = stack.pop();
    if (Array.isArray(node)) {
      if (node.length > best.length) best = node;
      continue;
    }
    if (node && typeof node === "object") {
      for (const v of Object.values(node)) if (v && typeof v === "object") stack.push(v);
    }
  }
  return best;
}

/**
 * Live Composio news search. Throws on missing key / HTTP failure (callers degrade LOUDLY).
 * Returns [] when the search legitimately finds nothing — that absence IS evidence
 * (a claim with zero news hits stays unsupported).
 */
export async function composioSearchNews(query: string): Promise<ComposioNewsHit[]> {
  const key = process.env.COMPOSIO_API_KEY;
  if (!key) {
    throw new Error("[composio] COMPOSIO_API_KEY missing -> FAIL (set it in .env or run STUB_MODE=1)");
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const t0 = Date.now();
  try {
    const resp = await fetch(COMPOSIO_EXECUTE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key },
      body: JSON.stringify({ user_id: "sayhello", arguments: { query: query.slice(0, 300) } }),
      signal: ctrl.signal,
    });
    const body = (await resp.json().catch(() => null)) as { data?: unknown; error?: unknown } | null;
    if (resp.status !== 200 || body?.error) {
      console.error(
        `[seam] node:enrich -> COMPOSIO_SEARCH_NEWS_SEARCH "${query.slice(0, 50)}" -> HTTP ${resp.status} -> FAIL`,
      );
      throw new Error(`[composio] COMPOSIO_SEARCH_NEWS_SEARCH -> HTTP ${resp.status}`);
    }
    const raw = largestArray(body?.data) as Array<Record<string, unknown>>;
    const hits: ComposioNewsHit[] = raw
      .map((r) => ({
        title: String(r.title ?? r.name ?? ""),
        url: String(r.link ?? r.url ?? ""),
        snippet: String(r.snippet ?? r.description ?? r.source ?? ""),
      }))
      .filter((h) => h.url)
      .slice(0, 5);
    console.log(
      `[seam] node:enrich -> COMPOSIO_SEARCH_NEWS_SEARCH "${query.slice(0, 50)}" -> HTTP 200 results=${hits.length} -> ok (${Date.now() - t0}ms)`,
    );
    return hits;
  } finally {
    clearTimeout(timer);
  }
}
