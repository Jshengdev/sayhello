"use client";

/**
 * lib/ws.ts — useStoryRun(): the ONE binding between the live harness and the UI.
 * Connects WS /ws, reduces every WsEvent into { run, activeNode, gate, failure, events },
 * reconnects on drop, rehydrates from GET /story/:leadId on refresh.
 * Seam 5 (docs/BUILD-LOOP.md) is logged for EVERY event:
 *   [seam] ws:<type> -> {keys} -> consumed by <component> -> ok|FAIL (<ms>ms)
 * The frontend RENDERS, never computes — no panel gets invented data.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  RunInput,
  StoryGeneration,
  StoryRun,
  StoryScore,
  WsEvent,
} from "./types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";
export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8787/ws";

/** the 7 visual nodes of the loop (LoopCanvas renders these left→right) */
export type VisualNode =
  | "scrape"
  | "enrich"
  | "ground"
  | "draft"
  | "judge"
  | "archive"
  | "render";

export interface HarnessState {
  run: StoryRun | null;
  /** which visual node holds --live right now (null = nothing executing) */
  activeNode: VisualNode | null;
  /** the human gate payload — non-null means the strip is armed */
  gate: { story: string; score: StoryScore } | null;
  /** fail LOUD — a non-null failure renders the FAILED badge */
  failure: { stage: string; error: string } | null;
  approved: boolean;
  events: WsEvent[];
}

const EMPTY: HarnessState = {
  run: null,
  activeNode: null,
  gate: null,
  failure: null,
  approved: false,
  events: [],
};

/** seam 5 — which component consumes each event type (logged per event) */
const CONSUMERS: Record<WsEvent["type"], string> = {
  run_started: "LoopCanvas",
  node_enter: "LoopCanvas",
  scrape_done: "StoryCanvas(brief)",
  draft_done: "StoryCanvas",
  score_done: "StoryCanvas+ScorePanel+GenerationSpiral",
  reenrich: "LoopCanvas(regen wire)",
  gate: "ApproveGate",
  done: "GenerationSpiral+ScorePanel",
  failed: "FailedBadge",
};

