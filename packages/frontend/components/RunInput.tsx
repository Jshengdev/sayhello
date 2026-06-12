"use client";

/**
 * RunInput — the crystal input: {industry, handle} (docs/DECISIONS.md §2).
 * gtm is live; realestate/marketing are selectable but marked "lens stubbed"
 * (no silent stubs — the stub is named on screen).
 */

import { useState } from "react";
import type { RunInput as RunInputType } from "@/lib/types";

const INDUSTRIES: Array<{
  value: RunInputType["industry"];
  label: string;
  live: boolean;
  placeholder: string;
}> = [
  { value: "gtm", label: "gtm — SF SaaS outreach", live: true, placeholder: "https://acme.com — the company URL" },
  { value: "realestate", label: "real estate (lens stubbed)", live: false, placeholder: "property address or owner name" },
  { value: "marketing", label: "marketing (lens stubbed)", live: false, placeholder: "https://brand.com — the brand URL" },
];

export default function RunInput({
  busy,
  onRun,
}: {
  busy: boolean;
  onRun: (input: RunInputType) => void;
}) {
  const [industry, setIndustry] = useState<RunInputType["industry"]>("gtm");
  const [handle, setHandle] = useState("");
  const lens = INDUSTRIES.find((i) => i.value === industry)!;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim() || busy) return;
    onRun({ industry, handle: handle.trim() });
  };

  return (
    <form onSubmit={submit} aria-label="Run a lead" className="ring-card rounded-2xl bg-raised p-3">
      <div className="flex flex-wrap items-stretch gap-2.5">
        <label className="sr-only" htmlFor="industry">industry lens</label>
        <select
          id="industry"
          value={industry}
          onChange={(e) => setIndustry(e.target.value as RunInputType["industry"])}
          className="key-bevel rounded-lg bg-page px-3 py-2.5 font-mono text-[11.5px] text-ink-2"
        >
          {INDUSTRIES.map((i) => (
            <option key={i.value} value={i.value}>
              {i.label}
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

        <button
          type="submit"
          disabled={busy || !handle.trim()}
          data-testid="run-button"
          className="btn-crunch crunch-dark rounded-lg bg-ink px-5 py-2.5 font-mono text-[12px] font-medium text-page disabled:opacity-50"
        >
          {busy ? "running…" : "say hello →"}
        </button>
      </div>
      {!lens.live && (
        <p className="mt-2 px-1 font-mono text-[9.5px] text-warn">
          [stub] the {industry} lens pack is stubbed — gtm is the live lens today
        </p>
      )}
    </form>
  );
}
