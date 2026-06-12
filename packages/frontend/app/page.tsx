"use client";

/**
 * Element A — the paper-light dashboard. Everything on this page renders the
 * REAL WS /ws stream via useStoryRun (lib/ws.ts) — no panel invents data.
 * Layout: input row → LoopCanvas (the watchable harness) → the generations
 * SPIRAL (hero) → story + critic verdict + human gate → live event stream.
 */

import ApproveGate from "@/components/ApproveGate";
import EventTicker from "@/components/EventTicker";
import EvidencePanel from "@/components/EvidencePanel";
import FailedBadge from "@/components/FailedBadge";
import GenerationSpiral from "@/components/GenerationSpiral";
import LoopCanvas from "@/components/LoopCanvas";
import ReceiptPanel from "@/components/ReceiptPanel";
import RunInput from "@/components/RunInput";
import ScorePanel from "@/components/ScorePanel";
import StoryCanvas from "@/components/StoryCanvas";
import { useStoryRun } from "@/lib/ws";

const IN_FLIGHT = ["scraping", "drafting", "judging", "reenriching"];

export default function Home() {
  const { run, activeNode, gate, failure, approved, mode, events, connected, startRun, approve } =
    useStoryRun();
  const busy = !!run && IN_FLIGHT.includes(run.status);

  return (
    <main className="min-h-screen bg-page">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-4 px-5 py-6">
        {/* masthead */}
        <header className="flex flex-wrap items-baseline justify-between gap-2 px-1">
          <div className="flex items-baseline gap-3">
            <h1 className="text-[22px] text-ink" style={{ fontWeight: 480 }}>
              sayhello
            </h1>
            <p className="text-[12.5px] text-mute">
              before you say hello, know their story.
            </p>
          </div>
          <p className="flex items-center gap-2 font-mono text-[10px] text-mute">
            {mode === "replay" && (
              <span className="pill-emboss rounded-full bg-page px-2 py-[2px] text-[9px] uppercase tracking-[0.1em] text-warn">
                ◧ replay
              </span>
            )}
            <span
              aria-hidden
              className={`dot-glow h-2 w-2 rounded-full bg-current ${
                connected ? "text-good" : "text-warn dash-pulse"
              }`}
            />
            {connected ? "harness live" : "reconnecting…"}
          </p>
        </header>

        {/* fail LOUD — any failed event lands here, names the stage */}
        <FailedBadge failure={failure} />

        {/* the crystal input — {industry, handle} */}
        <RunInput busy={busy} onRun={(input) => void startRun(input)} />

        {/* the watchable typed-node graph (+ parallel person branch) */}
        <LoopCanvas run={run} activeNode={activeNode} mode={mode} />

        {/* Element B — THE HERO: the story shaped across generations */}
        <GenerationSpiral generations={run?.generations ?? []} />

        {/* the story + the catch | the verdict + the gate */}
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <StoryCanvas run={run} />
          <div className="flex flex-col gap-4">
            <ScorePanel run={run} />
            <ApproveGate gate={gate} approved={approved} onApprove={approve} />
          </div>
        </div>

        {/* the grounding corpus — company + person signals as evidence rows */}
        <EvidencePanel run={run} mode={mode} />

        {/* the generated verification receipt — OpenUI / Thesys C1 */}
        <ReceiptPanel run={run} gate={gate} approved={approved} onApprove={approve} />

        {/* the system voice — the live event stream */}
        <EventTicker events={events} />

        <footer className="px-1 pb-2">
          <p className="font-mono text-[9.5px] leading-relaxed text-faint">
            scrape Firecrawl · person HeyReach + X + SixtyFour · enrich Composio · ground
            ClickHouse · draft OpenRouter (claude-sonnet-4.6) · judge OpenRouter
            (gpt-5.4-mini, held-out) · archive ClickHouse · render Thesys C1 / OpenUI ·
            trace Langfuse · deployed on Render
          </p>
        </footer>
      </div>
    </main>
  );
}
