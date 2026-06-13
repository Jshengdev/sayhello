"use client";

/**
 * SpiralGarden — the spiral SHAPES ITSELF (docs/DEMO-FEEL.md item 5 / VISUAL-V3).
 * Growth states: seed → seedling (red, withered — the unproven gen-0) → a leaf
 * visibly PRUNED at the catch → green BLOOM when the clean generation lands.
 * Pure CSS morphs (transform/fill transitions + keyframes on the signature ease)
 * — it MOVES. The SHAPE is presentation; the captions/chips/counts underneath
 * are the REAL verdicts off the stream (fabricated-claim counts, proof scores).
 */

import { useEffect, useState } from "react";
import type { StoryGeneration } from "@/lib/types";
import GenerationSpiral from "@/components/GenerationSpiral";
import { AxisBars } from "@/components/RunStepper";
import StoryBeats from "@/components/StoryBeats";

export type GardenStage = "idle" | "seed" | "catch" | "fixing" | "bloom";
type Phase = "idle" | "seed" | "withered" | "pruning" | "bloom";

const PRUNE_BEAT_MS = 1700; // the withered seedling holds, then the leaf is cut

/* ——— the proof trajectory — one point per draft, the line climbs to proven.
       Pure SVG, thin-lines law (1px), numerals + labels in mono. Real scores
       only — every point is a judge verdict off the stream. ——— */
const CH = { w: 260, h: 92, padX: 30, padTop: 16, padBot: 20 };

