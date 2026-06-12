"use client";

/**
 * RunInput — the V2 run console. Crystal input stays {industry, handle}
 * (docs/CONTRACTS.md) plus optional person-scrape targets (LinkedIn / X), a
 * positioning textarea prefilled from the lens sellerIdentity (Johnny tunes it),
 * and a LIVE/REPLAY mode toggle (REPLAY = cached real, snappy — labeled visibly).
 * Extra fields ride the same POST body; the backend consumes them when present.
 */

import { useState } from "react";
import type { RunInput as RunInputType } from "@/lib/types";
import type { RunMode, RunRequest } from "@/lib/ws";

type Industry = RunInputType["industry"];

/* lens copy — sellerIdentity prefill (VERBATIM from docs/LENSES-CONTENT.md;
   Johnny-editable). Selecting a lens prefills the positioning textarea. */
const LENSES: Array<{
  value: Industry;
  label: string;
  seller: string;
  positioning: string;
  placeholder: string;
}> = [
  {
    value: "gtm",
    label: "gtm — seller = Photon",
    seller: "Photon",
    positioning:
      "Photon — open-source iMessage infrastructure for AI agents. imessage-kit: ~2,300 GitHub stars, 20K+ developers. Ditto: 42,000+ users across 5 campuses, 99.87% delivery. We sell the channel agents' users actually open.",
    placeholder: "https://lindy.ai — the company URL",
  },
  {
    value: "realestate",
    label: "real estate — seller = Johnny",
    seller: "Johnny Sheng",
    positioning:
      "Johnny Sheng — independent AI-automations marketer, SF. I build the patty: I turn a team's raw lead data into grounded stories of who's actually likely to sell, every claim traced to a real record. The AI never closes — the human makes the pitch.",
    placeholder: "off-market acquisitions team — name or handle",
  },
  {
    value: "marketing",
    label: "marketing — seller = Johnny",
    seller: "Johnny Sheng",
    positioning:
      "Johnny Sheng — same seller, different pain. Agencies grow on referrals and the founder's face — they fail the coma test. My offer: the signal-driven pipeline as a durable system, not automation slop rebuilt every two months. LinkedIn ~40% reply vs cold email 2%.",
    placeholder: "https://agency.com — the brand URL",
  },
];

