"use client";

/**
 * HelloBar — ONE search bar (docs/DEMO-FEEL.md item 1). Typing autocompletes
 * against a HARDCODED catalog ("real estate" → the off-market team, "marketing"
 * → the experiential agency, "lindy"/"ai" → Lindy). Selecting an entry sets
 * EVERYTHING — lens + fixture/replay handle — invisibly. No tabs, no sub-chips.
 * Johnny | Photon chips switch ONLY a general positioning blurb (item 2).
 * Verdicts stay real: this component only chooses WHO to run, never WHAT the
 * judge says.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { RunRequest } from "@/lib/ws";

export interface CatalogFind {
  chip: string;
  text: string;
  url: string;
}

export interface CatalogEntry {
  id: string;
  /** what lands in the bar when picked */
  label: string;
  /** the quiet category line in the dropdown */
  sub: string;
  keywords: string[];
  industry: "gtm" | "realestate" | "marketing";
  /** live handle (fixture:// or URL) */
  handle: string;
  /** cached-tape handle — research mode replays this (only where a tape exists) */
  replayHandle?: string;
  /** who you end up talking to (decorates the person step) */
  person?: string;
  domain?: string;
  /** staged web-artifact finds — decoration for the gather step (item 4) */
  finds: CatalogFind[];
}

/* ——— THE HARDCODED CATALOG (Johnny-editable) ——— */
export const CATALOG: CatalogEntry[] = [
  {
    id: "re",
    label: "Off-market acquisitions team — LA",
    sub: "real estate",
    keywords: [
      "real estate", "realestate", "re", "off-market", "offmarket",
      "offmarket team", "off-market team", "acquisitions", "carlos", "la",
      "off", "distressed",
    ],
    industry: "realestate",
    handle: "fixture://re-1-offmarket-team",
    replayHandle: "fixture://re-1-offmarket-team",
    person: "Carlos — founder, runs the buy side",
    domain: "los angeles · county records",
    finds: [
      { chip: "county", text: "reading 4 county records…", url: "assessor.lacounty.gov" },
      { chip: "title", text: "found: title-transfer history — 3 parcels moved since ’21", url: "titlepoint.com/transfers" },
      { chip: "linkedin", text: "found: the team — founder-led, 2–5 people", url: "linkedin.com/company" },
      { chip: "maps", text: "walking their LA buy-box, block by block…", url: "maps.google.com/@34.05,-118.24" },
      { chip: "web", text: "skimming LA off-market chatter…", url: "biggerpockets.com/forums/la" },
    ],
  },
  {
    id: "mk",
    label: "Experiential agency",
    sub: "marketing",
    keywords: ["marketing", "agency", "experiential", "events", "brand", "nve"],
    industry: "marketing",
    handle: "fixture://mk-1-experiential-agency",
    person: "the founder — the face of every pitch",
    domain: "experiencenve.com",
    finds: [
      { chip: "web", text: "found: their pricing page", url: "experiencenve.com/pricing" },
      { chip: "instagram", text: "scrolling the last 12 campaign reels…", url: "instagram.com/agency" },
      { chip: "web", text: "found: case studies — 8 flagship events", url: "experiencenve.com/work" },
      { chip: "linkedin", text: "found: growth is referral-led, founder-fronted", url: "linkedin.com/company" },
      { chip: "news", text: "skimming trade-press mentions…", url: "adweek.com/agencies" },
    ],
  },
  {
    id: "lindy",
    label: "Lindy · AI startup",
    sub: "ai startup",
    keywords: ["lindy", "ai", "lindy.ai", "startup", "agents"],
    industry: "gtm",
    handle: "https://lindy.ai",
    person: "the founding team",
    domain: "lindy.ai",
    finds: [
      { chip: "web", text: "found: their pricing page", url: "lindy.ai/pricing" },
      { chip: "github", text: "reading the public repos…", url: "github.com/lindyai" },
      { chip: "docs", text: "found: agent templates — 100+ integrations", url: "docs.lindy.ai" },
      { chip: "web", text: "found: the changelog — shipping weekly", url: "lindy.ai/changelog" },
      { chip: "news", text: "skimming launch coverage…", url: "techcrunch.com" },
    ],
  },
];

/* free-typed targets still get a believable gather */
export const GENERIC_FINDS: CatalogFind[] = [
  { chip: "web", text: "reading their homepage…", url: "their site" },
  { chip: "web", text: "found: their pricing page", url: "…/pricing" },
  { chip: "linkedin", text: "found: the team page", url: "linkedin.com/company" },
  { chip: "news", text: "skimming recent coverage…", url: "news.google.com" },
];

/* ——— item 2: ONE general positioning blurb per chip — nothing per-industry ——— */
const SELLERS: Array<{ id: "johnny" | "photon"; label: string; blurb: string }> = [
  {
    id: "johnny",
    label: "Johnny",
    blurb:
      "Johnny Sheng — independent AI-automations marketer, SF. I turn your raw lead data into proven stories about who's actually ready — every line traced to a real record. The AI never closes; you make the pitch.",
  },
  {
    id: "photon",
    label: "Photon",
    blurb:
      "Photon — open-source iMessage infrastructure for AI agents. imessage-kit: ~2,300 GitHub stars, 20K+ developers. Ditto: 42,000+ users, 99.87% delivery. We sell the channel agents' users actually open.",
  },
];

