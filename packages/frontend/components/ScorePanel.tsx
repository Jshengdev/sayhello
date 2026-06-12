"use client";

/**
 * ScorePanel — the held-out Critic's verdict: the 6 StoryScore axes as thin
 * bars + the verdict chip + the grounding trajectory across generations.
 * Renders ONLY real scores off the stream — no invented data.
 */

import type { StoryRun, StoryScore } from "@/lib/types";

const AXES: Array<{ key: keyof StoryScore; label: string }> = [
  { key: "grounding", label: "grounding" },
  { key: "completeness", label: "completeness" },
  { key: "narrative_arc", label: "narrative arc" },
  { key: "feasibility", label: "feasibility" },
  { key: "competitive_diff", label: "competitive diff" },
  { key: "metric_confidence", label: "metric confidence" },
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
            grounding trajectory
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {run.generations.map((g, i) => (
              <span key={g.generation} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden className="font-mono text-[10px] text-faint">→</span>}
                <span
                  className={`pill-emboss flex items-center gap-1.5 rounded-full bg-page px-2 py-[2px] font-mono text-[9.5px] ${
                    g.score.grounding >= 0.7 ? "text-good" : "text-bad"
                  }`}
                >
                  gen <span className="font-numeral">{g.generation}</span> ·{" "}
                  <span className="font-numeral">{g.score.grounding.toFixed(2)}</span>
                  {g.fabricatedClaims.length > 0 && (
                    <span aria-label={`${g.fabricatedClaims.length} fabricated claims`}>
                      ⊘{g.fabricatedClaims.length}
                    </span>
                  )}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
