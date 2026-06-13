"use client";

/**
 * EventTicker — the system voice (IBM Plex Mono): the last few REAL WsEvents
 * off the wire, newest first. Makes the seam visible to the judge.
 */

import type { WsEvent } from "@/lib/types";

function line(ev: WsEvent): string {
  switch (ev.type) {
    case "run_started":
      return `run_started ${ev.url}`;
    case "node_enter":
      return `node_enter → ${ev.node}`;
    case "scrape_done":
      return `scrape_done · ${ev.brief.signals.length} signals`;
    case "draft_done":
      return `draft_done · gen ${ev.generation} · ${ev.pitch_angle}`;
    case "score_done":
      return `score_done · gen ${ev.generation} · grounding ${ev.score.grounding.toFixed(2)} · ${ev.score.verdict}${
        ev.score.fabricatedClaims.length > 0
          ? ` · FABRICATED ×${ev.score.fabricatedClaims.length}`
          : ""
      }`;
    case "reenrich":
      return `reenrich · gen ${ev.generation} · ${ev.reason}`;
    case "gate":
      return `gate · awaiting the human`;
    case "done":
      return `done · ${ev.run.generations.length} generations`;
    case "failed":
      return `FAILED · ${ev.stage} · ${ev.error}`;
  }
}

export default function EventTicker({ events }: { events: WsEvent[] }) {
  const recent = events.slice(-7).reverse();
  if (recent.length === 0) return null;
  return (
    <section aria-label="Event stream" className="board-recess rounded-xl bg-canvas px-4 py-3">
      <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-faint">
        ws /ws · live stream
      </p>
      <ol className="m-0 mt-1.5 list-none space-y-[3px] p-0">
        {recent.map((ev, i) => (
          <li
            key={`${events.length - i}`}
            className={`truncate font-mono text-[10px] leading-[1.5] ${
              ev.type === "failed"
                ? "text-bad"
                : ev.type === "score_done" && ev.score.fabricatedClaims.length > 0
                  ? "text-bad"
                  : i === 0
                    ? "text-ink-2"
                    : "text-mute"
            }`}
          >
            {i === 0 ? "▸ " : "· "}
            {line(ev)}
          </li>
        ))}
      </ol>
    </section>
  );
}
