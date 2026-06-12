// schemas.ts — zod mirrors of the contract types in src/types.ts (docs/CONTRACTS.md).
// These are the runtime boundaries the typed nodes parse on enter/exit. Do not drift from types.ts.
import { z } from "zod";
import type { CompanyBrief, RunInput, Signal, StoryGeneration, StoryRun, StoryScore } from "./types.js";

export const zPitchAngle = z.enum([
  "resilience",
  "upgrade_from_sms",
  "multi_channel",
  "build_vs_buy",
  "speed_to_market",
  "revenue_share",
  "agentic_notifications",
]);

export const zSignal = z.object({
  signal_type: z.string(),
  source: z.string(),
  source_url: z.string(),
  detail: z.string(),
  strength: z.number(),
}) satisfies z.ZodType<Signal>;

export const zCompanyBrief = z.object({
  domain: z.string(),
  name: z.string(),
  url: z.string(),
  what_they_do: z.string(),
  founded_year: z.number().nullable(),
  key_features: z.array(z.string()),
  competitors: z.array(z.string()),
  tech_stack: z.array(z.string()),
  funding_stage: z.string().nullable(),
  funding_amount: z.string().nullable(),
  employee_count: z.number().nullable(),
  category: z.string(),
  current_messaging_channels: z.array(z.string()),
  github_url: z.string().nullable(),
  partnership_potential: z.boolean(),
  pitch_angle: zPitchAngle,
  features: z.record(z.boolean()),
  signals: z.array(zSignal),
  brief: z.string(),
}) satisfies z.ZodType<CompanyBrief>;

export const zStoryScore = z.object({
  grounding: z.number(),
  completeness: z.number(),
  narrative_arc: z.number(),
  feasibility: z.number(),
  competitive_diff: z.number(),
  metric_confidence: z.number(),
  verdict: z.enum(["emit", "regen"]),
  failReason: z.string().nullable(),
  fabricatedClaims: z.array(z.string()),
}) satisfies z.ZodType<StoryScore>;

export const zStoryGeneration = z.object({
  generation: z.number(),
  story: z.string(),
  score: zStoryScore,
  fabricatedClaims: z.array(z.string()),
  costCents: z.number(),
  latencyMs: z.number(),
  ts: z.string(),
}) satisfies z.ZodType<StoryGeneration>;

export const zStoryRun = z.object({
  leadId: z.string(),
  url: z.string(),
  status: z.enum(["scraping", "drafting", "judging", "reenriching", "blocked", "done", "failed"]),
  generation: z.number(),
  brief: zCompanyBrief.nullable(),
  story: z.string().nullable(),
  score: zStoryScore.nullable(),
  pitch_angle: zPitchAngle.nullable(),
  generations: z.array(zStoryGeneration),
  costCents: z.number(),
  totalLatencyMs: z.number(),
  createdAt: z.string(),
}) satisfies z.ZodType<StoryRun>;

export const zIndustry = z.enum(["gtm", "realestate", "marketing"]);

export const zRunInput = z.object({
  industry: zIndustry,
  handle: z.string().min(1, "handle must be a non-empty company URL / address / owner name"),
}) satisfies z.ZodType<RunInput>;
