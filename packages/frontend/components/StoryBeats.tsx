"use client";

/**
 * StoryBeats — the story lands as COMPONENTS, not a text wall.
 * The drafter emits five deterministic headers on their own lines
 * (THE GOAL / THE OBSTACLE / THE OLD WAY FAILS / THE BETTER PATH /
 * THE BETTER OUTCOME) — parsed here into a vertical stack of beat-cards:
 * a numbered mono header chip, the beat text, [signal_type] citations as
 * small inline evidence chips, flagged claims red (the existing
 * highlightClaims from RunStepper), and " ⟶ what this means: " segments
 * as quiet indented reasoning rows. Beats stagger in with a soft
 * rise+blur-up (CSS, .beat-rise). A story missing the headers falls back
 * gracefully to the plain text rendering — same ring recipe as before.
 */

import type { ReactNode } from "react";
import { highlightClaims } from "@/components/RunStepper";

/* the five deterministic beats, in canonical order — numbers are fixed 1–5 */
const BEAT_HEADERS = [
  "THE GOAL",
  "THE OBSTACLE",
  "THE OLD WAY FAILS",
  "THE BETTER PATH",
  "THE BETTER OUTCOME",
] as const;

const HEADER_RE = new RegExp(`^\\s*(${BEAT_HEADERS.join("|")})\\s*:?\\s*(.*)$`);
/* [signal_type] citations — lowercase snake tokens only, never bracketed prose */
const CITE_RE = /\[([a-z][a-z0-9_]{1,40})\]/g;
/* " ⟶ what this means: <read>" — the reasoning segment runs to end of line */
const REASON_SPLIT = /[ \t]*⟶[ \t]*what this means:[ \t]*([^\n]*)/gi;

interface Beat {
  n: number; // 1–5, fixed by header identity
  header: string;
  text: string;
}

/** Parse the 5-beat story. Returns null when the headers aren't there (fallback). */
export function parseBeats(story: string): { intro: string; beats: Beat[] } | null {
  const beats: Beat[] = [];
  let intro = "";
  let cur: Beat | null = null;
  for (const line of story.split("\n")) {
    const m = line.match(HEADER_RE);
    if (m) {
      if (cur) beats.push({ ...cur, text: cur.text.trim() });
      cur = {
        n: BEAT_HEADERS.indexOf(m[1] as (typeof BEAT_HEADERS)[number]) + 1,
        header: m[1]!,
        text: m[2] ?? "",
      };
    } else if (cur) {
      cur.text += (cur.text ? "\n" : "") + line;
    } else {
      intro += (intro ? "\n" : "") + line;
    }
  }
  if (cur) beats.push({ ...cur, text: cur.text.trim() });
  if (beats.length < 2) return null; // not the 5-beat shape — render as text
  return { intro: intro.trim(), beats };
}

/** string pieces → strings + evidence chips (brackets stripped, chip styling) */
function withCitations(nodes: ReactNode[]): ReactNode[] {
  return nodes.flatMap((node, ni) => {
    if (typeof node !== "string") return [node];
    const out: ReactNode[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    CITE_RE.lastIndex = 0;
    while ((m = CITE_RE.exec(node))) {
      if (m.index > last) out.push(node.slice(last, m.index));
      out.push(
        <span
          key={`cite-${ni}-${m.index}`}
          data-testid="evidence-chip"
          className="pill-emboss mx-[2px] inline-block translate-y-[-1px] whitespace-nowrap rounded-full bg-page px-[7px] py-[1px] font-mono text-[8.5px] leading-[1.5] text-mute"
        >
          {m[1]}
        </span>,
      );
      last = m.index + m[0].length;
    }
    if (last < node.length) out.push(node.slice(last));
    return out;
  });
}

/** claims red first (exact substrings of the raw text), then citation chips */
function decorate(text: string, claims: string[]): ReactNode[] {
  return withCitations(highlightClaims(text, claims));
}

/** beat text → flow text + indented " ⟶ what this means" reasoning rows */
function renderBeatText(text: string, claims: string[]): ReactNode[] {
  const segs = text.split(REASON_SPLIT); // odd indices = reasoning segments
  return segs.flatMap((seg, i) => {
    if (i % 2 === 1) {
      return [
        <span
          key={`reason-${i}`}
          data-testid="reason-row"
          className="my-1 block whitespace-pre-wrap pl-4 font-mono text-[10.5px] leading-relaxed"
          style={{ color: "rgba(38, 35, 35, 0.6)" }}
        >
          <span aria-hidden className="mr-1.5 select-none">
            ⟶
          </span>
          {decorate(seg.trim(), claims)}
        </span>,
      ];
    }
    /* a reasoning row already breaks the line — drop the leading newline after it */
    const plain = i > 0 ? seg.replace(/^\n/, "") : seg;
    if (!plain) return [];
    return [<span key={`flow-${i}`}>{decorate(plain, claims)}</span>];
  });
}

export default function StoryBeats({
  story,
  claims = [],
  maxHeight,
  dense = false,
}: {
  story: string;
  claims?: string[];
  /** scroll ceiling — keeps each mount's existing footprint */
  maxHeight?: number;
  /** the iteration explorer's tighter type */
  dense?: boolean;
}) {
  const parsed = parseBeats(story);

  /* ——— graceful fallback — the headers aren't there, render the text wall ——— */
  if (!parsed) {
    return (
      <div
        data-testid="story-beats"
        data-parsed="false"
        className={`ring-card overflow-y-auto quiet-scroll whitespace-pre-wrap rounded-xl bg-white ${
          dense ? "px-3.5 py-3 text-[12px] leading-[1.7]" : "px-4 py-3.5 text-[13px] leading-[1.75]"
        } text-ink`}
        style={maxHeight ? { maxHeight } : undefined}
      >
        {highlightClaims(story, claims)}
      </div>
    );
  }

  return (
    <div
      data-testid="story-beats"
      data-parsed="true"
      className="overflow-y-auto quiet-scroll"
      style={maxHeight ? { maxHeight } : undefined}
    >
      {/* p-[3px] keeps the cards' 1px rings from clipping on the scroll edge */}
      <div className="flex flex-col gap-2.5 p-[3px]">
        {parsed.intro && (
          <p
            className={`beat-rise m-0 whitespace-pre-wrap px-1 ${
              dense ? "text-[11.5px]" : "text-[12px]"
            } leading-relaxed text-mute`}
          >
            {decorate(parsed.intro, claims)}
          </p>
        )}
        {parsed.beats.map((b, i) => (
          <article
            key={`${b.n}-${i}`}
            data-testid={`beat-card-${b.n}`}
            className="beat-rise ring-card rounded-xl bg-white"
            style={{ animationDelay: `${(i + (parsed.intro ? 1 : 0)) * 130}ms` }}
          >
            <div className={dense ? "px-3.5 py-3" : "px-4 py-3.5"}>
              <header>
                <span className="pill-emboss inline-flex items-baseline gap-1.5 rounded-full bg-page px-2 py-[2px] font-mono text-[9px] uppercase tracking-[0.12em] text-ink-2">
                  <span className="font-numeral text-[9.5px]">{b.n}</span>
                  <span aria-hidden className="text-faint">·</span>
                  {b.header.toLowerCase()}
                </span>
              </header>
              <div
                className={`mt-2 whitespace-pre-wrap ${
                  dense ? "text-[12px] leading-[1.7]" : "text-[12.5px] leading-[1.75]"
                } text-ink`}
              >
                {renderBeatText(b.text, claims)}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