export default function RunInput({
  busy,
  onRun,
}: {
  busy: boolean;
  onRun: (input: RunRequest) => void;
}) {
  const [industry, setIndustry] = useState<Industry>("gtm");
  const [handle, setHandle] = useState("");
  const [mode, setMode] = useState<RunMode>("live");
  const [showPerson, setShowPerson] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [xHandle, setXHandle] = useState("");
  const [positioning, setPositioning] = useState(LENSES[0].positioning);
  const [touchedPositioning, setTouchedPositioning] = useState(false);
  const lens = LENSES.find((l) => l.value === industry)!;

  const selectLens = (next: Industry) => {
    setIndustry(next);
    // re-prefill the positioning unless the human has edited it
    if (!touchedPositioning) {
      setPositioning(LENSES.find((l) => l.value === next)!.positioning);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim() || busy) return;
    onRun({
      industry,
      handle: handle.trim(),
      mode,
      positioning: positioning.trim() || undefined,
      linkedinUrl: linkedinUrl.trim() || undefined,
      xHandle: xHandle.trim() || undefined,
    });
  };

  return (
    <form onSubmit={submit} aria-label="Run a lead" className="ring-card rounded-2xl bg-raised p-3.5">
      {/* row 1 — lens · handle · run */}
      <div className="flex flex-wrap items-stretch gap-2.5">
        <label className="sr-only" htmlFor="industry">industry lens</label>
        <select
          id="industry"
          value={industry}
          onChange={(e) => selectLens(e.target.value as Industry)}
          className="key-bevel rounded-lg bg-page px-3 py-2.5 font-mono text-[11.5px] text-ink-2"
        >
          {LENSES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="handle">lead handle</label>
        <input
          id="handle"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder={lens.placeholder}
          autoComplete="off"
          spellCheck={false}
          data-testid="handle-input"
          className="min-w-[220px] flex-1 rounded-lg bg-white px-3.5 py-2.5 text-[13.5px] text-ink placeholder:text-faint"
          style={{
            boxShadow:
              "inset 0 0 0 1px #fff, 0 0 0 1px rgba(0,0,0,0.08), inset 0 1px 2px rgba(32,32,32,0.04)",
          }}
        />

        {/* LIVE / REPLAY toggle */}
        <div
          role="group"
          aria-label="run mode"
          className="key-bevel flex items-center rounded-lg bg-page p-0.5 font-mono text-[10.5px]"
        >
          {(["live", "replay"] as RunMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              data-testid={`mode-${m}`}
              aria-pressed={mode === m}
              className={`rounded-md px-2.5 py-2 uppercase tracking-[0.08em] transition-colors ${
                mode === m
                  ? m === "replay"
                    ? "bg-raised text-warn pill-emboss"
                    : "bg-raised text-good pill-emboss"
                  : "text-faint"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={busy || !handle.trim()}
          data-testid="run-button"
          className="btn-crunch crunch-dark rounded-lg bg-ink px-5 py-2.5 font-mono text-[12px] font-medium text-page disabled:opacity-50"
        >
          {busy ? "running…" : "say hello →"}
        </button>
      </div>

      {/* row 2 — positioning (seller voice) prefilled from the lens */}
      <div className="mt-2.5">
        <label
          htmlFor="positioning"
          className="flex items-baseline justify-between px-1 font-mono text-[9px] uppercase tracking-[0.12em] text-faint"
        >
          <span>your positioning · seller = {lens.seller}</span>
          <span className="text-faint">grounds the outreach angle (beat 4)</span>
        </label>
        <textarea
          id="positioning"
          value={positioning}
          onChange={(e) => {
            setPositioning(e.target.value);
            setTouchedPositioning(true);
          }}
          rows={2}
          spellCheck={false}
          data-testid="positioning-input"
          className="mt-1 w-full resize-none rounded-lg bg-page px-3 py-2 text-[12px] leading-relaxed text-ink-2"
          style={{
            boxShadow:
              "inset 0 0 0 1px #fff, 0 0 0 1px rgba(0,0,0,0.07), inset 0 1px 2px rgba(32,32,32,0.04)",
          }}
        />
      </div>

      {/* row 3 — optional person-scrape targets (HeyReach + X) */}
      <div className="mt-2">
        <button
          type="button"
          onClick={() => setShowPerson((s) => !s)}
          className="px-1 font-mono text-[9.5px] text-mute hover:text-ink-2"
        >
          {showPerson ? "▾" : "▸"} person scrape · optional ·{" "}
          <span className="text-faint">HeyReach LinkedIn · X timeline · SixtyFour</span>
        </button>
        {showPerson && (
          <div className="mt-1.5 flex flex-wrap gap-2.5">
            <input
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="linkedin.com/in/… (HeyReach verifier)"
              autoComplete="off"
              spellCheck={false}
              data-testid="linkedin-input"
              className="min-w-[200px] flex-1 rounded-lg bg-page px-3 py-2 font-mono text-[11px] text-ink-2 placeholder:text-faint"
              style={{ boxShadow: "inset 0 0 0 1px #fff, 0 0 0 1px rgba(0,0,0,0.07)" }}
            />
            <input
              value={xHandle}
              onChange={(e) => setXHandle(e.target.value)}
              placeholder="@handle (X timeline, 30d)"
              autoComplete="off"
              spellCheck={false}
              data-testid="x-input"
              className="min-w-[140px] flex-1 rounded-lg bg-page px-3 py-2 font-mono text-[11px] text-ink-2 placeholder:text-faint"
              style={{ boxShadow: "inset 0 0 0 1px #fff, 0 0 0 1px rgba(0,0,0,0.07)" }}
            />
          </div>
        )}
      </div>

      {mode === "replay" && (
        <p className="mt-2 px-1 font-mono text-[9.5px] text-warn">
          ◧ REPLAY — this run streams the cached real result (snappy, demo-safe). Switch to LIVE to hit the APIs.
        </p>
      )}
    </form>
  );
}
