"use client";

/**
 * RunStepper — the GUIDED TAB-THROUGH (docs/DEMO-FEEL.md item 3 + clarification).
 * The run is discrete steps: gather → person → draft → THE CATCH → the fix →
 * approve → report, shown as a step rail; the run AUTO-ADVANCES as real events
 * land (each step holds a minimum beat so it completes visibly); the active
 * step's content is THE screen — the rest collapse to labeled tabs you can
 * click back into. One page, no routes. Presentation pacing is staged; every
 * verdict on screen (flagged claims, scores) is real pipeline output.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { StoryRun, StoryScore } from "@/lib/types";
import type { VisualNode } from "@/lib/ws";
import type { CatalogEntry } from "@/components/HelloBar";
import ApproveGate from "@/components/ApproveGate";
import EvidencePanel from "@/components/EvidencePanel";
import GatherStage from "@/components/GatherStage";
import ReceiptPanel from "@/components/ReceiptPanel";
import ScorePanel from "@/components/ScorePanel";
import SpiralGarden from "@/components/SpiralGarden";
import type { GardenStage } from "@/components/SpiralGarden";
import StoryBeats from "@/components/StoryBeats";

type StepId = "gather" | "person" | "draft" | "catch" | "fix" | "approve" | "report";

const STEPS: Array<{ id: StepId; label: string }> = [
  { id: "gather", label: "gather" },
  { id: "person", label: "person" },
  { id: "draft", label: "draft" },
  { id: "catch", label: "the catch" },
  { id: "fix", label: "the fix" },
  { id: "approve", label: "approve" },
  { id: "report", label: "report" },
];

/* each step completes VISIBLY before the next takes focus */
const DWELL: Record<StepId, number> = {
  gather: 7200,
  person: 3400,
  draft: 3800,
  catch: 5400,
  fix: 3800,
  approve: 1100, // the beat after the human approves, before the report takes the screen
  report: 0,
};

/** exact-substring red marks for the flagged lines (same rule as StoryCanvas) */
export function highlightClaims(story: string, claims: string[]): ReactNode[] {
  let parts: ReactNode[] = [story];
  claims.forEach((claim, ci) => {
    if (!claim) return;
    const next: ReactNode[] = [];
    parts.forEach((part, pi) => {
      if (typeof part !== "string") {
        next.push(part);
        return;
      }
      const pieces = part.split(claim);
      pieces.forEach((piece, k) => {
        if (k > 0)
          next.push(
            <mark key={`c${ci}-${pi}-${k}`} className="claim-bad">
              {claim}
            </mark>,
          );
        if (piece) next.push(piece);
      });
    });
    parts = next;
  });
  return parts;
}

const AXES: Array<{ key: keyof StoryScore; label: string }> = [
  { key: "grounding", label: "traces to evidence" },
  { key: "completeness", label: "complete" },
  { key: "narrative_arc", label: "story arc" },
  { key: "feasibility", label: "feasible" },
  { key: "competitive_diff", label: "stands apart" },
  { key: "metric_confidence", label: "numbers backed" },
];

