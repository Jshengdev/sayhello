// lenses/index.ts — the lens-pack layer (docs/DECISIONS.md §2-3). RunInput.industry selects the lens.
// Same engine, swap the lens: grounding sources + L2 signal recipes + narrative angles + drafter voice.
//
// ── V2 contract adds (2026-06-12, lane 2 — docs/LENSES-CONTENT.md + docs/STORY-FRAME.md) ──
// 1. Lens.sellerIdentity {who, offer, proofPoints[]} — the seller side of the pack. proofPoints
//    become seller-side Signals (source "seller_pack") via sellerSignals() so seller claims trace
//    through the SAME judge — zero judge changes (docs/SCENARIOS.md).
// 2. Lens.angles widened from PitchAngle[] to LensAngle[] {angle, trigger, line} — the angle menu
//    the drafter picks from (selection-by-trigger happens inside the draft prompt).
// 3. Lens.openingLineShapes — the register the opening line must hit (real shapes from the corpus).
// 4. STORY_FRAME_PROMPT + NARRATIVE_ARC_CALIBRATION — the 5-beat lead-as-protagonist arc, folded
//    into every drafter prompt and every judge's narrative_arc axis (docs/STORY-FRAME.md).
import type { PitchAngle, RunInput, Signal } from "../types.js";
import { gtmLens } from "./gtm.js";
import { marketingLens } from "./marketing.js";
import { realestateLens } from "./realestate.js";

export type Industry = RunInput["industry"];

/** V2 contract add — who is saying hello. Lens-pack DATA, selected by `industry`. */
export interface SellerIdentity {
  who: string;
  offer: string;
  /** Each becomes a seller-side Signal (source "seller_pack") — FACTs must trace. */
  proofPoints: string[];
  /** Critic-trap: claiming any of these as customers = FABRICATED-class. */
  notCustomers?: string[];
}

/** V2 contract add — one angle in the lens menu: when it triggers and the one-line shape. */
export interface LensAngle {
  angle: PitchAngle;
  trigger: string;
  line: string;
}

export interface Lens {
  industry: Industry;
  /** V2 contract add — the seller side of this lens pack (docs/LENSES-CONTENT.md). */
  sellerIdentity: SellerIdentity;
  /** Where seller proofPoint Signals point (corpus provenance for source_url). */
  sellerSourceUrl: string;
  /** Where claims are allowed to be grounded (fail-CLOSED outside these). */
  groundingSources: string[];
  /** V2: narrative angle MENU this lens drafts toward (angle + trigger + line). */
  angles: LensAngle[];
  /** L2 curated English signal-reading recipes (SOUL.md layered-cache framing). */
  signalRecipes: string[];
  /** System prompt for the drafter LLM. EDITABLE — Johnny tunes voice. */
  drafterSystemPrompt: string;
  /** Extra hints for the held-out critic's axes. */
  judgeAxesHints: string;
  /** V2 contract add — opening-line register (real shapes that got replies). */
  openingLineShapes: string[];
}

// docs/STORY-FRAME.md consts — hoisted to ./story-frame.ts to break the runtime import cycle
// index.ts ⇄ lens files (TDZ boot crash); re-exported here so existing importers keep working.
export { NARRATIVE_ARC_CALIBRATION, STORY_FRAME_PROMPT } from "./story-frame.js";

/**
 * Seller proofPoints as seller-side Signals (source "seller_pack") — concat into the ONE evidence
 * corpus so the judge grounds seller claims identically (docs/LENSES-CONTENT.md cross-cutting).
 */
export function sellerSignals(lens: Lens): Signal[] {
  return lens.sellerIdentity.proofPoints.map((detail, i) => ({
    signal_type: "seller_proof",
    source: "seller_pack",
    source_url: lens.sellerSourceUrl,
    detail,
    strength: 8 - Math.min(i, 3), // ordering = rough confidence; EDITABLE
  }));
}

const LENSES: Record<Industry, Lens> = {
  gtm: gtmLens,
  realestate: realestateLens,
  marketing: marketingLens,
};

export function getLens(industry: Industry): Lens {
  return LENSES[industry];
}
