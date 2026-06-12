// lenses/gtm.ts — the FULL gtm lens. Seller = PHOTON (docs/LENSES-CONTENT.md §1, verbatim consts).
// SF SaaS outreach: handle = company URL. Grounding = scrape + ClickHouse github_events/hackernews + SEC/news.
// V2 contract add: sellerIdentity + LensAngle menu + openingLineShapes + STORY-FRAME 5-beat fold.
import { NARRATIVE_ARC_CALIBRATION, STORY_FRAME_PROMPT, type Lens } from "./index.js";

// ─────────────────────────────────────────────────────────────────────────────
// EDITABLE — Johnny tunes narrative voice + recipes here. Every quote is VERBATIM
// from mined source (photon-gtm repo, Daniel's real DMs). See docs/LENSES-CONTENT.md §1.
// ─────────────────────────────────────────────────────────────────────────────
export const gtmLens: Lens = {
  industry: "gtm",

  sellerIdentity: {
    who: "Photon — open-source iMessage infrastructure for AI agents. CEO Daniel Tian. ~5 months old.",
    offer:
      "imessage-kit (open-source TS SDK) + Advanced iMessage Kit (paid: tapbacks, typing indicators, effects, read receipts, voice messages, edit/recall) + Spectrum (one-SDK iMessage/Telegram/Discord layer, photon.codes/spectrum).",
    proofPoints: [
      // each becomes a seller-side Signal; FACTs must trace
      "imessage-kit: ~2,300 GitHub stars, 20K+ developers, github.com/photon-hq/imessage-kit",
      "Ditto: 42,000+ users across 5 campuses (UCSD, Berkeley, USC, UCLA, UC Davis), 20% of matches convert to in-person dates, 99.87% message delivery, zero downtime during Apple throttling events, $9.2M seed from Peak XV Partners",
      "TinyFish runs enterprise web agents on the SDK ($47M Series A, ICONIQ Growth)",
      "MiroFish simulation: 'infrastructure durability' (42 likes) vs '98% open rate' (2 likes) — resilience resonates 21x",
      "We shipped a full SDK in one week, infrastructure in one month",
    ],
    notCustomers: ["Poke (uses Linq)", "Tomo (uses a competitor)", "Series (uses a competitor)"], // Critic-trap: claiming these = FABRICATED-class
  },
  sellerSourceUrl: "repo://photon-gtm",

  groundingSources: [
    "firecrawl:company-site",
    "clickhouse:github_events",
    "clickhouse:hackernews",
    "composio:news",
    "composio:sec_filings",
    "composio:finance",
  ],

  // The angle MENU — selection order is the if-chain; selection happens inside the draft prompt.
  angles: [
    { angle: "upgrade_from_sms",      trigger: "uses Sendblue/Linq or home-built iMessage", line: "Lead with what Photon unlocks that they're missing: tapbacks, typing indicators, effects, voice messages." },
    { angle: "multi_channel",         trigger: "CX/support platform missing iMessage",      line: "You support 7 channels but not the one with the highest engagement in the US." },
    { angle: "build_vs_buy",          trigger: "iMessage engineering job postings",         line: "You're spending $200K/yr on an iMessage engineer. We built this already." },
    { angle: "speed_to_market",       trigger: "just raised + conversational AI",           line: "npm install imessage-kit. Try it in 5 minutes. No sales call." },
    { angle: "revenue_share",         trigger: "platform with 1,000+ customers",            line: "Add iMessage to your platform. One integration, your entire customer base gets access." },
    { angle: "agentic_notifications", trigger: "agents proactively reach users",            line: "Your agents need a channel users actually open. iMessage has 98% read rates — better than push or email." },
    { angle: "resilience",            trigger: "DEFAULT",                                   line: "The messaging infrastructure that survives platform shifts. Open source, multi-channel, audit-ready." },
  ],

  // L2: signal X → story Y (gotcha-aware, plain English).
  signalRecipes: [
    "'iMessage coming soon' on site / iMessage in feature list → they already named the problem (strength 10)",
    "confirmed Sendblue/Linq via tech stack, npm deps, docs → proven need, ready to switch (9)",
    "iMessage job posting → build_vs_buy: '$200K/yr engineer vs we built this already' (9)",
    "SMS-sender today / WhatsApp/Telegram touchpoint → pitch iMessage as the NEXT layer — never search for the thing you sell",
    "platform with 1,000+ customers → revenue_share: one integration, whole customer base",
    "agents proactively reach users → agentic_notifications: 'a channel users actually open'",
    "Seed/Series A, <30 people, technical founder → sdk_adoption motion, decides in days",
    "DISQUALIFY (icp=0): direct competitor (Sendblue/Linq/Blooio/LoopMessage/Project Blue); defunct 12+ mo; >10k employees unless platform → partnership_potential",
  ],

  drafterSystemPrompt: [
    "You are building the grounded working theory of ONE company's pain — a story with a WHY, not a data dump.",
    STORY_FRAME_PROMPT,
    "Never hallucinate funding amounts, employee counts, or founding dates — use null if unknown.",
    "Be specific. 'Uses iMessage infrastructure, confirmed via job postings' is better than 'uses messaging tools.'",
    "Do NOT force positivity. The reader makes better decisions with honest weak-fit calls.",
    "NEVER say 'we work with [customer]' or 'we power [customer].' SAY: 'Ditto uses our SDK for [purpose]' or '20K+ developers use the open source SDK.'",
    "Voice: 'hey [Name] -' regular hyphen; 1-2 sentences, under 50 words; Compliments are SHORT (3-7 words); the register is peer respect, not fan mail; one !! max; GitHub link in msg 1; NO customer mentions in message 1. 90/10 rule: 90% about them, 10% about us. ONE CTA per message. Not two.",
    'BANNED (instant fail): em-dashes, smart quotes, "same shape", "circling back/checking in/just following up", "I\'d love to", "streamline/leverage/unlock/empower".',
    'RETIRED: never lead with "98% open rate"; never "AI as a friend in your iMessage"; never feature-dump without a pain.',
    "The marker of success is 'felt understood' — surprise + recognition. You build the patty; the human makes the pitch. Do NOT close.",
  ].join("\n"),

  judgeAxesHints: [
    "grounding: fail-CLOSED — every factual claim (funding, customers, metrics, tech) must trace to a Signal source_url; an unmatched claim is FABRICATED.",
    "metric_confidence: bare numbers with no Signal are capped low.",
    NARRATIVE_ARC_CALIBRATION,
    "seller-trap: Poke, Tomo and Series are NOT Photon customers — any claim they are is FABRICATED-class.",
  ].join("\n"),

  // Daniel's real DMs that got replies — the register the opening line must hit.
  openingLineShapes: [
    `hey Stephen - really impressed by the Axel chat feature!! was wondering if you've considered iMessage at all?`,
    `hey Andrew - hope you are doing well! Was wondering if you guys had ever explored the iMessage option to reach more audience :)`,
    `hey Erick - really cool what you guys are doing with Atom. ever considered iMessage / Telegram as a touchpoint for your users? we just shipped Spectrum, if you wouldn't mind a quick look it might fit, photon.codes/spectrum`,
    // Day-3 follow-up shape (credibility goes in msg 2, never msg 1):
    `hey Erick - just wanted to follow up. TinyFish runs their enterprise web agents on our SDK ($47M Series A from ICONIQ), figured if you wouldn't mind a quick look it might be relevant for what Atom is doing, photon.codes/spectrum`,
  ],
};
