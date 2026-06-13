// nodes/draft.ts — [draft]: brief (+retryNote) -> story + pitch_angle. Sponsor: OpenRouter · drafter.
//
// V2 (lane 2): LIVE BY DEFAULT — the real OpenRouter drafter runs unless STUB_MODE=1 explicitly
// forces the canned S1 path (R7 rehearsal floor). Drafter context = brief + signals ONLY (no larping):
// the brief prose DELIBERATELY rides along — planted fixture claims live there, the drafter naturally
// uses them, and the held-out judge (whose corpus is signals[] only) catches them. That asymmetry IS
// the deterministic catch (docs/LENSES-CONTENT.md build-lane dependency).
// V2 contract add: optional `positioning` input (RunInput.positioning) woven into the seller block.
import { z } from "zod";
import { getLens, sellerSignals } from "../lenses/index.js";
import { generate, parseJsonLoose } from "../llm/openrouter.js";
import { MODELS } from "../llm/models.js";
import { zCompanyBrief, zIndustry, zPitchAngle } from "../schemas.js";
import type { CompanyBrief, PitchAngle } from "../types.js";
import { defineNode, stubExplicit } from "./defineNode.js";

// ─────────────────────────────────────────────────────────────────────────────
// EDITABLE — canned story copy (S1 rehearsal, STUB_MODE=1 only). Johnny tunes voice.
// The line "raised a $40M Series B" in GEN-0 is load-bearing: the stub critic flags it verbatim.
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

/** Drafter user message: brief + signals ONLY (signals listed explicitly; prose rides in the brief). */
function buildDrafterUserMessage(brief: CompanyBrief, retryNote?: string): string {
  const { signals, ...briefSansSignals } = brief;
  const lines = [
    "LEAD BRIEF (research record — the working facts):",
    JSON.stringify(briefSansSignals, null, 2),
    "",
    "SIGNALS (the evidence corpus — cite as [signal_type]; FACT claims must trace here or to [seller_pack]):",
    ...signals.map((s) => `- [${s.signal_type}] ${s.source} ${s.source_url}: ${s.detail} (strength ${s.strength})`),
  ];
  if (retryNote) {
    lines.push(
      "",
      "MUST-FIX — the held-out critic rejected the previous generation:",
      retryNote,
      "Remove or correctly ground every flagged claim. Do not soften a fabricated claim — CUT it.",
      "RETRY RESTRAINT (binding): prose numbers burned you. In this redraft, every number, count, dollar figure, percentage, and named quantity MUST appear in SIGNALS or [seller_pack] — facts that exist only in the LEAD BRIEF prose are unverified: describe them qualitatively ('their raw county list', 'their recent closes') or omit them. Do not swap a flagged fact for a different unverified one.",
      "NEVER write absence-of-evidence or hedge statements into the story ('there is no evidence that…', 'no signal shows…'). A cut claim is simply OMITTED — the story reads as if it never existed. Hedges are not storytelling.",
    );
  }
  return lines.join("\n");
}

