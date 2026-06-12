> From the PRD-extraction workflow (9 agents over doubles+gtm-tool+said-built), 2026-06-12. Sponsor-wiring synth failed on API overload — see BUILD-SCOPE.md + WIN-ASSESSMENT.md for that.
> ⚠️ FRAMEWORK NOTE: this PRD scoped doubles' hand-rolled orchestrator BEFORE we adopted the jam-nodes typed-node DAG (see WIN-ASSESSMENT.md). Reconcile: keep this port manifest + StoryRun contract + stages; swap the orchestrator spine for jam-nodes execute-workflow nodes.

# BUILD PRD — Story Engine

**A GTM lead-story enrichment harness | Harness Engineering Hack (AWS Builder Loft) | Submit 4:00 PM today**
**Now: ~11:30 AM, June 12. ~4.5h. Freeze at 2:50 PM, buffer to 4:00.**

---

## Product

GTM teams drown in half-researched leads: a name, a domain, a vibe. The hard part isn't writing a pitch — it's knowing whether the pitch is **grounded** (every claim traces to a real scraped fact) or **fabricated** (the model invented a funding round to make the story sing). **Story Engine** is a self-improving harness that takes one lead (company URL), scrapes it, drafts a GTM lead-story (problem → fit → traction → angle → ask), and runs that draft through a **grounding Critic** that scores it across axes (grounding, completeness, narrative arc, feasibility) and either **emits** or kicks a **re-enrich → redraft** loop, up to 2 retries. Every iteration is archived; the harness's own cockpit is rendered live. **Demo payoff:** we watch the harness catch itself cheating — it drafts a story with an unsourced metric, the Critic flags `grounding=0.4 FABRICATED`, the loop re-scrapes, the claim either gets a citation or gets cut, and the story turns green on screen. The score trajectory climbs across generations in real time. "Here's an agent that grades its own homework and refuses to pass a story it can't prove."

---

## Architecture

**Decision: monorepo, two packages, one `pnpm` workspace. Backend = TypeScript (Express + WS). Frontend = Next.js 15.** One repo because under a 4.5h clock, two repos means two deploys, two env files, CORS pain, and double the cognitive load. The whole port surface is already TS/Next — doubles is TS, said-built is Next — so there is zero language bridge to build. The only non-TS code is the Python scrapers, which we shell out to (they already run as `*.sh`/`*.py` CLIs).

```
story-engine/
├── package.json                  # pnpm workspace root, "dev": concurrently be+fe
├── pnpm-workspace.yaml
├── .env                          # one env file, both packages read it
├── packages/
│   ├── backend/                  # ← forks doubles/src — the harness
│   │   ├── src/
│   │   │   ├── server.ts         # Express + ws  (PORT doubles/src/web/server.ts skeleton)
│   │   │   ├── orchestrator/
│   │   │   │   └── index.ts      # ← doubles/src/orchestrator/index.ts  (runStory loop)
│   │   │   ├── agents/
│   │   │   │   ├── analyzer.ts        # NEW (collapses thinker; reads story sections)
│   │   │   │   ├── drafter.ts         # NEW thin (collapses talker; drafts story)
│   │   │   │   ├── critic.ts          # ← doubles/src/agents/critic.ts  (retarget axes)
│   │   │   │   ├── critic-prompt.ts   # ← doubles/src/agents/critic-prompt.ts
│   │   │   │   └── recovery.ts        # ← doubles/src/agents/recovery.ts (→ scorecard)
│   │   │   ├── llm/
│   │   │   │   ├── openrouter.ts      # ← doubles PORT-AS-IS
│   │   │   │   ├── models.ts          # ← doubles PORT-AS-IS (+GUIDE tier)
│   │   │   │   ├── invocation-log.ts  # ← doubles PORT-AS-IS
│   │   │   │   └── cost-ledger.ts     # ← doubles PORT-AS-IS
│   │   │   ├── enrich/
│   │   │   │   ├── scrape.ts          # wraps gtm scraper.py / firecrawl
│   │   │   │   └── research-prompt.ts # ← gtm prompt.md (26-field schema as TS const)
│   │   │   ├── store/
│   │   │   │   ├── clickhouse.ts      # NEW (archive every generation)
│   │   │   │   └── memory.ts          # NEW in-proc Map (StoryRun by leadId)
│   │   │   └── types.ts              # StoryRun, StoryScore, WsEvent contracts
│   │   └── connectors/           # ← gtm-tool/photon-gtm/connectors (copied .sh/.py)
│   └── frontend/                 # ← forks said-built
│       ├── app/
│       │   ├── page.tsx          # ← said-built app/mvp/page.tsx (the cockpit)
│       │   └── globals.css       # ← said-built app/globals.css  PORT-AS-IS
│       ├── components/
│       │   ├── LoopCanvas.tsx    # ← said-built .../today/LoopCanvas.tsx
│       │   ├── SlipStrip.tsx     # ← said-built .../today/SlipStrip.tsx
│       │   ├── StoryCanvas.tsx   # ← said-built components/story/StoryCanvas.tsx
│       │   ├── spiral/           # ← said-built components/lab/spiral/*  (gen gallery)
│       │   └── bits/, RoleProvider, primitives, mvp.css  # ← said-built deps
│       └── lib/
│           ├── ws.ts             # NEW — WS client, maps WsEvent → component props
│           └── mvp-data.ts       # ← said-built lib/mvp-data.ts (shapes kept, data live)
```

