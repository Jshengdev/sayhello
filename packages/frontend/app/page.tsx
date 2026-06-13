"use client";

/**
 * The page — two moods, one route (docs/DEMO-FEEL.md + docs/VISUAL-V3.md).
 * IDLE: the ocean entry — logomark, one quiet line, ONE search bar with the
 * hardcoded autofill catalog, Johnny|Photon positioning chips. Almost nothing.
 * RUNNING: the guided stepper — one stage front-and-center at a time, the
 * spiral garden shaping beside it. Everything streamed is REAL (lib/ws.ts);
 * the decoration is presentation only — verdicts are never invented.
 */

import { useRef, useState } from "react";

import Bird from "@/components/Bird";
import FailedBadge from "@/components/FailedBadge";
import HelloBar from "@/components/HelloBar";
import type { CatalogEntry } from "@/components/HelloBar";
import RunStepper from "@/components/RunStepper";
import { useStoryRun } from "@/lib/ws";

const IN_FLIGHT = ["scraping", "drafting", "judging", "reenriching"];

export default function Home() {
  const { run, activeNode, gate, failure, approved, mode, connected, startRun, approve } =
    useStoryRun();
  const busy = !!run && IN_FLIGHT.includes(run.status);
  /* research mode — the corner light. ON = replays a saved real run. */
  const [research, setResearch] = useState(false);
  /* the picked catalog target (decorates gather/person; never the verdicts) */
  const [entry, setEntry] = useState<CatalogEntry | null>(null);
  const startedAtRef = useRef(Date.now());

  const launch = (input: Parameters<typeof startRun>[0]) => {
    startedAtRef.current = Date.now();
    void startRun(input);
  };

  const reset = () => {
    try {
      sessionStorage.removeItem("sayhello:leadId");
    } catch {}
    window.location.reload();
  };

  return (
    <main className="min-h-screen bg-page">
      {/* the ocean — pixel band behind everything; the bird flies while the run does */}
      <div aria-hidden className="ocean-band" />
      <div aria-hidden className="sky-layer">
        <Bird active={busy} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/Group 70.svg"
          alt=""
          width={44}
          className="absolute right-[4%] top-[112px]"
          style={{ opacity: 0.45 }}
        />
      </div>

      {!run ? (
        /* ——— THE OCEAN (entry) — this page holds almost nothing ——— */
        <div className="relative z-10 mx-auto flex min-h-screen max-w-[760px] flex-col items-center justify-center gap-5 px-5 pb-24">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/Frame 68.svg" alt="sayhello" style={{ height: 52, width: "auto" }} />
          <p className="m-0 text-[13px] text-mute">
            say hello to who? drop the company.
          </p>
          <FailedBadge failure={failure} />
          <HelloBar busy={busy} research={research} onRun={launch} onPick={setEntry} />
          <p className="m-0 mt-2 text-center font-mono text-[9.5px] leading-relaxed text-faint">
            before you say hello, know their story — proven, or it doesn&apos;t ship.
          </p>
        </div>
      ) : (
        /* ——— THE RUN — guided, one step at a time ——— */
        <div className="relative z-10 mx-auto flex max-w-[1100px] flex-col gap-4 px-5 py-6">
          <header className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-baseline gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/Frame 68.svg"
                alt="sayhello"
                style={{ height: 30, width: "auto", display: "block" }}
              />
              <p className="m-0 hidden text-[12px] text-mute sm:block">
                {entry?.label ?? run.brief?.name ?? run.url}
              </p>
            </div>
            <p className="m-0 flex items-center gap-2 font-mono text-[10px] text-mute">
              {mode === "replay" && (
                <span className="pill-emboss rounded-full bg-page px-2 py-[2px] text-[9px] uppercase tracking-[0.1em] text-warn">
                  ◧ replay · a saved real run
                </span>
              )}
              <span
                aria-hidden
                className={`dot-glow h-2 w-2 rounded-full bg-current ${
                  connected ? "text-good" : "text-warn dash-pulse"
                }`}
              />
              {connected ? "live" : "reconnecting…"}
              <button
                type="button"
                onClick={reset}
                className="ml-2 rounded-full px-2 py-[2px] font-mono text-[9.5px] text-faint transition-colors hover:text-ink-2"
              >
                ↺ new hello
              </button>
            </p>
          </header>

          {/* fail LOUD — any failed event lands here, names the stage */}
          <FailedBadge failure={failure} />

          <RunStepper
            run={run}
            activeNode={activeNode}
            gate={gate}
            approved={approved}
            entry={entry}
            startedAt={startedAtRef.current}
            onApprove={approve}
          />

          <footer className="px-1 pb-2">
            <p className="m-0 font-mono text-[9.5px] leading-relaxed text-faint">
              gather Firecrawl · person HeyReach + X + SixtyFour · enrich Composio · evidence
              ClickHouse · draft OpenRouter (claude-sonnet-4.6) · judge OpenRouter
              (qwen3-235b-a22b-2507, held-out) · archive ClickHouse · report Thesys C1 / OpenUI ·
              trace Langfuse · deployed on Render
            </p>
          </footer>
        </div>
      )}

      {/* research mode — the corner light (OFF = LIVE; ON = saved real runs) */}
      <button
        type="button"
        onClick={() => setResearch((r) => !r)}
        data-on={research}
        data-testid="research-light"
        aria-pressed={research}
        className="research-light"
        title={
          research
            ? "research ON — replays saved real runs (click for LIVE)"
            : "LIVE — click for research (saved real runs)"
        }
      >
        <span aria-hidden className="research-dot" />
        research
      </button>
    </main>
  );
}
