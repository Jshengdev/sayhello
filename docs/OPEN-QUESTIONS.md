# Open questions

Most are now ANSWERED (moved to CONSTRAINTS/SCOPE-LOCK). Remaining truly-open items only.

## ANSWERED (see docs)
- Idea → SCOPE-LOCK.md (grounded GTM lead-story harness; catches the agent hallucinating).
- Hackathon/theme → Harness Engineering Hack; rubric 5×20% Idea/Tech/ToolUse/Presentation/Autonomy.
- Stack → TS monorepo: backend Express+ws (forks doubles), frontend Next (forks said-built). ARCHITECTURE.md.
- Live vs cached → live-scrape ONE lead; 2-3 cached in data/leads/ as fallback. ARCHITECTURE.md.
- Sponsors → CORE 5 (Firecrawl, ClickHouse, C1/OpenUI, Render, Langfuse) + held-out Critic. SCOPE-LOCK + SPONSORS.md.

## STILL OPEN (Johnny decides — don't block, flag if you collide)
- [ ] Final brand name (working: sayhello).
- [ ] The exact demo lead(s) + the specific fabricated claim to script for the catch beat.
- [ ] Narrative voice/copy in the story slides (tune AFTER the skeleton runs — leave prompts in editable consts).
- [ ] Pioneer parser: include as its own node, or fold into draft? (Include only if a ≤10-min drop-in.)
- [ ] ClickHouse: own Cloud trial for archive, or in-mem Map fallback? (Start in-mem; trial in parallel.)

## FINDINGS — inspiration sweep, 2026-06-12 (synthesizer; full map in docs/reference/INSPIRATION-MAP.md)
Convention: CONTRACTS.md wins on every contradiction. These are flags, not blockers.

- [ ] **CONTRACTS node shape vs jam pattern.** CONTRACTS L17 says `Node = { name, in: StoryRun, out: StoryRun, run(): emits WsEvent }`; jam nodes take narrow typed slices and never emit (engine hooks emit). CONTRACTS L7 itself says "typed StoryRun slice as I/O" — proposed resolution (INSPIRATION-MAP §2): nodes take slices, orchestrator merges into StoryRun, executeNode hooks emit WsEvents. Same observable stream. Johnny confirm or build to L17 literally.
- [ ] **jam executeWorkflow CANNOT run our regen loop** — `topologicalSort` throws on cycles. Not a contradiction (CONTRACTS already says orchestrator-as-engine) but a hard rule: do NOT port jam's DAG executor; do NOT claim we use it.
- [ ] **CLAUDE.md API table says `POST /story/run {url}`; CONTRACTS says `{industry, handle}`.** CONTRACTS + DECISIONS win — build `{industry, handle}`. CLAUDE.md table is stale.
- [ ] **ClickHouse playground tables are db-qualified** — `github.github_events`, `hackernews.hackernews` (+ cheap `github.repo_stars`, `github.repo_events_per_day`), NOT in `default` as SPONSORS.md assumes. Port 443 works, no `:8443`. Queries live-tested today, copy-paste ready in INSPIRATION-MAP §7.
- [ ] **render.yaml does NOT support Render Workflows** — contradicts SPONSORS.md "one render.yaml deploys the whole pipeline". Workflow service needs dashboard/CLI creation; no native scheduling (cron service → startTask). Workflows scale-lane is CUT-CANDIDATE per SCOPE-LOCK (multi-lead only-if-time), but sponsor says Workflows = MUST USE to win their prize — Johnny calls the trade.
- [ ] **Langfuse v4 env var is `LANGFUSE_BASE_URL`**, not `LANGFUSE_HOST` (v2/v3 name in KEYS.md). Set both.
- [ ] **ClickHouse / Langfuse / Thesys keys are NOT in doubles `.env`** — need signups (Langfuse free ~2 min; Thesys $10+5M tokens; ClickHouse Cloud trial optional, playground + Map fallback cover the demo).
- [ ] **Composio NO_AUTH scrape fallback: now verified.** doubles/icarus/gtm-tool contain no proven slug, but `COMPOSIO_SEARCH_FETCH_URL_CONTENT` (+21 other `COMPOSIO_SEARCH_*` slugs) verified live NO_AUTH via `@composio/core` `tools.execute(slug, {userId:"default", arguments})`. Keep as tertiary scrape fallback only; the claim-typed SEC/finance router stays CUT per SCOPE-LOCK.
- [ ] **Thesys repo pivoted: `thesysdev/openui` is now "OpenUI Lang"** (`@openuidev/*`) — OSS path runs on our existing OpenRouter key (zero-signup fallback). Build the render node LLM-swappable; either path qualifies for the prize.
- [ ] **Departure Mono is not on Google Fonts** and not loaded in said-built — need a `next/font/local` woff2 or substitute IBM Plex Mono `tabular-nums` for numerals.
- [ ] **Output-validation hardening (deliberate deviation from jam):** jam runtime-validates inputs only; we also `outputSchema.parse` every node result. On-message ("the harness validates its own outputs") — keep, and say so.
- [ ] **Fixture lead required (SOTARE R7):** the demo catch must never depend on the model happening to hallucinate — ship a `data/leads/` fixture that provably trips FABRICATED. Needs Johnny's demo-lead pick (ties to the open "exact demo lead" item above).

