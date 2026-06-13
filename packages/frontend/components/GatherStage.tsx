"use client";

/**
 * GatherStage — the gather step FEELS like the internet (docs/DEMO-FEEL.md item 4):
 * find-cards pop in on a timed cadence — domain chips, favicon-ish dots, little
 * URLs, "found: their pricing page". The decoration is staged from the picked
 * catalog entry's finds; the REAL fixture signals join the pops the moment the
 * brief lands off the wire. Decoration is presentation only — nothing here is a
 * verdict.
 */

import { useEffect, useMemo, useState } from "react";
import type { CompanyBrief } from "@/lib/types";
import type { CatalogEntry } from "@/components/HelloBar";
import { GENERIC_FINDS } from "@/components/HelloBar";

const POP_MS = 620;

interface FindItem {
  chip: string;
  text: string;
  url: string;
  real: boolean;
}

const DOT_TONES = ["#1970d1", "#1f7a4d", "#b5751a", "#6e2bff", "#c8241a"];
const dotTone = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return DOT_TONES[Math.abs(h) % DOT_TONES.length];
};

const trim = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export default function GatherStage({
  entry,
  brief,
  startedAt,
  gathering,
}: {
  entry: CatalogEntry | null;
  brief: CompanyBrief | null;
  startedAt: number;
  gathering: boolean;
}) {
  /* the pop queue: staged finds first, then the REAL signals as they land */
  const items = useMemo<FindItem[]>(() => {
    const staged = (entry?.finds ?? GENERIC_FINDS).map((f) => ({ ...f, real: false }));
    const real = (brief?.signals ?? [])
      .filter((s) => s.strength > 0)
      .slice(0, 8)
      .map((s) => ({
        chip: s.source.replaceAll("_", " "),
        text: `found: “${trim(s.detail, 96)}”`,
        url: s.source_url.replace(/^https?:\/\//, "") || s.source,
        real: true,
      }));
    return [...staged, ...real];
  }, [entry, brief]);

  /* timed pops — elapsed-since-run-start so collapsing/expanding the step never loses cards */
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 220);
    return () => clearInterval(id);
  }, []);
  const due = Math.min(items.length, Math.max(1, Math.floor((now - startedAt) / POP_MS) + 1));
  const visible = items.slice(0, due);

  return (
    <div>
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-mute">
          out on the internet, gathering
        </p>
        <p className="font-mono text-[10px] text-faint">
          <span className="font-numeral text-ink-2">{visible.length}</span> finds
          {brief && (
            <span className="text-good"> · {brief.signals.length} kept as evidence</span>
          )}
        </p>
      </header>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {visible.map((f, i) => (
          <div
            key={`${f.url}-${i}`}
            className="find-pop ring-card flex items-start gap-2.5 rounded-xl bg-white px-3 py-2.5"
          >
            {/* favicon-ish dot */}
            <span
              aria-hidden
              className="dot-glow mt-[5px] h-2 w-2 flex-none rounded-full"
              style={{ background: dotTone(f.url), color: dotTone(f.url) }}
            />
            <div className="min-w-0 flex-1">
              <p className="m-0 text-[12px] leading-snug text-ink">{f.text}</p>
              <p className="m-0 mt-1 flex items-center gap-2 font-mono text-[9px] text-faint">
                <span className="pill-emboss rounded-full bg-page px-1.5 py-[1px] uppercase tracking-[0.04em] text-ink-2">
                  {f.chip}
                </span>
                <span className="truncate" title={f.url}>
                  {trim(f.url, 44)}
                </span>
                {f.real && <span className="text-good">kept ✓</span>}
              </p>
            </div>
          </div>
        ))}

        {/* the next find, mid-grab */}
        {(gathering || due < items.length) && (
          <div className="board-recess dotted-canvas flex items-center gap-2.5 rounded-xl px-3 py-2.5">
            <span aria-hidden className="dot-glow h-2 w-2 flex-none rounded-full bg-current text-ocean dash-pulse" style={{ color: "var(--ocean)" }} />
            <p className="m-0 font-mono text-[10.5px] text-mute">still looking…</p>
          </div>
        )}
      </div>
    </div>
  );
}
