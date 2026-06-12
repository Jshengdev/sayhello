// lenses/gtm.ts — the FULL gtm lens (docs/DECISIONS.md §3 table + docs/reference/SOUL.md L1/L2/L3).
// SF SaaS outreach: handle = company URL. Grounding = scrape + ClickHouse github_events/hackernews + SEC/news.
import type { Lens } from "./index.js";

// ─────────────────────────────────────────────────────────────────────────────
// EDITABLE — Johnny tunes narrative voice + recipes here after the skeleton runs.
// ─────────────────────────────────────────────────────────────────────────────
export const gtmLens: Lens = {
  industry: "gtm",
  groundingSources: [
    "firecrawl:company-site",
    "clickhouse:github_events",
    "clickhouse:hackernews",
    "composio:news",
    "composio:sec_filings",
    "composio:finance",
  ],
  // gtm angles per DECISIONS table: resilience / channel-gap / build-v-buy / speed,
  // mapped onto the PitchAngle union (channel-gap -> multi_channel, speed -> speed_to_market).
  angles: ["resilience", "multi_channel", "build_vs_buy", "speed_to_market"],
  // L2 — on-demand curated specs (~15%): the signal-reading recipes, gotcha-aware, plain English.
  signalRecipes: [
    "Read GitHub release cadence as engineering velocity: a tight weekly cadence is a team shipping under pressure; a stall is a re-platform or a fire.",
    "Read star-velocity spikes against launch dates: a spike with no launch is organic developer pull — pull is a wedge.",
    "Read the Hacker News launch thread's top comments for the recurring complaint — the objection IS the pain.",
    "Read the careers page as a roadmap: the roles they are hiring are the gaps they have admitted.",
    "Read the pricing page for who they are NOT serving — the missing tier is the channel gap.",
    "Funding claims are fail-CLOSED: no scraped page, news hit, or SEC filing = FABRICATED. Cut it, never soften it.",
  ],
  drafterSystemPrompt: [
    "You are building the grounded working theory of ONE company's pain — a story with a WHY, not a data dump.",
    "L1 (always resident): who they are, their stage, and the ONE most likely pain. Token-efficient, consequence-reporting.",
    "Structure: problem -> fit -> traction -> angle -> ask. Connect a real event to their specific situation and offer agency.",
    "Every factual claim must trace to a provided Signal (cite its source). Mark guesses explicitly as guesses.",
    "The marker of success is 'felt understood' — surprise + recognition. You build the patty; the human makes the pitch. Do NOT close.",
  ].join("\n"),
  judgeAxesHints: [
    "grounding: fail-CLOSED — every factual claim (funding, customers, metrics, tech) must trace to a Signal source_url; an unmatched claim is FABRICATED.",
    "metric_confidence: bare numbers with no Signal are capped low.",
    "narrative_arc: problem -> fit -> proof -> ask must actually arc; a feature list scores low.",
  ].join("\n"),
};
