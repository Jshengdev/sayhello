"use client";

/**
 * ScorePanel — the held-out Critic's verdict: the 6 StoryScore axes as thin
 * bars + the verdict chip + the grounding TRAJECTORY SPARKLINE across
 * generations (real run.generations — the ClickHouse trajectory query feeds
 * this same shape). Renders ONLY real scores off the stream — no invented data.
 */

import type { StoryGeneration, StoryRun, StoryScore } from "@/lib/types";

const AXES: Array<{ key: keyof StoryScore; label: string }> = [
  { key: "grounding", label: "traces to evidence" },
  { key: "completeness", label: "complete" },
  { key: "narrative_arc", label: "story arc" },
  { key: "feasibility", label: "feasible" },
  { key: "competitive_diff", label: "stands apart" },
  { key: "metric_confidence", label: "numbers backed" },
];

function AxisBar({ label, value }: { label: string; value: number }) {
  const ok = value >= 0.7; // emit iff grounding≥0.7 AND all axes≥0.7 (fail-CLOSED)
  return (
    <div className="grid grid-cols-[110px_1fr_38px] items-center gap-2.5">
      <span className="font-mono text-[10px] text-mute">{label}</span>
      <span className={`bar-track block h-[5px] ${ok ? "text-good" : "text-bad"}`}>
        <span
          className="bar-fill block transition-[width] duration-700 ease-signature"
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </span>
      <span className={`text-right font-numeral text-[11px] ${ok ? "text-ink-2" : "text-bad"}`}>
        {value.toFixed(2)}
      </span>
    </div>
  );
}

/* ——— the trajectory sparkline — grounding shaped across generations ———
   thin-lines law: 1px polyline + a 1px dashed hairline at the 0.7 emit
   threshold. Numerals in Departure Mono (font-numeral). Real data only. */
const SPARK = { w: 240, h: 56, padX: 16, padTop: 9, padBot: 15 };

function sparkXY(i: number, count: number, grounding: number) {
  const x =
    count === 1
      ? SPARK.w / 2
      : SPARK.padX + (i * (SPARK.w - 2 * SPARK.padX)) / (count - 1);
  const y =
    SPARK.padTop + (1 - grounding) * (SPARK.h - SPARK.padTop - SPARK.padBot);
  return { x, y };
}

function TrajectorySparkline({ generations }: { generations: StoryGeneration[] }) {
  const n = generations.length;
  const pts = generations.map((g, i) => ({
    ...sparkXY(i, n, g.score.grounding),
    g,
  }));
  const yThresh =
    SPARK.padTop + (1 - 0.7) * (SPARK.h - SPARK.padTop - SPARK.padBot);
  return (
    <div data-testid="trajectory-sparkline" className="blur-up mt-2" key={`spark-${n}`}>
      <svg
        viewBox={`0 0 ${SPARK.w} ${SPARK.h}`}
        className="block h-[56px] w-full"
        role="img"
        aria-label={`Grounding trajectory across ${n} generations`}
      >
        {/* the emit threshold — grounding ≥ 0.7, fail-CLOSED */}
        <line
          x1={SPARK.padX - 6}
          y1={yThresh}
          x2={SPARK.w - SPARK.padX + 6}
          y2={yThresh}
          stroke="rgba(38,35,35,0.18)"
          strokeWidth="1"
          strokeDasharray="3 3"
          vectorEffect="non-scaling-stroke"
        />
        <text
          x={SPARK.w - SPARK.padX + 8}
          y={yThresh + 2.5}
          fontSize="7"
          fill="rgba(38,35,35,0.35)"
          fontFamily="var(--font-numeral)"
        >
          .70
        </text>
        {/* the climb — one 1px ink line through the real scores */}
        {n > 1 && (
          <polyline
            points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="rgba(38,35,35,0.45)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {pts.map((p) => {
          const ok = p.g.score.grounding >= 0.7 && p.g.fabricatedClaims.length === 0;
          return (
            <g key={p.g.generation}>
              <circle
                cx={p.x}
                cy={p.y}
                r="2.6"
                fill={ok ? "var(--good)" : "var(--bad)"}
                stroke="#fff"
                strokeWidth="1"
              />
              {/* the numerals — Departure Mono */}
              <text
                x={p.x}
                y={p.y - 5.5}
                textAnchor="middle"
                fontSize="8"
                fill={ok ? "var(--good)" : "var(--bad)"}
                fontFamily="var(--font-numeral)"
              >
                {p.g.score.grounding.toFixed(2)}
              </text>
              <text
                x={p.x}
                y={SPARK.h - 3}
                textAnchor="middle"
                fontSize="7"
                fill="rgba(38,35,35,0.35)"
                fontFamily="var(--font-numeral)"
              >
                g{p.g.generation}
                {p.g.fabricatedClaims.length > 0
                  ? ` ⊘${p.g.fabricatedClaims.length}`
                  : ""}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function ScorePanel({ run }: { run: StoryRun | null }) {
  const score = run?.score ?? null;
  return (
    <section aria-label="Critic score" className="ring-panel rounded-2xl bg-raised p-5">
      <header className="flex items-baseline justify-between">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-mute">
          held-out critic
        </p>
        {score && (
          <span
            className={`pill-emboss rounded-full px-2.5 py-[3px] font-mono text-[10px] font-medium ${
              score.verdict === "emit" ? "bg-page text-good" : "bg-page text-bad"
            }`}
          >
            {score.verdict === "emit" ? "✓ emit" : "↺ regen"}
          </span>
        )}
      </header>

      {!score ? (
        <p className="mt-4 font-mono text-[10.5px] text-faint">
          no verdict yet — the critic (a different model family) scores every draft
        </p>
      ) : (
        <div key={`score-${run?.generation ?? 0}`} className="blur-up mt-4 space-y-2.5">
          {AXES.map((a) => (
            <AxisBar key={a.key} label={a.label} value={score[a.key] as number} />
          ))}
          {score.failReason && (
            <p className="divider-dashed pt-2.5 font-mono text-[10px] leading-relaxed text-mute">
              {score.failReason}
            </p>
          )}
        </div>
      )}

      {/* the trajectory — grounding shaped across generations (real archive data) */}
      {run && run.generations.length > 0 && (
        <div className="divider-dashed mt-4 pt-3">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-faint">
            proof trajectory · ClickHouse archive
          </p>
          <TrajectorySparkline generations={run.generations} />
        </div>
      )}
    </section>
  );
}
