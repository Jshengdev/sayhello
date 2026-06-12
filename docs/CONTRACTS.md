# CONTRACTS — the shared bus every window builds against

> The one file all three lanes agree on. Lifted from PRD.md. Node names + the StoryRun type are law.
> Repo: monorepo `story-engine/` (rename freely), `packages/backend` (TS Express+ws) + `packages/frontend` (Next).

## The node graph (our own light typed-node layer — NOT a jam-nodes dependency)
Each orchestrator stage is a NAMED NODE with a typed StoryRun slice as I/O. doubles' orchestrator is the engine; we just name + type the stages so the frontend can render them as a live graph. This is "our own version of a jam-nodes-like framework," ~30 min on top of working code.

```
[scrape] → [draft] → [judge] ──emit──→ [archive] → [render]
                        │
                       regen
                        ↓
                   [reenrich] ──┐
                        ↑________│  (max 2 retries)
```
Node = `{ name, in: StoryRun, out: StoryRun, run(): emits WsEvent }`. The frontend renders nodes lighting up as a lead flows through (shimmer on the executing node, packet dots on the wires). THIS is the watchable harness + the Presentation-winning visual.

## The data contract (`packages/backend/src/types.ts`, imported into frontend)
```ts
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
  | "build_vs_buy" | "speed_to_market" | "revenue_share" | "agentic_notifications"
  // V2 contract add (2026-06-12): realestate + marketing lens angles (docs/LENSES-CONTENT.md)
  | "forced_sale" | "inheritance" | "relocation" | "absentee_fatigue"
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
  | { type: "run_started";   leadId: string; url: string }
  | { type: "node_enter";    leadId: string; node: "scrape"|"enrich"|"ground"|"draft"|"judge"|"reenrich"|"archive"|"render" }  // NEW: lights the node
  | { type: "scrape_done";   leadId: string; brief: CompanyBrief }
  | { type: "draft_done";    leadId: string; generation: number; story: string; pitch_angle: PitchAngle }
  | { type: "score_done";    leadId: string; generation: number; score: StoryScore }
  | { type: "reenrich";      leadId: string; generation: number; reason: string }
  | { type: "gate";          leadId: string; story: string; score: StoryScore }
  | { type: "done";          leadId: string; run: StoryRun }
  | { type: "failed";        leadId: string; stage: string; error: string };          // FAIL LOUD, visible badge
```
(Added `node_enter` vs the PRD so the frontend can light the graph per stage. Everything else verbatim.)

## ClickHouse (in-memory Map fallback first; Cloud trial in parallel)
```sql
CREATE TABLE IF NOT EXISTS story_runs (
  leadId String, generation UInt8, ts DateTime DEFAULT now(), url String,
  story String, pitch_angle String,
  grounding Float32, completeness Float32, narrative_arc Float32,
  verdict String, fabricated Array(String), cost_cents Float32, status String
) ENGINE = MergeTree ORDER BY (leadId, generation, ts);
```
Trajectory query (the sponsor demo line): `SELECT generation, avg(grounding), avg(completeness) FROM story_runs WHERE leadId={id} GROUP BY generation ORDER BY generation`

## Input (crystal — see docs/DECISIONS.md §2)
```ts
type RunInput = {
  industry: "gtm" | "realestate" | "marketing"; handle: string;
  mode?: "live" | "replay";                                          // V2: replay a recorded LIVE tape
  person?: { name?: string; linkedinUrl?: string; xHandle?: string }; // V2: parallel person-scrape inputs
  positioning?: string;                                              // V2 contract add: seller positioning line
};
// handle = company URL (gtm/marketing) OR property address/owner (realestate)
// industry selects the LENS PACK (signal recipes + grounding sources + narrative angles). Same engine.
```
`CompanyBrief` generalizes to a `LeadBrief`: gtm fields stay; realestate adds `{owner_age?, sale_date?,
transfer_history?, life_stage?}`; marketing adds `{recent_campaigns?, channels?}`. Keep the union loose —
the Critic grounds whatever fields the lens populated.
**V2 contract adds (2026-06-12, implemented in types.ts/schemas.ts + frontend mirror):** `domain` is
nullable (RE/MK discovery-call fixtures carry no domain); optional `industry`/`provenance`/`person?`
(PersonBrief) + the realestate/marketing optional fields above; `Lens.sellerIdentity {who, offer,
proofPoints[]}` (lens-pack data — proofPoints become `seller_pack` Signals concat'd into the ONE judge
corpus, zero judge changes); `Lens.angles` is now the `{angle, trigger, line}` menu; render node output
is `{slides, openuiLang: string|null}` with the receipt served by `GET /story/:leadId/receipt`.
**The planted-catch boundary (LOCKED):** the judge's evidence corpus = `signals[]` (+ seller_pack) ONLY —
never the brief summary prose. Fixture plants live in the prose; widening the corpus kills the catch.

## API
- `POST /story/run {industry, handle}` → starts a run, returns `{leadId}`
- `GET /story/:leadId` → rehydrate StoryRun (survives refresh)
- `GET /story/:leadId/receipt` → `{openuiLang: string|null, slides: Slide[]}` (V2 contract add — OpenUI receipt; null = visible fallback)
- `POST /story/:leadId/approve` → resolves the human gate (200; 409 if no pending gate)
- `WS /ws` → streams `WsEvent[]` per the union above

## Lane ownership
- **BACKEND** owns: orchestrator nodes + critic + scrape + llm + store + ws server. Produces `WsEvent`s + StoryRun.
- **FRONTEND** owns: `lib/ws.ts` (useStoryRun hook → Context) + LoopCanvas/SlipStrip/StoryCanvas/spiral bound to the node graph + StoryRun. Renders, never computes.
- **SHIP** owns: ClickHouse trial, Render deploy, OpenUI story renderer, Langfuse wrap, Devpost, video.

## Non-negotiables
- No silent stubs — `failed` events render a visible FAILED badge.
- Critic model ≠ drafter model (held-out). 
- `fabricatedClaims` is the demo's heart — make it visible the instant it's non-empty.
- Main always demoable; one lead end-to-end before any parallelism or polish.
