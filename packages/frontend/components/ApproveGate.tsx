"use client";

/**
 * ApproveGate — the SlipStrip grammar reworked as the human gate (kept human
 * on purpose). Hold-to-approve (900ms) → POST /story/:leadId/approve →
 * gate-stamp gesture + confetti — confetti fires ONLY on human approval
 * (docs/DESIGN.md signature gestures).
 */

import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import type { StoryScore } from "@/lib/types";

const HOLD_MS = 900;

export default function ApproveGate({
  gate,
  approved,
  onApprove,
}: {
  gate: { story: string; score: StoryScore } | null;
  approved: boolean;
  onApprove: () => Promise<boolean>;
}) {
  const [progress, setProgress] = useState(0);
  const [pending, setPending] = useState(false);
  const rafRef = useRef(0);
  const holdingRef = useRef(false);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  if (!gate) return null;

  const begin = () => {
    if (approved || pending) return;
    holdingRef.current = true;
    const t0 = performance.now();
    const tick = async (now: number) => {
      if (!holdingRef.current) return;
      const p = Math.min(1, (now - t0) / HOLD_MS);
      setProgress(p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      // held to the end — the human said yes
      holdingRef.current = false;
      setPending(true);
      const ok = await onApprove();
      setPending(false);
      setProgress(0);
      if (ok) {
        confetti({
          particleCount: 90,
          spread: 70,
          startVelocity: 32,
          origin: { y: 0.7 },
          colors: ["#6e2bff", "#1f7a4d", "#262323", "#fbfbf8"],
        });
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const release = () => {
    holdingRef.current = false;
    cancelAnimationFrame(rafRef.current);
    setProgress(0);
  };

  return (
    <section
      aria-label="Human gate"
      className="ring-float rounded-2xl bg-white p-5"
      data-testid="approve-gate"
    >
      <header className="flex items-baseline justify-between">
        <p className="font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-warn">
          ⛋ human gate
        </p>
        <span className="font-mono text-[10px] text-mute">
          grounding{" "}
          <b className="font-numeral text-[11px] text-good">
            {gate.score.grounding.toFixed(2)}
          </b>
          {" · "}
          {gate.score.verdict}
        </span>
      </header>
      <p className="mt-2 text-[12.5px] leading-relaxed text-ink-2">
        Every claim in this story traces to a scraped Signal. The harness built the
        patty — <em>you</em> make the pitch. Nothing ships without you.
      </p>

      {approved ? (
        <div className="mt-4 flex items-center gap-4">
          <span className="gate-stamp px-3 py-1.5 font-mono text-[13px] font-medium uppercase tracking-[0.18em]">
            approved
          </span>
          <span className="font-mono text-[10px] text-mute">
            story shipped — rendered by Thesys C1
          </span>
        </div>
      ) : (
        <div className="mt-4">
          <button
            type="button"
            onPointerDown={begin}
            onPointerUp={release}
            onPointerLeave={release}
            disabled={pending}
            data-testid="hold-approve"
            className="btn-crunch crunch-dark relative w-full select-none overflow-hidden rounded-lg bg-ink px-4 py-3 text-center font-mono text-[12px] font-medium text-page disabled:opacity-60"
          >
            {/* the hold fill — depicts the true thing: your decision arming */}
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 bg-white/20"
              style={{ width: `${progress * 100}%` }}
            />
            <span className="relative">
              {pending ? "shipping…" : "hold to approve — ship the story"}
            </span>
          </button>
          <p className="mt-2 text-center font-mono text-[9.5px] text-faint">
            hold {Math.round(HOLD_MS / 100) / 10}s · approving is yours alone
          </p>
        </div>
      )}
    </section>
  );
}
