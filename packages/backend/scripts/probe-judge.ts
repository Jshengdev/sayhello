// scripts/probe-judge.ts — lane-2 verification probe (docs/VALIDATION.md style; run with tsx).
//   pnpm --filter backend exec tsx scripts/probe-judge.ts
// Proves, LIVE against OpenRouter:
//   1. drafter (lens=realestate, fixture RE-1) emits the 5-beat STORY-FRAME structure;
//   2. the held-out judge catches the PLANTED claim ("closed 14 properties in the last 12 months",
//      brief prose only, NO signal) -> lands in fabricatedClaims, grounding < 0.7, verdict regen.
// Deterministic backstop: if the live drafter happens to omit the plant, the judge is probed on a
// fixed story embedding it verbatim — the catch never depends on luck (SOTARE R7).
// NEVER prints secret values — names/status/lengths only. Exit code = failed checks.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// ── secrets: parse .env line-by-line (NOT shell-sourceable), never printed ──
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
for (const line of readFileSync(resolve(repoRoot, ".env"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*["']?([^"'\r\n]*)/);
  if (m && m[1] && !process.env[m[1]]) process.env[m[1]] = m[2];
}
console.log(`[probe] .env parsed -> OPENROUTER_API_KEY ${process.env.OPENROUTER_API_KEY ? "SET" : "MISSING"} (value never printed)`);

process.env.STUB_MODE = "0"; // force-live draft/judge (they are live-default; belt and braces)

const { zCompanyBrief } = await import("../src/schemas.js");
const { draftNode } = await import("../src/nodes/draft.js");
const { judgeNode } = await import("../src/nodes/judge.js");

const PLANT = "closed 14 properties in the last 12 months";
// The drafter may spell the count out ("Fourteen properties") — match either form.
const PLANT_RE = /\b(14|fourteen)\b[^.\n]*propert|propert[^.\n]*\b(14|fourteen)\b/i;
const fixtureRaw = JSON.parse(readFileSync(resolve(repoRoot, "data/leads/re-1-offmarket-team.json"), "utf8"));
const brief = zCompanyBrief.parse(fixtureRaw); // strips _planted markers at the boundary, like the pipe does
console.log(`[probe] fixture RE-1 parsed -> ${brief.signals.length} signals, plant lives in prose only`);

const ctx = { leadId: "probe_re1", emit: (e: { type: string }) => console.log(`[probe] (emit ${e.type})`) };
const checks: Array<[string, boolean]> = [];
const check = (name: string, ok: boolean): void => {
  checks.push([name, ok]);
  console.log(`[probe] ${ok ? "PASS" : "FAIL"} ${name}`);
};

// ── 1. drafter LIVE (gen 0) — 5-beat structure ──────────────────────────────
const BEATS = ["THE GOAL", "THE OBSTACLE", "THE OLD WAY FAILS", "THE BETTER PATH", "THE BETTER OUTCOME"];
const { story, pitch_angle } = await draftNode.run(
  { brief, generation: 0, industry: "realestate" as const },
  ctx,
);
console.log(`[probe] drafter -> story ${story.length} chars, pitch_angle=${pitch_angle}`);
const beatsPresent = BEATS.filter((b) => story.toUpperCase().includes(b));
check(`drafter 5-beat structure (${beatsPresent.length}/5: ${beatsPresent.join(", ")})`, beatsPresent.length === 5);
check(`drafter pitch_angle in realestate menu (${pitch_angle})`, ["forced_sale", "inheritance", "relocation", "absentee_fatigue"].includes(pitch_angle));
const drafterUsedPlant = PLANT_RE.test(story);
console.log(`[probe] drafter ${drafterUsedPlant ? "USED the planted claim (live catch path)" : "omitted the plant (deterministic backstop will judge it)"}`);

// ── 2. judge LIVE — the planted catch must fire ─────────────────────────────
// Deterministic story under judgment: the drafted story if it carried the plant, else the
// drafted story with the plant injected as its traction line (verbatim from the fixture prose).
const storyUnderJudgment = drafterUsedPlant
  ? story
  : `${story}\n\nTRACTION: this team has ${PLANT}, so the system pays for itself on the first deal.`;
const { score } = await judgeNode.run(
  { brief, story: storyUnderJudgment, generation: 0, industry: "realestate" as const },
  ctx,
);
console.log(`[probe] judge -> grounding=${score.grounding} verdict=${score.verdict} fabricatedClaims=${JSON.stringify(score.fabricatedClaims)}`);
check(
  `planted claim lands in fabricatedClaims (14/fourteen properties)`,
  score.fabricatedClaims.some((c) => PLANT_RE.test(c)),
);
check(`grounding low (< 0.7): ${score.grounding}`, score.grounding < 0.7);
check(`verdict regen`, score.verdict === "regen");

const failed = checks.filter(([, ok]) => !ok).length;
console.log(`[probe] ${checks.length - failed} PASS · ${failed} FAIL`);
process.exit(failed);
