# PRIZE-PLAN — prize targeting, synthesized from 3 probes (2026-06-12, freeze 2:50 PM)

## 0. RECORDED OVERRIDE
> **SCOPE-LOCK CUT-list amended by Johnny 2026-06-12 for prize targeting:** Guild and Airbyte re-evaluated
> (SCOPE-LOCK lines 42–43 stand otherwise). **The 6-step demo line itself is UNCHANGED** — every integration
> below sits ON the line or directly under it (deploy/trace). "Don't add a node for a badge" still applies.

## 1. THE LEDGER — ranked by expected-$ × feasibility ÷ wiring-minutes

| # | Prize | $$ | Status | Minutes | The one move |
|---|---|---|---|---|---|
| 1 | **ClickHouse** | $1k | **Wired by design; sharpen at S3** | ~5 | Chip on FIX beat: "grounded via ClickHouse github_events" + score-trajectory panel reads the archive table |
| 2 | **OpenUI / Thesys C1** | $1k | **Wired by design; sharpen at S3** | ~5 | Slide surface footer names "rendered by Thesys C1" + show the C1 spec JSON→UI swap on screen |
| 3 | **Langfuse** | $500 | **Wired by design; sharpen at S3** | ~5 | One span per node executor; on-screen trace-id chip linking to the live Langfuse trace |
| 4 | **Composio** | $200 | **Wired by design; sharpen at S3** | ~5 | Enrich chip names "Composio SEARCH_NEWS (NO_AUTH)" when a fix-source comes from it |
| 5 | **Render** | $1k credits | **GO — Workflows A2 mandatory** ("MUST USE Workflows") | 60–75 (+20 deploy) | Harness-as-durable-workflow thin twin; live demo stays local |
| 6 | **Guild** | $1k + $2.8k/7-slot pool | **GO — ship-gate**, conditional on 10-min CLI verify | 45–60 | `guild agent chat` shell-out gate; BLOCK-on-camera at step 4 |
| 7 | **Airbyte** | $1k | **CONDITIONAL GO — Candidate C only**, needs enrich node built | 45–55 | Live-execute GitHub connector as the FIX-step evidence call |

Rows 1–4 cost ~20 min total and are already load-bearing — do their sharpening moves first, at S3.

## 2. GO / NO-GO per probe

### Render Workflows — **GO (variant A2: thin twin). Mandatory for the credits prize.**
- **Integration:** `packages/backend/src/workflow.ts` (~40 lines): wrap the SAME pure node executors in
  `task({name,retry,timeoutSeconds}, fn)` from `@renderinc/sdk` + parent `storyRun(url)` task chaining
  scrape→draft→judge→(enrich→draft→judge)→archive. Add `"workflow": "tsx src/workflow.ts"` script. Keep
  executors free of ws/Express imports (required anyway). Trust the `render workflows init` template for
  `task()` arg order (beta API churn). Live demo NEVER routes through it — trigger one real cloud run pre-demo.