function ProofTrajectory({ generations }: { generations: StoryGeneration[] }) {
  const n = generations.length;
  if (n === 0) return null;
  const X = (i: number) =>
    n === 1 ? CH.w / 2 : CH.padX + (i * (CH.w - 2 * CH.padX)) / (n - 1);
  const Y = (v: number) => CH.padTop + (1 - v) * (CH.h - CH.padTop - CH.padBot);
  const pts = generations.map((g, i) => ({ x: X(i), y: Y(g.score.grounding), g }));
  const axis = "rgba(38,35,35,0.35)";
  return (
    <div data-testid="proof-trajectory" className="divider-dashed mt-3 pt-2.5">
      <p className="m-0 font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
        proof trajectory
      </p>
      <svg
        viewBox={`0 0 ${CH.w} ${CH.h}`}
        className="mt-1 block w-full"
        role="img"
        aria-label={`Proof score per draft across ${n} drafts`}
      >
        {/* the floor (0) and the ceiling (1) — 1px hairlines, mono numerals */}
        <line x1={CH.padX - 8} y1={Y(0)} x2={CH.w - CH.padX + 8} y2={Y(0)} stroke="rgba(38,35,35,0.14)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <text x={CH.padX - 12} y={Y(0) + 2.5} textAnchor="end" fontSize="7" fill={axis} fontFamily="var(--font-numeral)">0</text>
        <text x={CH.padX - 12} y={Y(1) + 2.5} textAnchor="end" fontSize="7" fill={axis} fontFamily="var(--font-numeral)">1</text>
        {/* the bar to clear — proof ≥ .70 ships, below doesn't */}
        <line x1={CH.padX - 8} y1={Y(0.7)} x2={CH.w - CH.padX + 8} y2={Y(0.7)} stroke="rgba(38,35,35,0.18)" strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
        <text x={CH.padX - 12} y={Y(0.7) + 2.5} textAnchor="end" fontSize="7" fill={axis} fontFamily="var(--font-numeral)">.70</text>
        {/* the climb — one 1px ink line through the real verdicts */}
        {n > 1 && (
          <polyline
            points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="rgba(38,35,35,0.45)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {pts.map((p, i) => {
          const flags = p.g.fabricatedClaims.length;
          const ok = p.g.score.grounding >= 0.7 && flags === 0;
          const tone = ok ? "var(--good)" : "var(--bad)";
          return (
            <g key={p.g.generation}>
              <circle cx={p.x} cy={p.y} r="2.6" fill={tone} stroke="#fff" strokeWidth="1" />
              <text x={p.x} y={p.y - 6} textAnchor="middle" fontSize="8" fill={tone} fontFamily="var(--font-numeral)">
                {p.g.score.grounding.toFixed(2)}
              </text>
              {/* flags-count badge — ⊘n it can't verify rides the red points */}
              {flags > 0 && (
                <text x={p.x + 7} y={p.y + 3} fontSize="7.5" fill="var(--bad)" fontFamily="var(--font-mono, monospace)">
                  ⊘{flags}
                </text>
              )}
              <text x={p.x} y={CH.h - 4} textAnchor="middle" fontSize="7" fill={axis} fontFamily="var(--font-mono, monospace)">
                draft {i + 1}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ——— one draft, opened: its story with the unproven lines marked red +
       the judge's 6 axes. Follows the spiral's focus as you scrub. ——— */
function IterationDetail({ g }: { g: StoryGeneration }) {
  const bad = g.fabricatedClaims.length > 0;
  return (
    <section
      key={`iter-${g.generation}`}
      aria-label={`Draft ${g.generation + 1} detail`}
      data-testid="iteration-detail"
      className="blur-up ring-panel rounded-2xl bg-raised p-4"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="m-0 font-mono text-[10px] uppercase tracking-[0.14em] text-mute">
          draft {g.generation + 1} — what the judge saw
        </p>
        <span
          className={`pill-emboss rounded-full bg-page px-2 py-[2px] font-mono text-[9px] ${
            bad ? "text-bad" : "text-good"
          }`}
        >
          {bad ? `✕ ${g.fabricatedClaims.length} can't verify` : "✓ proven"}{" "}
          <span className="font-numeral">{g.score.grounding.toFixed(2)}</span>
        </span>
      </header>
      <div className="mt-2.5">
        <StoryBeats story={g.story} claims={g.fabricatedClaims} maxHeight={230} dense />
      </div>
      <div className="divider-dashed mt-3 pt-3">
        <AxisBars score={g.score} />
      </div>
    </section>
  );
}

export default function SpiralGarden({
  stage,
  generations,
}: {
  stage: GardenStage;
  generations: StoryGeneration[];
}) {
  /* a clicked draft chip opens the explorer — the spiral over every draft +
     that draft's story (flags marked red) + its judge scores. ✕ returns here. */
  const [explore, setExplore] = useState<number | null>(null);

  /* the catch step breathes: withered first, THEN the prune lands */
  const [pruned, setPruned] = useState(false);
  useEffect(() => {
    if (stage === "catch") {
      setPruned(false);
      const t = setTimeout(() => setPruned(true), PRUNE_BEAT_MS);
      return () => clearTimeout(t);
    }
    if (stage === "idle" || stage === "seed") setPruned(false);
    else setPruned(true);
  }, [stage]);

  const phase: Phase =
    stage === "idle"
      ? "idle"
      : stage === "seed"
        ? "seed"
        : stage === "catch"
          ? pruned
            ? "pruning"
            : "withered"
          : stage === "fixing"
            ? "pruning"
            : "bloom";

  const caught = generations.find((g) => g.fabricatedClaims.length > 0) ?? null;
  const clean =
    [...generations].reverse().find((g) => g.fabricatedClaims.length === 0) ?? null;

  const caption =
    phase === "idle"
      ? "the story grows here"
      : phase === "seed"
        ? "planting their story…"
        : phase === "withered"
          ? `draft landed — ${caught?.fabricatedClaims.length ?? "?"} lines can't be verified`
          : phase === "pruning"
            ? "cutting what can't be proven…"
            : "every line now traces to evidence";
  const captionTone =
    phase === "withered" ? "text-bad" : phase === "bloom" ? "text-good" : "text-mute";

  /* ——— EXPLORE — the garden swaps for the scrub spiral + the opened draft ——— */
  if (explore !== null && generations.length > 0) {
    const gi = Math.max(0, Math.min(generations.length - 1, explore));
    return (
      <div className="flex flex-col gap-4" data-testid="iteration-explorer">
        <GenerationSpiral
          generations={generations}
          focus={gi}
          onFocusChange={setExplore}
          onClose={() => setExplore(null)}
        />
        <IterationDetail g={generations[gi]} />
      </div>
    );
  }

  return (
    <section
      aria-label="The story, growing"
      data-testid="spiral-garden"
      data-phase={phase}
      className="ring-panel rounded-2xl bg-raised p-4"
    >
      <p className="m-0 font-mono text-[10px] uppercase tracking-[0.14em] text-mute">
        their story, taking shape
      </p>

      <div className="dotted-canvas board-recess mt-2.5 rounded-xl">
        <svg viewBox="0 0 220 250" className="gdn-svg mx-auto block h-[230px] w-full max-w-[260px]">
          {/* the ground */}
          <ellipse cx="110" cy="226" rx="64" ry="9" className="gdn-ground" />

          {/* the seed — visible before anything grows */}
          <circle cx="110" cy="220" r="4.5" className="gdn-seed" />

          <g className="gdn-plant">
            {/* stem */}
            <path d="M110 226 C 105 196, 117 170, 110 136" className="gdn-stem" />
            {/* leaves */}
            <path
              d="M109 196 C 92 192, 80 178, 78 162 C 96 166, 107 180, 109 196 Z"
              className="gdn-leaf gdn-leaf-l"
            />
            <path
              d="M111 176 C 128 172, 140 158, 142 142 C 124 146, 113 160, 111 176 Z"
              className="gdn-leaf gdn-leaf-r"
            />
            {/* the leaf that gets PRUNED at the catch */}
            <path
              d="M108 208 C 90 206, 76 196, 72 182 C 90 184, 104 194, 108 208 Z"
              className="gdn-leaf gdn-leaf-prune"
            />
            {/* the bloom — earned only by the clean generation */}
            <g className="gdn-bloom">
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <ellipse
                  key={deg}
                  cx="110"
                  cy="121"
                  rx="7.5"
                  ry="15"
                  className="gdn-petal"
                  transform={`rotate(${deg} 110 136)`}
                />
              ))}
              <circle cx="110" cy="136" r="7" className="gdn-bloom-core" />
            </g>
          </g>
        </svg>
      </div>

      <p
        data-testid="garden-caption"
        className={`m-0 mt-2.5 text-center font-mono text-[10px] leading-relaxed ${captionTone}`}
      >
        {caption}
      </p>

      {/* REAL verdicts only — one chip per draft off the stream. Click one to
          OPEN that draft: its story with the unproven lines red + its scores. */}
      {generations.length > 0 && (
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {generations.map((g, i) => {
            const bad = g.fabricatedClaims.length > 0;
            return (
              <button
                key={g.generation}
                type="button"
                data-testid={`iter-chip-${g.generation}`}
                aria-label={`Open draft ${g.generation + 1}`}
                onClick={() => setExplore(i)}
                className={`pill-emboss rounded-full bg-page px-2 py-[2px] font-mono text-[9px] transition-colors hover:bg-white ${
                  bad ? "text-bad" : "text-good"
                }`}
              >
                draft {g.generation + 1} ·{" "}
                {bad ? `✕ ${g.fabricatedClaims.length} can't verify` : "✓ proven"}{" "}
                <span className="font-numeral">{g.score.grounding.toFixed(2)}</span>
              </button>
            );
          })}
        </div>
      )}
      {generations.length > 0 && (
        <p className="m-0 mt-1.5 text-center font-mono text-[8.5px] text-faint">
          click a draft to open it
        </p>
      )}
      {clean && phase === "bloom" && caught && (
        <p className="m-0 mt-1.5 text-center font-mono text-[9px] text-faint">
          ✂ {caught.fabricatedClaims.length} unproven lines cut on the way
        </p>
      )}

      {/* THE CHART — proof score per draft, climbing to ship */}
      <ProofTrajectory generations={generations} />
    </section>
  );
}
