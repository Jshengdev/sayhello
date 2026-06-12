// TinyFish → Firecrawl → cheerio cascade for URL → markdown extraction.
//
// Tier order and cost asymmetry WHY:
//   1. TinyFish Fetch   — cheapest: 1 credit per 15 URLs, ~3s, real-browser render + JS.
//   2. TinyFish Agent   — ~15× more expensive than Fetch; use only when Fetch fails AND
//                         caller supplies a natural-language goal for structured extraction.
//   3. Firecrawl        — broader anti-bot coverage; 1 credit per URL scrape.
//   4. raw fetch+cheerio — zero cost, zero anti-bot bypass; works for static HTML only.
//
// FAIL LOUD per CLAUDE.md Rule 6: only throws after ALL tiers fail.

import * as cheerio from "cheerio";
import { log } from "../logger.js";

const TINYFISH_FETCH_URL = "https://api.fetch.tinyfish.ai";
const TINYFISH_AGENT_URL = "https://agent.tinyfish.ai/v1/automation/run";
const FIRECRAWL_API_BASE = "https://api.firecrawl.dev/v1";

const FETCH_TIMEOUT_MS = 60_000;   // TinyFish Fetch: fast (~3s) but allow headroom for slow sites
const AGENT_TIMEOUT_MS = 90_000;   // TinyFish Agent: can take 30-60s for complex navigation
const FIRECRAWL_TIMEOUT_MS = 30_000;
const RAW_FETCH_TIMEOUT_MS = 15_000;

const TINYFISH_API_KEY = process.env.TINYFISH_API_KEY ?? "";
const TINYFISH_MODE = process.env.TINYFISH_MODE ?? "live";
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY ?? "";
const FIRECRAWL_MODE = process.env.FIRECRAWL_MODE ?? (FIRECRAWL_API_KEY ? "live" : "disabled");

export interface ScrapeResult {
  url: string;
  finalUrl?: string;
  title?: string;
  markdown: string;
  source: "tinyfish-fetch" | "tinyfish-agent" | "firecrawl" | "cheerio";
}

export interface SearchHit {
  url: string;
  title?: string;
  description?: string;
}

