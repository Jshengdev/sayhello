// nodes/render.ts — [render]: StoryRun -> walkable slides + OpenUI receipt. Sponsor: Thesys OpenUI.
//
// V2 (lane 2): LIVE BY DEFAULT per the PROVEN recipe (docs/reference/OPENUI-RENDER.md +
// .evidence/openui-probe/): custom paper-light component library -> library.prompt() system prompt ->
// OpenRouter google/gemini-2.5-flash (temp 0, reasoning OFF) -> lang-core createParser validity gate ->
// ONE corrective retry -> typed-slides fallback that NEVER blocks. Failure is visible: loud [seam] log
// + openuiLang=null (frontend renders "render FAILED -> local slides"), never silent.
// V2 contract adds (recorded): render outputSchema -> { slides, openuiLang: string|null }
// (OPENUI-RENDER CONTRACT-ADD-1); receipt stored via store.setReceipt and served by
// GET /story/:leadId/receipt (CONTRACT-ADD-2). StoryRun itself stays untouched (no slides field).
import { createLibrary, createParser, defineComponent } from "@openuidev/lang-core";
import { z as z4 } from "zod/v4"; // lang-core REQUIRES the zod/v4 subpath (zod 3.25.x ships it)
import { z } from "zod";
import { MODELS } from "../llm/models.js";
import { generate, type ChatMessage } from "../llm/openrouter.js";
import { zStoryRun } from "../schemas.js";
import type { StoryRun } from "../types.js";
import type { Slide } from "../store/memory.js";
import { defineNode, stubExplicit } from "./defineNode.js";

const zSlide = z.object({ title: z.string().min(1), body: z.string() });

// ─────────────────────────────────────────────────────────────────────────────
// The paper-light verification library — VERBATIM from the proven probe
// (.evidence/openui-probe/probe.mjs). Zod key order = positional arg order: the
// frontend mirror (components on these names/props) must NEVER reorder keys
// without regenerating this prompt. component stubs are fine server-side.
// ─────────────────────────────────────────────────────────────────────────────
const stub = (): null => null;

const ClaimRow = defineComponent({
  name: "ClaimRow",
  description: "One claim from the lead-story with its grounding verdict and optional scraped source",
  props: z4.object({
    claim: z4.string(),
    status: z4.enum(["GROUNDED", "FABRICATED", "CUT"]),
    source: z4.string().optional(), // scraped URL/path proving the claim
  }),
  component: stub,
});

const ClaimsLedger = defineComponent({
  name: "ClaimsLedger",
  description: "The claims ledger: every claim in the story with its verdict, FABRICATED rows first",
  props: z4.object({ rows: z4.array(ClaimRow.ref) }),
  component: stub,
});

const EvidenceItem = defineComponent({
  name: "EvidenceItem",
  description: "Drill-down for one claim: the scraped excerpt that proves it (or the reason it failed)",
  props: z4.object({
    claim: z4.string(),
    excerpt: z4.string(),
    url: z4.string().optional(),
  }),
  component: stub,
});

const EvidenceAccordion = defineComponent({
  name: "EvidenceAccordion",
  description: "Collapsible per-claim evidence drill-down",
  props: z4.object({ items: z4.array(EvidenceItem.ref) }),
  component: stub,
});

const TrajectoryChart = defineComponent({
  name: "TrajectoryChart",
  description: "Grounding score per generation, showing the harness improving the story",
  props: z4.object({
    points: z4.array(z4.object({ generation: z4.number(), grounding: z4.number() })),
  }),
  component: stub,
});

const GateBlock = defineComponent({
  name: "GateBlock",
  description: "The human approve-gate. action is the event name emitted on click",
  props: z4.object({
    label: z4.string(),
    action: z4.string(),
    note: z4.string().optional(),
  }),
  component: stub,
});

const Receipt = defineComponent({
  name: "Receipt",
  description: "Root verification receipt for one lead-story run",
  props: z4.object({
    company: z4.string(),
    headline: z4.string(), // one-line verdict, e.g. "1 fabricated claim caught, story re-grounded"
    body: z4.array(z4.union([ClaimsLedger.ref, EvidenceAccordion.ref, TrajectoryChart.ref, GateBlock.ref])),
  }),
  component: stub,
});

export const receiptLibrary = createLibrary({
  root: "Receipt",
  components: [Receipt, ClaimsLedger, ClaimRow, EvidenceAccordion, EvidenceItem, TrajectoryChart, GateBlock],
  componentGroups: [
    {
      name: "Ledger",
      components: ["ClaimsLedger", "ClaimRow"],
      notes: [
        "- Every claim in the input MUST appear as a ClaimRow; FABRICATED rows come first.",
        "- Only GROUNDED rows get a source.",
      ],
    },
    {
      name: "Evidence",
      components: ["EvidenceAccordion", "EvidenceItem"],
      notes: ["- One EvidenceItem per claim that has evidence or a failure reason."],
    },
  ],
});

