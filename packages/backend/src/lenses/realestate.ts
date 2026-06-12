// lenses/realestate.ts — TYPED STUB lens (selectable without crashing; content lands post-S1).
// handle = property address / owner name. Grounding = public records, owner age, sale date, transfers.
// TODO(Johnny): full content per docs/DECISIONS.md §3 + the Carlos yaps (~/code/carlos/context/yaps).
// FINDING (docs/OPEN-QUESTIONS.md): PitchAngle union is gtm-flavored — the real-estate angles
// (forced-sale / inheritance / relocation) do not exist in it; nearest stand-ins used below.
import type { Lens } from "./index.js";

// ─────────────────────────────────────────────────────────────────────────────
// EDITABLE — TODO content. Johnny fills from the Carlos grounding.
// ─────────────────────────────────────────────────────────────────────────────
export const realestateLens: Lens = {
  industry: "realestate",
  groundingSources: [
    "public-records:ownership",
    "public-records:transfer-history",
    "public-records:sale-date",
    // TODO: county assessor / life-stage sources
  ],
  // TODO: needs forced-sale / inheritance / relocation angles — PitchAngle union lacks them.
  angles: ["resilience", "speed_to_market"],
  signalRecipes: [
    "Read owner age into a life-stage story: an 82-year-old owner is a predictable transition (pass-down -> heirs fight -> sells), not a 'hot lead flag'.",
    "TODO: read sale date + transfer history into a forced-sale / inheritance / relocation theory.",
  ],
  drafterSystemPrompt:
    "TODO(realestate): build the grounded life-stage story of one owner — same harness, Carlos lens. " +
    "Read the stage, not a score. Every claim traces to a public record. The human makes the call.",
  judgeAxesHints:
    "TODO(realestate): grounding fail-CLOSED against public records; age/date claims need a record source.",
};
