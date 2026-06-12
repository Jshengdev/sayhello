"use client";

/**
 * ReceiptRenderer — the paper-light component library the OpenUI Lang AST renders
 * into (docs/reference/OPENUI-RENDER.md §3). The render node emits openuiLang;
 * lib/openui-lang.ts parses it to a tree; this maps each node → a real
 * paper-light React component (NOT a chat card — that's the prize pitch). The
 * SAME components render the StoryRun-derived fallback tree (treeFromRun) when
 * the render node hasn't produced a receipt yet — every value is real run data.
 */

import { useState } from "react";
import type { ReactNode } from "react";
import type { ElementNode, LangValue } from "@/lib/openui-lang";
import { isElement } from "@/lib/openui-lang";
import type { StoryRun } from "@/lib/types";

type Verdict = "GROUNDED" | "FABRICATED" | "CUT";

const asStr = (v: LangValue): string => (typeof v === "string" ? v : v == null ? "" : String(v));
const asNum = (v: LangValue): number => (typeof v === "number" ? v : Number(v) || 0);
const asArr = (v: LangValue): LangValue[] => (Array.isArray(v) ? v : []);

/* ——— the renderer: one node → one component ——— */
export function RenderNode({
  node,
  onAction,
  approved,
}: {
  node: LangValue;
  onAction?: (action: string) => void;
  approved?: boolean;
}): ReactNode {
  if (!isElement(node)) return null;
  const a = node._args;
  switch (node._component) {
    case "Receipt":
      return (
        <ReceiptShell company={asStr(a[0])} headline={asStr(a[1])}>
          {asArr(a[2]).map((c, i) => (
            <RenderNode key={i} node={c} onAction={onAction} approved={approved} />
          ))}
        </ReceiptShell>
      );
    case "ClaimsLedger":
      return <ClaimsLedger rows={asArr(a[0])} />;
    case "ClaimRow":
      return <ClaimRow claim={asStr(a[0])} verdict={asStr(a[1]) as Verdict} source={a[2] ? asStr(a[2]) : null} />;
    case "EvidenceAccordion":
      return <EvidenceAccordion items={asArr(a[0])} />;
    case "EvidenceItem":
      return <EvidenceItem claim={asStr(a[0])} excerpt={asStr(a[1])} sourceUrl={a[2] == null ? null : asStr(a[2])} />;
    case "TrajectoryChart":
      return <TrajectoryChart points={asArr(a[0])} />;
    case "GateBlock":
      return (
        <GateBlock
          label={asStr(a[0])}
          action={asStr(a[1])}
          summary={asStr(a[2])}
          onAction={onAction}
          approved={approved}
        />
      );
    case "StorySlides":
      return <StorySlides slides={asArr(a[0])} />;
    case "StorySlide":
      return <StorySlide title={asStr(a[0])} body={asStr(a[1])} />;
    default:
      return (
        <p className="font-mono text-[10px] text-faint">
          [openui] unknown component {node._component}
        </p>
      );
  }
}

