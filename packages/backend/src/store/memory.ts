// store/memory.ts — in-proc Map<leadId, StoryRun> (ClickHouse archive fallback per docs/ARCHITECTURE.md).
// GET /story/:leadId rehydrates from here. Slides live in a side-map because StoryRun has no
// slides field (flagged in docs/OPEN-QUESTIONS.md).
// V2 contract add (OPENUI-RENDER CONTRACT-ADD-1/2): openuiLang receipt side-map beside slides;
// served by GET /story/:leadId/receipt. null = OpenUI render failed (visible fallback).
import type { StoryRun } from "../types.js";

export interface Slide {
  title: string;
  body: string;
}

const runs = new Map<string, StoryRun>();
const slides = new Map<string, Slide[]>();
const receipts = new Map<string, string | null>();

export const store = {
  getRun(leadId: string): StoryRun | undefined {
    return runs.get(leadId);
  },
  setRun(leadId: string, run: StoryRun): void {
    runs.set(leadId, run);
  },
  getSlides(leadId: string): Slide[] | undefined {
    return slides.get(leadId);
  },
  setSlides(leadId: string, s: Slide[]): void {
    slides.set(leadId, s);
  },
  getReceipt(leadId: string): string | null | undefined {
    return receipts.get(leadId);
  },
  setReceipt(leadId: string, openuiLang: string | null): void {
    receipts.set(leadId, openuiLang);
  },
};
