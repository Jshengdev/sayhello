"use client";

/**
 * EvidencePanel — the scraped Signal corpus the held-out Critic grounds against,
 * rendered as ordinary evidence rows. Person signals (HeyReach / X / SixtyFour)
 * ride the SAME brief.signals (no new node, no new event — docs/SCENARIOS.md) and
 * surface a sourced chip + a "person" tag. Degraded/cached provenance is visible.
 * Renders REAL signals off the stream only — never invents a row.
 */

import type { Signal, StoryRun } from "@/lib/types";

type SourceKind = "person" | "company";

/** which sponsor/source produced this signal — drives the chip label + color */
function classify(sig: Signal): { kind: SourceKind; chip: string } {
  const hay = `${sig.source} ${sig.source_url} ${sig.signal_type}`.toLowerCase();
  if (hay.includes("heyreach") || hay.includes("linkedin"))
    return { kind: "person", chip: "heyreach" };
  if (hay.includes("sixtyfour") || hay.includes("sixty four"))
    return { kind: "person", chip: "sixtyfour" };
  if (
    hay.includes("x.com") ||
    hay.includes("twitter") ||
    hay.includes("x_post") ||
    hay.includes("x_bio") ||
    /\bx\b/.test(sig.source.toLowerCase())
  )
    return { kind: "person", chip: "x" };
  if (hay.includes("firecrawl") || hay.includes("website")) return { kind: "company", chip: "firecrawl" };
  if (hay.includes("clickhouse") || hay.includes("github_events"))
    return { kind: "company", chip: "clickhouse" };
  if (hay.includes("composio") || hay.includes("news")) return { kind: "company", chip: "composio" };
  if (hay.includes("discovery_call") || hay.includes("call://"))
    return { kind: "company", chip: "discovery-call" };
  if (hay.includes("seller_pack")) return { kind: "company", chip: "seller-pack" };
  return { kind: "company", chip: sig.source || "scrape" };
}

/** cached/degraded provenance is honest — flag it on the row */
function isCached(sig: Signal): boolean {
  const hay = `${sig.source} ${sig.source_url}`.toLowerCase();
  return (
    hay.includes("cached") ||
    hay.includes("fixture") ||
    hay.includes("fallback") ||
    hay.includes("paste")
  );
}

export default function EvidencePanel({
  run,
  mode,
}: {
  run: StoryRun | null;
  mode?: "live" | "replay" | null;
}) {
  const signals = run?.brief?.signals ?? [];
  const personCount = signals.filter((s) => classify(s).kind === "person").length;

  return (
    <section aria-label="Evidence" className="ring-panel rounded-2xl bg-raised p-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-mute">
          evidence · the grounding corpus
        </p>
        <span className="flex items-center gap-2 font-mono text-[10px] text-faint">
          <span className="font-numeral text-ink-2">{signals.length}</span> signals
          {personCount > 0 && (
            <span className="pill-emboss rounded-full bg-page px-2 py-[2px] text-[9px] text-ink-2">
              ◉ {personCount} person
            </span>
          )}
          {mode === "replay" && (
            <span className="pill-emboss rounded-full bg-page px-2 py-[2px] text-[9px] uppercase tracking-[0.08em] text-warn">
              cached
            </span>
          )}
        </span>
      </header>

      {signals.length === 0 ? (
        <p className="dotted-canvas board-recess mt-4 rounded-xl px-4 py-6 text-center font-mono text-[11px] text-faint">
          no signals yet — evidence rows land the moment scrape ∥ person merge
        </p>
      ) : (
        <ul className="m-0 mt-3 list-none space-y-2 p-0">
          {signals.map((sig, i) => {
            const { kind, chip } = classify(sig);
            const cached = isCached(sig);
            return (
              <li
                key={`${chip}-${i}`}
                className="ring-card flex items-start gap-2.5 rounded-lg bg-white px-3 py-2.5"
              >
                <span
                  className={`mt-[2px] flex-none rounded-full px-1.5 py-[1px] font-mono text-[8.5px] uppercase tracking-[0.04em] pill-emboss ${
                    kind === "person" ? "bg-page text-live" : "bg-page text-ink-2"
                  }`}
                  title={kind === "person" ? "person signal" : "company signal"}
                >
                  {chip}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] leading-snug text-ink">{sig.detail}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[9px] text-faint">
                    <span className="text-mute">{sig.signal_type}</span>
                    {sig.source_url && (
                      <span className="truncate text-faint" title={sig.source_url}>
                        {sig.source_url.replace(/^https?:\/\//, "").slice(0, 48)}
                      </span>
                    )}
                    <span className="text-faint">
                      strength <span className="font-numeral text-ink-2">{sig.strength}</span>
                    </span>
                    {kind === "person" && <span className="text-live">person</span>}
                    {cached && <span className="text-warn">cached · degraded-safe</span>}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
