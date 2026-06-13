"use client";

/**
 * StoryCanvas — the draft lead-story. The instant score_done lands with
 * fabricatedClaims non-empty, the offending claim text turns RED inline and
 * the Critic card drops in ("no source Signal — FABRICATED" + grounding +
 * failReason). THE demo heart (docs/CONSTRAINTS.md #3) — render it instantly.
 * Blur-up swap between generations (signature gesture).
 */

import type { ReactNode } from "react";
import type { StoryRun } from "@/lib/types";

/** wrap every fabricated claim found in the story in a red mark — exact substring */
function highlightClaims(story: string, claims: string[]): ReactNode[] {
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

export default function StoryCanvas({ run }: { run: StoryRun | null }) {
  const story = run?.story ?? null;
  const score = run?.score ?? null;
  const fabricated = score?.fabricatedClaims ?? [];
  const caught = fabricated.length > 0;

  return (
    <section aria-label="The lead story" className="ring-panel rounded-2xl bg-raised p-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-mute">
          the lead-story
        </p>
        <span className="flex items-center gap-2">
          {run?.brief && (
            <span className="font-mono text-[10px] text-faint">{run.brief.name}</span>
          )}
          {run?.pitch_angle && (
            <span className="pill-emboss rounded-full bg-page px-2 py-[2px] font-mono text-[9.5px] text-ink-2">
              angle · {run.pitch_angle.replaceAll("_", " ")}
            </span>
          )}
          {run && (
            <span className="font-mono text-[10px] text-mute">
              gen <span className="font-numeral">{run.generation}</span>
            </span>
          )}
        </span>
      </header>

      {/* the scraped brief — one quiet line of real provenance */}
      {run?.brief && (
        <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-mute">
          {run.brief.what_they_do}
          <span className="ml-2 font-mono text-[9.5px] text-faint">
            {run.brief.signals.length} signals scraped
          </span>
        </p>
      )}

      {story === null ? (
        <p className="dotted-canvas board-recess mt-4 rounded-xl px-4 py-8 text-center font-mono text-[11px] text-faint">
          no draft yet — the story lands here the moment the drafter emits
        </p>
      ) : (
        <div
          key={`gen-${run?.generation ?? 0}-${caught ? "caught" : "clean"}`}
          className="blur-up mt-4"
        >
          <div className="ring-card whitespace-pre-wrap rounded-xl bg-white px-4 py-3.5 text-[14px] leading-[1.75] text-ink">
            {highlightClaims(story, fabricated)}
          </div>
        </div>
      )}

      {/* THE moment — the held-out Critic refuses to ship what it can't prove */}
      {caught && score && (
        <div
          className="dash-pop mt-3 rounded-xl px-4 py-3.5"
          style={{
            background: "color-mix(in srgb, var(--bad) 5%, var(--raised))",
            boxShadow:
              "inset 0 0 0 1px #fff, 0 0 0 1px color-mix(in srgb, var(--bad) 40%, transparent), 0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          <p className="flex items-center gap-2 font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-bad">
            <span aria-hidden className="dot-glow h-2 w-2 rounded-full bg-current" />
            no source Signal — FABRICATED ×{fabricated.length}
          </p>
          <ul className="m-0 mt-2 list-none space-y-1.5 p-0">
            {fabricated.map((c) => (
              <li key={c} className="flex items-baseline gap-2 text-[12.5px] leading-snug text-ink">
                <span aria-hidden className="font-mono text-[10px] text-bad">⊘</span>
                <span>“{c}”</span>
              </li>
            ))}
          </ul>
          <p className="divider-dashed mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 pt-2.5 font-mono text-[10px] text-ink-2">
            <span>
              grounding{" "}
              <b className="font-numeral text-[11px] text-bad">{score.grounding.toFixed(2)}</b>
            </span>
            <span className="text-mute">verdict · {score.verdict}</span>
            {score.failReason && <span className="text-mute">{score.failReason}</span>}
          </p>
        </div>
      )}

      {/* grounded — quiet, earned */}
      {!caught && score && score.verdict === "emit" && (
        <p className="dash-pop mt-3 flex items-center gap-2 font-mono text-[10.5px] text-good">
          <span aria-hidden className="dot-glow h-2 w-2 rounded-full bg-current" />
          grounded — every claim traces to a scraped Signal · grounding{" "}
          <b className="font-numeral text-[11px]">{score.grounding.toFixed(2)}</b>
        </p>
      )}
    </section>
  );
}
