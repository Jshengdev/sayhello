// Direct seam test for the archive node's live path (insertGenerations) — exact node code path.
import dotenv from "dotenv";
import path from "node:path";
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
const { insertGenerations } = await import("../src/store/clickhouse.js");
const score = { grounding: 0.92, completeness: 0.84, narrative_arc: 0.88, feasibility: 0.8, competitive_diff: 0.74, metric_confidence: 0.79, verdict: "emit" as const, failReason: null, fabricatedClaims: [] };
const rows = await insertGenerations({
  leadId: "ld_seamtest1",
  url: "https://lindy.ai",
  pitchAngle: "build_vs_buy",
  status: "done",
  generations: [
    { generation: 0, story: "seam-test gen0", score: { ...score, grounding: 0.4, verdict: "regen" as const, fabricatedClaims: ["seam-test fabricated claim"] }, fabricatedClaims: ["seam-test fabricated claim"], costCents: 2, latencyMs: 1200, ts: new Date().toISOString() },
    { generation: 1, story: "seam-test gen1", score, fabricatedClaims: [], costCents: 3, latencyMs: 1500, ts: new Date().toISOString() },
  ],
});
console.log(`insert returned rows=${rows}`);
const resp = await fetch(process.env.CLICKHOUSE_URL!, {
  method: "POST",
  headers: { "X-ClickHouse-User": process.env.CLICKHOUSE_USER!, "X-ClickHouse-Key": process.env.CLICKHOUSE_PASSWORD! },
  body: "SELECT leadId, generation, verdict, grounding FROM story_runs WHERE leadId='ld_seamtest1' ORDER BY generation FORMAT JSON",
});
const json = await resp.json();
console.log(`readback HTTP ${resp.status} rows=${json.data.length}: ${JSON.stringify(json.data)}`);