function freshRun(leadId: string, url: string): StoryRun {
  return {
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
}

/** wire node names (WsEvent) → visual nodes. reenrich lights the enrich node. */
function toVisual(node: string): VisualNode | null {
  if (node === "reenrich") return "enrich";
  const known: VisualNode[] = [
    "scrape",
    "enrich",
    "ground",
    "draft",
    "judge",
    "archive",
    "render",
  ];
  return known.includes(node as VisualNode) ? (node as VisualNode) : null;
}

const NODE_STATUS: Partial<Record<string, StoryRun["status"]>> = {
  scrape: "scraping",
  draft: "drafting",
  judge: "judging",
  reenrich: "reenriching",
};

/** upsert this generation into run.generations (score_done is the real signal). */
function upsertGeneration(
  generations: StoryGeneration[],
  generation: number,
  story: string,
  score: StoryScore,
): StoryGeneration[] {
  const entry: StoryGeneration = {
    generation,
    story,
    score,
    fabricatedClaims: score.fabricatedClaims,
    costCents: 0, // real costs land with the `done` run snapshot
    latencyMs: 0,
    ts: new Date().toISOString(),
  };
  const rest = generations.filter((g) => g.generation !== generation);
  return [...rest, entry].sort((a, b) => a.generation - b.generation);
}

export function reduceEvent(state: HarnessState, ev: WsEvent): HarnessState {
  const events = [...state.events.slice(-199), ev];
  switch (ev.type) {
    case "run_started":
      return {
        ...EMPTY,
        run: freshRun(ev.leadId, ev.url),
        activeNode: "scrape",
        events,
      };
    case "node_enter": {
      const visual = toVisual(ev.node);
      const status = NODE_STATUS[ev.node];
      return {
        ...state,
        activeNode: visual ?? state.activeNode,
        run: state.run
          ? { ...state.run, status: status ?? state.run.status }
          : state.run,
        events,
      };
    }
    case "scrape_done":
      return {
        ...state,
        run: state.run ? { ...state.run, brief: ev.brief } : state.run,
        events,
      };
    case "draft_done":
      return {
        ...state,
        run: state.run
          ? {
              ...state.run,
              story: ev.story,
              pitch_angle: ev.pitch_angle,
              generation: ev.generation,
            }
          : state.run,
        events,
      };
    case "score_done":
      return {
        ...state,
        run: state.run
          ? {
              ...state.run,
              score: ev.score,
              generation: ev.generation,
              generations: upsertGeneration(
                state.run.generations,
                ev.generation,
                state.run.story ?? "",
                ev.score,
              ),
            }
          : state.run,
        events,
      };
    case "reenrich":
      return {
        ...state,
        activeNode: "enrich",
        run: state.run
          ? { ...state.run, status: "reenriching" }
          : state.run,
        events,
      };
    case "gate":
      return {
        ...state,
        gate: { story: ev.story, score: ev.score },
        run: state.run
          ? { ...state.run, story: ev.story, score: ev.score, status: "blocked" }
          : state.run,
        events,
      };
    case "done":
      return { ...state, run: ev.run, activeNode: null, events };
    case "failed":
      return {
        ...state,
        failure: { stage: ev.stage, error: ev.error },
        run: state.run ? { ...state.run, status: "failed" } : state.run,
        events,
      };
    default:
      return { ...state, events };
  }
}

const LEAD_KEY = "sayhello:leadId";

export function useStoryRun() {
  const [state, setState] = useState<HarnessState>(EMPTY);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const aliveRef = useRef(true);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ——— the socket: connect, reduce, reconnect on drop ——— */
  useEffect(() => {
    aliveRef.current = true;

    const connect = () => {
      if (!aliveRef.current) return;
      let ws: WebSocket;
      try {
        ws = new WebSocket(WS_URL);
      } catch (err) {
        console.error(`[seam] ws:connect -> ${WS_URL} -> FAIL (${String(err)})`);
        retryRef.current = setTimeout(connect, 1500);
        return;
      }
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        console.log(`[seam] ws:open -> ${WS_URL} -> ok`);
      };
      ws.onmessage = (msg) => {
        const t0 = performance.now();
        let ev: WsEvent;
        try {
          ev = JSON.parse(String(msg.data)) as WsEvent;
        } catch (err) {
          console.error(
            `[seam] ws:message -> unparseable payload -> FAIL (${String(err)})`,
          );
          return;
        }
        try {
          setState((prev) => reduceEvent(prev, ev));
          if (ev.type === "run_started") {
            try {
              sessionStorage.setItem(LEAD_KEY, ev.leadId);
            } catch {}
          }
          const ms = (performance.now() - t0).toFixed(1);
          console.log(
            `[seam] ws:${ev.type} -> {${Object.keys(ev).join(",")}} -> consumed by ${
              CONSUMERS[ev.type] ?? "EventTicker"
            } -> ok (${ms}ms)`,
          );
          if (ev.type === "score_done" && ev.score.fabricatedClaims.length > 0) {
            console.log(
              `[seam] critic -> fabricatedClaims(${ev.score.fabricatedClaims.length}): ${JSON.stringify(
                ev.score.fabricatedClaims,
              )} -> rendered RED -> ok`,
            );
          }
        } catch (err) {
          console.error(
            `[seam] ws:${ev.type} -> reduce -> FAIL (${String(err)})`,
          );
        }
      };
      ws.onclose = () => {
        setConnected(false);
        if (!aliveRef.current) return;
        console.warn(`[seam] ws:close -> ${WS_URL} -> reconnect in 1500ms`);
        retryRef.current = setTimeout(connect, 1500);
      };
      ws.onerror = () => {
        // onclose follows; the reconnect loop handles it
      };
    };

    connect();
    return () => {
      aliveRef.current = false;
      if (retryRef.current) clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, []);

  /* ——— rehydrate on refresh: GET /story/:leadId if a leadId is known ——— */
  useEffect(() => {
    let leadId: string | null = null;
    try {
      leadId = sessionStorage.getItem(LEAD_KEY);
    } catch {}
    if (!leadId) return;
    const t0 = performance.now();
    fetch(`${API_URL}/story/${leadId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const run = (await res.json()) as StoryRun;
        setState((prev) =>
          prev.run && prev.events.length > 0
            ? prev // a live stream already repopulated us; don't clobber it
            : { ...EMPTY, run, approved: false },
        );
        console.log(
          `[seam] GET /story/${leadId} -> {status:${run.status},gen:${run.generation}} -> rehydrated -> ok (${(
            performance.now() - t0
          ).toFixed(0)}ms)`,
        );
      })
      .catch((err) => {
        console.warn(
          `[seam] GET /story/${leadId} -> rehydrate -> FAIL (${String(err)}) — waiting on live stream`,
        );
      });
  }, []);

  /* ——— POST /story/run {industry, handle} ——— */
  const startRun = useCallback(async (input: RunInput) => {
    const t0 = performance.now();
    try {
      const res = await fetch(`${API_URL}/story/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { leadId } = (await res.json()) as { leadId: string };
      try {
        sessionStorage.setItem(LEAD_KEY, leadId);
      } catch {}
      console.log(
        `[seam] POST /story/run -> {industry:${input.industry},handle:${input.handle}} -> {leadId:${leadId}} -> ok (${(
          performance.now() - t0
        ).toFixed(0)}ms)`,
      );
      return leadId;
    } catch (err) {
      console.error(`[seam] POST /story/run -> FAIL (${String(err)})`);
      setState((prev) => ({
        ...prev,
        failure: { stage: "run_request", error: String(err) },
      }));
      return null;
    }
  }, []);

  /* ——— POST /story/:leadId/approve — the human gate ——— */
  const approve = useCallback(async () => {
    const leadId = state.run?.leadId;
    if (!leadId) return false;
    const t0 = performance.now();
    try {
      const res = await fetch(`${API_URL}/story/${leadId}/approve`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setState((prev) => ({ ...prev, approved: true }));
      console.log(
        `[seam] POST /story/${leadId}/approve -> human gate cleared -> ok (${(
          performance.now() - t0
        ).toFixed(0)}ms)`,
      );
      return true;
    } catch (err) {
      console.error(
        `[seam] POST /story/${leadId}/approve -> FAIL (${String(err)})`,
      );
      setState((prev) => ({
        ...prev,
        failure: { stage: "approve", error: String(err) },
      }));
      return false;
    }
  }, [state.run?.leadId]);

  return { ...state, connected, startRun, approve };
}