/* ——— components ——— */
function ReceiptShell({ company, headline, children }: { company: string; headline: string; children: ReactNode }) {
  return (
    <div className="ring-card rounded-xl bg-raised p-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-mute">
          verification receipt · {company}
        </p>
        <span className="pill-emboss rounded-full bg-page px-2 py-[2px] font-mono text-[9px] text-ink-2">
          OpenUI Lang · Thesys C1
        </span>
      </header>
      <p className="mt-1 font-mono text-[12px] text-ink">{headline}</p>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

function verdictTone(v: Verdict): { cls: string; mark: string } {
  if (v === "FABRICATED") return { cls: "text-bad", mark: "⊘" };
  if (v === "CUT") return { cls: "text-mute", mark: "—" };
  return { cls: "text-good", mark: "✓" };
}

function ClaimsLedger({ rows }: { rows: LangValue[] }) {
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint">claims ledger</p>
      <ul className="m-0 mt-1.5 list-none space-y-1.5 p-0">
        {rows.map((r, i) => (
          <RenderNode key={i} node={r} />
        ))}
      </ul>
    </div>
  );
}

function ClaimRow({ claim, verdict, source }: { claim: string; verdict: Verdict; source: string | null }) {
  const t = verdictTone(verdict);
  return (
    <li
      className="flex items-start gap-2 rounded-lg bg-white px-3 py-2"
      style={{
        boxShadow:
          verdict === "FABRICATED"
            ? "inset 0 0 0 1px #fff, 0 0 0 1px color-mix(in srgb, var(--bad) 38%, transparent)"
            : "inset 0 0 0 1px #fff, 0 0 0 1px rgba(0,0,0,0.07)",
      }}
    >
      <span className={`mt-[1px] flex-none font-mono text-[11px] ${t.cls}`}>{t.mark}</span>
      <span className="min-w-0 flex-1 text-[12px] leading-snug text-ink">{claim}</span>
      <span className="flex flex-none flex-col items-end gap-0.5">
        <span className={`font-mono text-[8.5px] font-medium uppercase tracking-[0.06em] ${t.cls}`}>
          {verdict}
        </span>
        {source && (
          <span className="font-mono text-[8.5px] text-faint" title={source}>
            {source.replace(/^https?:\/\//, "").slice(0, 28)}
          </span>
        )}
      </span>
    </li>
  );
}

function EvidenceAccordion({ items }: { items: LangValue[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint">evidence · the scraped sentence</p>
      <ul className="m-0 mt-1.5 list-none space-y-1 p-0">
        {items.map((it, i) => {
          if (!isElement(it)) return null;
          const claim = asStr(it._args[0]);
          const excerpt = asStr(it._args[1]);
          const sourceUrl = it._args[2] == null ? null : asStr(it._args[2]);
          const isOpen = open === i;
          return (
            <li key={i} className="rounded-lg bg-page px-3 py-2" style={{ boxShadow: "inset 0 0 0 1px #fff, 0 0 0 1px rgba(0,0,0,0.06)" }}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-2 text-left"
              >
                <span className="min-w-0 flex-1 truncate text-[11.5px] text-ink-2">{claim}</span>
                <span className="font-mono text-[9px] text-faint">{isOpen ? "▾" : "▸"}</span>
              </button>
              {isOpen && (
                <div className="mt-1.5 blur-up">
                  <p className="text-[11.5px] italic leading-snug text-ink">{excerpt}</p>
                  <p className="mt-1 font-mono text-[9px]">
                    {sourceUrl ? (
                      <span className="text-good">{sourceUrl.replace(/^https?:\/\//, "")}</span>
                    ) : (
                      <span className="text-bad">NO SOURCE FOUND</span>
                    )}
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function EvidenceItem({ claim, excerpt, sourceUrl }: { claim: string; excerpt: string; sourceUrl: string | null }) {
  return (
    <div className="rounded-lg bg-page px-3 py-2" style={{ boxShadow: "inset 0 0 0 1px #fff, 0 0 0 1px rgba(0,0,0,0.06)" }}>
      <p className="text-[11.5px] text-ink-2">{claim}</p>
      <p className="mt-1 text-[11.5px] italic leading-snug text-ink">{excerpt}</p>
      <p className="mt-1 font-mono text-[9px]">
        {sourceUrl ? (
          <span className="text-good">{sourceUrl.replace(/^https?:\/\//, "")}</span>
        ) : (
          <span className="text-bad">NO SOURCE FOUND</span>
        )}
      </p>
    </div>
  );
}

function TrajectoryChart({ points }: { points: LangValue[] }) {
  const pts = points
    .map((p) => (p && typeof p === "object" && !Array.isArray(p) ? p : null))
    .filter(Boolean)
    .map((p) => ({ generation: asNum((p as Record<string, LangValue>).generation), grounding: asNum((p as Record<string, LangValue>).grounding) }));
  if (pts.length === 0) return null;
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint">grounding trajectory</p>
      <div className="mt-1.5 flex items-end gap-3">
        {pts.map((p) => {
          const ok = p.grounding >= 0.7;
          return (
            <div key={p.generation} className="flex flex-col items-center gap-1">
              <span className={`font-numeral text-[12px] ${ok ? "text-good" : "text-bad"}`}>
                {p.grounding.toFixed(2)}
              </span>
              <span className="bar-track block h-[46px] w-[10px]" style={{ borderRadius: 4 }}>
                <span
                  className={`bar-fill block ${ok ? "text-good" : "text-bad"}`}
                  style={{ width: "100%", height: `${Math.round(p.grounding * 100)}%`, borderRadius: 4 }}
                />
              </span>
              <span className="font-numeral text-[8px] text-faint">g{p.generation}</span>
            </div>
          );
        })}
        <span className="mb-4 font-mono text-[9px] text-mute">→ climbs past the .70 emit line</span>
      </div>
    </div>
  );
}

function GateBlock({
  label,
  action,
  summary,
  onAction,
  approved,
}: {
  label: string;
  action: string;
  summary: string;
  onAction?: (action: string) => void;
  approved?: boolean;
}) {
  return (
    <div className="rounded-xl bg-white p-3" style={{ boxShadow: "inset 0 0 0 1px #fff, 0 0 0 1px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)" }}>
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint">human gate · {action}</p>
      <p className="mt-1 text-[12px] text-ink-2">{summary}</p>
      {approved ? (
        <span className="gate-stamp mt-2 inline-block px-3 py-1 font-mono text-[12px] font-medium uppercase tracking-[0.18em]">
          approved
        </span>
      ) : (
        <button
          type="button"
          onClick={() => onAction?.(action)}
          className="btn-crunch crunch-dark mt-2 rounded-lg bg-ink px-4 py-2 font-mono text-[11px] font-medium text-page"
        >
          {label}
        </button>
      )}
    </div>
  );
}

function StorySlides({ slides }: { slides: LangValue[] }) {
  const items = slides.filter(isElement);
  const [active, setActive] = useState(0);
  if (items.length === 0) return null;
  const cur = items[Math.min(active, items.length - 1)];
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint">story · 5-beat customer-as-hero</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            className={`rounded-md px-2 py-1 font-mono text-[9px] transition-colors ${
              i === active ? "bg-page text-ink pill-emboss" : "text-faint hover:text-ink-2"
            }`}
          >
            {i + 1}. {asStr(s._args[0])}
          </button>
        ))}
      </div>
      <div key={active} className="blur-up mt-2 rounded-lg bg-page px-3 py-2.5" style={{ boxShadow: "inset 0 0 0 1px #fff, 0 0 0 1px rgba(0,0,0,0.06)" }}>
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-mute">{asStr(cur._args[0])}</p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink">{asStr(cur._args[1])}</p>
      </div>
    </div>
  );
}

function StorySlide({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg bg-page px-3 py-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-mute">{title}</p>
      <p className="mt-1 text-[12.5px] leading-relaxed text-ink">{body}</p>
    </div>
  );
}

/* ——— the fallback: synthesize the SAME tree from the live StoryRun ———
   Real run data only. Used when the render node hasn't emitted openuiLang yet —
   honestly labeled by the panel ("derived from StoryRun · render node pending"). */
function el(component: string, ...args: LangValue[]): ElementNode {
  return { _component: component, _args: args };
}

export function treeFromRun(run: StoryRun): ElementNode {
  const brief = run.brief;
  const company = brief?.name ?? run.url;
  // every claim the Critic EVER flagged renders FABRICATED (OPENUI rule §6)
  const flagged = new Set<string>();
  for (const g of run.generations) for (const c of g.fabricatedClaims) flagged.add(c);
  for (const c of run.score?.fabricatedClaims ?? []) flagged.add(c);

  const claimRows: ElementNode[] = [];
  for (const c of flagged) claimRows.push(el("ClaimRow", c, "FABRICATED"));
  // grounded rows = the scraped signals that survived (real source-backed claims)
  for (const s of (brief?.signals ?? []).slice(0, 5)) {
    claimRows.push(el("ClaimRow", s.detail, "GROUNDED", s.source_url || s.source));
  }

  const evidence: ElementNode[] = [];
  for (const c of flagged) evidence.push(el("EvidenceItem", c, "NO SOURCE FOUND in the scraped corpus — Critic flagged FABRICATED.", null));
  for (const s of (brief?.signals ?? []).slice(0, 5)) {
    evidence.push(el("EvidenceItem", s.detail, s.detail, s.source_url || null));
  }

  const points: LangValue[] = run.generations.map((g) => ({
    generation: g.generation,
    grounding: g.score.grounding,
  }));

  const finalG = run.score?.grounding ?? run.generations.at(-1)?.score.grounding ?? 0;
  const headline =
    flagged.size > 0
      ? `${flagged.size} fabricated claim${flagged.size > 1 ? "s" : ""} caught and cut`
      : "grounded — every claim traces to a Signal";

  const children: ElementNode[] = [el("ClaimsLedger", claimRows)];
  if (evidence.length) children.push(el("EvidenceAccordion", evidence));
  if (points.length) children.push(el("TrajectoryChart", points));
  if (run.story) {
    children.push(
      el("StorySlides", [
        el("StorySlide", "the grounded story", run.story),
      ]),
    );
  }
  children.push(
    el("GateBlock", "Approve story", "approve_story", `Grounding ${finalG.toFixed(2)} — ready for human review`),
  );

  return el("Receipt", company, headline, children);
}
