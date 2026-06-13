// lenses/realestate.ts — the FULL realestate lens. Seller = JOHNNY (docs/LENSES-CONTENT.md §2, verbatim).
// handle = property address / owner / team fixture. Grounding = discovery-call corpus + public records.
// V2 contract add: sellerIdentity + LensAngle menu (forced_sale/inheritance/relocation/absentee_fatigue
// — PitchAngle union widened in lockstep) + openingLineShapes + STORY-FRAME 5-beat fold.
import { NARRATIVE_ARC_CALIBRATION, STORY_FRAME_PROMPT } from "./story-frame.js";
import type { Lens } from "./index.js";

// ─────────────────────────────────────────────────────────────────────────────
// EDITABLE — Johnny tunes voice + recipes. Every quote VERBATIM from the Carlos
// call corpus ("guided, not faked"). See docs/LENSES-CONTENT.md §2.
// ─────────────────────────────────────────────────────────────────────────────
export const realestateLens: Lens = {
  industry: "realestate",

  sellerIdentity: {
    who: "Johnny Sheng — independent AI-automations marketer, SF. linkedin.com/in/johnny--sheng.",
    offer:
      "Enrichment + story + sorting on YOUR lead data — 'the patty, the meat and potatoes' (outreach is 'the tomato and lettuce'). Durable CRM-style data system, rerunnable, not automation slop that 'needs to be completely rebuilt every two months.' Flat base + commission ($65-85/hr anchor).",
    proofPoints: [
      "Real-estate investor client agreed $4-5k flat + 10-20% commission ('anywhere from 4 5 K would be sick')",
      "Marketing agency signed fixed $5,040 / 2 months / 4 modules + ~$250/mo running costs",
      "'name + linkedin' Google-search hack: ~85% hit rate where scrapers get accounts flagged",
      "LinkedIn outreach ~40% reply rate vs cold email ~2% ('if you're doing like good')",
      "The pricing anchor to beat: refused vendor at '$15,000 and it's like 40 enriched'",
    ],
  },
  sellerSourceUrl: "call://carlos-kickoff-2026-06-10",

  groundingSources: [
    "discovery_call:carlos-corpus",
    "public-records:ownership",
    "public-records:transfer-history",
    "public-records:sale-date",
  ],

  angles: [
    { angle: "forced_sale",      trigger: "tax delinquent / divorce filing / foreclosure risk", line: "would you rather the banks foreclosed you'll never get a loan ever again... or we make an [all-cash] offer get you out of your situation and you're good" },
    { angle: "inheritance",      trigger: "transfer to multiple kids / trust behind old sale",  line: "most times when real estate property gets transferred to kids they fight over it if they have multiple and then it ends up getting sold and so they would be like a high prospect" },
    { angle: "relocation",       trigger: "employer news event tied to the owner",              line: "it just hit the news that spacex is closing down in hawthorne... hes probably gonna sell his house in the next 2 years... lets be the first ones to talk to him" },
    { angle: "absentee_fatigue", trigger: "mailing ≠ site address + expense signals",           line: "it has so many expenses that they're like i just want to get fucking rid of this investment property" },
  ],

  signalRecipes: [
    "owner age 82 vs 24 → opposite stories from the same data (82: predictable transition; 24: active remodel plan)",
    "last sale decades ago + same owner → elderly-owner/transition read ('1967 and still the same owner')",
    "trust transfer hiding behind an old sale date → younger-heir flip ('michael's 30... moving up in his career')",
    "inheritance to multiple kids → forced sale ('they fight over it... ends up getting sold')",
    "employer news event → relocation window (SpaceX leaving Hawthorne → 'sell his house in the next 2 years... lets be the first ones to talk to him')",
    "mailing ≠ site address → absentee/rental read, ~50/50 ('just want to get rid of this investment property')",
    "owner-occupied + business mailing elsewhere → business-registry lookup → sophistication read",
    "owner works in real estate → change the PITCH, not the target",
    "tax delinquent → 'prime house that they're probably gonna be forced to sell'",
    "divorce filing → sell-likely regardless of property age ('all public knowledge')",
    "equity position via title run → options read (outright vs owes 90%: 'different Outlook')",
    "phone number on Zillow → active intent, 30-60 day window; just sold 2 days ago → skip ('likelihood is seven percent')",
    "year built old + no remodel since 1980 → distress proxy; zoning → developer-attractiveness gate",
  ],

  drafterSystemPrompt: [
    "You are building the grounded working theory of ONE lead's situation — a story with a WHY, not a data dump.",
    STORY_FRAME_PROMPT,
    "Read the life/business STAGE, not a score. An 82-year-old owner is a person facing a predictable transition; a 24-year-old 'probably going to remodel it... they have an active plan.' Same data, opposite story.",
    "The success metric: the prospect is 'surprised when you mentioned this because he felt understood.' One wrong fact breaks the spell — their own email data was 'consistently 30% wrong.'",
    "Shape: connect a real event to THEIR specific situation, then hand them agency ('you're in a very powerful position because you can plan for this').",
    "The AI builds the patty; the human makes the pitch. NEVER write the close — 'this ai... it's not going to be able to get us the clients.' Stop at the opening line + working theory.",
    "Never invent transaction counts, team sizes, deal values, owner ages, or sale dates — use null if unknown.",
    "FACT claims must trace to a signal. ANGLE claims (life-stage reads) are allowed, labeled as interpretation, grounded on the traced fact underneath.",
  ].join("\n"),

  judgeAxesHints: [
    "grounding: fail-CLOSED — every FACT claim (transaction counts, team sizes, deal values, owner ages, sale dates, vendor quotes) must trace to a Signal; an unmatched claim is FABRICATED.",
    "ANGLE claims (life-stage reads, working theories) are allowed when labeled as interpretation AND the traced fact underneath exists — do not flag those.",
    "metric_confidence: bare numbers with no Signal are capped low.",
    NARRATIVE_ARC_CALIBRATION,
  ].join("\n"),

  openingLineShapes: [
    "True + specific + forward-looking + offers agency: 'lets be the first ones to talk to him... tell him like hey you're in a very powerful position because you can plan for this'",
    "Name the pain in their own metaphor; reflect the prospect's own structure back",
    "The judge rubric, not copy: surprise + recognition = 'he felt understood'",
    "The human close stays HUMAN (harness stops before it): 'I have 10 investors that are ready to pay cash like today... Just you give us a price'",
    "Anti-pattern: one false fact (the 30%-wrong data) breaks 'felt understood' — maps 1:1 to fabricatedClaims",
  ],
};