export function AxisBars({ score }: { score: StoryScore }) {
  return (
    <div className="space-y-2">
      {AXES.map((a) => {
        const v = score[a.key] as number;
        const ok = v >= 0.7;
        return (
          <div key={a.key} className="grid grid-cols-[120px_1fr_38px] items-center gap-2.5">
            <span className="font-mono text-[9.5px] text-mute">{a.label}</span>
            <span className={`bar-track block h-[5px] ${ok ? "text-good" : "text-bad"}`}>
              <span
                className="bar-fill block transition-[width] duration-700 ease-signature"
                style={{ width: `${Math.round(v * 100)}%` }}
              />
            </span>
            <span className={`text-right font-numeral text-[11px] ${ok ? "text-ink-2" : "text-bad"}`}>
              {v.toFixed(2)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function RunStepper({
  run,
  activeNode,
  gate,
  approved,
  entry,
  startedAt,
  onApprove,
}: {
  run: StoryRun;
  activeNode: VisualNode | null;
  gate: { story: string; score: StoryScore } | null;
  approved: boolean;
  entry: CatalogEntry | null;
  startedAt: number;
  onApprove: () => Promise<boolean>;
}) {
  const gens = run.generations;
  const caughtGen = useMemo(
    () => gens.find((g) => g.fabricatedClaims.length > 0) ?? null,
    [gens],
  );
  const cleanGen = useMemo(
    () =>
      [...gens]
        .reverse()
        .find((g) => g.fabricatedClaims.length === 0 && g.score.verdict === "emit") ?? null,
    [gens],
  );
  /* rehydrated runs may have no gate event — synthesize from the run itself */
  const effectiveGate =
    gate ??
    (run.status === "blocked" || run.status === "done" || approved
      ? run.story && run.score
        ? { story: run.story, score: run.score }
        : null
      : null);
  const gateReached = !!effectiveGate;
  const skipCatch = !caughtGen && gateReached; // clean first try — no catch to show

  /* ——— how far the REAL run has gotten (monotonic) ——— */
  let furthest = 0;
  if (run.brief) furthest = 1;
  if (run.brief && (activeNode === "draft" || run.story !== null || gens.length > 0)) furthest = 2;
  if (caughtGen) furthest = 3;
  if (
    caughtGen &&
    (run.status === "reenriching" ||
      run.generation > caughtGen.generation ||
      (cleanGen && cleanGen.generation > caughtGen.generation))
  )
    furthest = 4;
  if (gateReached) furthest = 5;
  if (approved || run.status === "done") furthest = 6;

  const isSkipped = (i: number) => skipCatch && (i === 3 || i === 4);

  /* ——— the shown step: auto-advances toward `furthest`, one beat per step ——— */
  const [shown, setShown] = useState(0);
  const [pinned, setPinned] = useState(false);
  const enteredRef = useRef(Date.now());

  /* new run → restart the walk */
  useEffect(() => {
    setShown(0);
    setPinned(false);
    enteredRef.current = Date.now();
  }, [run.leadId]);

  /* the human moment always surfaces — unpin when the gate arrives */
  useEffect(() => {
    if (gateReached) setPinned(false);
  }, [gateReached]);

  useEffect(() => {
    if (pinned || shown >= furthest) return;
    const wait = Math.max(0, DWELL[STEPS[shown].id] - (Date.now() - enteredRef.current));
    const t = setTimeout(() => {
      setShown((s) => {
        let n = Math.min(s + 1, furthest);
        while (isSkipped(n) && n < furthest) n++;
        enteredRef.current = Date.now();
        return n;
      });
    }, wait);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, furthest, pinned, skipCatch]);

  const shownId = STEPS[shown].id;

  /* the garden tracks the presentation, colored by REAL verdicts */
  const gardenStage: GardenStage =
    shown <= 2 ? "seed" : shownId === "catch" ? "catch" : cleanGen || skipCatch ? "bloom" : "fixing";

  const draftStory = gens[0]?.story ?? run.story;

  /* ——— stage content ——— */
  const stagePanel = (() => {
    switch (shownId) {
      case "gather":
        return (
          <GatherStage
            entry={entry}
            brief={run.brief}
            startedAt={startedAt}
            gathering={run.brief === null}
          />
        );
      case "person": {
        const quotes = (run.brief?.signals ?? [])
          .filter((s) => s.source === "discovery_call")
          .slice(0, 3);
        const degraded = (run.brief?.signals ?? []).some(
          (s) => s.signal_type === "person_scrape_degraded",
        );
        const person = run.brief?.person ?? null;
        return (
          <div>
            <p className="m-0 font-mono text-[10.5px] uppercase tracking-[0.14em] text-mute">
              who you&apos;re saying hello to
            </p>
            <div className="ring-card mt-3 rounded-xl bg-white px-4 py-3.5">
              <p className="m-0 text-[15px] font-medium text-ink">
                {person?.name ?? entry?.person ?? run.brief?.name ?? run.url}
              </p>
              {(person?.headline || run.brief?.what_they_do) && (
                <p className="m-0 mt-1.5 text-[12.5px] leading-relaxed text-mute">
                  {person?.headline ?? run.brief?.what_they_do}
                </p>
              )}
            </div>
            {quotes.length > 0 && (
              <ul className="m-0 mt-3 list-none space-y-2 p-0">
                {quotes.map((s, i) => (
                  <li key={i} className="find-pop ring-card rounded-xl bg-white px-4 py-3" style={{ animationDelay: `${i * 0.35}s` }}>
                    <p className="m-0 text-[12.5px] italic leading-relaxed text-ink">
                      “{s.detail}”
                    </p>
                    <p className="m-0 mt-1 font-mono text-[9px] text-faint">
                      from your call · {s.source_url.replace(/^call:\/\//, "")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {degraded && (
              <p className="m-0 mt-3 font-mono text-[9.5px] text-warn">
                no LinkedIn or X given — working from the call only (said out loud, never hidden)
              </p>
            )}
          </div>
        );
      }
      case "draft":
        return (
          <div>
            <p className="m-0 flex items-baseline justify-between font-mono text-[10.5px] uppercase tracking-[0.14em] text-mute">
              <span>writing their story from what it found</span>
              {run.pitch_angle && (
                <span className="pill-emboss rounded-full bg-page px-2 py-[2px] text-[9px] normal-case tracking-normal text-ink-2">
                  angle · {run.pitch_angle.replaceAll("_", " ")}
                </span>
              )}
            </p>
            {draftStory ? (
              <div className="mt-3">
                <StoryBeats story={draftStory} maxHeight={420} />
              </div>
            ) : (
              <p className="dotted-canvas board-recess mt-3 rounded-xl px-4 py-8 text-center font-mono text-[11px] text-faint">
                the first draft is being written…
              </p>
            )}
          </div>
        );
      case "catch": {
        if (!caughtGen) return null;
        const claims = caughtGen.fabricatedClaims;
        return (
          <div>
            <div
              className="dash-pop rounded-xl px-4 py-3.5"
              style={{
                background: "color-mix(in srgb, var(--bad) 5%, var(--raised))",
                boxShadow:
                  "inset 0 0 0 1px #fff, 0 0 0 1px color-mix(in srgb, var(--bad) 40%, transparent), 0 4px 12px rgba(0,0,0,0.05)",
              }}
            >
              <p className="m-0 flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-bad">
                <span aria-hidden className="dot-glow h-2 w-2 rounded-full bg-current" />
                the catch — {claims.length} lines it can&apos;t verify
              </p>
              <p className="m-0 mt-1.5 text-[12px] leading-relaxed text-ink-2">
                Each one needs proof or gets cut. Nothing unproven ships.
              </p>
              <ul className="m-0 mt-2.5 list-none space-y-1.5 p-0">
                {claims.map((c) => (
                  <li key={c} className="flex items-baseline gap-2 text-[12.5px] leading-snug text-ink">
                    <span aria-hidden className="font-mono text-[10px] text-bad">⊘</span>
                    <span>“{c}”</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-3">
              <StoryBeats story={caughtGen.story} claims={claims} maxHeight={260} />
            </div>
            <div className="divider-dashed mt-3 pt-3">
              <AxisBars score={caughtGen.score} />
            </div>
          </div>
        );
      }
      case "fix": {
        const fixed = cleanGen ?? gens.at(-1) ?? null;
        return (
          <div>
            <p className="m-0 font-mono text-[10.5px] uppercase tracking-[0.14em] text-mute">
              the fix — proof found, the rest cut
            </p>
            {caughtGen && (
              <p className="m-0 mt-2 font-mono text-[10px] text-bad">
                ✂ {caughtGen.fabricatedClaims.length} unproven lines cut or rewritten
              </p>
            )}
            {fixed && fixed.fabricatedClaims.length === 0 ? (
              <>
                <p className="dash-pop m-0 mt-2 flex items-center gap-2 font-mono text-[10.5px] text-good">
                  <span aria-hidden className="dot-glow h-2 w-2 rounded-full bg-current" />
                  every line now traces to evidence ·{" "}
                  <b className="font-numeral text-[11px]">{fixed.score.grounding.toFixed(2)}</b>
                </p>
                <div className="mt-3">
                  <StoryBeats story={fixed.story} claims={fixed.fabricatedClaims} maxHeight={380} />
                </div>
              </>
            ) : (
              <p className="dotted-canvas board-recess mt-3 rounded-xl px-4 py-8 text-center font-mono text-[11px] text-faint">
                rewriting with proof in hand…
              </p>
            )}
          </div>
        );
      }
      case "approve":
        return (
          <div className="space-y-3">
            <ApproveGate gate={effectiveGate} approved={approved} onApprove={onApprove} />
          </div>
        );
      case "report":
        return (
          <div className="space-y-4">
            <ReceiptPanel run={run} gate={effectiveGate} approved={approved} onApprove={onApprove} />
            {/* the held-out judge's final read — 6 axes, thin bars, real scores */}
            <ScorePanel run={run} />
            <EvidencePanel run={run} />
          </div>
        );
    }
  })();

  return (
    <div className="flex flex-col gap-4">
      {/* the step rail — tabs you can click back into */}
      <nav aria-label="Run steps" className="ring-panel rounded-2xl bg-raised px-4 py-3">
        <ol className="m-0 flex list-none flex-wrap items-center gap-x-1 gap-y-2 p-0">
          {STEPS.map((s, i) => {
            const skipped = isSkipped(i);
            const state = skipped
              ? "skipped"
              : i === shown
                ? "active"
                : i < furthest || (i <= furthest && i < shown)
                  ? "done"
                  : i === furthest
                    ? "live"
                    : "todo";
            const clickable = !skipped && i <= furthest;
            return (
              <li key={s.id} className="flex items-center">
                {i > 0 && <span aria-hidden className="mx-1.5 font-mono text-[9px] text-faint">→</span>}
                <button
                  type="button"
                  disabled={!clickable}
                  data-testid={`step-tab-${s.id}`}
                  data-state={state}
                  onClick={() => {
                    if (!clickable) return;
                    setShown(i);
                    enteredRef.current = Date.now();
                    setPinned(i < furthest);
                  }}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-[5px] font-mono text-[10px] transition-colors ${
                    state === "active"
                      ? "pill-emboss bg-white text-ink"
                      : state === "done"
                        ? "text-ink-2 hover:bg-page"
                        : state === "skipped"
                          ? "text-faint line-through"
                          : "text-faint"
                  } ${s.id === "catch" && state !== "todo" && state !== "skipped" ? "text-bad" : ""}`}
                >
                  <span
                    aria-hidden
                    className={`h-[6px] w-[6px] rounded-full ${
                      state === "active"
                        ? "dot-glow bg-current text-live dash-pulse"
                        : state === "done"
                          ? "dot-glow bg-current text-good"
                          : state === "live"
                            ? "dot-glow bg-current text-ocean dash-pulse"
                            : "bg-current opacity-25"
                    }`}
                    style={
                      state === "active"
                        ? { color: "var(--live)" }
                        : state === "live"
                          ? { color: "var(--ocean)" }
                          : undefined
                    }
                  />
                  {s.label}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* one thing at a time: THE stage + the growing story beside it */}
      <div className="grid items-start gap-4 lg:grid-cols-[1.7fr_1fr]">
        <section
          key={shownId}
          aria-label={`Step: ${STEPS[shown].label}`}
          data-testid="stage-panel"
          data-step={shownId}
          className="stage-enter ring-panel min-h-[320px] rounded-2xl bg-raised p-5"
        >
          {stagePanel}
        </section>
        <SpiralGarden stage={gardenStage} generations={gens} />
      </div>
    </div>
  );
}
