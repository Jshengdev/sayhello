// nodes/ground.ts — [ground]: brief -> brief + builder-traction signals from the ClickHouse PUBLIC
// playground (github.github_events WatchEvents = the claimed-vs-actual star check; hackernews mentions).
// Sponsor: ClickHouse. V2: LIVE by DEFAULT (sql-clickhouse.clickhouse.com, user=demo, no key —
// db-qualified tables per docs/VALIDATION.md). Stub only when STUB_MODE=1. Query failures degrade
// LOUDLY (brief passes through un-augmented, visible log) — grounding enrichment is never fatal.
import { z } from "zod";
import { zCompanyBrief, zIndustry } from "../schemas.js";
import { chEscape, playgroundQuery } from "../store/clickhouse.js";
import type { Signal } from "../types.js";
import { defineNode, stubExplicit } from "./defineNode.js";

// ─────────────────────────────────────────────────────────────────────────────
// EDITABLE — canned ClickHouse grounding signals (STUB_MODE=1 floor).
// ─────────────────────────────────────────────────────────────────────────────
function cannedGroundingSignals(name: string): Signal[] {
  return [
    {
      signal_type: "github_release_cadence",
      source: "clickhouse:github_events",
      source_url: "https://sql.clickhouse.com/?query=SELECT+count()+FROM+github_events",
      detail: `${name}'s repo shows a weekly release cadence over the last 90 days — a team shipping under pressure.`,
      strength: 0.8,
    },
    {
      signal_type: "hn_launch_traction",
      source: "clickhouse:hackernews",
      source_url: "https://news.ycombinator.com/item?id=39000000",
      detail: "HN launch thread: top comments repeatedly ask for deeper notification/webhook control — the objection is the pain.",
      strength: 0.75,
    },
  ];
}

function playgroundUrlFor(sql: string): string {
  return `https://sql.clickhouse.com/?query=${encodeURIComponent(sql)}`;
}

export const groundNode = defineNode({
  name: "ground",
  sponsor: "ClickHouse",
  wireNode: "ground", // lights its own chip (ClickHouse named on screen during the live pass)
  stubLatencyMs: 600,
  stubWhen: stubExplicit, // V2: LIVE default; stub only when STUB_MODE=1
  inputSchema: z.object({ brief: zCompanyBrief, industry: zIndustry }),
  outputSchema: z.object({ brief: zCompanyBrief }),
  async executor({ brief }) {
    if (stubExplicit()) {
      console.log("[stub] node:ground canned output (STUB_MODE=1 floor)");
      return { brief: { ...brief, signals: [...brief.signals, ...cannedGroundingSignals(brief.name)] } };
    }

    // LIVE: real counts against 9B+ public rows — the claimed-vs-actual grounding source.
    const groundingSignals: Signal[] = [];

    // 1) GitHub star check (WatchEvents) when the brief carries an org/repo github_url.
    const repoMatch = brief.github_url?.match(/github\.com\/([^/\s]+\/[^/\s#?]+)/);
    if (repoMatch?.[1]) {
      const repo = repoMatch[1].replace(/\.git$/, "");
      const sql = `SELECT count() AS c FROM github.github_events WHERE repo_name = '${chEscape(repo)}' AND event_type = 'WatchEvent'`;
      try {
        const res = await playgroundQuery(sql);
        const stars = Number(res.rows[0]?.c ?? 0);
        groundingSignals.push({
          signal_type: "github_stars_actual",
          source: "clickhouse:github_events",
          source_url: playgroundUrlFor(sql),
          detail: `ClickHouse playground claimed-vs-actual: ${repo} has ${stars} WatchEvents (stars proxy) counted live against github.github_events — any star claim in the story must match this order of magnitude.`,
          strength: 0.85,
        });
      } catch (err) {
        console.error(`[seam] node:ground -> github star check -> ${(err as Error).message.slice(0, 120)} -> DEGRADED (no github signal this run)`);
      }
    } else {
      console.log(`[seam] node:ground -> no github org/repo on brief (github_url=${brief.github_url ?? "null"}) -> skipping star check (visible)`);
    }

    // 2) HN mention count for the company name (traction surface).
    if (brief.name && brief.name.length >= 3) {
      const sql = `SELECT count() AS c FROM hackernews.hackernews WHERE title ILIKE '%${chEscape(brief.name)}%'`;
      try {
        const res = await playgroundQuery(sql);
        const mentions = Number(res.rows[0]?.c ?? 0);
        groundingSignals.push({
          signal_type: "hn_mentions_actual",
          source: "clickhouse:hackernews",
          source_url: playgroundUrlFor(sql),
          detail: `Hacker News title mentions of "${brief.name}": ${mentions} (live count, hackernews.hackernews) — ${
            mentions > 0 ? "real public-builder attention exists" : "zero HN title mentions; do NOT claim HN traction"
          }.`,
          strength: 0.7,
        });
      } catch (err) {
        console.error(`[seam] node:ground -> hn mention check -> ${(err as Error).message.slice(0, 120)} -> DEGRADED (no hn signal this run)`);
      }
    }

    if (groundingSignals.length === 0) {
      console.warn(`[seam] node:ground -> 0 grounding signals added (both checks skipped/failed) -> DEGRADED (visible, never fatal)`);
    }
    return { brief: { ...brief, signals: [...brief.signals, ...groundingSignals] } };
  },
});
