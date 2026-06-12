// lenses/index.ts — the lens-pack layer (docs/DECISIONS.md §2-3). RunInput.industry selects the lens.
// Same engine, swap the lens: grounding sources + L2 signal recipes + narrative angles + drafter voice.
import type { PitchAngle, RunInput } from "../types.js";
import { gtmLens } from "./gtm.js";
import { marketingLens } from "./marketing.js";
import { realestateLens } from "./realestate.js";

export type Industry = RunInput["industry"];

export interface Lens {
  industry: Industry;
  /** Where claims are allowed to be grounded (fail-CLOSED outside these). */
  groundingSources: string[];
  /** Narrative angles this lens drafts toward. */
  angles: PitchAngle[];
  /** L2 curated English signal-reading recipes (SOUL.md layered-cache framing). */
  signalRecipes: string[];
  /** System prompt for the drafter LLM (S2). EDITABLE — Johnny tunes voice. */
  drafterSystemPrompt: string;
  /** Extra hints for the held-out critic's axes. */
  judgeAxesHints: string;
}

const LENSES: Record<Industry, Lens> = {
  gtm: gtmLens,
  realestate: realestateLens,
  marketing: marketingLens,
};

export function getLens(industry: Industry): Lens {
  return LENSES[industry];
}