- **Deploy fixes regardless (do now, ~5 min):** `server.ts:7` → `Number(process.env.PORT) || 8787`; frontend
  start → `next start -p $PORT`; move `tsx` devDep → dependencies; root `render.yaml` (probe's draft, web
  services only — Blueprints can't create workflow services).
- **Minutes:** 60–75 (workflow.ts 25 · dashboard svc 15 · env 5 · verified cloud run 15 · slack) + ~20 deploy.
- **On screen:** Render dashboard run-tree tab (each node = a task run, retries visible) + badge "this harness
  also runs as a durable Render Workflow."
- **Johnny by hand:** ① open credits portal `credits-portal-mmdm.onrender.com/claim/harness-engineering-hack`
  in a browser (JS-rendered, not scriptable) → claim with Render account ② Account Settings → create
  `RENDER_API_KEY` → into `.env` ③ dashboard: New → Workflow → this repo → Node → build
  `corepack enable && pnpm install --frozen-lockfile` → start `pnpm --filter backend workflow` → paste env keys.
- **Badge-ware risk: LOW** — same executors (not a fork), real run, retry-loop is literally Workflows' pitch.
- **Fallback B** if orchestrator slips past ~1:30: `prewarmLead(url)` task → Firecrawl → ClickHouse `lead_cache`
  write; backend reads ClickHouse-first/local-JSON-second; cron job POSTs `/v1/tasks` nightly. On screen:
  cached-lead chip "pre-warmed by Render Workflow run tsk-… @ HH:MM". Risk MEDIUM ("why is one scrape a
  workflow?") — spec'd here so it's a 45-min drop-in, but A2 is the honest one.

### Guild — **GO (ship-gate), gated on a 10-min verify-first check.**
- **Note:** Devpost has NO explicit Guild-use requirement — we're eligible on thesis alone (harness intercepts
  rogue agent = literally their pitch). Wiring raises odds on the richest pool ($2,800/7 slots).
- **Integration:** publish `sayhello-gatekeeper` llmAgent (systemPrompt: StoryScore JSON in → ONLY
  `{"verdict":"BLOCK"|"ALLOW","reason"}` out; BLOCK if `fabricatedClaims` non-empty). Files: agent dir
  `packages/backend/guild/sayhello-gatekeeper/` + `packages/backend/src/enrich/guildGate.ts` (~30 lines:
  `execFile("guild",["agent","chat", payload], {cwd: agentDir}, 8s timeout)`, defensive JSON parse). Two honest
  call sites: (a) async fire right after first judge FAIL → chip during enrich (the on-camera interception);
  (b) on hold-to-approve — backend refuses `render` without ALLOW. Env-gated `GUILD_GATE=1`; CLI failure emits
  visible `guild-gate FAILED` WsEvent + local-rule fallback (no silent stub). Do NOT make the judge node itself
  a Guild agent (model unverifiable → breaks constraint 3; 8s external call on THE moment).
- **Minutes:** 45–60. **Verify first (10 min, abort gate):** `guild agent chat` stdout + latency, and
  `agent save --wait` time. If flaky → 20-min fallback (publish critic prompt to Agent Hub + live session tab;
  badge-ware risk HIGH, last resort) or honor the CUT.
- **On screen:** chip on judge/gate edge: "GUILD GATE: BLOCKED (no source for $40M Series B)" → later
  "GUILD GATE: ALLOW · session <id>"; optional second tab = Guild session audit log.
- **Johnny by hand:** ① app.guild.ai → Google/GitHub sign-in (free, no card) ② note workspace ③ demo laptop:
  `npm i -g @guildai/cli && guild auth login` (browser) → `guild auth status` → `guild workspace select`.
  No API keys exist — everything else agent-doable.
- **Badge-ware risk: MEDIUM, stated plainly** — ALLOW duplicates a local boolean; the defense is BLOCK
  genuinely prevents shipping in code + Guild session = audit trail of every ship decision. The BLOCK-on-camera
  beat converts it from badge to demo. **Local-only** (browser auth, no headless) — never on the Render deploy.

### Airbyte — **CONDITIONAL GO (Candidate C only). Original candidates A & B: DEAD.**
- **Evidence for the deaths:** Context Store is READ-ONLY (docs verbatim: "search operations only"), no
  arbitrary-document ingest exists, and initial indexing is "minutes to days" — SCOPE-LOCK's cut rationale is
  confirmed for the store. The ONLY fast path is live API passthrough:
  `POST api.airbyte.ai/api/v1/integrations/connectors/<id>/execute` (plain REST, fetch-able from TS; the
  Python-only SDK is irrelevant).
- **Integration:** when the Critic flags a FABRICATED claim, enrich calls the hosted GitHub connector
  (`repositories/api_search`, `organizations/get`, `releases/list`) for live proof → sourced Signal chip
  (`source:"airbyte:github"`) or the claim is cut. Files: `packages/backend/src/enrich/airbyte.ts` (~40 lines:
  cached token mint via `POST /api/v1/account/applications/token` + execute wrapper; env
  `AIRBYTE_CLIENT_ID/SECRET/CONNECTOR_ID`) + one call site in the enrich executor + "via Airbyte" chip label.
  No new node. Scope to claims ClickHouse can't ground (repo/org existence NOW, current releases) — never
  duplicate ClickHouse's historical grounding, never touch `context_store_search`.
- **Minutes:** 45–55, **abort checkpoint at minute 10** if app.airbyte.ai gates hosted execute behind
  payment/AO credits (free tier advertised, allotment unverified — the one open unknown).
- **On screen:** at THE FIX beat the red claim gains "verified live via Airbyte · github:org_repositories" —
  named at the demo's emotional peak.
- **Johnny by hand:** ① app.airbyte.ai signup (free) ② Profile page → copy client_id/client_secret to `.env`
  ③ GitHub PAT ④ one-time connector-create curl (probe has the exact body).
- **Badge-ware risk: MEDIUM** — one connector as a GitHub proxy; mitigated by framing managed-credential typed
  connectors as the harness's tool layer + run fails visibly if Airbyte returns nothing.
- **Hard dependency:** the enrich node must exist when this starts. If not → **stays CUT** (no other on-path seam).

## 3. THE EXECUTION ORDER (freeze 2:50 PM — bottleneck-first)

**NOW, in parallel (Johnny's hands, ~15 min wall-clock — these block everything below):**
- Render: claim credits portal in browser + create RENDER_API_KEY. Guild: app.guild.ai signup + CLI auth.
  Airbyte: signup + creds + PAT + connector curl. (Signups are the only non-agent-doable steps.)

**S3 (with archive/Langfuse/spiral/slides work):**
- Deploy fixes (PORT × 2, tsx dep, render.yaml) — 5 min, unblocks all Render work. **Do first.**
- Sharpening chips for ClickHouse / OpenUI / Langfuse / Composio — ~20 min total, on the demo line already.
- Render web-service deploy via render.yaml — ~20 min, sponsor-required baseline.
- Guild 10-min verify (`guild agent chat` latency) — cheap, decides the S4 slot early.

**S4 (after one lead runs end-to-end; demo path untouched):**
- **Render Workflows A2** — 60–75 min, MANDATORY for the credits prize; slot immediately after the orchestrator
  lands (needs pure executors). If orchestrator slips past ~1:30 → switch to Fallback B (spec above).
- **Guild ship-gate** — 45–60 min, only if verify passed; `GUILD_GATE=1` local-only; cuttable at 2:30 with
  zero demo damage (env flag off).
- **Airbyte enrich-evidence** — 45–55 min, ONLY if enrich node is live AND >60 min remain before freeze;
  minute-10 paywall abort.

**CUT (unchanged):** Pioneer node, Composio paid firmographics, TrueFoundry, Bright Data, Apify, multi-lead
parallelism, anything not serving step 4's catch. Guild/Airbyte revert to CUT the moment their gate fails.

**Priority collision rule:** if only one S4 slot survives, it's Render Workflows A2 (mandatory-for-prize +
lowest badge-ware risk), then Guild (richest pool), then Airbyte.