function matchCatalog(q: string): CatalogEntry[] {
  const n = q.trim().toLowerCase();
  if (!n) return CATALOG;
  return CATALOG.filter(
    (e) =>
      e.label.toLowerCase().includes(n) ||
      e.sub.includes(n) ||
      e.keywords.some((k) => k.includes(n) || n.includes(k)),
  );
}

export default function HelloBar({
  busy,
  research,
  onRun,
  onPick,
}: {
  busy: boolean;
  research: boolean;
  onRun: (input: RunRequest) => void;
  onPick: (entry: CatalogEntry | null) => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const [selected, setSelected] = useState<CatalogEntry | null>(null);
  const [seller, setSeller] = useState<"johnny" | "photon">("johnny");
  const [miss, setMiss] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => matchCatalog(q), [q]);
  const blurb = SELLERS.find((s) => s.id === seller)!.blurb;

  /* click-away closes the dropdown */
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = (entry: CatalogEntry) => {
    setSelected(entry);
    setQ(entry.label);
    setOpen(false);
    setMiss(null);
    onPick(entry);
  };

  const fire = () => {
    if (busy || !q.trim()) return;
    /* the typed text resolves to a catalog entry — picked, or the top match */
    const entry =
      selected && q.trim() === selected.label ? selected : (matchCatalog(q)[0] ?? null);
    if (entry && entry !== selected) {
      setSelected(entry);
      setQ(entry.label);
      onPick(entry);
    }

    if (research) {
      if (!entry?.replayHandle) {
        setMiss(q.trim());
        return;
      }
      setMiss(null);
      onRun({ industry: entry.industry, handle: entry.replayHandle, mode: "replay" });
      return;
    }

    setMiss(null);
    if (entry) {
      onRun({
        industry: entry.industry,
        handle: entry.handle,
        mode: "live",
        positioning: blurb,
      });
    } else {
      onPick(null);
      onRun({ industry: "gtm", handle: q.trim(), mode: "live", positioning: blurb });
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHi((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && suggestions[hi]) pick(suggestions[hi]);
      else fire();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="w-full max-w-[640px]">
      {/* THE bar */}
      <div ref={wrapRef} className="relative">
        <div className="ring-card flex items-stretch gap-2 rounded-2xl bg-raised p-2">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSelected(null);
              setOpen(true);
              setHi(0);
              if (miss) setMiss(null);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKey}
            placeholder="say hello to who? try “real estate”, “marketing”, “lindy”…"
            autoComplete="off"
            spellCheck={false}
            data-testid="hello-input"
            className="min-w-0 flex-1 rounded-xl bg-white px-4 py-3 text-[14px] text-ink placeholder:text-faint"
            style={{
              boxShadow: research
                ? "inset 0 0 0 1px #fff, 0 0 0 1px color-mix(in srgb, var(--ocean) 45%, transparent), inset 0 1px 2px rgba(32,32,32,0.04)"
                : "inset 0 0 0 1px #fff, 0 0 0 1px rgba(0,0,0,0.08), inset 0 1px 2px rgba(32,32,32,0.04)",
            }}
          />
          <button
            type="button"
            onClick={fire}
            disabled={busy || !q.trim()}
            data-testid="run-button"
            className="btn-crunch crunch-dark whitespace-nowrap rounded-xl bg-ink px-5 font-mono text-[12px] font-medium text-page disabled:opacity-50"
          >
            {busy ? "saying hello…" : "say hello →"}
          </button>
        </div>

        {/* the autofill dropdown — the hardcoded catalog */}
        {open && suggestions.length > 0 && (
          <ul
            data-testid="hello-suggestions"
            className="ring-float absolute left-0 right-0 top-[calc(100%+6px)] z-30 m-0 list-none overflow-hidden rounded-xl bg-white p-1.5"
          >
            {suggestions.map((e, i) => (
              <li key={e.id}>
                <button
                  type="button"
                  data-testid={`suggest-${e.id}`}
                  onMouseEnter={() => setHi(i)}
                  onClick={() => pick(e)}
                  className={`flex w-full items-baseline justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    i === hi ? "bg-page" : ""
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] text-ink">{e.label}</span>
                    {e.domain && (
                      <span className="block truncate font-mono text-[9.5px] text-faint">
                        {e.domain}
                      </span>
                    )}
                  </span>
                  <span className="pill-emboss flex-none rounded-full bg-page px-2 py-[2px] font-mono text-[9px] text-ink-2">
                    {e.sub}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* item 2 — whose hello this is: ONE general blurb each */}
      <div className="mt-3 flex items-start gap-3 px-1">
        <div
          role="group"
          aria-label="who's saying hello"
          className="key-bevel flex flex-none items-center rounded-lg bg-page p-0.5 font-mono text-[11px]"
        >
          {SELLERS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSeller(s.id)}
              data-testid={`seller-${s.id}`}
              aria-pressed={seller === s.id}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                seller === s.id ? "bg-raised text-ink pill-emboss" : "text-faint"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p
          key={seller}
          data-testid="positioning-blurb"
          className="blur-up m-0 flex-1 text-[11.5px] leading-relaxed text-mute"
        >
          {blurb}
        </p>
      </div>

      {research && (
        <p
          className="mt-2 px-1 font-mono text-[9.5px]"
          style={{ color: miss ? "var(--bad)" : "var(--ocean)" }}
        >
          {miss
            ? `✕ no saved run for “${miss}” — try the real-estate team`
            : "● research — replays a saved real run, instantly (labeled replay)."}
        </p>
      )}
    </div>
  );
}
