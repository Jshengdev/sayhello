"use client";

/**
 * GenerationSpiral — Element B, THE HERO (docs/DECISIONS.md §5).
 * The said-built /lab/spiral engine (components/lab/spiral/SpiralEngine.tsx)
 * retyped to StoryGeneration[]: watch the story get SHAPED across generations —
 * gen-0 ungrounded (red claim chips) spiraling up to grounded (green).
 * Wheel / drag / click scrubs the focus through a frame-rate-independent lerp;
 * new generations auto-advance the focus (the spiral turns as the story turns).
 * Cards render REAL generation data off the stream — nothing invented.
 */

import { useEffect, useRef, useState } from "react";
import type { StoryGeneration } from "@/lib/types";

/* helix params — "paper mode" tuned for a 460px dashboard stage */
const P = {
  radius: 430,
  pitch: 230,
  itemsPerTurn: 6,
  cameraTilt: 12,
  cameraDist: 520,
  focusScale: 1.12,
  entryBlur: 6,
  entryDim: 0.22,
  depthFade: 0.4,
  smoothing: 0.12,
  cardW: 330,
  cardH: 218,
};

/* one predicate for the gen's grounding color (cards + the climbed thread) */
const isGrounded = (g: StoryGeneration) =>
  g.score.grounding >= 0.7 && g.fabricatedClaims.length === 0;
const threadTint = (g: StoryGeneration) =>
  `color-mix(in srgb, var(${isGrounded(g) ? "--good" : "--bad"}) 70%, transparent)`;