// ─────────────────────────────────────────────────────────────────────────────
// EDITABLE — RECEIPT_PROMPT (Johnny tunes wording). The example is the probe's
// real validated output (.evidence/openui-probe/output.openui) — one full example
// dramatically improves first-attempt validity (probe: valid on attempt 1).
// ─────────────────────────────────────────────────────────────────────────────
export const RECEIPT_PROMPT = {
  preamble:
    "You compose a verification receipt UI for a sales lead-story run. " +
    "You are given a StoryRun JSON. Render ONLY what the JSON supports — never invent claims, sources, scores, or numbers. " +
    "Order: ClaimsLedger, EvidenceAccordion, TrajectoryChart, GateBlock.",
  additionalRules: [
    'Any claim the input marks FABRICATED must render with status "FABRICATED" — the catch is the point — even if a later generation cut it.',
    "Use EXACTLY the claims[] entries as ClaimRows — one row per entry, no more, no fewer, never invent or repeat rows.",
    "Use every trajectory[] entry as a TrajectoryChart point.",
    'The GateBlock action must be exactly "approve_story".',
    "Respond with OpenUI Lang statements only — no prose, no markdown fences.",
  ],
  examples: [
    `root = Receipt("Vantra Logistics", "1 fabricated claim caught and cut", [ledger, evidence, chart, gate])
ledger = ClaimsLedger([r1, r2, r3])
r1 = ClaimRow("Vantra raised a $40M Series B led by Indexline", "FABRICATED")
r2 = ClaimRow("Vantra runs real-time freight visibility for 200+ mid-market shippers", "GROUNDED", "vantra.io/customers")
r3 = ClaimRow("Their stack ingests 1B telematics events/day into ClickHouse", "GROUNDED", "vantra.io/blog/scaling-telemetry")
evidence = EvidenceAccordion([e1, e2, e3])
e1 = EvidenceItem("Vantra runs real-time freight visibility for 200+ mid-market shippers", "\\"Trusted by 200+ mid-market shippers to track every load in real time.\\"", "vantra.io/customers")
e2 = EvidenceItem("Their stack ingests 1B telematics events/day into ClickHouse", "\\"We ingest just over a billion telematics events a day into ClickHouse.\\"", "vantra.io/blog/scaling-telemetry")
e3 = EvidenceItem("Vantra raised a $40M Series B led by Indexline", "NO SOURCE FOUND in 14 scraped pages. Critic flagged FABRICATED in gen 1; cut in gen 2.", null)
chart = TrajectoryChart([p1, p2])
p1 = {generation: 1, grounding: 0.4}
p2 = {generation: 2, grounding: 0.92}
gate = GateBlock("Approve story", "approve_story", "Grounding 0.92 — ready for human review")`,
  ],
};