**Data flow:** `POST /story/run {url}` → orchestrator runs the loop → each stage emits a `WsEvent` over `/ws` → frontend `lib/ws.ts` routes events into LoopCanvas (ring packet), StoryCanvas (5 beats), SpiralEngine (generation gallery), SlipStrip (approval gate). Every generation also written to ClickHouse + held in the in-proc Map so `GET /story/:leadId` rehydrates on refresh. The single live ClickHouse query feeds the score-trajectory panel.

---

## The Data Contract

`packages/backend/src/types.ts` (shared into frontend via workspace import):

```ts
// ─────────────────────────────────────────────────────────────
// The 26-field research record — ported verbatim from
// gtm-tool/photon-gtm/agents/1-research/prompt.md output schema.
// This is what "research-complete" means; the Critic grounds against it.
export interface CompanyBrief {
  domain: string; name: string; url: string;
  what_they_do: string; founded_year: number | null;
  key_features: string[]; competitors: string[]; tech_stack: string[];
  funding_stage: string | null; funding_amount: string | null;
  employee_count: number | null;
  category: string; current_messaging_channels: string[];
  github_url: string | null; partnership_potential: boolean;
  pitch_angle: PitchAngle;
  features: Record<string, boolean>;            // the 10 boolean signal flags
  signals: Signal[];                            // {signal_type, source, source_url, detail, strength}
  brief: string;                                // human summary
}
export interface Signal { signal_type: string; source: string; source_url: string; detail: string; strength: number; }
export type PitchAngle =
  | "resilience" | "upgrade_from_sms" | "multi_channel"
  | "build_vs_buy" | "speed_to_market" | "revenue_share" | "agentic_notifications";

// ─────────────────────────────────────────────────────────────
// The Critic verdict — retargeted from doubles CriticScore (8 axes).
// Numbers, not booleans: verdict recomputed from axes (defence-in-depth).
export interface StoryScore {
  grounding: number;          // 0..1 — every claim traceable to a Signal; fail-CLOSED
  completeness: number;       // 0..1 — 5 fundamentals present
  narrative_arc: number;      // 0..1 — problem→fit→proof→ask traceable
  feasibility: number;        // 0..1 — the ask is concrete
  competitive_diff: number;   // 0..1 — positioned vs named competitors
  metric_confidence: number;  // 0..1 — metrics cited w/ source; bare numbers capped
  verdict: "emit" | "regen";  // emit iff grounding≥0.7 AND all axes≥0.7
  failReason: string | null;
  fabricatedClaims: string[]; // claims with no matching Signal — the money shot
}

// ─────────────────────────────────────────────────────────────
// One lead's whole life. The unit LoopCanvas/Spiral/ClickHouse all consume.
export interface StoryRun {
  leadId: string;             // slug of domain
  url: string;
  status: "scraping" | "drafting" | "judging" | "reenriching" | "blocked" | "done" | "failed";
  generation: number;         // 0,1,2 — the loop iteration
  brief: CompanyBrief | null;
  story: string | null;       // the current draft (problem→fit→traction→angle→ask)
  score: StoryScore | null;
  pitch_angle: PitchAngle | null;
  generations: StoryGeneration[];  // full history → SpiralEngine items
  costCents: number; totalLatencyMs: number;
  createdAt: string;
}
export interface StoryGeneration {
  generation: number; story: string; score: StoryScore;
  fabricatedClaims: string[]; costCents: number; latencyMs: number; ts: string;
}

// ─────────────────────────────────────────────────────────────
// WS event shapes — one discriminated union, frontend switches on `type`.
export type WsEvent =
  | { type: "run_started";   leadId: string; url: string }
  | { type: "scrape_done";   leadId: string; brief: CompanyBrief }
  | { type: "draft_done";    leadId: string; generation: number; story: string; pitch_angle: PitchAngle }
  | { type: "score_done";    leadId: string; generation: number; score: StoryScore }   // → LoopCanvas gate beat
  | { type: "reenrich";      leadId: string; generation: number; reason: string }      // → ring re-loops
  | { type: "gate";          leadId: string; story: string; score: StoryScore }        // → SlipStrip approval row
  | { type: "done";          leadId: string; run: StoryRun }
  | { type: "failed";        leadId: string; stage: string; error: string };           // FAIL LOUD, visible badge
```

