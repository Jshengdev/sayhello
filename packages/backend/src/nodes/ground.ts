// nodes/ground.ts — [ground]: brief -> brief + builder-traction signals from the ClickHouse public
// playground (github_events star-velocity/release cadence + hackernews launch traction).
// Sponsor: ClickHouse. Lights "ground" on the wire (node_enter union widened per S1 validator finding).
// S1: STUB_MODE canned signals. Live (sql-clickhouse.clickhouse.com, user=demo) lands at S2.
import { z } from "zod";
import { zCompanyBrief, zIndustry } from "../schemas.js";
import type { Signal } from "../types.js";
import { defineNode, stubMode } from "./defineNode.js";

// ─────────────────────────────────────────────────────────────────────────────
// EDITABLE — canned ClickHouse grounding signals (S1).
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

export const groundNode = defineNode({
  name: "ground",
  sponsor: "ClickHouse",
  wireNode: "ground", // lights its own chip (ClickHouse named on screen during the live pass)
  stubLatencyMs: 600,
  inputSchema: z.object({ brief: zCompanyBrief, industry: zIndustry }),
  outputSchema: z.object({ brief: zCompanyBrief }),
  async executor({ brief }) {
    if (stubMode()) {
      console.log("[stub] node:ground canned output");
      return { brief: { ...brief, signals: [...brief.signals, ...cannedGroundingSignals(brief.name)] } };
    }
    // S2: query github_events + hackernews on the public playground (no key — see docs/KEYS.md row 3)
    throw new Error("ground live mode lands at S2 — run with STUB_MODE unset/1 (no silent stubs)");
  },
});
