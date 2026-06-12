// orchestrator/replay.ts — REPLAY mode: re-emit a recorded LIVE run's WsEvents with the original
// (capped) timings under a fresh leadId. Snappy, demo-safe, and HONESTLY labeled:
// run_started carries mode:"replay" + label "REPLAY · cached real run".
// The human gate still gates — the replay pauses at the recorded `gate` event and waits for
// POST /story/:leadId/approve, exactly like a live run (same pendingGates map).
import { store } from "../store/memory.js";
import { findReplay } from "../store/replay.js";
import type { RunInput, StoryRun, WsEvent } from "../types.js";
import { registerGate } from "./runStory.js";

const GAP_CAP_MS = 2_500; // original pacing, capped — a 90s live scrape replays in <=2.5s

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Rewrite every occurrence of the recorded leadId to the fresh one (events embed it everywhere). */
function rebrand<T>(value: T, oldId: string, newId: string): T {
  return JSON.parse(JSON.stringify(value).split(oldId).join(newId)) as T;
}

/** True when a tape exists for this handle (server pre-checks before issuing a leadId). */
export function hasReplay(handle: string): boolean {
  return findReplay(handle) !== null;
}

export async function replayStory(leadId: string, input: RunInput, emit: (e: WsEvent) => void): Promise<void> {
  const tape = findReplay(input.handle);
  if (!tape) {
    // Fail LOUD — never invent a tape (the server pre-checks, this is belt and braces).
    const error = `no recorded replay for handle=${input.handle} (run it LIVE once first — data/replays/ is empty for this lead)`;
    console.error(`[seam] replay -> ${error} -> FAIL`);
    emit({ type: "failed", leadId, stage: "replay", error });
    return;
  }
  console.log(
    `[seam] replay -> using data/replays/${tape.leadId}.json (recorded ${tape.recordedAt}, ${tape.events.length} events, stubMode=${tape.stubMode}) -> leadId=${leadId} -> ok`,
  );

  // Skeleton run so GET /story/:leadId rehydrates from the first moment.
  const run: StoryRun = {
    leadId,
    url: tape.url,
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

  let prevT = 0;
  for (const { t, event: recorded } of tape.events) {
    const gap = Math.min(Math.max(t - prevT, 0), GAP_CAP_MS);
    prevT = t;
    if (gap > 0) await sleep(gap);

    const event = rebrand(recorded, tape.leadId, leadId);

    // Honest labeling on the opening event.
    if (event.type === "run_started") {
      emit({ ...event, mode: "replay", label: "REPLAY · cached real run" });
      continue;
    }

    // Keep the rehydrate store in sync as the tape plays.
    switch (event.type) {
      case "scrape_done":
        run.brief = event.brief;
        break;
      case "draft_done":
        run.status = "drafting";
        run.generation = event.generation;
        run.story = event.story;
        run.pitch_angle = event.pitch_angle;
        break;
      case "score_done":
        run.status = "judging";
        run.score = event.score;
        break;
      case "reenrich":
        run.status = "reenriching";
        break;
      case "done":
        Object.assign(run, event.run); // recorded final run (already rebranded)
        break;
      case "failed":
        run.status = "failed";
        break;
      default:
        break;
    }
    store.setRun(leadId, run);
    emit(event);

    // The human gate is REAL even in replay — block until approve, like live.
    if (event.type === "gate") {
      run.status = "blocked";
      console.log(`[seam] replay gate -> leadId=${leadId} -> blocked, awaiting human approval (replay paused)`);
      await registerGate(leadId);
      console.log(`[seam] replay gate -> leadId=${leadId} -> approved -> resuming tape`);
    }
  }
  console.log(`[seam] replay done -> leadId=${leadId} (${tape.events.length} events re-emitted) -> ok`);
}
