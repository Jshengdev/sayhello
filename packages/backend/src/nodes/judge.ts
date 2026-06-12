// nodes/judge.ts — [judge]: brief + story -> StoryScore. Sponsor: OpenRouter · held-out critic.
// CONSTRAINT: critic model ≠ drafter model (held-out, fail-CLOSED grounding) — wired live at S2.
// S1: STUB_MODE canned verdicts — gen-0 CATCHES the fabricated "$40M Series B" (regen),
// gen-1 emits (grounding 0.92, all axes ≥ 0.7). Seam 3 logs the caught claim verbatim.
import { z } from "zod";
import { getLens } from "../lenses/index.js";
import { zCompanyBrief, zIndustry, zStoryScore } from "../schemas.js";
import type { StoryScore } from "../types.js";
import { defineNode, stubMode } from "./defineNode.js";

// ─────────────────────────────────────────────────────────────────────────────
// EDITABLE — canned critic verdicts (S1). The fabricated claim string must match
// the gen-0 draft line in nodes/draft.ts verbatim.
// ─────────────────────────────────────────────────────────────────────────────
const GEN0_SCORE: StoryScore = {
  grounding: 0.4,
  completeness: 0.78,
  narrative_arc: 0.81,
  feasibility: 0.74,
  competitive_diff: 0.7,
  metric_confidence: 0.35,
  verdict: "regen",
  failReason:
    'FABRICATED claim: "raised a $40M Series B" — no matching Signal in the brief (funding_stage=null, no news/SEC source). Fail-CLOSED: cannot ship.',
  fabricatedClaims: ["raised a $40M Series B"],
};

const GEN1_SCORE: StoryScore = {
  grounding: 0.92,
  completeness: 0.84,
  narrative_arc: 0.88,
  feasibility: 0.8,
  competitive_diff: 0.74,
  metric_confidence: 0.79,
  verdict: "emit",
  failReason: null,
  fabricatedClaims: [],
};

export const judgeNode = defineNode({
  name: "judge",
  sponsor: "OpenRouter · held-out critic",
  wireNode: "judge",
  stubLatencyMs: 900, // the catch beat — let the held-out critic visibly "think"
  inputSchema: z.object({
    brief: zCompanyBrief,
    story: z.string().min(1),
    generation: z.number().int().min(0),
    industry: zIndustry,
  }),
  outputSchema: z.object({ score: zStoryScore }),
  async executor({ generation, industry }) {
    const lens = getLens(industry);
    if (stubMode()) {
      console.log(`[stub] node:judge canned output (gen=${generation}, lens=${lens.industry})`);
      const score = generation === 0 ? GEN0_SCORE : GEN1_SCORE;
      // Seam 3 (docs/BUILD-LOOP.md): the held-out Critic — grounding + fabricatedClaims, claim verbatim.
      console.log(
        `[seam] critic -> grounding=${score.grounding} -> fabricatedClaims=${JSON.stringify(score.fabricatedClaims)} -> verdict=${score.verdict} -> ok`,
      );
      return { score };
    }
    // S2: held-out critic on a DIFFERENT model family than the drafter, lens.judgeAxesHints in prompt
    throw new Error("judge live mode lands at S2 — run with STUB_MODE unset/1 (no silent stubs)");
  },
});
