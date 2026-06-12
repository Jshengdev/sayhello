// GENERATED COPY — source of truth: packages/backend/src/types.ts
// Regenerate after any contract change: cp packages/backend/src/types.ts packages/frontend/lib/types.ts (keep this header).
// types.ts — VERBATIM from docs/CONTRACTS.md ("The data contract"). Do not drift.
// Source of truth: docs/CONTRACTS.md. Frontend consumes a generated copy (packages/frontend/lib/types.ts).

export interface CompanyBrief {            // 26-field research record (gtm-tool prompt.md schema)
  domain: string; name: string; url: string;
  what_they_do: string; founded_year: number | null;
  key_features: string[]; competitors: string[]; tech_stack: string[];
  funding_stage: string | null; funding_amount: string | null;
  employee_count: number | null;
  category: string; current_messaging_channels: string[];
  github_url: string | null; partnership_potential: boolean;
  pitch_angle: PitchAngle;
  features: Record<string, boolean>;
  signals: Signal[];
  brief: string;
}
export interface Signal { signal_type: string; source: string; source_url: string; detail: string; strength: number; }
export type PitchAngle =
  | "resilience" | "upgrade_from_sms" | "multi_channel"
  | "build_vs_buy" | "speed_to_market" | "revenue_share" | "agentic_notifications";

export interface StoryScore {              // the held-out Critic verdict (numbers, not booleans)
  grounding: number;          // 0..1 — every claim traceable to a Signal; fail-CLOSED
  completeness: number;       // 0..1
  narrative_arc: number;      // 0..1 — problem→fit→proof→ask
  feasibility: number;        // 0..1
  competitive_diff: number;   // 0..1
  metric_confidence: number;  // 0..1 — bare numbers capped
  verdict: "emit" | "regen";  // emit iff grounding≥0.7 AND all axes≥0.7
  failReason: string | null;
  fabricatedClaims: string[]; // claims with no matching Signal — THE MONEY SHOT
}

export interface StoryRun {                // one lead's whole life — LoopCanvas/Spiral/ClickHouse all consume this
  leadId: string; url: string;
  status: "scraping" | "drafting" | "judging" | "reenriching" | "blocked" | "done" | "failed";
  generation: number;
  brief: CompanyBrief | null;
  story: string | null;
  score: StoryScore | null;
  pitch_angle: PitchAngle | null;
  generations: StoryGeneration[];
  costCents: number; totalLatencyMs: number; createdAt: string;
}
export interface StoryGeneration {
  generation: number; story: string; score: StoryScore;
  fabricatedClaims: string[]; costCents: number; latencyMs: number; ts: string;
}

export type WsEvent =                      // frontend switches on `type`
  | { type: "run_started";   leadId: string; url: string }
  | { type: "node_enter";    leadId: string; node: "scrape"|"draft"|"judge"|"reenrich"|"archive"|"render" }  // NEW: lights the node
  | { type: "scrape_done";   leadId: string; brief: CompanyBrief }
  | { type: "draft_done";    leadId: string; generation: number; story: string; pitch_angle: PitchAngle }
  | { type: "score_done";    leadId: string; generation: number; score: StoryScore }
  | { type: "reenrich";      leadId: string; generation: number; reason: string }
  | { type: "gate";          leadId: string; story: string; score: StoryScore }
  | { type: "done";          leadId: string; run: StoryRun }
  | { type: "failed";        leadId: string; stage: string; error: string };          // FAIL LOUD, visible badge

// Input (crystal — see docs/DECISIONS.md §2)
export type RunInput = { industry: "gtm" | "realestate" | "marketing"; handle: string };
// handle = company URL (gtm/marketing) OR property address/owner (realestate)
// industry selects the LENS PACK (signal recipes + grounding sources + narrative angles). Same engine.
