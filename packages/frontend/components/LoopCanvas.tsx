"use client";

/**
 * LoopCanvas — the harness as a watchable typed-node graph (Element A centerpiece).
 * 7 nodes wired left→right with the regen back-edge drawn judge→enrich.
 * ONLY the executing node gets --live + shimmer; packet dots travel the wires
 * on transitions; every node is captioned with its sponsor (graded — on screen).
 * Ported from said-built components/mvp/today/LoopCanvas.tsx, retyped to StoryRun.
 */

import { useEffect, useRef, useState } from "react";
import type { StoryRun } from "@/lib/types";
import type { VisualNode } from "@/lib/ws";

const NODES: Array<{ id: VisualNode; name: string; sponsor: string }> = [
  { id: "scrape", name: "scrape", sponsor: "Firecrawl" },
  { id: "enrich", name: "enrich", sponsor: "Composio" },
  { id: "ground", name: "ground", sponsor: "ClickHouse" },
  { id: "draft", name: "draft", sponsor: "OpenRouter · drafter" },
  { id: "judge", name: "judge", sponsor: "OpenRouter · held-out critic" },
  { id: "archive", name: "archive", sponsor: "ClickHouse · archive" },
  { id: "render", name: "render", sponsor: "Thesys C1" },
];

/* geometry — a 1000×190 viewBox; nodes sit on the main line at y=72 */
const W = 1000;
const H = 190;
const Y = 72;
const X0 = 72;
const XSTEP = (W - 2 * X0) / (NODES.length - 1);
const xAt = (i: number) => X0 + i * XSTEP;
const IDX: Record<VisualNode, number> = {
  scrape: 0,
  enrich: 1,
  ground: 2,
  draft: 3,
  judge: 4,
  archive: 5,
  render: 6,
};

/* the regen back-edge: judge (4) curving below back to enrich (1) */
const BACK_Y = Y + 76;
const backPath = `M ${xAt(4)} ${Y + 24} C ${xAt(4)} ${BACK_Y}, ${xAt(1)} ${BACK_Y}, ${xAt(1)} ${Y + 24}`;

/** point along the back edge (cubic bezier, t in 0..1, from judge → enrich) */
function backPoint(t: number) {
  const p0 = { x: xAt(4), y: Y + 24 };
  const p1 = { x: xAt(4), y: BACK_Y };
  const p2 = { x: xAt(1), y: BACK_Y };
  const p3 = { x: xAt(1), y: Y + 24 };
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
}

const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

interface Transit {
  from: number;
  to: number;
  regen: boolean;
  key: number;
}