export default function GenerationSpiral({
  generations,
}: {
  generations: StoryGeneration[];
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const threadRefs = useRef<(HTMLDivElement | null)[]>([]);
  const focusRef = useRef(0); // displayed (lerped)
  const targetRef = useRef(0); // input-derived
  const [focusIdx, setFocusIdx] = useState(0);
  const n = generations.length;

  /* a new generation landing turns the spiral to it — depicts something true */
  useEffect(() => {
    if (n > 0) targetRef.current = n - 1;
  }, [n]);

  useEffect(() => {
    const stage = stageRef.current;
    const group = groupRef.current;
    if (!stage || !group || n === 0) return;

    let raf = 0;
    let lastTime = 0;
    let lastFocusInt = -1;
    const prevCard = new Array<string>(n).fill("");

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 1 / 60;
      lastTime = now;
      const k = 1 - Math.pow(1 - P.smoothing, dt * 60);
      focusRef.current += (targetRef.current - focusRef.current) * k;
      const f = focusRef.current;

      group.style.transform = `translateZ(${-(P.radius + P.cameraDist)}px) rotateX(${P.cameraTilt}deg)`;

      const stepAngle = 360 / P.itemsPerTurn;
      const stepY = P.pitch / P.itemsPerTurn;

      for (let i = 0; i < n; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        const rel = i - f;
        const angle = rel * stepAngle;
        const rad = (angle * Math.PI) / 180;
        const depth = Math.cos(rad);
        const dist = Math.abs(rel);
        const focusT = Math.max(0, 1 - dist);
        const norm = Math.min(1, dist / (P.itemsPerTurn * 0.5));

        const blur = Math.min(14, P.entryBlur * norm * norm);
        const bright = 1 - P.entryDim * norm;
        const opacity = Math.max(0, 1 - P.depthFade * Math.max(0, -depth) - 0.12 * norm);
        const scale = 1 + (P.focusScale - 1) * focusT;
        const counterTilt = -P.cameraTilt * 0.85 * focusT;

        const next =
          `translate(-50%,-50%) translateY(${(rel * stepY).toFixed(2)}px) ` +
          `rotateY(${angle.toFixed(3)}deg) translateZ(${P.radius}px) ` +
          `rotateX(${counterTilt.toFixed(2)}deg) scale(${scale.toFixed(4)})|` +
          `${blur.toFixed(2)}|${bright.toFixed(3)}|${opacity.toFixed(3)}`;
        if (next !== prevCard[i]) {
          prevCard[i] = next;
          el.style.transform = next.split("|")[0];
          el.style.filter =
            blur > 0.05 || bright < 0.995
              ? `blur(${blur.toFixed(2)}px) brightness(${bright.toFixed(3)})`
              : "none";
          el.style.opacity = opacity.toFixed(3);
        }
      }

      /* the climbed path — 1px chords between consecutive cards in group space,
         tinted by each gen's grounding color (rendered behind the cards). */
      for (let i = 0; i < n - 1; i++) {
        const el = threadRefs.current[i];
        if (!el) continue;
        const aRel = i - f;
        const bRel = i + 1 - f;
        const a = (aRel * stepAngle * Math.PI) / 180;
        const b = (bRel * stepAngle * Math.PI) / 180;
        const p0x = P.radius * Math.sin(a);
        const p0y = aRel * stepY;
        const p0z = P.radius * Math.cos(a);
        const vx = P.radius * Math.sin(b) - p0x;
        const vy = bRel * stepY - p0y;
        const vz = P.radius * Math.cos(b) - p0z;
        const len = Math.hypot(vx, vy, vz);
        const ry = (Math.atan2(-vz, vx) * 180) / Math.PI;
        const rz = (Math.asin(vy / len) * 180) / Math.PI;
        const depth = (Math.cos(a) + Math.cos(b)) / 2; // fade behind, like the cards
        el.style.transform =
          `translate3d(${p0x.toFixed(1)}px,${p0y.toFixed(1)}px,${p0z.toFixed(1)}px) ` +
          `rotateY(${ry.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg)`;
        el.style.width = `${len.toFixed(1)}px`;
        el.style.opacity = Math.max(0, 0.55 - 0.5 * Math.max(0, -depth)).toFixed(3);
      }

      const fi = Math.max(0, Math.min(n - 1, Math.round(f)));
      if (fi !== lastFocusInt) {
        lastFocusInt = fi;
        setFocusIdx(fi);
      }
    };

    /* scrub: wheel over the stage (page scroll passes through at the bounds) */
    const onWheel = (e: WheelEvent) => {
      const next = Math.max(0, Math.min(n - 1, targetRef.current + e.deltaY * 0.003));
      if (Math.abs(next - targetRef.current) > 1e-4) {
        e.preventDefault();
        targetRef.current = next;
      }
    };
    /* scrub: horizontal drag */
    let dragX: number | null = null;
    let dragT0 = 0;
    const onDown = (e: PointerEvent) => {
      dragX = e.clientX;
      dragT0 = targetRef.current;
    };
    const onMove = (e: PointerEvent) => {
      if (dragX === null) return;
      targetRef.current = Math.max(
        0,
        Math.min(n - 1, dragT0 - (e.clientX - dragX) / 220),
      );
    };
    const onUp = () => {
      dragX = null;
    };

    stage.addEventListener("wheel", onWheel, { passive: false });
    stage.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    focusRef.current = targetRef.current; // no fly-in on (re)bind
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      stage.removeEventListener("wheel", onWheel);
      stage.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [n]);

  const focused = generations[Math.min(focusIdx, n - 1)] ?? null;

  return (
    <section aria-label="The generations spiral" className="ring-panel rounded-2xl bg-raised p-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-mute">
          the spiral — watch the story get shaped
        </p>
        {n > 0 && focused && (
          <p className="font-mono text-[10px] text-mute">
            gen{" "}
            {/* ink alpha, never --live: violet belongs ONLY to the executing
                node ring + wire packet (strict-law fix, design-judge 2026-06-12) */}
            <span className="font-numeral" style={{ color: "rgba(38,35,35,0.45)" }}>
              {focused.generation}
            </span>{" "}
            /{" "}
            <span className="font-numeral">{n - 1}</span> · grounding{" "}
            <span
              className={`font-numeral ${focused.score.grounding >= 0.7 ? "text-good" : "text-bad"}`}
            >
              {focused.score.grounding.toFixed(2)}
            </span>
            {" · "}
            <span className="text-faint">scroll / drag to scrub</span>
          </p>
        )}
      </header>

      {n === 0 ? (
        <div className="dotted-canvas board-recess mt-3 grid h-[200px] place-items-center rounded-xl">
          <p className="px-6 text-center font-mono text-[11px] leading-relaxed text-faint">
            generations land here as the judge scores them —<br />
            gen-0 arrives red, the loop spirals it up to grounded
          </p>
        </div>
      ) : (
        <div ref={stageRef} className="gsp-stage dotted-canvas board-recess mt-3" data-testid="spiral-stage">
          <div className="gsp-ground" aria-hidden />
          <div className="gsp-scene">
            <div ref={groupRef} className="gsp-group">
              {generations.slice(0, -1).map((g, i) => (
                <div
                  key={`thread-${g.generation}`}
                  ref={(el) => {
                    threadRefs.current[i] = el;
                  }}
                  aria-hidden
                  className="gsp-thread"
                  style={{
                    opacity: 0,
                    background: `linear-gradient(90deg, ${threadTint(g)}, ${threadTint(
                      generations[i + 1],
                    )})`,
                  }}
                />
              ))}
              {generations.map((g, i) => {
                const grounded = isGrounded(g);
                return (
                  <button
                    key={g.generation}
                    ref={(el) => {
                      cardRefs.current[i] = el;
                    }}
                    type="button"
                    tabIndex={-1}
                    aria-label={`Focus generation ${g.generation}`}
                    data-grounded={grounded ? "true" : "false"}
                    data-testid={`spiral-gen-${g.generation}`}
                    className="gsp-card"
                    style={{ width: P.cardW, height: P.cardH }}
                    onClick={() => {
                      targetRef.current = i;
                    }}
                  >
                    {/* blur-up on the INNER content (signature gesture: a new
                        generation's story blurs up as it lands) — kept off the
                        button itself so it never fights the rAF 3D filter */}
                    <span className="blur-up flex h-full flex-col p-3.5">
                      <span className="flex items-baseline justify-between">
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">
                          gen <b className="font-numeral text-[12px] text-ink">{g.generation}</b>
                        </span>
                        <span
                          className={`font-mono text-[10px] font-medium ${grounded ? "text-good" : "text-bad"}`}
                        >
                          {grounded ? "grounded ✓" : `ungrounded ⊘${g.fabricatedClaims.length}`}
                          {" · "}
                          <span className="font-numeral">{g.score.grounding.toFixed(2)}</span>
                        </span>
                      </span>
                      <span className="mt-2 line-clamp-4 flex-1 whitespace-pre-wrap text-left text-[11px] leading-[1.6] text-ink-2">
                        {g.story}
                      </span>
                      <span className="mt-2 flex flex-wrap gap-1.5">
                        {g.fabricatedClaims.slice(0, 2).map((c) => (
                          <span
                            key={c}
                            className="max-w-full truncate rounded px-1.5 py-[2px] font-mono text-[8.5px] text-bad"
                            style={{
                              background: "color-mix(in srgb, var(--bad) 7%, transparent)",
                              boxShadow:
                                "0 0 0 1px color-mix(in srgb, var(--bad) 30%, transparent)",
                            }}
                          >
                            ⊘ {c}
                          </span>
                        ))}
                        {g.fabricatedClaims.length > 2 && (
                          <span className="font-mono text-[8.5px] text-bad">
                            +{g.fabricatedClaims.length - 2} more
                          </span>
                        )}
                        {grounded && (
                          <span
                            className="rounded px-1.5 py-[2px] font-mono text-[8.5px] text-good"
                            style={{
                              background: "color-mix(in srgb, var(--good) 7%, transparent)",
                              boxShadow:
                                "0 0 0 1px color-mix(in srgb, var(--good) 30%, transparent)",
                            }}
                          >
                            every claim → a Signal
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
