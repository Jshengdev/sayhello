// nodes/judge.ts — [judge]: brief + story -> StoryScore. Sponsor: OpenRouter · held-out critic.
// CONSTRAINT: critic model FAMILY ≠ drafter family (held-out, asserted in llm/models.ts AND here).
//
// V2 (lane 2): LIVE BY DEFAULT — STUB_MODE=1 explicitly forces the canned S1 verdicts.
// THE PLANTED-CATCH BOUNDARY (docs/LENSES-CONTENT.md, OPEN-QUESTIONS): the judge's evidence corpus
// is brief.signals[] (+ seller_pack signals) ONLY — NEVER the brief summary prose (what_they_do /
// brief). Planted fixture claims live in the prose; the drafter sees them, the judge cannot, so the
// catch provably fires. Do not widen this corpus.
// Seam 3 (critic -> grounding -> fabricatedClaims -> verdict) is HOISTED to the shared path so the
// demo-heart log survives stub AND live (VALIDATION.md gap #2).
import { z } from "zod";
import { getLens, sellerSignals } from "../lenses/index.js";
import { assertHeldOutCritic, MODELS } from "../llm/models.js";
import { generate, parseJsonLoose } from "../llm/openrouter.js";
import { zCompanyBrief, zIndustry, zStoryScore } from "../schemas.js";
import type { CompanyBrief, StoryScore } from "../types.js";
import { defineNode } from "./defineNode.js";

/** V2 polarity flip for draft/judge: LIVE default; STUB_MODE=1 explicitly opts back into canned. */
function stubForced(): boolean {
  return process.env.STUB_MODE === "1";
}

// ─────────────────────────────────────────────────────────────────────────────
// EDITABLE — canned critic verdicts (S1 rehearsal, STUB_MODE=1 only). The fabricated
// claim string must match the gen-0 draft line in nodes/draft.ts verbatim.
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

const clamp01 = (n: unknown): number => {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return Math.min(1, Math.max(0, v));
};

const AXES = ["grounding", "completeness", "narrative_arc", "feasibility", "competitive_diff", "metric_confidence"] as const;

/** The judge's ONLY ground truth: lead signals + seller_pack signals. Brief prose is NOT evidence. */
function buildEvidenceCorpus(brief: CompanyBrief, industry: "gtm" | "realestate" | "marketing"): string[] {
  const lens = getLens(industry);
  return [...brief.signals, ...sellerSignals(lens)].map(
    (s) => `- [${s.signal_type}] ${s.source} ${s.source_url}: ${s.detail}`,
  );
}

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
  async executor({ brief, story, generation, industry }, ctx) {
    const lens = getLens(industry);
    let score: StoryScore;

    if (stubForced()) {
      console.log(`[stub] node:judge canned output (gen=${generation}, lens=${lens.industry}) — STUB_MODE=1 forced`);
      score = generation === 0 ? GEN0_SCORE : GEN1_SCORE;
    } else {
      // ── LIVE (default): held-out critic on a DIFFERENT model family than the drafter ──
      assertHeldOutCritic(); // fail CLOSED before any paid call
      const systemPrompt = [
        "You are a HELD-OUT critic — a different model family than the drafter; you never grade your own homework.",
        "You grade a sales lead-story against an evidence corpus of Signals. The Signals are the ONLY ground truth.",
        "FAIL-CLOSED GROUNDING: every factual claim in the story (names, numbers, funding, customers, metrics, dates, counts, tech, prices) must trace to a provided Signal. A factual claim with no matching Signal is FABRICATED — quote it in fabricatedClaims as the EXACT substring from the story.",
        "Claims explicitly labeled as interpretation/guess/working-theory are allowed IF the underlying traced fact exists — do not flag those.",
        "Claims about the seller must trace to [seller_pack] Signals the same way — the harness does not let the seller exaggerate themselves.",
        lens.judgeAxesHints,
        "Score all six axes 0..1: grounding, completeness, narrative_arc, feasibility, competitive_diff, metric_confidence.",
        "Calibration: if every factual claim traces and the 5 beats are present, axes belong at 0.75-0.95; reserve sub-0.7 for real failures, not stylistic taste.",
        'verdict: "emit" iff fabricatedClaims is empty AND every axis >= 0.7; otherwise "regen" with a one-sentence failReason naming the worst problem.',
        "Respond with JSON ONLY (no prose, no fences):",
        '{"grounding":0.0,"completeness":0.0,"narrative_arc":0.0,"feasibility":0.0,"competitive_diff":0.0,"metric_confidence":0.0,"verdict":"emit","failReason":null,"fabricatedClaims":[]}',
      ].join("\n");
      const userMessage = [
        `LEAD: ${brief.name} (lens: ${industry})`,
        "",
        "EVIDENCE CORPUS (Signals — the ONLY ground truth; nothing outside this list is sourced):",
        ...buildEvidenceCorpus(brief, industry),
        "",
        `STORY UNDER REVIEW (generation ${generation}):`,
        story,
      ].join("\n");

      const result = await generate(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        {
          model: MODELS.JUDGE.model,
          temperature: 0, // deterministic critic
          maxTokens: 1600,
          agentName: "critic",
          runId: ctx.leadId,
        },
      );

      const raw = parseJsonLoose(result.text, "critic") as Record<string, unknown>;
      const fabricatedClaims = Array.isArray(raw.fabricatedClaims)
        ? raw.fabricatedClaims.filter((c): c is string => typeof c === "string" && c.length > 0)
        : [];
      score = {
        grounding: clamp01(raw.grounding),
        completeness: clamp01(raw.completeness),
        narrative_arc: clamp01(raw.narrative_arc),
        feasibility: clamp01(raw.feasibility),
        competitive_diff: clamp01(raw.competitive_diff),
        metric_confidence: clamp01(raw.metric_confidence),
        verdict: raw.verdict === "emit" ? "emit" : "regen",
        failReason: typeof raw.failReason === "string" && raw.failReason ? raw.failReason : null,
        fabricatedClaims,
      };

      // Contract enforcement (docs/CONTRACTS.md: emit iff grounding>=0.7 AND all axes>=0.7) —
      // deterministic in code, LOUDLY overriding an inconsistent model verdict. Fail-CLOSED.
      const shouldEmit = score.fabricatedClaims.length === 0 && AXES.every((a) => score[a] >= 0.7);
      if ((score.verdict === "emit") !== shouldEmit) {
        console.error(
          `[seam] critic verdict "${score.verdict}" inconsistent with axes/fabricatedClaims -> enforced ${shouldEmit ? "emit" : "regen"} (fail-CLOSED contract rule, visible override)`,
        );
        score.verdict = shouldEmit ? "emit" : "regen";
      }
      if (score.verdict === "regen" && !score.failReason) {
        score.failReason = score.fabricatedClaims.length
          ? `FABRICATED claim(s) with no matching Signal: ${score.fabricatedClaims.map((c) => `"${c}"`).join("; ")}. Fail-CLOSED: cannot ship.`
          : `axis below 0.7: ${AXES.filter((a) => score[a] < 0.7).join(", ")}`;
      }
    }

    // Seam 3 (HOISTED — shared stub+live path): the demo-heart line. Claim verbatim.
    console.log(
      `[seam] critic -> grounding=${score.grounding} -> fabricatedClaims=${JSON.stringify(score.fabricatedClaims)} -> verdict=${score.verdict} -> ok`,
    );
    return { score };
  },
});
