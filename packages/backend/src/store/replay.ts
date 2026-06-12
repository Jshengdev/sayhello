// store/replay.ts — LIVE∥REPLAY write-through capture (docs/FINAL-PROMPT.md "LIVE + OFFLINE in parallel").
// Every LIVE run records {brief, signals, generations, events + relative timings} AS IT STREAMS:
//   data/replays/<leadId>.json — the WsEvent tape (re-emitted by REPLAY mode, original capped timings)
//   data/leads/<leadId>.json   — the run snapshot (brief/signals/generations) for offline inspection
// STUB runs (STUB_MODE=1) are NEVER recorded — replays must be cached REAL runs, honestly labeled.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { StoryRun, WsEvent } from "../types.js";

// repo-root data dirs (src/store -> src -> backend -> packages -> sayhello)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const REPLAYS_DIR = path.join(ROOT, "data", "replays");
const LEADS_DIR = path.join(ROOT, "data", "leads");

export interface RecordedEvent {
  /** ms since run start — REPLAY re-emits with these gaps (capped). */
  t: number;
  event: WsEvent;
}

export interface ReplayFile {
  leadId: string;
  url: string;
  industry: string;
  recordedAt: string;
  /** Honesty marker: which STUB_MODE the recording ran under ("unset"=mixed live default). */
  stubMode: string;
  events: RecordedEvent[];
}

export class RunRecorder {
  private readonly t0 = Date.now();
  private readonly events: RecordedEvent[] = [];
  private readonly replayFile: string;
  private readonly leadFile: string;

  constructor(
    private readonly leadId: string,
    private readonly url: string,
    private readonly industry: string,
  ) {
    fs.mkdirSync(REPLAYS_DIR, { recursive: true });
    fs.mkdirSync(LEADS_DIR, { recursive: true });
    this.replayFile = path.join(REPLAYS_DIR, `${leadId}.json`);
    this.leadFile = path.join(LEADS_DIR, `${leadId}.json`);
  }

  /** Record + flush on every event — the tape survives a mid-run crash (write-through). */
  record(event: WsEvent): void {
    this.events.push({ t: Date.now() - this.t0, event });
    try {
      fs.writeFileSync(this.replayFile, JSON.stringify(this.tape(), null, 2));
    } catch (err) {
      console.error(`[cache] replay write -> ${this.replayFile} -> FAIL (${(err as Error).message})`);
    }
  }

  /** Final snapshot: the whole StoryRun (brief + signals + generations) into data/leads/<id>.json. */
  finish(run: StoryRun): void {
    try {
      fs.writeFileSync(
        this.leadFile,
        JSON.stringify(
          {
            leadId: this.leadId,
            url: this.url,
            industry: this.industry,
            recordedAt: new Date().toISOString(),
            brief: run.brief,
            signals: run.brief?.signals ?? [],
            generations: run.generations,
            run,
            events: this.events,
          },
          null,
          2,
        ),
      );
      console.log(
        `[cache] live run captured -> data/leads/${this.leadId}.json + data/replays/${this.leadId}.json (${this.events.length} events) -> ok`,
      );
    } catch (err) {
      console.error(`[cache] lead snapshot write -> ${this.leadFile} -> FAIL (${(err as Error).message})`);
    }
  }

  private tape(): ReplayFile {
    return {
      leadId: this.leadId,
      url: this.url,
      industry: this.industry,
      recordedAt: new Date().toISOString(),
      stubMode: process.env.STUB_MODE ?? "unset",
      events: this.events,
    };
  }
}

/** Recorder for LIVE runs only — stub-floor runs are canned, never worth replaying. */
export function startRecorder(leadId: string, url: string, industry: string): RunRecorder | null {
  if (process.env.STUB_MODE === "1") {
    console.log(`[cache] recorder -> STUB_MODE=1 -> not recording (replays are cached REAL runs only)`);
    return null;
  }
  return new RunRecorder(leadId, url, industry);
}

/**
 * Latest recorded replay matching this handle (exact url match first, then domain-ish contains).
 * Returns null when nothing recorded yet — the caller fails LOUD, never invents a tape.
 */
export function findReplay(handle: string): ReplayFile | null {
  let files: string[];
  try {
    files = fs.readdirSync(REPLAYS_DIR).filter((f) => f.endsWith(".json"));
  } catch {
    return null;
  }
  const candidates: ReplayFile[] = [];
  for (const f of files) {
    try {
      const parsed = JSON.parse(fs.readFileSync(path.join(REPLAYS_DIR, f), "utf8")) as ReplayFile;
      if (!parsed.events || parsed.events.length === 0) continue;
      const target = handle.toLowerCase();
      const recorded = (parsed.url ?? "").toLowerCase();
      if (recorded === target || recorded.includes(target) || target.includes(recorded)) {
        candidates.push(parsed);
      }
    } catch {
      /* unreadable tape — skip */
    }
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : -1));
  return candidates[0] ?? null;
}
