"use client";

/**
 * /recall — the Airbyte recall PANEL (worktree feat/airbyte-recall). A SEPARATE route so it never
 * alters the main dashboard layout (docs/AIRBYTE-RECALL.md scope guardrail). Cofounder paper-light
 * detail-card style (docs/DESIGN.md): no borders, depth from light rings, Onest + Plex Mono, one
 * accent (--live) only on the live tier.
 *
 * Ask in plain language ("which real-estate leads have we storied?", "what pains recur for marketing
 * agencies?", "have we touched this person?"). Each result is a grounded-story detail card: the lead,
 * the angle, the key grounded fact, the fabricated/rejected claim, a link to the Notion page.
 *
 * The panel is honest about WHICH memory tier answered (Airbyte Context Store / Notion direct / local
 * grounded corpus) — never a silent stub.
 */

import Link from "next/link";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

interface StoryRecord {
  id: string;
  lead: string;
  person: string | null;
  industry: string;
  category: string | null;
  pains: string[];
  angle: string | null;
  groundingScore: number | null;
  verdict: string | null;
  keyFact: string;
  groundedClaims: string[];
  fabricatedClaims: string[];
  source: string;
  sourceFile: string;
  notionUrl: string | null;
}
interface RecallResult {
  rec: StoryRecord;
  relevance: number;
}
interface RecallResponse {
  query: string;
  via: "airbyte-context-store" | "notion-direct" | "offline-cache" | "cache-replay";
  note: string;
  count: number;
  results: RecallResult[];
  trail: string[];
}
interface RecallStatus {
  airbyte: boolean;
  notion: boolean;
  notionDatabase: boolean;
  offline: boolean;
}

const SUGGESTIONS = [
  "which real-estate leads have we storied?",
  "what pains recur for marketing agencies?",
  "have we touched Lindy?",
  "which angles have we used?",
];

const VIA_LABEL: Record<RecallResponse["via"], { label: string; live: boolean }> = {
  "airbyte-context-store": { label: "Airbyte Context Store", live: true },
  "notion-direct": { label: "Notion · direct", live: true },
  "offline-cache": { label: "local grounded corpus", live: false },
  "cache-replay": { label: "cached replay", live: false },
};

export default function RecallPage() {
  const [q, setQ] = useState("");
  const [resp, setResp] = useState<RecallResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<RecallStatus | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/recall/status`)
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => setStatus(s))
      .catch(() => setStatus(null));
  }, []);

  const runQuery = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API_URL}/recall?q=${encodeURIComponent(trimmed)}`);
      const body = await r.json();
      if (!r.ok) throw new Error(body?.error ?? `recall failed (${r.status})`);
      setResp(body as RecallResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setResp(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-page">
      <div className="mx-auto flex max-w-[920px] flex-col gap-4 px-5 py-6">
        {/* masthead */}
        <header className="flex flex-wrap items-baseline justify-between gap-2 px-1">
          <div className="flex items-baseline gap-3">
            <h1 className="text-[22px] text-ink" style={{ fontWeight: 480 }}>
              recall
            </h1>
            <p className="text-[12.5px] text-mute">every story becomes memory you can ask later.</p>
          </div>
          <Link
            href="/"
            className="font-mono text-[10.5px] text-mute underline-offset-2 hover:text-ink-2 hover:underline"
          >
            ← back to the harness
          </Link>
        </header>

        {/* tier status — honest provenance of the memory layer */}
        <TierStatus status={status} />

        {/* the query console */}
        <section className="ring-card rounded-2xl bg-raised p-3.5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void runQuery(q);
            }}
            className="flex flex-wrap items-stretch gap-2.5"
          >
            <label className="sr-only" htmlFor="recall-q">
              recall query
            </label>
            <input
              id="recall-q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ask the GTM memory in plain language…"
              autoComplete="off"
              spellCheck={false}
              data-testid="recall-input"
              className="min-w-[260px] flex-1 rounded-lg bg-white px-3.5 py-2.5 text-[13.5px] text-ink placeholder:text-faint"
              style={{
                boxShadow:
                  "inset 0 0 0 1px #fff, 0 0 0 1px rgba(0,0,0,0.08), inset 0 1px 2px rgba(32,32,32,0.04)",
              }}
            />
            <button
              type="submit"
              disabled={loading || !q.trim()}
              data-testid="recall-button"
              className="btn-crunch crunch-dark rounded-lg bg-ink px-5 py-2.5 font-mono text-[12px] font-medium text-page disabled:opacity-50"
            >
              {loading ? "recalling…" : "recall →"}
            </button>
          </form>

          {/* suggested plain-language queries */}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setQ(s);
                  void runQuery(s);
                }}
                className="pill-emboss rounded-full bg-page px-2.5 py-1 font-mono text-[10px] text-mute hover:text-ink-2"
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {/* fail loud */}
        {error && (
          <div
            role="alert"
            className="ring-card rounded-xl bg-raised px-4 py-3 font-mono text-[11.5px] text-warn"
            data-testid="recall-error"
          >
            recall failed — {error}
          </div>
        )}

        {/* the answer */}
        {resp && <Answer resp={resp} />}

        {!resp && !error && (
          <p className="dotted-canvas board-recess rounded-xl px-4 py-8 text-center font-mono text-[11px] text-faint">
            ask a question — recall sweeps every grounded story sayhello has built.
          </p>
        )}

        <footer className="px-1 pb-2">
          <p className="font-mono text-[9.5px] leading-relaxed text-faint">
            memory tiers: Airbyte Agent Engine · context_store_search → Notion connector → the
            &quot;sayhello stories&quot; DB → grounded story records. local grounded corpus is the
            always-on demo-safe floor.
          </p>
        </footer>
      </div>
    </main>
  );
}

