// nodes/render.ts — [render]: StoryRun -> walkable slides. Sponsor: Thesys C1.
// S1: STUB_MODE slices the approved story into 5 canned slides.
// NOTE: StoryRun (types.ts) has NO slides field — slides live in the store side-map.
// Flagged in docs/OPEN-QUESTIONS.md; do not widen types.ts silently.
import { z } from "zod";
import { zStoryRun } from "../schemas.js";
import type { Slide } from "../store/memory.js";
import { defineNode, stubMode } from "./defineNode.js";

const zSlide = z.object({ title: z.string().min(1), body: z.string() });

// ─────────────────────────────────────────────────────────────────────────────
// EDITABLE — canned slide carving (S1). problem -> fit -> traction -> angle -> ask.
// ─────────────────────────────────────────────────────────────────────────────
const SLIDE_SECTIONS = ["PROBLEM", "FIT", "TRACTION", "ANGLE", "ASK"] as const;

function carveSlides(story: string, leadName: string): Slide[] {
  const slides: Slide[] = [{ title: `before you say hello: ${leadName}`, body: story.split("\n")[0] ?? "" }];
  for (const section of SLIDE_SECTIONS) {
    const line = story.split("\n").find((l) => l.toUpperCase().startsWith(section));
    if (line) slides.push({ title: section.toLowerCase(), body: line.replace(/^[A-Z() _a-z]+:\s*/, "") });
  }
  return slides;
}

export const renderNode = defineNode({
  name: "render",
  sponsor: "Thesys C1",
  wireNode: "render",
  stubLatencyMs: 650,
  inputSchema: z.object({ run: zStoryRun }),
  outputSchema: z.object({ slides: z.array(zSlide).min(1) }),
  async executor({ run }) {
    if (stubMode()) {
      console.log("[stub] node:render canned output");
      if (!run.story) throw new Error("render: run.story is null — cannot carve slides (fail loud)");
      return { slides: carveSlides(run.story, run.brief?.name ?? run.url) };
    }
    // S3: Thesys C1 POST /v1/embed/chat/completions from StoryRun JSON -> <C1Component> spec
    throw new Error("render live mode lands at S3 — run with STUB_MODE unset/1 (no silent stubs)");
  },
});
