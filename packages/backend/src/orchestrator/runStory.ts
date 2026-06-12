// orchestrator/runStory.ts — drives the node sequence with the ≤2-retry regen loop.
// handle -> [scrape ∥ person-scrape] -> enrich -> ground -> merge person -> draft -> judge ──emit──>
//   gate(human) -> archive -> render -> done            │regen
//                                  reenrich ←───────────┘   (max 2 retries, fail-CLOSED after)
// V2 (this lane):
//   - PERSON STAGE runs IN PARALLEL with the company gather phase (docs/FINAL-PROMPT.md §2):
//     HeyReach + X + SixtyFour fan-out; every person fact merges as a Signal on the brief —
//     no new node, no new WsEvent (docs/SCENARIOS.md). Missing inputs -> LOUD skip, never crash.
//   - WRITE-THROUGH CAPTURE: every non-stub run records its WsEvent tape + run snapshot to
//     data/replays/<id>.json + data/leads/<id>.json as it streams (REPLAY mode re-emits it).
//   - Real cost attribution: per-generation costCents from the OpenRouter cost ledger.
// score_done fires the MOMENT the judge returns — fabricatedClaims is the demo heart.
// On any throw: {type:"failed", stage} (fail LOUD, no silent stubs).
import { runCostCents } from "../llm/cost-ledger.js";
import { archiveNode } from "../nodes/archive.js";
import { NodeFailure, type NodeCtx } from "../nodes/defineNode.js";
import { draftNode } from "../nodes/draft.js";
import { enrichNode, reenrichNode } from "../nodes/enrich.js";
import { groundNode } from "../nodes/ground.js";
import { judgeNode } from "../nodes/judge.js";
import { renderNode } from "../nodes/render.js";
import { scrapeNode } from "../nodes/scrape.js";
import { runPersonStage } from "../scrape/person.js";
import { store } from "../store/memory.js";
import { startRecorder } from "../store/replay.js";
import type { RunInput, Signal, StoryRun, WsEvent } from "../types.js";

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

/** Register a pending human gate; resolves when POST /story/:leadId/approve lands. (Replay uses this too.) */
export function registerGate(leadId: string): Promise<void> {
  return new Promise<void>((resolve) => pendingGates.set(leadId, resolve));
}

export async function runStory(leadId: string, input: RunInput, emitRaw: (e: WsEvent) => void): Promise<void> {
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

  // V2 write-through capture: LIVE runs are recorded as they stream (stub floor never records).
  const recorder = startRecorder(leadId, url, input.industry);
  const emit = (e: WsEvent): void => {
    emitRaw(e);
    recorder?.record(e);
  };

  const runMode = process.env.STUB_MODE === "1" ? "stub" : "live";
  emit({ type: "run_started", leadId, url, mode: runMode, label: runMode === "stub" ? "STUB · canned floor" : "LIVE" });

  const ctx: NodeCtx = { leadId, emit };

  try {
    // ── gather phase (status: scraping) — person stage IN PARALLEL with company scrape ─────
    const personPromise = runPersonStage(input.person); // never throws; degrades LOUDLY
    const { rawMarkdown } = await scrapeNode.run({ url }, ctx);
    const enriched = await enrichNode.run({ url, rawMarkdown, industry: input.industry }, ctx);
    let { brief } = await groundNode.run({ brief: enriched.brief, industry: input.industry }, ctx);

    // Merge the person slice: fields onto brief.person, EVERY person fact as a Signal
    // (source: heyreach|x|sixtyfour) — they ride scrape_done's brief, no new WsEvent.
    const personResult = await personPromise;
    if (personResult.person) brief = { ...brief, person: personResult.person };
    if (personResult.signals.length > 0) {
      brief = { ...brief, signals: [...brief.signals, ...personResult.signals] };
      console.log(`[seam] person merge -> ${personResult.signals.length} person signals onto brief.signals -> ok`);
    }
    if (personResult.degraded.length > 0) {
      // Visible degraded notice — rendered as an ordinary evidence row, supports no claims.
      const notice: Signal = {
        signal_type: "person_scrape_degraded",
        source: "harness",
        source_url: "",
        detail: `PERSON SCRAPE DEGRADED: ${personResult.degraded.join(" · ")}`,
        strength: 0,
      };
      brief = { ...brief, signals: [...brief.signals, notice] };
    }

    run.brief = brief;
    emit({ type: "scrape_done", leadId, brief });

    // ── draft -> judge regen loop (≤ MAX_RETRIES) ───────────────────────────
    let generation = 0;
    let retryNote: string | undefined;
    for (;;) {
      run.status = "drafting";
      run.generation = generation;
      const tGen = Date.now();
      const centsBefore = runCostCents(leadId);
      const { story, pitch_angle } = await draftNode.run(
        { brief, generation, industry: input.industry, retryNote, positioning: input.positioning },
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
        costCents: runCostCents(leadId) - centsBefore, // real OpenRouter cost for this generation
        latencyMs: Date.now() - tGen,
        ts: new Date().toISOString(),
      });
      run.costCents = runCostCents(leadId);

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
    await registerGate(leadId);
    console.log(`[seam] gate -> leadId=${leadId} -> approved -> ok`);

    // ── archive -> render -> done ────────────────────────────────────────────
    await archiveNode.run(
      { leadId, url, generations: run.generations, pitch_angle: run.pitch_angle, status: "done" },
      ctx,
    );
    const { slides, openuiLang } = await renderNode.run({ run }, ctx);
    store.setSlides(leadId, slides);
    store.setReceipt(leadId, openuiLang); // V2: null = OpenUI failed (visible fallback, never blocks)

    run.status = "done";
    run.costCents = runCostCents(leadId);
    run.totalLatencyMs = Date.now() - t0;
    emit({ type: "done", leadId, run });
    recorder?.finish(run);
    console.log(`[seam] run done -> leadId=${leadId} generations=${run.generations.length} cost=${run.costCents}c -> ok (${run.totalLatencyMs}ms)`);
  } catch (err) {
    // Seam 7: any failure -> FAILED badge data + the error (fail loud).
    const stage = err instanceof NodeFailure ? err.stage : "orchestrator";
    const error = err instanceof Error ? err.message : String(err);
    pendingGates.delete(leadId);
    run.status = "failed";
    run.costCents = runCostCents(leadId);
    run.totalLatencyMs = Date.now() - t0;
    console.error(`[seam] run failed -> leadId=${leadId} stage=${stage} -> ${error} -> FAIL (${run.totalLatencyMs}ms)`);
    emit({ type: "failed", leadId, stage, error });
    recorder?.finish(run);
  }
}