function TierStatus({ status }: { status: RecallStatus | null }) {
  const dot = (on: boolean) => (on ? "text-good" : "text-faint");
  return (
    <section
      aria-label="Memory tiers"
      className="ring-panel flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-2xl bg-raised px-4 py-2.5"
    >
      <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-mute">memory tiers</span>
      {[
        { k: "Airbyte Context Store", on: !!status?.airbyte },
        { k: "Notion DB", on: !!status?.notionDatabase },
        { k: "local corpus", on: status ? status.offline : true },
      ].map((t) => (
        <span key={t.k} className="flex items-center gap-1.5 font-mono text-[10.5px] text-ink-2">
          <span aria-hidden className={`dot-glow h-2 w-2 rounded-full bg-current ${dot(t.on)}`} />
          {t.k}
          <span className="text-faint">{t.on ? "ready" : "—"}</span>
        </span>
      ))}
    </section>
  );
}

function Answer({ resp }: { resp: RecallResponse }) {
  const via = VIA_LABEL[resp.via];
  return (
    <section aria-label="Recall results" className="flex flex-col gap-3">
      {/* provenance line — which tier answered */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <p className="font-mono text-[10.5px] text-mute">
          <span className="font-numeral text-ink-2">{resp.count}</span> grounded{" "}
          {resp.count === 1 ? "story" : "stories"} recalled
        </p>
        <span
          className={`pill-emboss rounded-full bg-page px-2.5 py-[3px] font-mono text-[9px] uppercase tracking-[0.1em] ${
            via.live ? "text-live" : "text-warn"
          }`}
          title={resp.note}
        >
          {via.live ? "◉ live" : "◧ replay"} · via {via.label}
        </span>
      </div>

      {resp.count === 0 ? (
        <p className="dotted-canvas board-recess rounded-xl px-4 py-6 text-center font-mono text-[11px] text-faint">
          no grounded story matches that yet — try a broader query, or seed more stories into the
          memory.
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {resp.results.map((r) => (
            <RecordCard key={r.rec.id} rec={r.rec} />
          ))}
        </ul>
      )}
    </section>
  );
}

function RecordCard({ rec }: { rec: StoryRecord }) {
  return (
    <li className="ring-panel rounded-2xl bg-raised p-5">
      {/* header — lead · industry · angle */}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex flex-wrap items-baseline gap-2.5">
          <h2 className="text-[15.5px] text-ink" style={{ fontWeight: 450 }}>
            {rec.lead}
          </h2>
          <span className="pill-emboss rounded-full bg-page px-2 py-[2px] font-mono text-[9px] uppercase tracking-[0.06em] text-ink-2">
            {rec.industry}
          </span>
          {rec.person && (
            <span className="font-mono text-[10px] text-mute">person · {rec.person}</span>
          )}
        </div>
        {rec.angle && (
          <span className="pill-emboss rounded-full bg-page px-2.5 py-[2px] font-mono text-[10px] text-live">
            angle · {rec.angle}
          </span>
        )}
      </div>

      {/* the key grounded fact */}
      <div className="board-recess mt-3 rounded-xl bg-white px-3.5 py-3">
        <p className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-faint">key grounded fact</p>
        <p className="mt-1 text-[13px] leading-snug text-ink">{rec.keyFact}</p>
      </div>

      {/* the verdict line — grounding score + the fabricated/rejected claim (the money shot) */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-faint">
            held-out grounding
          </p>
          <p className="mt-1 font-mono text-[11.5px] text-ink-2">
            {rec.groundingScore === null ? (
              <span className="text-faint">pre-judge fixture · not yet scored</span>
            ) : (
              <>
                <span className="font-numeral text-ink">{rec.groundingScore.toFixed(2)}</span>
                {rec.verdict && (
                  <span className={rec.verdict === "emit" ? "text-good" : "text-warn"}>
                    {" "}
                    · {rec.verdict}
                  </span>
                )}
              </>
            )}
          </p>
        </div>
        <div>
          <p className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-faint">
            fabricated · rejected claim
          </p>
          {rec.fabricatedClaims.length === 0 ? (
            <p className="mt-1 font-mono text-[11px] text-faint">none flagged</p>
          ) : (
            <ul className="mt-1 list-none space-y-1 p-0">
              {rec.fabricatedClaims.slice(0, 3).map((c, i) => (
                <li key={i} className="font-mono text-[10.5px] leading-snug text-warn">
                  ✕ {c}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* recurring pains (collapsed peek) */}
      {rec.pains.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer font-mono text-[10px] text-mute hover:text-ink-2">
            {rec.pains.length} recurring pain{rec.pains.length === 1 ? "" : "s"}
          </summary>
          <ul className="mt-1.5 list-none space-y-1 p-0">
            {rec.pains.map((p, i) => (
              <li key={i} className="text-[11.5px] leading-snug text-ink-2">
                • {p}
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* footer — source provenance + Notion link */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[9px] text-faint">
        <span>source · {rec.source}</span>
        <span className="text-faint">{rec.sourceFile}</span>
        {rec.notionUrl && (
          <a
            href={rec.notionUrl}
            target="_blank"
            rel="noreferrer"
            className="text-live underline-offset-2 hover:underline"
          >
            open Notion page ↗
          </a>
        )}
      </div>
    </li>
  );
}
