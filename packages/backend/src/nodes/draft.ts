// nodes/draft.ts — [draft]: brief (+retryNote) -> story + pitch_angle. Sponsor: OpenRouter · drafter.
// S1: STUB_MODE canned drafts. Gen-0 DELIBERATELY contains the fabricated "raised a $40M Series B"
// (no matching Signal in the brief) so the held-out critic catches it — the demo heart.
import { z } from "zod";
import { getLens } from "../lenses/index.js";
import { zCompanyBrief, zIndustry, zPitchAngle } from "../schemas.js";
import { defineNode, stubMode } from "./defineNode.js";

// ─────────────────────────────────────────────────────────────────────────────
// EDITABLE — canned story copy (S1). Johnny tunes narrative voice after the pipe runs.
// The line "raised a $40M Series B" in GEN-0 is load-bearing: the critic flags it verbatim.
// ─────────────────────────────────────────────────────────────────────────────
function gen0Story(name: string): string {
  return [
    `${name} just raised a $40M Series B and is scaling go-to-market fast — which means their notification stack is about to crack.`,
    ``,
    `PROBLEM: ${name} ships weekly, but their pricing page has no enterprise notification tier and their HN launch thread is full of users asking for deeper webhook control. Growth is outrunning their messaging surface.`,
    ``,
    `FIT: a multi-channel notification layer slots exactly into the platform/infra gap their own careers page admits.`,
    ``,
    `TRACTION: weekly release cadence for 90 days straight — this team moves; integration debt compounds at that speed.`,
    ``,
    `ANGLE (multi_channel): the missing pricing tier IS the channel gap. Sell the tier they haven't built.`,
    ``,
    `ASK: 20 minutes with their platform lead before the Series B hiring wave locks the roadmap.`,
  ].join("\n");
}

function gen1Story(name: string): string {
  return [
    `${name} is a ~120-person devtools team shipping weekly — and three of their own public surfaces point at the same gap: notifications.`,
    ``,
    `PROBLEM: the HN launch thread's top comments repeatedly ask for deeper notification/webhook control [hn_launch_traction]; the pricing page lists Free/Standard/Plus with no enterprise notification tier [pricing_tier_gap]. The objection is the pain, and the missing tier is the channel gap.`,
    ``,
    `FIT: their careers page is hiring Platform + Infrastructure + DevRel [hiring_roadmap] — the roles they hire are the gaps they admit. A multi-channel notification layer is that gap, bought instead of built.`,
    ``,
    `TRACTION: a weekly release cadence over the last 90 days [github_release_cadence] — a team shipping under pressure, where integration debt compounds. Their public API beta drew coverage centered on integration demand [news_mention].`,
    ``,
    `FUNDING (corrected): no Series B on record; latest disclosed round is a $4.2M seed (2024) [funding_check] — so this is a build-vs-buy conversation at seed-stage budget, not an enterprise land-grab.`,
    ``,
    `ANGLE (multi_channel): sell the notification tier their pricing page hasn't built, sized for a seed-stage team that ships weekly.`,
    ``,
    `ASK: 20 minutes with their platform lead — bring the HN thread, not a deck.`,
  ].join("\n");
}

export const draftNode = defineNode({
  name: "draft",
  sponsor: "OpenRouter · drafter",
  wireNode: "draft",
  stubLatencyMs: 800,
  inputSchema: z.object({
    brief: zCompanyBrief,
    generation: z.number().int().min(0),
    industry: zIndustry,
    retryNote: z.string().optional(),
  }),
  outputSchema: z.object({ story: z.string().min(1), pitch_angle: zPitchAngle }),
  async executor({ brief, generation, industry, retryNote }) {
    const lens = getLens(industry);
    if (stubMode()) {
      console.log(
        `[stub] node:draft canned output (gen=${generation}, lens=${lens.industry}` +
          (retryNote ? `, retryNote present` : "") +
          `)`,
      );
      return {
        story: generation === 0 ? gen0Story(brief.name) : gen1Story(brief.name),
        pitch_angle: "multi_channel" as const,
      };
    }
    // S2: OpenRouter drafter model with lens.drafterSystemPrompt (+ retryNote as MUST-FIX context)
    throw new Error("draft live mode lands at S2 — run with STUB_MODE unset/1 (no silent stubs)");
  },
});