// Web SEARCH (not URL scrape) via Firecrawl /v1/search — the discovery
// primitive: turns a free-text query ("Johnny Sheng USC twitter") into ranked
// result URLs we can then classify. Honest absence (logged) when Firecrawl is
// disabled/unkeyed: returns [] so the caller can fall back to other discovery
// sources — NOT a throw, because discovery is best-effort enrichment.
export async function searchWeb(query: string, limit = 8): Promise<SearchHit[]> {
  if (FIRECRAWL_MODE !== "live" || !FIRECRAWL_API_KEY) {
    log.warn("search_web_disabled", { reason: "FIRECRAWL_API_KEY unset or FIRECRAWL_MODE!=live", query: query.slice(0, 80) });
    return [];
  }
  const t0 = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FIRECRAWL_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${FIRECRAWL_API_BASE}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${FIRECRAWL_API_KEY}` },
      body: JSON.stringify({ query, limit }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) {
    const snippet = (await response.text()).slice(0, 200);
    throw new Error(`firecrawl-search HTTP ${response.status}: ${snippet}`);
  }
  const payload = (await response.json()) as {
    success?: boolean;
    data?: Array<{ url?: string; title?: string; description?: string }>;
  };
  const hits = (payload.data ?? [])
    .filter((d): d is { url: string; title?: string; description?: string } => typeof d.url === "string")
    .map((d) => ({ url: d.url, title: d.title, description: d.description }));
  log.info("search_web_complete", { query: query.slice(0, 80), hitCount: hits.length, latencyMs: Date.now() - t0 });
  return hits;
}

export async function scrapeUrl(url: string, opts?: { agentGoal?: string }): Promise<ScrapeResult> {
  log.info("tinyfish_fetch_start", { url, hasAgentGoal: !!opts?.agentGoal });

  const tiersAttempted: string[] = [];
  const tierReasons: Record<string, string> = {};

  // Tier 1: TinyFish Fetch
  if (TINYFISH_MODE === "live" && TINYFISH_API_KEY) {
    tiersAttempted.push("tinyfish-fetch");
    const t0 = Date.now();
    try {
      const result = await tinyfishFetch(url);
      if (result) {
        const latencyMs = Date.now() - t0;
        log.info("tinyfish_fetch_complete", {
          url,
          source: "tinyfish-fetch",
          markdownLength: result.markdown.length,
          latencyMs,
        });
        return result;
      }
      tierReasons["tinyfish-fetch"] = "empty result";
      log.warn("tinyfish_tier_failed", { url, tier: "tinyfish-fetch", reason: "empty result" });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      tierReasons["tinyfish-fetch"] = reason;
      log.warn("tinyfish_tier_failed", { url, tier: "tinyfish-fetch", reason });
    }
  }

  // Tier 2: TinyFish Agent (only when Fetch failed AND caller provided a goal)
  if (TINYFISH_MODE === "live" && TINYFISH_API_KEY && opts?.agentGoal) {
    tiersAttempted.push("tinyfish-agent");
    const t0 = Date.now();
    try {
      const result = await tinyfishAgent(url, opts.agentGoal);
      if (result) {
        const latencyMs = Date.now() - t0;
        log.info("tinyfish_fetch_complete", {
          url,
          source: "tinyfish-agent",
          markdownLength: result.markdown.length,
          latencyMs,
        });
        return result;
      }
      tierReasons["tinyfish-agent"] = "non-COMPLETED status";
      log.warn("tinyfish_tier_failed", { url, tier: "tinyfish-agent", reason: "non-COMPLETED status" });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      tierReasons["tinyfish-agent"] = reason;
      log.warn("tinyfish_tier_failed", { url, tier: "tinyfish-agent", reason });
    }
  }

  // Tier 3: Firecrawl
  if (FIRECRAWL_MODE === "live" && FIRECRAWL_API_KEY) {
    tiersAttempted.push("firecrawl");
    const t0 = Date.now();
    try {
      const result = await firecrawlScrape(url);
      if (result) {
        const latencyMs = Date.now() - t0;
        log.info("tinyfish_fetch_complete", {
          url,
          source: "firecrawl",
          markdownLength: result.markdown.length,
          latencyMs,
        });
        return result;
      }
      tierReasons["firecrawl"] = "empty result";
      log.warn("tinyfish_tier_failed", { url, tier: "firecrawl", reason: "empty result" });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      tierReasons["firecrawl"] = reason;
      log.warn("tinyfish_tier_failed", { url, tier: "firecrawl", reason });
    }
  }

  // Tier 4: raw fetch + cheerio
  tiersAttempted.push("cheerio");
  const t0 = Date.now();
  try {
    const result = await cheerioScrape(url);
    const latencyMs = Date.now() - t0;
    log.info("tinyfish_fetch_complete", {
      url,
      source: "cheerio",
      markdownLength: result.markdown.length,
      latencyMs,
    });
    return result;
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    tierReasons["cheerio"] = reason;
    log.warn("tinyfish_tier_failed", { url, tier: "cheerio", reason });
  }

  const allFailed = new Error(
    `[scrape] all tiers failed for ${url} — tiers: ${tiersAttempted.join(", ")}; reasons: ${JSON.stringify(tierReasons)}`,
  );
  log.error("tinyfish_all_tiers_failed", allFailed, { url, tiersAttempted });
  throw allFailed;
}

async function tinyfishFetch(url: string): Promise<ScrapeResult | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(TINYFISH_FETCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": TINYFISH_API_KEY,
      },
      body: JSON.stringify({ urls: [url], format: "markdown" }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const snippet = (await response.text()).slice(0, 200);
    throw new Error(`tinyfish-fetch HTTP ${response.status}: ${snippet}`);
  }

  const data = (await response.json()) as {
    results?: Array<{ text?: string; final_url?: string; title?: string }>;
    errors?: Array<{ error?: string }>;
  };

  const results = data.results ?? [];
  if (results.length > 0) {
    const page = results[0];
    const text = page.text ?? "";
    if (text) {
      return {
        url,
        finalUrl: page.final_url ?? url,
        title: page.title,
        markdown: text,
        source: "tinyfish-fetch",
      };
    }
  }

  const errors = data.errors ?? [];
  if (errors.length > 0) {
    throw new Error(`tinyfish-fetch per-url error: ${errors[0].error ?? "unknown"}`);
  }

  return null;
}

async function tinyfishAgent(url: string, goal: string): Promise<ScrapeResult | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AGENT_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(TINYFISH_AGENT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": TINYFISH_API_KEY,
      },
      body: JSON.stringify({ url, goal, browser_profile: "lite" }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const snippet = (await response.text()).slice(0, 200);
    throw new Error(`tinyfish-agent HTTP ${response.status}: ${snippet}`);
  }

  const data = (await response.json()) as {
    status?: string;
    result?: { result?: string };
    error?: string;
  };

  if (data.status !== "COMPLETED") {
    throw new Error(`tinyfish-agent status=${data.status ?? "unknown"} error=${data.error ?? "none"}`);
  }

  const text = data.result?.result ?? "";
  if (!text) return null;

  return {
    url,
    markdown: text,
    source: "tinyfish-agent",
  };
}

async function firecrawlScrape(url: string): Promise<ScrapeResult | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FIRECRAWL_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${FIRECRAWL_API_BASE}/scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({ url, formats: ["markdown"] }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const snippet = (await response.text()).slice(0, 200);
    throw new Error(`firecrawl HTTP ${response.status}: ${snippet}`);
  }

  const payload = (await response.json()) as {
    success?: boolean;
    data?: { markdown?: string; metadata?: { title?: string; sourceURL?: string } };
  };

  if (!payload.success || !payload.data) {
    throw new Error(`firecrawl response missing success/data: ${JSON.stringify(payload).slice(0, 200)}`);
  }

  const markdown = payload.data.markdown ?? "";
  if (!markdown) return null;

  return {
    url,
    finalUrl: payload.data.metadata?.sourceURL ?? url,
    title: payload.data.metadata?.title,
    markdown,
    source: "firecrawl",
  };
}

async function cheerioScrape(url: string): Promise<ScrapeResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RAW_FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; DoublesBot/0.1)",
        Accept: "text/html",
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`cheerio fetch HTTP ${response.status} for ${url}`);
  }

  const html = await response.text();
  if (!html) throw new Error(`cheerio fetch returned empty body for ${url}`);

  const $ = cheerio.load(html);
  $("script, style, noscript, iframe").remove();

  const title = ($("title").first().text() || $("h1").first().text() || "").trim();
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();

  if (!bodyText) throw new Error(`cheerio extracted empty body for ${url}`);

  return {
    url,
    title: title || undefined,
    markdown: bodyText,
    source: "cheerio",
  };
}
