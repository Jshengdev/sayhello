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
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getLens, sellerSignals } from "../lenses/index.js";
import { runCostCents } from "../llm/cost-ledger.js";
import { archiveNode } from "../nodes/archive.js";
import { NodeFailure, type NodeCtx } from "../nodes/defineNode.js";
import { draftNode } from "../nodes/draft.js";
import { enrichNode, reenrichNode } from "../nodes/enrich.js";
import { groundNode } from "../nodes/ground.js";
import { judgeNode } from "../nodes/judge.js";
import { renderNode } from "../nodes/render.js";
import { scrapeNode } from "../nodes/scrape.js";
import { zCompanyBrief } from "../schemas.js";
import { runPersonStage } from "../scrape/person.js";
import { store } from "../store/memory.js";
import { startRecorder } from "../store/replay.js";
import type { CompanyBrief, RunInput, Signal, StoryRun, WsEvent } from "../types.js";

const MAX_RETRIES = 2; // ≤2 regen retries (docs/CONTRACTS.md graph)

// ── fixture:// — the SCENARIOS.md planted-catch presets (scenario 1/2: scrape = CACHED + GUIDED) ──
// handle "fixture://re-1-offmarket-team" loads data/leads/re-1-offmarket-team.json VERBATIM as the
// post-gather CompanyBrief (authored from the Carlos call corpus; the planted claim rides the prose,
// signals[] = the judge corpus). The gather nodes light honestly (LOUD fixture logs, zero live calls);
// draft/judge/reenrich then run LIVE — the deterministic gen-0 catch (SOTARE R7).
const LEADS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../data/leads");

export function loadFixtureBrief(handle: string): CompanyBrief {
  const id = handle.slice("fixture://".length);
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(id)) {
    throw new NodeFailure("scrape", `[fixture] invalid fixture id "${id}" (a-z 0-9 . _ - only)`);
  }
  const file = path.join(LEADS_DIR, `${id}.json`);
  let rawText: string;
  try {
    rawText = readFileSync(file, "utf8");
  } catch {
    throw new NodeFailure("scrape", `[fixture] no fixture at data/leads/${id}.json (handle=${handle})`);
  }
  const parsed = zCompanyBrief.safeParse(JSON.parse(rawText));
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new NodeFailure("scrape", `[fixture] data/leads/${id}.json is not a valid CompanyBrief: ${issues}`);
  }
  return parsed.data; // zod strips the _planted/_planted_note meta keys
}

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
    let brief: CompanyBrief;
    if (url.startsWith("fixture://")) {
      // CACHED + GUIDED gather (docs/SCENARIOS.md scenario 1/2): the fixture IS the brief.
      // No Firecrawl / extractor / playground calls; nodes light with LOUD fixture provenance.
      brief = loadFixtureBrief(url);
      for (const node of ["scrape", "enrich", "ground"] as const) {
        ctx.emit({ type: "node_enter", leadId, node });
        console.log(
          `[seam] fixture -> node:${node} -> CACHED data/leads/${url.slice("fixture://".length)}.json (${brief.provenance ?? "fixture"}) -> ok`,
        );
        await new Promise((r) => setTimeout(r, 350)); // demo-beat watchability (logged, fixture-only)
      }
    } else {
      const { rawMarkdown } = await scrapeNode.run({ url }, ctx);
      const enriched = await enrichNode.run({ url, rawMarkdown, industry: input.industry }, ctx);
      ({ brief } = await groundNode.run({ brief: enriched.brief, industry: input.industry }, ctx));
    }

    // CORPUS-BOUNDARY FIX (3:15 PM regen-spiral root cause): the run's free-text positioning feeds
    // the DRAFTER's context but never reached the JUDGE's corpus — so every fact the drafter restated
    // from it ("close 14 deals…") got stamped FABRICATED forever and the loop refused. Positioning is
    // seller-stated evidence: inject it ONCE as a [seller_positioning] Signal so both sides see it.
    if (input.positioning && input.positioning.trim().length > 0) {
      brief = {
        ...brief,
        signals: [
          ...brief.signals,
          {
            signal_type: "seller_positioning",
            source: "positioning",
            source_url: "input://positioning",
            detail: input.positioning.trim(),
            strength: 8,
          },
        ],
      };
      console.log(`[seam] positioning -> injected as [seller_positioning] Signal (${input.positioning.trim().length} chars) -> judge corpus now sees seller-stated facts -> ok`);
    }

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

    // Seller-signal corpus merge (docs/SCENARIOS.md clock-triage: "one concat; judge untouched"):
    // the lens sellerIdentity proofPoints ride brief.signals as seller_pack Signals so a drafter
    // line about the SELLER must trace too — the harness won't even let the AI exaggerate its own user.
    const sellerSigs = sellerSignals(getLens(input.industry));
    if (sellerSigs.length > 0) {
      brief = { ...brief, signals: [...brief.signals, ...sellerSigs] };
      console.log(`[seam] seller merge -> ${sellerSigs.length} seller_pack signals onto brief.signals (ONE judge corpus) -> ok`);
    }

    run.brief = brief;
    emit({ type: "scrape_done", leadId, brief });

    // ── draft -> judge regen loop (≤ MAX_RETRIES) ───────────────────────────
    let generation = 0;
    let retryNote: string | undefined;
    const allFlagged: string[] = []; // cumulative AVOID set — every claim any generation got flagged for
    for (;;) {
      run.status = "drafting";
      run.generation = generation;
      const tGen = Date.now();
      const centsBefore = runCostCents(leadId);
      // MUST-CUT set: prior flagged claims that STILL trace to no Signal after reenrich — the
      // drafter is told to cut them, and draft's mechanical linter enforces it (regen-spiral fix).
      const normCut = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
      const corpusNorm = brief.signals.map((s) => normCut(s.detail)).join(" || ");
      const mustCut =
        generation > 0 && allFlagged.length
          ? [...new Set(allFlagged)].filter((c) => !corpusNorm.includes(normCut(c)))
          : undefined;
      if (mustCut?.length) {
        console.log(`[seam] draft mustCut -> ${mustCut.length} still-unsourced flagged claim(s) -> mechanical cut armed: ${JSON.stringify(mustCut.map((c) => c.slice(0, 60)))}`);
      }
      const { story, pitch_angle } = await draftNode.run(
        { brief, generation, industry: input.industry, retryNote, positioning: input.positioning, mustCut },
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
      allFlagged.push(...score.fabricatedClaims); // cumulative AVOID set — feeds next gen's mustCut
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