export default function LoopCanvas({
  run,
  activeNode,
}: {
  run: StoryRun | null;
  activeNode: VisualNode | null;
}) {
  const [transit, setTransit] = useState<Transit | null>(null);
  const prevRef = useRef<VisualNode | null>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  /* packet dot — fires on every node transition, travels the actual wire */
  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = activeNode;
    if (!prev || !activeNode || prev === activeNode) return;
    const from = IDX[prev];
    const to = IDX[activeNode];
    setTransit({ from, to, regen: to < from, key: Date.now() });
  }, [activeNode]);

  useEffect(() => {
    if (!transit) return;
    const el = dotRef.current;
    if (!el) return;
    const t0 = performance.now();
    const DUR = transit.regen ? 850 : 600;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / DUR);
      const e = easeInOut(p);
      let x: number, y: number;
      if (transit.regen) {
        // the regen packet rides the back edge judge→enrich
        const pt = backPoint(e);
        x = pt.x;
        y = pt.y;
      } else {
        x = xAt(transit.from) + (xAt(transit.to) - xAt(transit.from)) * e;
        y = Y;
      }
      el.style.left = `${(x / W) * 100}%`;
      el.style.top = `${(y / H) * 100}%`;
      el.style.opacity = p < 1 ? "1" : "0";
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else setTransit(null);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [transit]);

  const reenriching = run?.status === "reenriching";
  const visited = new Set<VisualNode>();
  if (run) {
    // honest trail: a node is "visited" only if its evidence exists on the run.
    // brief lands via scrape_done, emitted AFTER the whole gather phase (scrape→enrich→ground).
    if (run.brief) {
      visited.add("scrape");
      visited.add("enrich");
      visited.add("ground");
    }
    if (run.story !== null) visited.add("draft");
    if (run.score !== null) visited.add("judge");
    if (run.status === "done") {
      visited.add("archive");
      visited.add("render");
    }
  }

  return (
    <section aria-label="The harness loop" className="ring-panel rounded-2xl bg-raised px-5 pb-2 pt-4">
      <header className="mb-1 flex items-baseline justify-between px-1">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-mute">
          the harness · typed-node graph
        </p>
        <p className="font-mono text-[10px] text-faint">
          {run ? (
            <>
              <span className="text-mute">{run.leadId}</span>
              {" · "}
              <span className={run.status === "failed" ? "text-bad" : "text-ink-2"}>
                {run.status}
              </span>
              {" · gen "}
              <span className="font-numeral text-ink-2">{run.generation}</span>
            </>
          ) : (
            "idle — waiting for a lead"
          )}
        </p>
      </header>

      <div className="dotted-canvas board-recess relative rounded-xl">
        <div className="relative mx-auto w-full" style={{ aspectRatio: `${W}/${H}` }}>
          <svg viewBox={`0 0 ${W} ${H}`} fill="none" className="absolute inset-0 h-full w-full">
            {/* the main wire — left→right, dashed hairline */}
            <line
              x1={xAt(0)}
              y1={Y}
              x2={xAt(NODES.length - 1)}
              y2={Y}
              stroke="rgba(32,32,32,0.12)"
              strokeWidth="1"
              strokeDasharray="4.5 4.5"
            />
            {/* the regen back-edge judge→enrich (marches violet while reenriching) */}
            <path
              d={backPath}
              className={reenriching ? "wire-march" : ""}
              stroke={reenriching ? undefined : "rgba(32,32,32,0.12)"}
              strokeWidth="1"
              strokeDasharray={reenriching ? undefined : "4.5 4.5"}
              fill="none"
            />
            {/* back-edge label — ink alphas ONLY (violet belongs to the node ring +
                wire packet; strict-law fix, design-judge 2026-06-12) */}
            <text
              x={(xAt(1) + xAt(4)) / 2}
              y={BACK_Y + 14}
              textAnchor="middle"
              fontSize="9"
              fill={reenriching ? "rgba(38,35,35,0.45)" : "rgba(38,35,35,0.35)"}
              fontFamily="var(--font-mono)"
            >
              regen · max 2 retries
            </text>
            {/* emit label on the judge→archive wire */}
            <text
              x={(xAt(4) + xAt(5)) / 2}
              y={Y - 10}
              textAnchor="middle"
              fontSize="9"
              fill="rgba(38,35,35,0.35)"
              fontFamily="var(--font-mono)"
            >
              emit
            </text>
            {/* ringed endpoints at each node */}
            {NODES.map((n, i) => (
              <circle
                key={n.id}
                cx={xAt(i)}
                cy={Y}
                r="3"
                fill="#f5f5f2"
                stroke="rgba(0,0,0,0.14)"
                strokeWidth="0.6"
              />
            ))}
          </svg>

          {/* the traveling packet */}
          <div
            ref={dotRef}
            aria-hidden
            className="absolute z-10 h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              opacity: 0,
              background: transit?.regen ? "var(--bad)" : "var(--live)",
              boxShadow:
                "0 0 0 3px color-mix(in srgb, currentColor 12%, transparent), 0 1px 2px rgba(0,0,0,0.25)",
              color: transit?.regen ? "var(--bad)" : "var(--live)",
            }}
          />

          {/* node chips */}
          {NODES.map((n, i) => {
            const isLive = activeNode === n.id;
            const wasVisited = visited.has(n.id);
            return (
              <div
                key={n.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${(xAt(i) / W) * 100}%`, top: `${(Y / H) * 100}%` }}
              >
                <div
                  data-live={isLive ? "true" : undefined}
                  className="node-chip relative w-[104px] rounded-[7px] px-1.5 py-[10px] text-center"
                >
                  {isLive && <span className="node-shimmer" aria-hidden />}
                  <span className="flex items-center justify-center gap-1.5">
                    {(isLive || wasVisited) && (
                      <span
                        aria-hidden
                        className={`dot-glow h-[7px] w-[7px] flex-none rounded-full bg-current ${
                          isLive ? "text-live" : "text-good"
                        } ${isLive ? "dash-pulse" : ""}`}
                      />
                    )}
                    <span className="whitespace-nowrap text-[11.5px] leading-[120%] text-ink-2">
                      {n.name}
                    </span>
                  </span>
                  <span className="mt-1 block whitespace-nowrap font-mono text-[7.5px] leading-tight text-mute">
                    {n.sponsor}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
