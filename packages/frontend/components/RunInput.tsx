"use client";

/**
 * RunInput — the V2 run console. The contract on the wire stays {industry, handle}
 * (docs/CONTRACTS.md) — but the UI speaks SELLER: a Johnny | Photon segmented
 * control (whose angle you're pitching from). Johnny carries a real estate |
 * marketing sub-chip (default real estate); Photon = gtm. Positioning prefills
 * from the selected lens (VERBATIM docs/LENSES-CONTENT.md; Johnny-editable).
 *
 * RESEARCH MODE (the corner light, page.tsx): the handle input becomes a name
 * field and submit resolves a HARDCODED name → cached-tape map, firing the
 * backend's REPLAY path (POST /story/run {mode:"replay"}) — the run streams the
 * recorded REAL events through the normal UI, honestly labeled
 * "REPLAY · cached real run". Demo insurance; unknown names fail LOUD inline.
 */

import { useState } from "react";
import type { RunInput as RunInputType } from "@/lib/types";
import type { RunRequest } from "@/lib/ws";

type Industry = RunInputType["industry"];
type Seller = "johnny" | "photon";

/* lens copy — positioning prefill (VERBATIM from docs/LENSES-CONTENT.md;
   Johnny-editable). Selecting a seller/lens prefills the positioning textarea. */
const LENSES: Record<
  Industry,
  { positioning: string; placeholder: string }
> = {
  gtm: {
    positioning:
      "Photon — open-source iMessage infrastructure for AI agents. imessage-kit: ~2,300 GitHub stars, 20K+ developers. Ditto: 42,000+ users across 5 campuses, 99.87% delivery. We sell the channel agents' users actually open.",
    placeholder: "https://lindy.ai — the company URL",
  },
  realestate: {
    positioning:
      "Johnny Sheng — independent AI-automations marketer, SF. I build the patty: I turn a team's raw lead data into grounded stories of who's actually likely to sell, every claim traced to a real record. The AI never closes — the human makes the pitch.",
    placeholder: "off-market acquisitions team — name or handle",
  },
  marketing: {
    positioning:
      "Johnny Sheng — same seller, different pain. Agencies grow on referrals and the founder's face — they fail the coma test. My offer: the signal-driven pipeline as a durable system, not automation slop rebuilt every two months. LinkedIn ~40% reply vs cold email 2%.",
    placeholder: "https://agency.com — the brand URL",
  },
};

/* Johnny's sub-lenses (the angle within Johnny) — default real estate */
const JOHNNY_LENSES: Array<{ value: Industry; label: string }> = [
  { value: "realestate", label: "real estate" },
  { value: "marketing", label: "marketing" },
];

/* ——— RESEARCH MODE — hardcoded name → cached-tape map (demo insurance). ———
   Tapes verified COMPLETE in data/replays/ (score_done with non-empty
   fabricatedClaims, then a later gate): the RE fixture run (validated converged
   tape ld_3f6daf26). The backend's findReplay matches handle↔recorded url and
   plays the latest tape. lindy / agency names are SKIPPED — no complete tape
   recorded for them (all end in `failed`). */
const RESEARCH_TAPES: Array<{
  names: string[];
  industry: Industry;
  handle: string;
}> = [
  {
    names: [
      "offmarket team",
      "offmarket",
      "off-market",
      "off-market team",
      "offmarket acquisitions team",
      "carlos",
      "re",
    ],
    industry: "realestate",
    handle: "fixture://re-1-offmarket-team",
  },
];

function resolveTape(name: string) {
  const n = name.trim().toLowerCase();
  if (!n) return null;
  for (const t of RESEARCH_TAPES) {
    if (t.names.includes(n)) return t;
    if (t.names.some((k) => k.length >= 4 && n.includes(k))) return t;
  }
  return null;
}

