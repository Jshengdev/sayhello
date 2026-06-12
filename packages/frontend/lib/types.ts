// GENERATED COPY — source of truth: packages/backend/src/types.ts
// Regenerate after any contract change: cp packages/backend/src/types.ts packages/frontend/lib/types.ts (keep this header).
// types.ts — VERBATIM from docs/CONTRACTS.md ("The data contract"). Do not drift.
// Source of truth: docs/CONTRACTS.md. Frontend consumes a generated copy (packages/frontend/lib/types.ts).
//
// ── V2 contract adds (2026-06-12, lane 2 — per docs/CONTRACTS.md "keep the union loose") ──
// 1. PitchAngle WIDENED with the realestate + marketing lens angles (docs/LENSES-CONTENT.md;
//    OPEN-QUESTIONS "PitchAngle union widening now demo-blocking").
// 2. RunInput.positioning? — optional seller-positioning line woven into the drafter context.
// 3. LeadBrief loosening on CompanyBrief: domain nullable (RE/MK discovery-call fixtures have no
//    domain) + optional industry/provenance + realestate {owner_age, sale_date, transfer_history,
//    life_stage} + marketing {recent_campaigns, channels}. All optional — gtm briefs unchanged;
//    the Critic grounds ONLY signals[] (brief prose is never evidence — the planted-catch boundary).
// 4. (lane 1, same day) brief.person?: PersonBrief + RunInput.mode/person + run_started mode/label.

export interface CompanyBrief {            // 26-field research record (gtm-tool prompt.md schema)
  domain: string | null; name: string; url: string;  // V2 contract add: domain nullable (fixture briefs)
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
  /** V2: merged person fields (parallel person-scrape). Optional — company-only runs omit it. */
  person?: PersonBrief | null;
  // ── V2 contract adds — optional lens slices (loose union; absent on plain gtm briefs) ──
  industry?: "gtm" | "realestate" | "marketing";
  owner_age?: number | null; sale_date?: string | null;           // realestate
  transfer_history?: string[] | null; life_stage?: string | null;  // realestate
  recent_campaigns?: string[] | null; channels?: string[] | null;  // marketing
  provenance?: string;                                             // honest fixture/source labeling
}
export interface Signal { signal_type: string; source: string; source_url: string; detail: string; strength: number; }

// V2 person slice (docs/PERSON-SCRAPE-PORT.md + docs/SCENARIOS.md): person facts ride the brief as
// ordinary Signals (source: "heyreach"|"x"|"sixtyfour") — no new node, no new WsEvent. The merged
// person fields live on an OPTIONAL brief.person so the existing contract never breaks.
export interface PersonBrief {
  name: string | null;
  linkedinUrl: string | null;
  xHandle: string | null;
  headline: string | null;
  company: string | null;
  title: string | null;
  location: string | null;
  summary: string | null;
  /** "live" | "cache:<file>" | "skipped:<why>" — visible provenance, never silent. */
  provenance: string;
}
export type PitchAngle =
  | "resilience" | "upgrade_from_sms" | "multi_channel"
  | "build_vs_buy" | "speed_to_market" | "revenue_share" | "agentic_notifications"
  // V2 contract add — realestate lens angles (docs/LENSES-CONTENT.md §2)
  | "forced_sale" | "inheritance" | "relocation" | "absentee_fatigue"
  // V2 contract add — marketing lens angles (docs/LENSES-CONTENT.md §3)
  | "brand_gap" | "channel" | "positioning";

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
  // V2: optional mode/label so a REPLAY run is honestly labeled ("REPLAY · cached real run").
  | { type: "run_started";   leadId: string; url: string; mode?: "live" | "replay" | "stub"; label?: string }
  | { type: "node_enter";    leadId: string; node: "scrape"|"enrich"|"ground"|"draft"|"judge"|"reenrich"|"archive"|"render" }  // NEW: lights the node
  | { type: "scrape_done";   leadId: string; brief: CompanyBrief }
  | { type: "draft_done";    leadId: string; generation: number; story: string; pitch_angle: PitchAngle }
  | { type: "score_done";    leadId: string; generation: number; score: StoryScore }
  | { type: "reenrich";      leadId: string; generation: number; reason: string }
  | { type: "gate";          leadId: string; story: string; score: StoryScore }
  | { type: "done";          leadId: string; run: StoryRun }
  | { type: "failed";        leadId: string; stage: string; error: string };          // FAIL LOUD, visible badge

// Input (crystal — see docs/DECISIONS.md §2)
export type RunInput = {
  industry: "gtm" | "realestate" | "marketing";
  handle: string;
  /** V2: "replay" re-emits a recorded LIVE run (snappy, labeled). Default live. */
  mode?: "live" | "replay";
  /** V2: optional person inputs for the parallel person-scrape; missing -> stage skipped LOUDLY. */
  person?: { name?: string; linkedinUrl?: string; xHandle?: string };
  /** V2 contract add — optional seller-positioning line, woven into the drafter context. */
  positioning?: string;
};
// handle = company URL (gtm/marketing) OR property address/owner (realestate)
// industry selects the LENS PACK (signal recipes + grounding sources + narrative angles). Same engine.