ClickHouse table (`store/clickhouse.ts` runs this `CREATE` on boot; archives every `score_done`):

```sql
CREATE TABLE IF NOT EXISTS story_runs (
  leadId        String,
  generation    UInt8,
  ts            DateTime DEFAULT now(),
  url           String,
  story         String,                 -- the draft text
  pitch_angle   String,
  grounding     Float32,
  completeness  Float32,
  narrative_arc Float32,
  verdict       String,
  fabricated    Array(String),          -- the caught claims
  cost_cents    Float32,
  status        String
) ENGINE = MergeTree ORDER BY (leadId, generation, ts);
```

Live trajectory query (feeds the score panel — sponsor demo line):
`SELECT generation, avg(grounding), avg(completeness) FROM story_runs WHERE leadId={id} GROUP BY generation ORDER BY generation`

---

## Build Stages

### Stage 0 — Repo + scaffold | **DONE BY 12:00**
- **OBJECTIVE:** Monorepo boots; backend `/health` 200; frontend renders the cockpit shell with stub data; one WS message round-trips.
- **PORTED MODULES:**
  - `said-built/package.json`, `app/globals.css`, `components/mvp/mvp.css`, `lib/mvp-data.ts` → `packages/frontend/*` (PORT-AS-IS; data shapes kept)
  - `said-built/app/mvp/page.tsx` → `packages/frontend/app/page.tsx`
  - `doubles/src/web/server.ts` skeleton + `src/logger.ts` → `packages/backend/src/server.ts`
  - `doubles/src/llm/{openrouter,models,invocation-log,cost-ledger}.ts` → `packages/backend/src/llm/*` (PORT-AS-IS)
- **NEW:** `pnpm-workspace.yaml`; `backend/src/types.ts` (the full contract above); `frontend/lib/ws.ts` (connect + dispatch); one hardcoded `WsEvent` emitter loop on boot to prove the wire.
- **DoD:** `pnpm dev` starts both; browser shows LoopCanvas ring + SlipStrip from `mvp-data.ts`; backend logs one stub `score_done` and the frontend console logs receipt.
- **PROVE:** `curl localhost:8080/health` → `{ok:true}`; open `localhost:3000`, see ring render; `curl -X POST localhost:8080/story/run -d '{"url":"poke.ai"}'` triggers a visible stub packet on the ring.
- **SPONSOR LIGHTS UP:** none yet (infra).

