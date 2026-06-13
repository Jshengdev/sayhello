"use client";

/**
 * FailedBadge — fail LOUD (docs/CONSTRAINTS.md #1). Any {type:"failed"} event
 * renders this band: red-inked, names the stage and the error. No silent stubs.
 */

export default function FailedBadge({
  failure,
}: {
  failure: { stage: string; error: string } | null;
}) {
  if (!failure) return null;
  return (
    <div
      role="alert"
      data-testid="failed-badge"
      className="dash-pop flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl px-4 py-3"
      style={{
        background: "color-mix(in srgb, var(--bad) 7%, var(--raised))",
        boxShadow:
          "inset 0 0 0 1px #fff, 0 0 0 1px color-mix(in srgb, var(--bad) 55%, transparent), 0 4px 12px rgba(0,0,0,0.06)",
      }}
    >
      <span className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-bad">
        <span aria-hidden className="dot-glow h-2.5 w-2.5 rounded-full bg-current dash-pulse" />
        FAILED · {failure.stage}
      </span>
      <span className="font-mono text-[11px] text-ink-2">{failure.error}</span>
    </div>
  );
}