## FINDINGS — backend S1 build, 2026-06-12 (contract collisions, NOT silently decided)
- [x] **`WsEvent.node_enter` union has no `enrich`/`ground`** — RESOLVED by the S1 fixer (validator judged the fold a FAILURE; frontend voted widen): `node_enter` union widened to include `"enrich"|"ground"` in docs/CONTRACTS.md + backend `types.ts` + frontend `lib/types.ts` (all three in lockstep); `enrichNode.wireNode="enrich"`, `groundNode.wireNode="ground"`. `StoryRun.status` still folds the gather phase into `"scraping"` (status union unchanged).
- [ ] **`StoryRun` has NO `slides` field**, though CLAUDE.md/ARCHITECTURE say engine output includes slides. S1 keeps slides in a backend store side-map (`src/store/memory.ts`), NOT on the wire or the `done` event. Decide: extend StoryRun, or add `GET /story/:leadId/slides`?
- [ ] **`PitchAngle` union is gtm-flavored** — the realestate (forced-sale/inheritance/relocation) and marketing (brand-gap/channel/positioning) angles from DECISIONS §3 don't fit it. Stub lenses use nearest stand-ins (`src/lenses/{realestate,marketing}.ts`, marked TODO). Widen the union before any realestate/marketing demo?

## FINDINGS — frontend S1 build, 2026-06-12 (contract collisions, NOT silently decided)
- [x] **Frontend votes WIDEN `node_enter`** — RESOLVED: widened (see backend finding above). Composio + ClickHouse chips now light on the live pass.
- [ ] **`POST /story/:leadId/approve` is NOT in CONTRACTS.md's API table** but was specified in the frontend lane brief — the gate calls it (`components/ApproveGate.tsx`); approve failure renders the FAILED badge. Backend must implement it (200 = approved) or the gate fails loud.
- [ ] **Event ordering assumed `gate` → `done`** (per the lane brief's canned sequence): the frontend keeps the gate armed after `done` (approval is human-async). If backend instead holds `done` until after approve, nothing breaks — gate just disappears into the approved state later. Confirm ordering.
- [ ] **`StoryGeneration.costCents/latencyMs` aren't on any per-generation WsEvent** — frontend builds the trajectory from `score_done` (real scores) with cost/latency 0 until the `done` run snapshot replaces them. If per-gen cost matters mid-run, add fields to `score_done`.

## FINDINGS — S1 validation, 2026-06-12 (validator; evidence in .evidence/)
- [x] **DEMO-PATH BLOCKER: backend has NO CORS headers** — FIXED by the S1 fixer: hand-rolled CORS middleware in `packages/backend/src/server.ts` (allow-all origin, `Content-Type` header, OPTIONS preflight → 204, seam-logged). Verified: preflight returns `Access-Control-Allow-Origin: *`; UI-driven run-start AND hold-to-approve now succeed from :3100 (no FAILED badge, gate-stamp + confetti fire).
- [x] **Stub pipeline has ZERO pacing** — FIXED: `stubLatencyMs` per node (scrape 700 / enrich 650 / ground 600 / draft 800 / judge 900 / reenrich 750 / archive 500 / render 650), applied in `defineNode.run` ONLY in stub mode, loudly `[stub]`-logged. `STUB_PACE=0` disables for fast capture runs. handle→gate now ~6.1s; every chip visibly lights.
- [x] **`ground` chip never gets a visited dot** — FIXED: `LoopCanvas.tsx` visited-set adds scrape+enrich+ground when `run.brief` exists (brief lands via `scrape_done`, emitted after the whole gather phase).

## FINDINGS — seam-log audit + preflight, 2026-06-12 (runbook writer; gap table in docs/VALIDATION.md)
- [ ] **STUB_MODE polarity inverts CLAUDE.md constraint 1:** stubs are default-ON, opt-OUT via `STUB_MODE=0` (defineNode.ts:62) — opposite of "mocks env-gated dev-only (`MOCK_*=1`)". Visible at boot (server.ts:111) so not silent, but the S2 flip must set `STUB_MODE=0` everywhere (incl. any Render deploy env) or the demo runs canned data while looking live.
- [ ] **Seam 3 (critic → fabricatedClaims) + every per-node `[stub]` log live INSIDE `if (stubMode())` branches** — fixers replacing stub branches with live code will silently delete the demo-heart seam line unless it's hoisted to the shared path (VALIDATION.md gap #2). Don't decide silently; hoist when writing the live judge executor.
- [ ] **No Langfuse/Guild/workflow/ClickHouse-client code exists in packages/ yet** (grep clean) — when `guildGate.ts` lands, PRIZE-PLAN already mandates a visible-failure WsEvent (`guild-gate FAILED`); same seam-log shape should apply: `[seam] guild-gate -> agent=jshengdev~sayhello-gatekeeper -> verdict=BLOCK reason=... -> ok` / `-> timeout 15000ms -> FAIL (local-rule fallback)`.
- [ ] **Boot env-readiness check is entirely absent in packages/** — no file reads any sponsor env key at startup (doubles' `envReadiness()/bootBlockers()` pattern unported). Single biggest S2-flip risk: a dead key surfaces mid-run, not at boot. Spec'd as gap #1 in docs/VALIDATION.md.
- [ ] **Composio slug correction (live-verified today):** `COMPOSIO_SEARCH_NEWS` does NOT exist (404 Tool_ToolNotFound); the real NO_AUTH slug is `COMPOSIO_SEARCH_NEWS_SEARCH` (body requires `user_id` even NO_AUTH). The enrich node must use the `_SEARCH`-suffixed slug; earlier docs (KEYS.md row 2, PRIZE-PLAN row 4 chip label) name the un-suffixed one.
- [ ] **OpenRouter aliases resolve to canonical ids** (`anthropic/claude-sonnet-4.6` → `anthropic/claude-4.6-sonnet-20260217`, `qwen/qwen3-235b-a22b-2507` → `qwen/qwen3-235b-a22b-07-25`) — any held-out assert must compare model FAMILY (prefix before `/`-segment), never the exact id string.
- [ ] **Neon is TCP-reach-only verified** — `pg` not installed in packages/backend, so preflight can't run `SELECT 1`; preflight auto-upgrades the check if pg becomes resolvable. Only matters if Neon is actually used as the archive fallback.

## FINDINGS — seller-side evolution, 2026-06-12 1:30 PM (scenario author; full spec in docs/SCENARIOS.md + docs/LENSES-CONTENT.md)
- [ ] **JOHNNY EVOLUTION RECORDED: lens packs grow a SELLER side.** 3 scenarios: realestate (seller=Johnny → RE agencies, Carlos-grounded), marketing (seller=Johnny → agencies, Aiden-grounded), gtm (seller=Photon → AI startups, photon-gtm-grounded). Resolution vs SCOPE-LOCK "one company URL": seller = lens-pack DATA selected by `industry`; `RunInput {industry, handle}` unchanged; seller signals concat into the ONE evidence corpus (judge untouched).
- [ ] **Top-N discovery DEFERRED** — cached entry surface only (display rows labeled "pre-computed"); one-lead law stands; a real computed discovery step is post-hackathon.
- [ ] **Person-fixture BLOCKER:** `data/leads/person-johnny.json` needs Johnny's real LinkedIn paste + X handle in hand — inventing it is forbidden. LinkedIn live impossible (Firecrawl 403 hard-block, tested today); X live off the demo line (free-tier 429) — one setup-time scrapeX run, cached.
- [ ] **Planted-catch mechanism dependency:** the 6 fixtures in LENSES-CONTENT.md each carry ONE plausible-but-unsourced claim in the brief PROSE with no matching Signal. This only trips FABRICATED if the judge's evidence corpus = `signals[].detail` (+ scraped page text), NOT the brief summary prose. Build lane must keep that boundary or the deterministic catch dies.
- [ ] **PitchAngle union widening now demo-blocking:** the cached lens swap (realestate forced_sale/inheritance/relocation/absentee_fatigue, marketing brand_gap/channel/positioning) is IN the demo per SCENARIOS.md clock triage — widen the union or render angle from the lens const before freeze.