### Stage 1 — One lead end-to-end on stub LLM | **DONE BY 1:00**
- **OBJECTIVE:** `POST /story/run {url:"poke.ai"}` walks the full loop on **mock scrape + real Critic** and drives the cockpit through scrape→draft→judge→done, generation 0.
- **PORTED MODULES:**
  - `doubles/src/orchestrator/index.ts` → `backend/src/orchestrator/index.ts` — retarget `runTurn`→`runStory`: parallel-assemble brief, Analyzer→Drafter→Critic, keep `MAX_REGEN_ATTEMPTS=2`, keep FAIL-LOUD paths.
  - `doubles/src/agents/critic.ts` + `critic-prompt.ts` → `backend/src/agents/*` — swap 8 voice axes for the 6 story axes; keep `tryParseScore` fallback, the numeric-verdict recompute, `containsForbiddenPhrase` repurposed to cliché-floor (`paradigm shift`, `synergies`, `leveraging`).
  - `gtm-tool/.../1-research/prompt.md` → `backend/src/enrich/research-prompt.ts` (26-field schema as the drafter+brief contract).
  - `gtm-tool/.../connectors/apollo/mock.sh` + scraper mock → stub `scrape.ts` (returns the `poke.ai` fixture brief).
- **NEW:** `analyzer.ts` (thin: reads brief → section presence flags), `drafter.ts` (thin: brief → story via `generate()` VOICE tier), `store/memory.ts` Map.
- **DoD:** A real Critic call returns a `StoryScore`; if `verdict==="regen"` the loop redrafts (gen 1); LoopCanvas animates a gate beat; StoryCanvas shows 5 beats with real story text; `done` fires.
- **PROVE:** `pnpm --filter backend test:e2e` (one vitest: runStory("poke.ai") resolves `status:"done"`, `score.grounding` is a real number, `generations.length>=1`). Manually: watch the ring complete + story turn green.
- **SPONSOR LIGHTS UP:** **Bedrock or OpenRouter** (real LLM for Critic). Use OpenRouter first (already wired); Bedrock is a one-line base-url swap later.

### Stage 2 — Real scrape + the fabrication catch | **DONE BY 1:45**
- **OBJECTIVE:** One real scrape path works; the harness catches a fabricated claim on camera and re-enriches. This is THE demo beat.
- **PORTED MODULES:**
  - `gtm-tool/photon-gtm/scripts/scraper.py` (or `scrape-secure.py`) → shell out from `enrich/scrape.ts` — the **P0 scrape path** (pure stdlib, no key, offline-able with cached HTML).
  - `gtm-tool/.../connectors/firecrawl/firecrawl.py` + `mock.sh` → fallback chain (live key OR mock).
  - `doubles/src/agents/recovery.ts` → `backend/src/agents/recovery.ts` retargeted to `generateScoreCard` — when score is borderline, emit human-readable feedback ("grounding 0.4: 'Series B' has no Signal — cut or cite").
