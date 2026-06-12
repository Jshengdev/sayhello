// lenses/marketing.ts — the FULL marketing lens. Seller = JOHNNY, same person as the realestate lens,
// different pain (docs/LENSES-CONTENT.md §3, verbatim). handle = agency/brand URL or fixture.
// V2 contract add: sellerIdentity + LensAngle menu (brand_gap/channel/positioning — PitchAngle union
// widened in lockstep) + openingLineShapes + STORY-FRAME 5-beat fold.
import { NARRATIVE_ARC_CALIBRATION, STORY_FRAME_PROMPT, type Lens } from "./index.js";

// ─────────────────────────────────────────────────────────────────────────────
// EDITABLE — Johnny tunes voice + recipes. Every quote VERBATIM from the Aiden
// call corpus ("guided, not faked"). See docs/LENSES-CONTENT.md §3.
// ─────────────────────────────────────────────────────────────────────────────
export const marketingLens: Lens = {
  industry: "marketing",

  sellerIdentity: {
    who: "Johnny Sheng — same seller as realestate lens (one person, two lens packs).",
    offer:
      "Signal-driven pipeline as a durable system: 'this person just raised this person just got into whole foods' → reach out, name-in-a-box, the founder still handles the relationship. Fixes the coma test.",
    proofPoints: [
      "Vortex (experiential agency): signed fixed $5,040 / 2 months / 4 modules",
      "Photon build: 2 months @ ~20 hr/wk",
      "LinkedIn ~40% reply rate vs cold email ~2% — the stat that landed ('Aiden bought it')",
      "'there are like all these little markers that would indicate that somebody has a budget to spend'",
    ],
  },
  sellerSourceUrl: "call://aiden-call-2026-05-28",

  groundingSources: [
    "discovery_call:aiden-corpus",
    "firecrawl:brand-site",
    "social:recent-posts",
  ],

  angles: [
    { angle: "brand_gap",   trigger: "own site stale / rebuild in flight / thin case studies", line: "we're revamping our website because our website was buns so it's just trash... a full rebuild like tons of case studies... way more photos of our activations" },
    { angle: "channel",     trigger: "referral-only + founder-geography-bound growth",          line: "our whole flow is based on referrals and me meeting people in person... there's only so many people I can meet — vs LinkedIn 'almost like a 40% reply rate' / cold email '2% if you're doing like good'" },
    { angle: "positioning", trigger: "founder-dependence + exit ambition",                      line: "an agency that's relying on the owner has no enterprise value at all... if I had a coma for one month... nothing would happen [to the pipeline]" },
  ],

  signalRecipes: [
    "founder on every sales call / no CRM → coma-test pain ('as far as like sales and business development... that's all me')",
    "Gmail-only tooling → systems gap ('pretty much gmail dude... amazing I've gotten this far with such like little systems')",
    "referral/in-person-only growth language → channel gap ('we don't even really prospect that much')",
    "website rebuild in flight / thin case studies → brand-gap in motion",
    "campaign count scaling → ops bottleneck ('eight back school campaigns at one time... I'm one person')",
    "founder talks exit/sale → enterprise-backbone story ('relying on the owner has no enterprise value at all')",
    "reporting case-by-case → attribution gap ('it's case by case in my head which is really bad')",
    "napkin-math pricing → margin-risk read ('a lot of our pricing is... napkin math... pretty imprecise')",
  ],

  drafterSystemPrompt: [
    "You are building the grounded working theory of ONE agency's pain — a story with a WHY, not a data dump.",
    STORY_FRAME_PROMPT,
    "Name their business shape better than they do: 'you're literally running a whole production company bro' → 'that's actually a pretty good analysis of it.' Reflecting the prospect's own structure back = instant rapport.",
    "Use the prospect's own metaphor as the diagnosis (replay 'the coma test' back to them).",
    "The inbound shape to engineer: specific recognition + perceived uniqueness ('I really love your channel... I don't really know anybody else is doing that').",
    "Never invent client counts, campaign counts, headcount, or revenue — use null if unknown.",
    "The AI builds the patty; the human makes the pitch. Stop at the opening line + working theory.",
  ].join("\n"),

  judgeAxesHints: [
    "grounding: fail-CLOSED — every FACT claim (client counts, campaign counts, headcount, revenue, channel stats) must trace to a Signal; an unmatched claim is FABRICATED.",
    "ANGLE claims (the coma-test read, structure reflections) are allowed when labeled as interpretation AND the traced fact underneath exists — do not flag those.",
    "metric_confidence: bare numbers with no Signal are capped low.",
    NARRATIVE_ARC_CALIBRATION,
  ].join("\n"),

  openingLineShapes: [
    "Reflect their structure: 'you're literally running a whole production company bro'",
    "Their metaphor as diagnosis: 'the coma test basically which is that sales is only you'",
    "Specific recognition + uniqueness: 'what you're doing makes total sense, I don't really know anybody else is doing that'",
  ],
};