export default function RunInput({
  busy,
  research,
  onRun,
}: {
  busy: boolean;
  research: boolean;
  onRun: (input: RunRequest) => void;
}) {
  const [seller, setSeller] = useState<Seller>("johnny");
  const [johnnyLens, setJohnnyLens] = useState<Industry>("realestate");
  const [handle, setHandle] = useState("");
  const [showPerson, setShowPerson] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [xHandle, setXHandle] = useState("");
  const [positioning, setPositioning] = useState(LENSES.realestate.positioning);
  const [touchedPositioning, setTouchedPositioning] = useState(false);
  const [researchMiss, setResearchMiss] = useState<string | null>(null);

  const industry: Industry = seller === "photon" ? "gtm" : johnnyLens;
  const lens = LENSES[industry];

  const prefill = (next: Industry) => {
    if (!touchedPositioning) setPositioning(LENSES[next].positioning);
  };
  const selectSeller = (next: Seller) => {
    setSeller(next);
    prefill(next === "photon" ? "gtm" : johnnyLens);
  };
  const selectJohnnyLens = (next: Industry) => {
    setJohnnyLens(next);
    prefill(next);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim() || busy) return;

    /* research mode — map the typed name to a cached real tape, run REPLAY */
    if (research) {
      const tape = resolveTape(handle);
      if (!tape) {
        setResearchMiss(handle.trim());
        return;
      }
      setResearchMiss(null);
      onRun({ industry: tape.industry, handle: tape.handle, mode: "replay" });
      return;
    }

    setResearchMiss(null);
    onRun({
      industry,
      handle: handle.trim(),
      mode: "live",
      positioning: positioning.trim() || undefined,
      linkedinUrl: linkedinUrl.trim() || undefined,
      xHandle: xHandle.trim() || undefined,
    });
  };

  return (
    <form onSubmit={submit} aria-label="Run a lead" className="ring-card rounded-2xl bg-raised p-3.5">
      {/* row 1 — seller chips · handle · run */}
      <div className="flex flex-wrap items-stretch gap-2.5">
        {/* whose angle you're pitching from */}
        <div
          role="group"
          aria-label="seller"
          className="key-bevel flex items-center rounded-lg bg-page p-0.5 font-mono text-[11px]"
        >
          {(
            [
              { value: "johnny", label: "Johnny" },
              { value: "photon", label: "Photon" },
            ] as Array<{ value: Seller; label: string }>
          ).map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => selectSeller(s.value)}
              data-testid={`seller-${s.value}`}
              aria-pressed={seller === s.value}
              className={`rounded-md px-3 py-2 transition-colors ${
                seller === s.value ? "bg-raised text-ink pill-emboss" : "text-faint"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <label className="sr-only" htmlFor="handle">
          {research ? "lead name" : "lead handle"}
        </label>
        <input
          id="handle"
          value={handle}
          onChange={(e) => {
            setHandle(e.target.value);
            if (researchMiss) setResearchMiss(null);
          }}
          placeholder={research ? "type a name…" : lens.placeholder}
          autoComplete="off"
          spellCheck={false}
          data-testid="handle-input"
          className="min-w-[220px] flex-1 rounded-lg bg-white px-3.5 py-2.5 text-[13.5px] text-ink placeholder:text-faint"
          style={{
            boxShadow: research
              ? "inset 0 0 0 1px #fff, 0 0 0 1px color-mix(in srgb, var(--ocean) 45%, transparent), inset 0 1px 2px rgba(32,32,32,0.04)"
              : "inset 0 0 0 1px #fff, 0 0 0 1px rgba(0,0,0,0.08), inset 0 1px 2px rgba(32,32,32,0.04)",
          }}
        />

        <button
          type="submit"
          disabled={busy || !handle.trim()}
          data-testid="run-button"
          className="btn-crunch crunch-dark rounded-lg bg-ink px-5 py-2.5 font-mono text-[12px] font-medium text-page disabled:opacity-50"
        >
          {busy ? "running…" : "say hello →"}
        </button>
      </div>

      {/* row 1b — Johnny's angle (real estate | marketing, default real estate) */}
      {seller === "johnny" && (
        <div
          role="group"
          aria-label="Johnny's angle"
          className="mt-2 flex items-center gap-1.5 px-1"
        >
          {JOHNNY_LENSES.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => selectJohnnyLens(l.value)}
              data-testid={`lens-${l.value}`}
              aria-pressed={johnnyLens === l.value}
              className={`rounded-full px-2.5 py-[3px] font-mono text-[9.5px] tracking-[0.06em] transition-colors ${
                johnnyLens === l.value
                  ? "pill-emboss bg-page text-ink-2"
                  : "text-faint hover:text-mute"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}

      {/* row 2 — positioning (your voice) prefilled from the lens */}
      <div className="mt-2.5">
        <label
          htmlFor="positioning"
          className="flex items-baseline justify-between px-1 font-mono text-[9px] uppercase tracking-[0.12em] text-faint"
        >
          <span>your positioning</span>
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

      {research && (
        <p
          className="mt-2 px-1 font-mono text-[9.5px]"
          style={{ color: researchMiss ? "var(--bad)" : "var(--ocean)" }}
        >
          {researchMiss
            ? `✕ no cached run for “${researchMiss}” — try: offmarket team · carlos · re`
            : "● research — type a name; the run streams a cached REAL result (labeled REPLAY)."}
        </p>
      )}
    </form>
  );
}