- **NEW:** the `reenrich` orchestrator branch: on `regen` with a `fabricatedClaims` list, re-scrape targeted pages (about/blog) and pass `AVOID` set into the next draft (the doubles regen-threading pattern).
- **DoD:** Run a real URL; first draft contains a claim with no Signal; Critic returns `grounding<0.7` + populated `fabricatedClaims`; `reenrich` event fires; gen 1 either cites or cuts the claim; gen 1 emits.
- **PROVE:** `pnpm --filter backend exec tsx scripts/demo-run.ts series.so` prints gen0 (FABRICATED) → gen1 (CLEAN) with the offending claim named. Cockpit shows red→green transition.
- **SPONSOR LIGHTS UP:** **Pioneer** (optional, deterministic GLiNER grounding scorer as the Critic's extraction step — `entities:['claim','source_url','verdict']`; only if promo code activates in first 10 min, else Claude Critic). **Firecrawl/TinyFish** (scrape).

### Stage 3 — Archive + observability + generation gallery | **DONE BY 2:20**
- **OBJECTIVE:** Every generation lands in ClickHouse; the score-trajectory panel queries live; the spiral gallery shows gen0→gen1→gen2 as cards; Langfuse traces the loop.
- **PORTED MODULES:**
  - `said-built/components/lab/spiral/*` (`SpiralEngine`, `SpiralStudy`, `params.ts`, `spiral.css`) → `frontend/components/spiral/*` — one `SpiralItem` per `StoryGeneration` (title=gen #, meta=grounding score, caption=verdict).
  - `said-built/components/mvp/today/SlipStrip.tsx` → wired to the `gate` event (each blocked story = a slip row; Hop In = approve).
  - `doubles/src/llm/{invocation-log,cost-ledger}.ts` → already ported; surface `costCents` on the dashboard.
- **NEW:** `store/clickhouse.ts` (`CREATE` + insert-per-`score_done` + the trajectory `SELECT`); `@observe()`-style Langfuse spans around scrape/draft/judge/reenrich; a `/story/trajectory/:leadId` endpoint feeding the panel.
- **DoD:** ClickHouse has N rows for a 2-gen run; trajectory panel shows grounding climbing 0.4→0.9; spiral scrolls the generations; Langfuse project shows the run's spans.
- **PROVE:** ClickHouse `SELECT count() FROM story_runs` > 0 after a run (use the **free playground** if no creds: `sql-clickhouse.clickhouse.com:8443` read-only — for inserts, spin a free ClickHouse Cloud trial or keep an in-memory mirror as offline fallback). Langfuse UI shows the trace.
- **SPONSOR LIGHTS UP:** **ClickHouse** (archive + live query), **Langfuse** (loop spans + token curve), **OpenUI/Thesys** (stretch: regenerate one dashboard panel via C1 if time — else skip, it's high-risk model-version coupling).

### Stage 4 — Polish + deploy | **FREEZE 2:50**
- **OBJECTIVE:** Deploy live; the Guild governance beat works; the demo script runs clean twice; everything offline-safe.
- **PORTED MODULES:**
  - `said-built/app/globals.css` design tokens (paper-light, gate colors) — final pass so grounded=green, fabricated=red, gate=⛋.
  - `doubles` Guild wrap point: the orchestrator's emit decision becomes a Guild-gated action (agent tries to mark an ungrounded claim "grounded"; Guild policy blocks it on camera).
- **NEW:** `render.yaml` Blueprint (web=Next static + node=Express, bind `0.0.0.0:$PORT`); a "seed 3 leads" button; the scripted Guild interception.
- **DoD:** App is on a public Render URL; cold-load → seed → watch a fabrication catch → trajectory climbs → done; runs twice without a manual fix; every external call has a mock fallback (`MOCK_*=1`).
- **PROVE:** Hit the Render URL from a phone; run `series.so`; see red→green + climbing trajectory. `git log` clean at 2:50.
- **SPONSOR LIGHTS UP:** **Render** (live deploy, on-camera), **Guild** (the marquee governance beat — "watch it try to cheat its own evaluator"), **TrueFoundry** (stretch: route generator/scorer through the gateway for the cost-split panel — only if ≥20 min left).

---

## Connector Matrix

| Connector | Source | Auth | Pri | Offline-able | Stage |
|---|---|---|---|---|---|
| **scraper.py / scrape-secure.py** | Any company website (stdlib urllib + BS4) | none | **P0** | **yes** (cached HTML) | 2 |
| **Apollo** (mock) | B2B contacts + company enrich | `APOLLO_API_KEY` / mock | P0 | yes (domain-keyed mock) | 1–2 |
| **Firecrawl / TinyFish** | JS-heavy sites, anti-bot | `FIRECRAWL_API_KEY` / `TINYFISH_API_KEY` / mock | P1 | yes (mock) | 2 |
| **ClickHouse** | iteration archive + live query | host/user/pass / free playground | P0 (observability) | partial (in-mem mirror) | 3 |
| **GitHub** | stars/forks/code signals | `GITHUB_TOKEN` opt / mock | P1 | yes | (signal, P1) |
| **Hunter.io** | email verify | `HUNTER_API_KEY` / mock | P2 | yes | cut |
| **HeyReach** | LinkedIn enrich | `HEYREACH_MCP_KEY` / mock | P2 | yes | cut |
| **G2 / JobSpy / npm / IMAP / SMTP / iMessage** | reviews / jobs / downloads / email | various | P2 | mixed | cut |

**The ONE P0 scrape path that must work:** `gtm-tool/photon-gtm/scripts/scraper.py <url>` — pure stdlib, no API key, returns `{title, description, body_text(3000), signals, key_links}`. **Cached fallback:** pre-save 3 HTML snapshots (`poke.ai`, `series.so`, `ditto.ai`) under `connectors/_fixtures/`; `scrape.ts` checks the fixture dir first when `MOCK_SCRAPE=1`. If live HTTP dies at the venue, the demo never notices.

---

## Port Manifest (literal copy list)

| Module | from → to | as-is/adapt | effort |
|---|---|---|---|
| openrouter | `doubles/src/llm/openrouter.ts` → `backend/src/llm/openrouter.ts` | as-is | trivial |
| models | `doubles/src/llm/models.ts` → `backend/src/llm/models.ts` (+GUIDE tier) | as-is | trivial |
| invocation-log | `doubles/src/llm/invocation-log.ts` → `backend/src/llm/invocation-log.ts` | as-is | trivial |
| cost-ledger | `doubles/src/llm/cost-ledger.ts` → `backend/src/llm/cost-ledger.ts` | as-is | trivial |
| orchestrator | `doubles/src/orchestrator/index.ts` → `backend/src/orchestrator/index.ts` | adapt (runTurn→runStory) | moderate |
| critic | `doubles/src/agents/critic.ts` → `backend/src/agents/critic.ts` | adapt (axes) | moderate |
| critic-prompt | `doubles/src/agents/critic-prompt.ts` → `backend/src/agents/critic-prompt.ts` | adapt (axes+clichés) | trivial |
| recovery | `doubles/src/agents/recovery.ts` → `backend/src/agents/recovery.ts` | adapt (→scorecard) | moderate |
| server skeleton | `doubles/src/web/server.ts` → `backend/src/server.ts` | adapt (routes+ws) | moderate |
| logger | `doubles/src/logger.ts` → `backend/src/logger.ts` | as-is | trivial |
| research schema | `gtm/agents/1-research/prompt.md` → `backend/src/enrich/research-prompt.ts` | adapt (TS const) | moderate |
| narrative framework | `gtm/specs/narrative-framework.md` → drafter prompt block | adapt | trivial |
| scraper | `gtm/scripts/scraper.py` → `backend/connectors/scraper.py` | as-is (shell out) | trivial |
| apollo/firecrawl/tinyfish | `gtm/connectors/{apollo,firecrawl,tinyfish}/*` → `backend/connectors/*` | as-is | trivial |
| globals.css | `said-built/app/globals.css` → `frontend/app/globals.css` | as-is | trivial |
| mvp.css | `said-built/components/mvp/mvp.css` → `frontend/components/mvp.css` | as-is | trivial |
| page (cockpit) | `said-built/app/mvp/page.tsx` → `frontend/app/page.tsx` | adapt | trivial |
| LoopCanvas | `said-built/components/mvp/today/LoopCanvas.tsx` → `frontend/components/LoopCanvas.tsx` | adapt (live beats) | moderate |
| SlipStrip | `said-built/components/mvp/today/SlipStrip.tsx` → `frontend/components/SlipStrip.tsx` | adapt (gate rows) | moderate |
| StoryCanvas | `said-built/components/story/StoryCanvas.tsx` → `frontend/components/StoryCanvas.tsx` | adapt (5 beats live) | moderate |
| Spiral set | `said-built/components/lab/spiral/*` → `frontend/components/spiral/*` | as-is + adapt data | moderate |
| mvp-data | `said-built/lib/mvp-data.ts` → `frontend/lib/mvp-data.ts` | adapt (shapes kept) | moderate |

---

## What to BUILD NEW vs PORT

**PORT (don't touch the logic):** the entire LLM layer (openrouter/models/log/ledger — free, generic, audit-ready), the Critic scoring machinery (parse-with-fallback, numeric verdict recompute, deterministic floors — this is the hardest-to-write part and it's done), the orchestrator regen loop, all said-built UI components and the design system, the Python scraper.

**BUILD NEW (and keep it tiny):**
1. `types.ts` — the contract (45 min, but it's the spine; do it first).
2. `analyzer.ts` + `drafter.ts` — thin replacements for thinker/talker. The inventory says thinker/talker are REFERENCE-ONLY (their prompt tuning is voice-specific). Do NOT port them — write two ~40-line agents that call `generate()` with the research-prompt schema.
3. The 6 retargeted Critic axes (edit `critic-prompt.ts` text + the axis names in `critic.ts`; keep ALL the surrounding machinery).
4. `frontend/lib/ws.ts` — the event→prop router (the integration glue).
5. `store/clickhouse.ts` + `store/memory.ts`.
6. `render.yaml` + the Guild wrap + demo-seed button (Stage 4 only).

**Hard rule:** if a module is marked REFERENCE-ONLY or PORT-AND-ADAPT-heavy in the inventory (thinker, talker, memory RRF layer, persona generator, personality system), **we do not port it.** We read it for the pattern and write the 40-line version.

---

## Cut List (explicitly NOT doing)

- **No Postgres / no memory schema.** In-proc `Map<leadId, StoryRun>` + ClickHouse archive. No `DATABASE_URL`. (Cuts doubles `memory/schema.ts`, `persist.ts`, the whole RRF memory layer.)
- **No embeddings / semantic ranking.** MiniLM is overkill for a single-lead demo. Grounding is claim↔Signal string/LLM matching, not cosine.
- **No persona / personality system, no MBTI, no founder-voice coaching.** REFERENCE-ONLY in the inventory; zero demo value under the clock.
- **No multi-source ingestion swarm.** No SixtyFour, HeyReach, GitHub, Gmail/Calendar, IMAP, SMTP, X, JobSpy, npm, G2, iMessage, Crunchbase. One scrape path + Apollo mock for the brief is enough.
- **No contact discovery (Agent 2).** Out of scope; the story, not the outreach, is the product.
- **No Composio OAuth flows, no real email send.** Guild is the governance layer we demo, not Composio actions.
- **No OpenUI generative dashboard as a hard dependency.** The cockpit is hand-built from said-built. OpenUI is a *stretch* panel-regen only if Stage 3 finishes early (model-version coupling is a silent-failure trap).
- **No TrueFoundry/Bedrock as blockers.** OpenRouter is the default gateway (already wired). Bedrock = base-url swap, TrueFoundry = gateway swap — both 1-line, both Stage-4-stretch, neither on the critical path.
- **No SpiralControls designer panel.** Spiral is read-only viz; ship without the tuning sliders.

**Critical-path sponsors that must light up:** Bedrock/OpenRouter (LLM) → ClickHouse (archive+query) → Langfuse (traces) → Render (deploy) → Guild (the catch-it-cheating beat). Everything else is upside.

---

**Verified:** every source path in this PRD exists on disk — `doubles/src/{orchestrator,agents,llm}`, `gtm-tool/photon-gtm/{agents/1-research/prompt.md, scripts/scraper.py, connectors/*}`, and `work/apps/said-built/{app,components,lib}` were all inspected. `said-built` is Next 15 (`pnpm dev`); `doubles` is TS; the only non-TS code (Python scrapers) is shelled out, not ported in-language.