export const draftNode = defineNode({
  name: "draft",
  sponsor: "OpenRouter · drafter",
  wireNode: "draft",
  stubLatencyMs: 800,
  stubWhen: stubExplicit, // V2: LIVE default; stub only when STUB_MODE=1
  inputSchema: z.object({
    brief: zCompanyBrief,
    generation: z.number().int().min(0),
    industry: zIndustry,
    retryNote: z.string().optional(),
    positioning: z.string().optional(), // V2 contract add — RunInput.positioning passthrough
    // Flagged claims STILL unsourced after reenrich. The drafter is told to cut them (retryNote);
    // this is the MECHANICAL backstop — the MUST-FIX linter physically enforces the cut, because a
    // drafter that believes its own brief prose will keep restating it forever (the 3:15 regen-spiral).
    mustCut: z.array(z.string()).optional(),
  }),
  outputSchema: z.object({ story: z.string().min(1), pitch_angle: zPitchAngle }),
  async executor({ brief, generation, industry, retryNote, positioning, mustCut }, ctx) {
    const lens = getLens(industry);
    if (stubExplicit()) {
      console.log(
        `[stub] node:draft canned output (gen=${generation}, lens=${lens.industry}` +
          (retryNote ? `, retryNote present` : "") +
          `) — STUB_MODE=1 forced`,
      );
      return {
        story: generation === 0 ? gen0Story(brief.name) : gen1Story(brief.name),
        pitch_angle: "multi_channel" as const,
      };
    }

    // ── LIVE (default): lens-pack drafter on the STRONG model ──────────────────
    const seller = lens.sellerIdentity;
    const sellerProof = sellerSignals(lens);
    const systemPrompt = [
      lens.drafterSystemPrompt,
      "",
      "SELLER (the better-path side — receipts only, NEVER the protagonist):",
      `who: ${seller.who}`,
      `offer: ${seller.offer}`,
      "proof points (cite as [seller_pack] — claims about the seller must trace here too):",
      ...sellerProof.map((s) => `- ${s.detail}`),
      ...(seller.notCustomers?.length
        ? [`NEVER claim these as customers (instant FABRICATED): ${seller.notCustomers.join("; ")}`]
        : []),
      ...(positioning ? [`seller positioning for THIS run (Johnny's words): ${positioning}`] : []),
      "",
      "ANGLE MENU — pick exactly ONE pitch_angle whose trigger the signals actually match (top to bottom):",
      ...lens.angles.map((a) => `- ${a.angle} | trigger: ${a.trigger} | shape: ${a.line}`),
      "",
      "OPENING-LINE REGISTER (real shapes that got replies — match the register, never copy):",
      ...lens.openingLineShapes.map((s) => `- ${s}`),
      "",
      "SIGNAL-READING RECIPES (how to read signal X into story Y):",
      ...lens.signalRecipes.map((r) => `- ${r}`),
      "",
      'Respond with JSON ONLY (no prose, no fences): {"story": "<the 5-beat story, section headers on their own lines, \\n line breaks>", "pitch_angle": "<one angle id from the menu>"}',
      "The story value MUST contain all five headers verbatim: THE GOAL / THE OBSTACLE / THE OLD WAY FAILS / THE BETTER PATH / THE BETTER OUTCOME.",
    ].join("\n");

    // ONE visible retry on unparseable completion (truncation / fence weirdness) — the demo's
    // draft beat must not die to a single bad sample. Second failure throws loud as before.
    let parsed: { story?: unknown; pitch_angle?: unknown } | null = null;
    let modelUsed = MODELS.DRAFTER.model;
    for (let attempt = 1; attempt <= 2 && !parsed; attempt++) {
      const result = await generate(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: buildDrafterUserMessage(brief, retryNote) },
        ],
        {
          model: MODELS.DRAFTER.model,
          temperature: attempt === 1 ? 0.7 : 0.4,
          maxTokens: 3200,
          agentName: "drafter",
          runId: ctx.leadId,
        },
      );
      modelUsed = result.model;
      try {
        parsed = parseJsonLoose(result.text, "drafter") as { story?: unknown; pitch_angle?: unknown };
      } catch (err) {
        if (attempt === 2) throw err;
        console.log(
          `[seam] draft -> completion unparseable (attempt 1, likely truncation; len=${result.text.length}) -> ONE visible retry at temp 0.4`,
        );
      }
    }
    let story = typeof parsed!.story === "string" ? (parsed!.story as string).trim() : "";
    if (!story) throw new Error(`[drafter] completion parsed but story is empty (model=${modelUsed})`);

    // ── MECHANICAL CUT (the MUST-FIX linter enforces) ────────────────────────
    // Two passes: exact normalized substring, then DISTINCTIVE-TOKEN (the numbers inside a flagged
    // claim — "10k-row", "14", "85%"). Drafters evade substring cuts by paraphrasing; they cannot
    // keep the claim without keeping its number. Tokens that appear in ANY Signal are exempt.
    if (mustCut?.length) {
      const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
      const corpusNorm = norm(brief.signals.map((s) => s.detail).join(" || "));
      const cutTokens = new Set<string>();
      for (const claim of mustCut) {
        for (const tok of claim.toLowerCase().match(/\d[\d,.]*[\w%-]*/g) ?? []) {
          if (!corpusNorm.includes(tok)) cutTokens.add(tok);
        }
      }
      const offends = (sentence: string): string | null => {
        const ns = norm(sentence);
        for (const claim of mustCut) if (norm(claim) && ns.includes(norm(claim))) return claim;
        for (const tok of cutTokens) if (ns.includes(tok)) return `token "${tok}"`;
        return null;
      };
      story = story
        .split("\n")
        .map((line) => {
          if (/^THE [A-Z ]+:?\s*$/.test(line.trim())) return line; // never touch the 5-beat headers
          return line
            .split(/(?<=[.!?])\s+/)
            .filter((sentence) => {
              const hit = offends(sentence);
              if (hit) {
                console.log(
                  `[seam] draft -> MECHANICAL CUT enforced: ${hit.slice(0, 70)} -> sentence stripped (MUST-FIX linter, gen=${generation})`,
                );
                return false;
              }
              return true;
            })
            .join(" ");
        })
        .join("\n");
      if (!story.trim()) throw new Error("[drafter] mechanical cuts emptied the story — drafter built everything on flagged claims");
    }

    // pitch_angle must be in the widened union AND this lens's menu — coerce LOUDLY, never silently.
    let pitch_angle: PitchAngle;
    const angleParse = zPitchAngle.safeParse(parsed!.pitch_angle);
    const menu = lens.angles.map((a) => a.angle);
    if (angleParse.success && menu.includes(angleParse.data)) {
      pitch_angle = angleParse.data;
    } else {
      pitch_angle = menu[0]!;
      console.error(
        `[seam] drafter pitch_angle ${JSON.stringify(parsed!.pitch_angle)} not in lens menu [${menu.join(",")}] -> coerced to ${pitch_angle} (visible coercion, not silent)`,
      );
    }
    return { story, pitch_angle };
  },
});
