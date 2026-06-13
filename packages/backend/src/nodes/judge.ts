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
import { defineNode, stubExplicit } from "./defineNode.js";

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
  stubWhen: stubExplicit, // V2: LIVE default; stub only when STUB_MODE=1
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

    if (stubExplicit()) {
      console.log(`[stub] node:judge canned output (gen=${generation}, lens=${lens.industry}) — STUB_MODE=1 forced`);
      score = generation === 0 ? GEN0_SCORE : GEN1_SCORE;
    } else {
      // ── LIVE (default): held-out critic on a DIFFERENT model family than the drafter ──
      assertHeldOutCritic(); // fail CLOSED before any paid call
      const systemPrompt = [
        "You are a HELD-OUT critic — a different model family than the drafter; you never grade your own homework.",
        "You grade a sales lead-story against an evidence corpus of Signals. The Signals are the ONLY ground truth.",
        "PROCEDURE (do this systematically, not impressionistically): 1) extract EVERY factual claim from the story — especially every count, dollar figure, percentage, date, named third party, and quantity; 2) check EACH ONE against the corpus; 3) list EVERY unmatched factual claim in fabricatedClaims. Do not stop at the first one.",
        "FAIL-CLOSED GROUNDING: every factual claim in the story (names, numbers, funding, customers, metrics, dates, counts, tech, prices) must trace to a provided Signal. A factual claim with no matching Signal is FABRICATED — quote it in fabricatedClaims as the EXACT substring from the story.",
        "HARD RULE — fabricatedClaims entries MUST be copied character-for-character from THE STORY UNDER REVIEW. A phrase that does not appear in the story text CANNOT be flagged, no matter what the corpus mentions.",
        "Signals of type [claim_check], [claim_check_failed] and [person_scrape_degraded] are harness verification notes about PRIOR drafts — corpus metadata, NOT story claims. Never copy a claim out of those notes into fabricatedClaims; only grade text actually present in the story below.",
        "TRACING IS SUBSTANCE-MATCH, NOT STRING-MATCH: a claim TRACES when any Signal supports its content — paraphrase, rounding, reordering, or restating/comparing numbers that each appear in Signals (e.g. contrasting two reply rates both present in the corpus) all COUNT as traced. Never flag a claim merely because its wording differs from the Signal's.",
        "[seller_pack] AND [seller_positioning] Signals are first-class evidence: a story line about the seller (prices, reply rates, client deals, contracts, proof points) that restates either is TRACED, not fabricated — the seller stating their own receipts is the evidence.",
        "grounding = the fraction of factual claims that trace. If fabricatedClaims is non-empty, grounding MUST be <= 0.6.",
        "ANGLE/interpretation lines (working theories, life-stage reads, 'likely/probably/suggests' framings, the pitch recommendation itself) are NOT factual claims — NEVER list them in fabricatedClaims when the traced fact underneath exists. Only flag the checkable fact inside them if THAT fact has no Signal.",
        "Claims about the seller must trace to [seller_pack] Signals the same way — the harness does not let the seller exaggerate themselves.",
        "WHEN UNSURE whether a claim traces, score it GROUNDED. A false FABRICATED flag wrongly kills a true story and spirals the loop — it is as harmful as missing a lie. Reserve FABRICATED for claims you are confident appear in NO Signal.",
        "QUALITATIVE MAGNITUDE IS NOT A FACT CLAIM: phrases like 'thousands of rows', 'a large raw list', 'recent closes', 'a multi-month cycle' are deliberately de-specified descriptions — NEVER flag them. Flag only SPECIFIC verifiable quantities: exact numbers, dollar figures, percentages, dates, named third parties.",
        "HEDGES AND NEGATIVE STATEMENTS ARE NOT FACT CLAIMS: lines like 'there is no evidence that X' or 'without Y, the risk is…' assert nothing checkable about the lead — NEVER flag them (they may cost narrative_arc points, but they are not fabrications).",
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

      const callCritic = async (correction?: string): Promise<StoryScore> => {
        const result = await generate(
          [
            { role: "system", content: correction ? `${systemPrompt}\n${correction}` : systemPrompt },
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
        return {
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
      };

      // PHANTOM-CLAIM ENFORCEMENT (V2 validator finding, runs ld_40fe6b59/ld_f41037e2): the qwen
      // critic copies claims out of [claim_check] corpus notes that are NOT in the story under
      // review — violating the exact-substring contract and making emit UNREACHABLE. Deterministic
      // rule: a fabricatedClaim must be a substring of the story (case/whitespace-insensitive).
      // Phantoms -> ONE corrective re-judge naming them; any survivors are dropped LOUDLY.
      const normalize = (s: string): string => s.toLowerCase().replace(/\s+/g, " ").trim();
      const storyNorm = normalize(story);
      const phantomsOf = (s: StoryScore): string[] =>
        s.fabricatedClaims.filter((c) => !storyNorm.includes(normalize(c)));

      score = await callCritic();
      let phantoms = phantomsOf(score);
      if (phantoms.length > 0) {
        console.error(
          `[seam] critic flagged ${phantoms.length} claim(s) NOT present in the story (phantom corpus echo): ${JSON.stringify(phantoms)} -> re-judging ONCE with the substring rule pinned (visible correction)`,
        );
        score = await callCritic(
          `CORRECTION: a prior review of this exact story flagged phrases that do NOT appear in the story text: ${phantoms
            .map((p) => `"${p}"`)
            .join("; ")}. Those CANNOT be fabricatedClaims of this story. Re-grade from scratch; only flag text verbatim-present in THE STORY UNDER REVIEW.`,
        );
        phantoms = phantomsOf(score);
      }
      if (phantoms.length > 0) {
        console.error(
          `[seam] critic STILL flagging phantom claims after correction: ${JSON.stringify(phantoms)} -> dropped (exact-substring contract, deterministic, visible)`,
        );
        score.fabricatedClaims = score.fabricatedClaims.filter((c) => storyNorm.includes(normalize(c)));
      }

      // MECHANICAL TRACE OVERRULE (SOTARE R6: mechanical beats the eye; run ld_ab457fb3: the critic
      // flagged seller proofPoints VERBATIM-present in the corpus because the story paraphrased them).
      // Deterministic: a flagged claim whose substance demonstrably lives in the evidence corpus is
      // NOT fabricated — drop the flag LOUDLY. Substance = full normalized containment, OR every
      // numeric token present, OR >=80% of its content-words present. Real catches (Spectrum, pricing
      // tiers, invented customers) fail all three and survive.
      {
        const corpusNorm = normalize(buildEvidenceCorpus(brief, industry).join(" || "));
        const mechanicallyTraced = (claim: string): boolean => {
          const nc = normalize(claim);
          if (!nc) return false;
          if (corpusNorm.includes(nc)) return true;
          const nums = nc.match(/\d[\d,.]*[\w%-]*/g) ?? [];
          if (nums.length > 0 && nums.every((t) => corpusNorm.includes(t))) return true;
          const words = nc.split(/[^a-z0-9%$.]+/).filter((w) => w.length > 3);
          if (words.length >= 3) {
            const hit = words.filter((w) => corpusNorm.includes(w)).length;
            if (hit / words.length >= 0.8) return true;
          }
          return false;
        };
        const overruled = score.fabricatedClaims.filter(mechanicallyTraced);
        if (overruled.length > 0) {
          console.error(
            `[seam] critic flagged ${overruled.length} claim(s) whose substance IS in the corpus -> mechanically traced, flag overruled (R6, visible): ${JSON.stringify(overruled.map((c) => c.slice(0, 60)))}`,
          );
          score.fabricatedClaims = score.fabricatedClaims.filter((c) => !mechanicallyTraced(c));
        }
      }

      // Contract enforcement (docs/CONTRACTS.md: emit iff grounding>=0.7 AND all axes>=0.7) —
      // deterministic in code, LOUDLY overriding an inconsistent model verdict. Fail-CLOSED.
      // Rule 1: fabricated claims CAP grounding (a story with an unsourced claim is not grounded).
      if (score.fabricatedClaims.length > 0 && score.grounding > 0.55) {
        console.error(
          `[seam] critic grounding ${score.grounding} inconsistent with ${score.fabricatedClaims.length} fabricatedClaims -> capped to 0.55 (fail-CLOSED, visible override)`,
        );
        score.grounding = 0.55;
      }
      // Rule 1b: ZERO-FLAG CALIBRATION FLOOR (run ld_9e021974: gen-2 had zero fabrications and the
      // model still lowballed grounding 0.6 — a clean story died on vibes). Zero fabricated claims IS
      // the grounding bar; an LLM "0.6 but nothing is fabricated" is a calibration error, not evidence.
      // Visible correction, never applied when any flag exists (the fabrication axis NEVER relaxes).
      if (score.fabricatedClaims.length === 0 && score.grounding >= 0.55 && score.grounding < 0.7) {
        console.error(
          `[seam] critic grounding ${score.grounding} with ZERO fabricatedClaims -> calibration floor raised to 0.7 (visible correction; fabrication axis untouched)`,
        );
        score.grounding = 0.7;
      }
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
