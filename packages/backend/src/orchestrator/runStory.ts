// orchestrator/runStory.ts — drives the node sequence with the ≤2-retry regen loop.
// handle -> scrape -> enrich -> ground -> draft -> judge ──emit──> gate(human) -> archive -> render -> done
//                                           ↑                │regen
//                                           └── reenrich ←───┘   (max 2 retries, fail-CLOSED after)
// Accumulates StoryRun (status transitions per types.ts), pushes every generation into generations[],
// emits the full WsEvent set per docs/CONTRACTS.md. score_done fires the MOMENT the judge returns —
// fabricatedClaims is the demo heart. On any throw: {type:"failed", stage} (fail LOUD, no silent stubs).
import { archiveNode } from "../nodes/archive.js";
import { NodeFailure, type NodeCtx } from "../nodes/defineNode.js";
import { draftNode } from "../nodes/draft.js";
import { enrichNode, reenrichNode } from "../nodes/enrich.js";
import { groundNode } from "../nodes/ground.js";
import { judgeNode } from "../nodes/judge.js";
import { renderNode } from "../nodes/render.js";
import { scrapeNode } from "../nodes/scrape.js";
import { store } from "../store/memory.js";
import type { RunInput, StoryRun, WsEvent } from "../types.js";

const MAX_RETRIES = 2; // ≤2 regen retries (docs/CONTRACTS.md graph)

// The human approval gate: leadId -> resolve. POST /story/:leadId/approve resolves it.
const pendingGates = new Map<string, () => void>();

/** Resolves the pending gate for leadId. Returns false if there is none (-> 409). */
export function approveGate(leadId: string): boolean {
  const resolve = pendingGates.get(leadId);
  if (!resolve) return false;
  pendingGates.delete(leadId);
  resolve();
  return true;
}

export async function runStory(leadId: string, input: RunInput, emit: (e: WsEvent) => void): Promise<void> {
  const t0 = Date.now();
  const url = input.handle;
  const run: StoryRun = {
    leadId,
    url,
    status: "scraping",
    generation: 0,
    brief: null,
    story: null,
    score: null,
    pitch_angle: null,
    generations: [],
    costCents: 0,
    totalLatencyMs: 0,
    createdAt: new Date().toISOString(),
  };
  store.setRun(leadId, run);
  emit({ type: "run_started", leadId, url });

  const ctx: NodeCtx = { leadId, emit };

  try {
    // ── gather phase (status: scraping) ─────────────────────────────────────
    const { rawMarkdown } = await scrapeNode.run({ url }, ctx);
    const enriched = await enrichNode.run({ url, rawMarkdown, industry: input.industry }, ctx);
    let { brief } = await groundNode.run({ brief: enriched.brief, industry: input.industry }, ctx);
    run.brief = brief;
    emit({ type: "scrape_done", leadId, brief });

    // ── draft -> judge regen loop (≤ MAX_RETRIES) ───────────────────────────
    let generation = 0;
    let retryNote: string | undefined;
    for (;;) {
      run.status = "drafting";
      run.generation = generation;
      const tGen = Date.now();
      const { story, pitch_angle } = await draftNode.run(
        { brief, generation, industry: input.industry, retryNote },
        ctx,
      );
      run.story = story;
      run.pitch_angle = pitch_angle;
      emit({ type: "draft_done", leadId, generation, story, pitch_angle });

      run.status = "judging";
      const { score } = await judgeNode.run({ brief, story, generation, industry: input.industry }, ctx);
      run.score = score;
      // THE MONEY SHOT: emit the instant the judge returns — fabricatedClaims renders immediately.
      emit({ type: "score_done", leadId, generation, score });

      run.generations.push({
        generation,
        story,
        score,
        fabricatedClaims: score.fabricatedClaims,
        costCents: 0, // S1 stubs spend nothing; real cost ledger lands at S2
        latencyMs: Date.now() - tGen,
        ts: new Date().toISOString(),
      });

      if (score.verdict === "emit") break;
      if (generation >= MAX_RETRIES) {
        // fail-CLOSED: refuse to ship a story we can't prove.
        throw new NodeFailure(
          "judge",
          `grounding failed after ${generation + 1} generations (fail-CLOSED, refusing to ship): ${score.failReason ?? "ungrounded claims remain"}`,
        );
      }

      run.status = "reenriching";
      const reason =
        score.failReason ?? `fabricated claims with no matching Signal: ${score.fabricatedClaims.join("; ")}`;
      const reenriched = await reenrichNode.run(
        { brief, fabricatedClaims: score.fabricatedClaims, industry: input.industry },
        ctx,
      );
      brief = reenriched.brief;
      run.brief = brief;
      retryNote = reenriched.note;
      emit({ type: "reenrich", leadId, generation, reason });
      generation += 1;
    }

    // ── human gate (status: blocked) — WAIT for POST /story/:leadId/approve ─
    run.status = "blocked";
    emit({ type: "gate", leadId, story: run.story!, score: run.score! });
    console.log(`[seam] gate -> leadId=${leadId} score.verdict=${run.score!.verdict} -> blocked, awaiting human approval`);
    await new Promise<void>((resolve) => pendingGates.set(leadId, resolve));
    console.log(`[seam] gate -> leadId=${leadId} -> approved -> ok`);

    // ── archive -> render -> done ────────────────────────────────────────────
    await archiveNode.run({ leadId, url, generations: run.generations }, ctx);
    const { slides } = await renderNode.run({ run }, ctx);
    store.setSlides(leadId, slides);

    run.status = "done";
    run.totalLatencyMs = Date.now() - t0;
    emit({ type: "done", leadId, run });
    console.log(`[seam] run done -> leadId=${leadId} generations=${run.generations.length} -> ok (${run.totalLatencyMs}ms)`);
  } catch (err) {
    // Seam 7: any failure -> FAILED badge data + the error (fail loud).
    const stage = err instanceof NodeFailure ? err.stage : "orchestrator";
    const error = err instanceof Error ? err.message : String(err);
    pendingGates.delete(leadId);
    run.status = "failed";
    run.totalLatencyMs = Date.now() - t0;
    console.error(`[seam] run failed -> leadId=${leadId} stage=${stage} -> ${error} -> FAIL (${run.totalLatencyMs}ms)`);
    emit({ type: "failed", leadId, stage, error });
  }
}
