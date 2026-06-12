// lenses/story-frame.ts — the shared story-frame consts, hoisted OUT of index.ts to break the
// runtime import cycle index.ts ⇄ {gtm,realestate,marketing}.ts (TDZ crash at boot: "Cannot access
// 'STORY_FRAME_PROMPT' before initialization"). index.ts re-exports both, so existing importers
// keep working. Cross-lane fix, recorded in docs/OPEN-QUESTIONS.md.
//
// docs/STORY-FRAME.md — the 5-beat customer-as-hero spine. Folded into ALL 3
// drafter prompts; the section headers are load-bearing (render carves slides on them).
// EDITABLE — Johnny tunes wording, keep the 5 headers.
export const STORY_FRAME_PROMPT = [
  "Structure the story as the LEAD's 5-beat arc, with these EXACT section headers on their own lines:",
  "THE GOAL: what this lead is trying to achieve — their words, from their site/posts/person signals.",
  "THE OBSTACLE: what's in the way — the pain, grounded in Signals.",
  "THE OLD WAY FAILS: why their current approach is no longer good enough (grounded, never invented).",
  "THE BETTER PATH: how the seller creates it — sellerIdentity proof points, receipts only. End this beat with the outreach angle spoken in ONE line, in the seller's voice.",
  "THE BETTER OUTCOME: what they get — specific, forward-looking, offers agency.",
  "ALL FIVE headers (THE GOAL / THE OBSTACLE / THE OLD WAY FAILS / THE BETTER PATH / THE BETTER OUTCOME) MUST appear verbatim, each on its own line — a missing header fails the judge.",
  "The lead is the protagonist — never the seller. Every beat grounds in a Signal or it gets cut.",
].join("\n");

/** docs/STORY-FRAME.md — judge narrative_arc calibration (all 3 lenses). */
export const NARRATIVE_ARC_CALIBRATION =
  "narrative_arc calibration: 1.0 = all 5 beats present (goal -> obstacle -> old-way-fails -> better-path -> outcome), " +
  "lead-as-protagonist, each beat sourced. CAP narrative_arc at 0.5 if the seller is the main character " +
  "or any beat is invented/unsourced.";
