// lenses/marketing.ts — TYPED STUB lens (selectable without crashing; content lands post-S1).
// handle = brand URL. Grounding = brand site, social, recent campaigns/launches.
// TODO(Johnny): full content per docs/DECISIONS.md §3 (aiden/vortex yaps).
import type { Lens } from "./index.js";

// ─────────────────────────────────────────────────────────────────────────────
// EDITABLE — TODO content. Johnny fills from the vortex grounding.
// ─────────────────────────────────────────────────────────────────────────────
export const marketingLens: Lens = {
  industry: "marketing",
  groundingSources: [
    "firecrawl:brand-site",
    "social:recent-posts",
    // TODO: campaign/launch trackers
  ],
  // marketing angles per DECISIONS: brand-gap / channel / positioning -> nearest PitchAngle stand-ins.
  angles: ["multi_channel", "resilience"],
  signalRecipes: [
    "Read the last 3 campaigns against the brand's stated positioning — the gap between them is the pitch.",
    "TODO: read channel mix (where they post vs where their audience lives) into a channel-gap story.",
  ],
  drafterSystemPrompt:
    "TODO(marketing): build the grounded brand-gap story of one brand — same harness, agency lens. " +
    "Every claim traces to the brand site, a social post, or a campaign. The human makes the pitch.",
  judgeAxesHints:
    "TODO(marketing): grounding fail-CLOSED; campaign/positioning claims need a live source URL.",
};
