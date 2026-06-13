"use client";

/**
 * Bird — the agent at work. One small gull (public/brand/ wings-up → coasting →
 * wings-down, ~280ms/frame) flying slowly left→right across the ocean band
 * while a run is active; idle = the coasting frame gently bobbing at the right.
 * Purely decorative (aria-hidden) — it depicts something true: the harness flies.
 */

import { useEffect, useState } from "react";

const FRAMES = [
  "/brand/wings-up.svg",
  "/brand/coasting.svg",
  "/brand/wings-down.svg",
] as const;
const FRAME_MS = 280;
const COASTING = 1;

export default function Bird({ active }: { active: boolean }) {
  const [frame, setFrame] = useState<number>(COASTING);

  useEffect(() => {
    if (!active) {
      setFrame(COASTING);
      return;
    }
    const id = setInterval(() => setFrame((f) => (f + 1) % FRAMES.length), FRAME_MS);
    return () => clearInterval(id);
  }, [active]);

  return (
    <span aria-hidden className={active ? "bird-fly" : "bird-idle"}>
      {/* stack all three frames; toggle visibility — no flicker on swap */}
      {FRAMES.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          width={44}
          style={{ display: i === frame ? "block" : "none" }}
        />
      ))}
    </span>
  );
}