function stripFences(text: string): string {
  return text.replace(/^```[a-z-]*\s*$/gim, "").trim();
}

/**
 * Slim payload shaped like the PROVEN probe input: an EXPLICIT pre-derived claims list, not raw
 * story text (probe gotcha learned live: handing the model the full story makes it derive the
 * ledger open-endedly — gemini-2.5-flash at temp 0 looped to 600+ rows and token-truncated).
 * FABRICATED rows = every claim any generation flagged; GROUNDED rows = the top signals. Hard caps.
 */
function slimRun(run: StoryRun): unknown {
  const name = run.brief?.name ?? run.url;
  const fabricated = [...new Set(run.generations.flatMap((g) => g.fabricatedClaims))].slice(0, 3);
  const topSignals = (run.brief?.signals ?? [])
    .filter((s) => s.detail && s.source_url)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 5);
  return {
    company: name,
    url: run.url,
    summary: {
      generations: run.generations.length,
      fabricatedCaught: fabricated.length,
      finalGrounding: run.score?.grounding ?? null,
      verdict: run.score?.verdict ?? null,
    },
    claims: [
      ...fabricated.map((claim) => ({ claim, status: "FABRICATED", source: null })),
      ...topSignals.map((s) => ({ claim: s.detail.slice(0, 160), status: "GROUNDED", source: s.source_url })),
    ],
    evidence: [
      ...fabricated.map((claim) => ({
        claim,
        excerpt: "NO SOURCE FOUND — the Critic flagged this claim FABRICATED and it was cut.",
        url: null,
      })),
      ...topSignals.slice(0, 3).map((s) => ({ claim: s.detail.slice(0, 160), excerpt: `"${s.detail.slice(0, 220)}"`, url: s.source_url })),
    ],
    trajectory: run.generations.map((g) => ({ generation: g.generation, grounding: g.score.grounding })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EDITABLE — local typed slides (the floor that never blocks). Generic section
// carver: handles both the V2 5-beat headers (THE GOAL / THE OBSTACLE / THE OLD
// WAY FAILS / THE BETTER PATH / THE BETTER OUTCOME) and the S1 legacy headers
// (PROBLEM/FIT/TRACTION/ANGLE/ASK) — any `ALL-CAPS HEADER:` line starts a slide.
// ─────────────────────────────────────────────────────────────────────────────
const HEADER_RE = /^([A-Z][A-Z0-9 '&()/_-]{1,40}?)(?:\s*\([a-z_]+\))?:\s*(.*)$/;

export function carveSlides(story: string, leadName: string): Slide[] {
  const lines = story.split("\n");
  const slides: Slide[] = [];
  let current: Slide | null = null;
  let intro = "";
  for (const line of lines) {
    const m = line.match(HEADER_RE);
    if (m) {
      if (current) slides.push(current);
      current = { title: m[1]!.toLowerCase(), body: m[2] ?? "" };
    } else if (current) {
      current.body = (current.body + "\n" + line).trim();
    } else if (line.trim() && !intro) {
      intro = line.trim();
    }
  }
  if (current) slides.push(current);
  const title: Slide = { title: `before you say hello: ${leadName}`, body: intro || lines.find((l) => l.trim()) || "" };
  if (slides.length === 0) {
    // no headers at all — paragraph chunks, max 5
    const paras = story.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).slice(0, 5);
    return [title, ...paras.map((p, i) => ({ title: `beat ${i + 1}`, body: p }))];
  }
  return [title, ...slides];
}

const parser = createParser(receiptLibrary.toJSONSchema(), "Receipt");

function parseValidity(text: string): { valid: boolean; meta: { errors: unknown[]; unresolved: unknown[]; orphaned: unknown[]; incomplete: boolean } } {
  const parsed = parser.parse(text);
  const valid =
    parsed.root !== null &&
    parsed.meta.errors.length === 0 &&
    parsed.meta.unresolved.length === 0 &&
    !parsed.meta.incomplete;
  return { valid, meta: parsed.meta };
}

/** Live OpenUI call with ONE corrective retry. Throws on total failure (caller falls back LOUDLY). */
async function renderOpenuiLang(run: StoryRun, leadId: string): Promise<string> {
  const systemPrompt = receiptLibrary.prompt(RECEIPT_PROMPT);
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: "Render the verification receipt for this StoryRun:\n" + JSON.stringify(slimRun(run)) },
  ];
  for (let attempt = 1; attempt <= 2; attempt++) {
    const result = await generate(messages, {
      model: MODELS.RENDERER.model,
      temperature: 0,
      maxTokens: 3000,
      reasoning: { enabled: false }, // proven recipe — gemini-2.5-flash, reasoning OFF
      agentName: "renderer",
      runId: leadId,
    });
    const text = stripFences(result.text);
    const { valid, meta } = parseValidity(text);
    if (valid) {
      console.log(`[seam] render openui -> attempt=${attempt} valid -> ${text.length} chars -> ok`);
      return text;
    }
    console.error(
      `[seam] render openui -> attempt=${attempt} INVALID -> errors=${JSON.stringify(meta.errors)} unresolved=${JSON.stringify(meta.unresolved)} incomplete=${meta.incomplete} -> ${attempt === 1 ? "corrective retry" : "FAIL"}`,
    );
    messages.push({ role: "assistant", content: result.text });
    messages.push({
      role: "user",
      content:
        "Your OpenUI Lang had problems. Fix and re-emit the FULL program (statements only, no prose): " +
        JSON.stringify({ errors: meta.errors, unresolved: meta.unresolved, orphaned: meta.orphaned, incomplete: meta.incomplete }),
    });
  }
  throw new Error("openui lang invalid after corrective retry");
}

export const renderNode = defineNode({
  name: "render",
  sponsor: "Thesys OpenUI",
  wireNode: "render",
  stubLatencyMs: 650,
  stubWhen: stubExplicit, // V2: LIVE default; stub only when STUB_MODE=1
  inputSchema: z.object({ run: zStoryRun }),
  // V2 contract add (OPENUI-RENDER CONTRACT-ADD-1): openuiLang rides beside the typed slides;
  // null = OpenUI path failed (visible fallback), slides are ALWAYS present (never blocks).
  outputSchema: z.object({ slides: z.array(zSlide).min(1), openuiLang: z.string().nullable() }),
  async executor({ run }, ctx) {
    if (!run.story) throw new Error("render: run.story is null — cannot render (fail loud)");
    const leadName = run.brief?.name ?? run.url;
    const slides = carveSlides(run.story, leadName);

    if (stubExplicit()) {
      console.log("[stub] node:render carved typed slides only — STUB_MODE=1 forced");
      return { slides, openuiLang: null };
    }

    // ── LIVE (default): OpenUI receipt; typed slides are the floor that never blocks ──
    try {
      const openuiLang = await renderOpenuiLang(run, ctx.leadId);
      return { slides, openuiLang };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Visible fallback, never silent, never blocks the run (no-silent-stubs law):
      // openuiLang=null tells the frontend to badge "openui FAILED -> local slides".
      console.error(`[seam] render openui -> ${msg} -> FAIL (falling back to local typed slides, openuiLang=null)`);
      return { slides, openuiLang: null };
    }
  },
});
