// scripts/probe-render.ts — lane-2 render-node probe (live OpenUI path; tsx).
//   pnpm --filter backend exec tsx scripts/probe-render.ts
// Proves: renderNode LIVE -> gemini-2.5-flash (reasoning OFF) -> valid OpenUI Lang (openuiLang
// non-null) + carved 5-beat slides. Secrets parsed line-by-line from .env, never printed.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
for (const line of readFileSync(resolve(repoRoot, ".env"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*["']?([^"'\r\n]*)/);
  if (m && m[1] && !process.env[m[1]]) process.env[m[1]] = m[2];
}
console.log(`[probe] .env parsed -> OPENROUTER_API_KEY ${process.env.OPENROUTER_API_KEY ? "SET" : "MISSING"}`);
process.env.STUB_MODE = "0";

const { renderNode } = await import("../src/nodes/render.js");
const { zCompanyBrief } = await import("../src/schemas.js");
const brief = zCompanyBrief.parse(JSON.parse(readFileSync(resolve(repoRoot, "data/leads/re-1-offmarket-team.json"), "utf8")));

const score1 = { grounding: 0.5, completeness: 0.8, narrative_arc: 0.8, feasibility: 0.75, competitive_diff: 0.7, metric_confidence: 0.4, verdict: "regen" as const, failReason: "FABRICATED: closed 14 properties in the last 12 months", fabricatedClaims: ["closed 14 properties in the last 12 months"] };
const score2 = { grounding: 0.92, completeness: 0.85, narrative_arc: 0.88, feasibility: 0.8, competitive_diff: 0.74, metric_confidence: 0.78, verdict: "emit" as const, failReason: null, fabricatedClaims: [] };
const story = [
  "RE-1 wants pipeline without the $15k vendor tax.",
  "",
  "THE GOAL: rebuild the acquisition pipeline and expand to new cities ('the goal is to start moving to other cities').",
  "THE OBSTACLE: 'right now I have like no houses' — and the contact data is 'consistently 30% wrong'.",
  "THE OLD WAY FAILS: driving-for-dollars and manual title runs don't scale past LA; the refused vendor wanted $15k for 40 enriched rows.",
  "THE BETTER PATH: enrichment + story + sorting on their own 10k-row CSV, flat $4-5k + commission. One line: your county CSV already knows who's selling — let's make it say so.",
  "THE BETTER OUTCOME: a rerunnable system instead of a hire; first calls in the new city before anyone else.",
].join("\n");

const run = {
  leadId: "probe_render", url: "fixture://re-1-offmarket-team", status: "blocked" as const, generation: 1,
  brief, story, score: score2, pitch_angle: "forced_sale" as const,
  generations: [
    { generation: 0, story: story + "\nTRACTION: closed 14 properties in the last 12 months.", score: score1, fabricatedClaims: score1.fabricatedClaims, costCents: 2, latencyMs: 9000, ts: new Date().toISOString() },
    { generation: 1, story, score: score2, fabricatedClaims: [], costCents: 2, latencyMs: 8000, ts: new Date().toISOString() },
  ],
  costCents: 4, totalLatencyMs: 30000, createdAt: new Date().toISOString(),
};

const ctx = { leadId: "probe_render", emit: () => {} };
const { slides, openuiLang } = await renderNode.run({ run }, ctx);
console.log(`[probe] slides=${slides.length} titles=[${slides.map((s) => s.title).join(" | ")}]`);
console.log(`[probe] openuiLang ${openuiLang ? `${openuiLang.length} chars` : "NULL (fallback)"}`);
if (openuiLang) console.log(openuiLang.split("\n").slice(0, 4).join("\n"));
const ok = slides.length >= 5 && openuiLang !== null && openuiLang.includes("FABRICATED");
console.log(`[probe] ${ok ? "PASS" : "FAIL"} render live (5-beat slides + valid openuiLang with FABRICATED row)`);
process.exit(ok ? 0 : 1);
