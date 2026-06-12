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

### Guild — **GO (A+B evidence-gate): ONE agent — ship-gate floor (A) + governed-Firecrawl evidence upgrade (B). Verify-first.**
- **The call, plainly:** primary = **A+B as a single published agent `sayhello-evidence-gate`**. A (no-tool
  BLOCK/ALLOW ship-gate on StoryScore; BLOCK if `fabricatedClaims` non-empty) is the guaranteed floor and ships
  regardless. B (the agent re-scrapes the flagged claim's source through Johnny's CONNECTED Firecrawl credential
  at the FIX beat) is a +15–20-min upgrade on A's plumbing, attempted ONLY if verify steps ②–③ clear the
  firecrawl integration. Why B wins judging: the prize is "Most Innovative Use of Agents" — a governed tool call
  with org-credential injection + session audit trail at the demo's emotional peak demonstrates Guild's flagship
  mechanic; a no-tool JSON classifier doesn't. Degrade path is free: delete the `tools` line and B collapses
  back to A. (Devpost note unchanged: no explicit Guild-use requirement — eligible on thesis alone; wiring
  raises odds on the richest pool, $2,800/7 slots.)
- **Probe corrections to the prior plan:** invoke the *published* agent via
  `guild chat --agent <identifier> --once '<payload>'` — NOT cwd-bound `guild agent chat` — because only the
  published path creates a platform session (= the judge-facing audit artifact). `guild workspace agent add
  <identifier>` is a required extra step. No public HTTP API exists — spend zero minutes hunting one. Auth is
  file-based (`~/.guild/config.json`), so `execFile` from Express inherits it with no env plumbing. The old 8s
  timeout was too tight → **15s (A) / 45s-async (B)**.
- **Agent definition** (`packages/backend/guild/sayhello-evidence-gate/agent.ts`):
  ```ts
  import { llmAgent, guildTools, pick } from "@guildai/agents-sdk"
  import { fireCrawlTools } from "@guildai-services/<org>~firecrawl"  // exact id + export name = verify ②–③
  export default llmAgent({
    description: "Ship-gate: verifies flagged claims against live web evidence.",
    tools: { ...pick(fireCrawlTools, ["firecrawl_scrape"]), ...guildTools },  // DELETE this line = shape-A floor
    systemPrompt: GATE_PROMPT,  // in: StoryScore + flagged claim + source URL → out: ONLY raw JSON
                                // {"verdict":"BLOCK"|"ALLOW","reason","evidenceUrl"} (llmAgent I/O is plain
                                // text — the JSON rides inside it; prompt must demand no prose)
  })
  ```
  The explicit `tools` declaration IS the judge line: Guild's runtime injects the org's Firecrawl credential at
  call time and "agents never see raw API keys" — *the harness's tool layer is itself governed, with an audit
  trail*. Agent model comes from the workspace owner's LLM settings (no per-agent pinning) → the judge node is
  NEVER a Guild agent (model unverifiable → constraint 3 stands; THE moment stays internal).
- **Publish flow (~10–20 min incl. npm install):** `guild agent init --name sayhello-evidence-gate --template
  LLM` → edit agent.ts → npm install → `guild agent test '<payload>'` → `guild agent save --message v1 --wait
  --publish` → `guild agent list` (grab identifier) → `guild workspace agent add <identifier>`. No review gate.
- **Backend call site** (`packages/backend/src/enrich/guildGate.ts`, ~30 lines):
  `execFile("guild", ["chat","--agent",GUILD_AGENT_ID,"--once",payload], {timeout})`; defensive parse =
  regex-extract the LAST JSON object from stdout (literal stdout shape UNVERIFIED — capture it raw in verify ⑤;
  try `guild config set json true`). Two honest beats: (a) fire **async at first judge-FAIL, concurrent with
  our own re-enrich** — B's realistic 15–40s hides inside the already-slow FIX segment, NEVER synchronous on
  camera; surface whichever evidence lands first as the chip at THE FIX beat; (b) hold-to-approve — backend
  refuses `render` without ALLOW. Env-gated `GUILD_GATE=1`, **local-only** (browser auth — never on the Render
  deploy); any CLI failure/timeout emits a visible `guild-gate FAILED` WsEvent + local-rule fallback. No silent
  stub. If the firecrawl package never resolves, `guild_experimental_fetch` (raw HTTP, no JS render) is a weak
  B-fallback — prefer dropping to A; firecrawl-through-Guild is the prize story.
- **On screen:** chip "GUILD GATE: BLOCKED — no source for '$40M Series B' · session <id>" → after the fix
  "GUILD GATE: ALLOW · evidence via guild~firecrawl". Audit trail for the judge: second browser tab =
  app.guild.ai session view (deep-link URL format undocumented — **copy it from the address bar during verify
  ⑥**) and/or terminal `guild session events <id>` live event stream. Confirm the session log visibly itemizes
  the Firecrawl tool call BEFORE promising that shot in DEMO-SCRIPT.
- **10-min live verify (run the MOMENT Johnny's CLI auth lands; abort-ordered):**
  ① `guild auth status && guild workspace list && guild workspace select <ws>` (1m)
  ② `guild integration list --published` → exact firecrawl `org~service` id; `guild integration get <id>` →
  tool names (2m — **B aborts here if absent; A proceeds**)
  ③ `guild agent init --template LLM` + npm install → does `@guildai-services/<org>~firecrawl` resolve, what's
  the export name (3m)
  ④ `time guild agent test '<StoryScore payload>'` no-tools → raw stdout shape + latency (2m — **abort ALL if
  >20s or unparseable**)
  ⑤ save/publish/install (flow above) → `time guild chat --agent <id> --once '<payload>'`; try
  `guild config set json true` (2m)
  ⑥ `guild session list` → `guild session events <id>` + open the session in the browser → **copy the
  deep-link URL**; eyeball whether tool calls are itemized
  ⑦ B only: add the firecrawl tool, re-save, `time` the tool-call turn → that number is the real 45s-class
  timeout constant.
- **Minutes:** verify 10 · A floor 45–60 (publish + guildGate.ts + chips) · +15–20 for B (tool add + re-publish
  + timeout calibration). If verify is flaky → honor the CUT (old Agent-Hub-prompt-only fallback stays last
  resort; badge-ware risk HIGH).
- **Johnny by hand (delta from done):** ✅ signed in to app.guild.ai · firecrawl credential connect +
  `guild auth login` in flight · **confirm Settings > LLM has managed tokens or BYOK** (agent runs fail without
  it) · during verify ⑥, copy the session URL for the demo audit tab.
- **Badge-ware risk:** A alone MEDIUM, stated plainly (ALLOW duplicates a local boolean; defense = BLOCK
  genuinely prevents shipping in code + sessions = audit trail of every ship decision). **A+B LOW** — a live
  governed tool call with injected credentials at the emotional peak is the platform's actual pitch, not a badge.

### Airbyte — **SUPERSEDED by Guild shape B unless both fit** (was: CONDITIONAL GO, Candidate C; original candidates A & B: DEAD).
- **Why superseded:** Guild shape B occupies the exact same FIX-step live-evidence seam, and once Guild A's
  plumbing exists it costs ~15–20 min vs Airbyte's 45–55 plus an unverified paywall risk — run Airbyte only if
  both fit before freeze (spec below stands unchanged for that case).
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
- Render: claim credits portal in browser + create RENDER_API_KEY. Guild: ✅ signed in; CLI auth + firecrawl
  credential connect in flight; confirm Settings > LLM (managed tokens or BYOK).
  Airbyte: signup + creds + PAT + connector curl. (Signups are the only non-agent-doable steps.)

**S3 (with archive/Langfuse/spiral/slides work):**
- Deploy fixes (PORT × 2, tsx dep, render.yaml) — 5 min, unblocks all Render work. **Do first.**
- Sharpening chips for ClickHouse / OpenUI / Langfuse / Composio — ~20 min total, on the demo line already.
- Render web-service deploy via render.yaml — ~20 min, sponsor-required baseline.
- Guild 10-min verify (`guild chat --agent --once` latency + firecrawl integration resolve) — run the moment
  CLI auth lands; decides A-only vs A+B early.

**S4 (after one lead runs end-to-end; demo path untouched):**
- **Render Workflows A2** — 60–75 min, MANDATORY for the credits prize; slot immediately after the orchestrator
  lands (needs pure executors). If orchestrator slips past ~1:30 → switch to Fallback B (spec above).
- **Guild evidence-gate (A floor + B upgrade)** — 45–60 min A (+15–20 B, only if verify cleared firecrawl);
  `GUILD_GATE=1` local-only; B supersedes the Airbyte FIX-seam slot unless both fit; cuttable at 2:30 with
  zero demo damage (env flag off).
- **Airbyte enrich-evidence** — 45–55 min, ONLY if enrich node is live AND >60 min remain before freeze;
  minute-10 paywall abort.

**CUT (unchanged):** Pioneer node, Composio paid firmographics, TrueFoundry, Bright Data, Apify, multi-lead
parallelism, anything not serving step 4's catch. Guild/Airbyte revert to CUT the moment their gate fails.

**Priority collision rule:** if only one S4 slot survives, it's Render Workflows A2 (mandatory-for-prize +
lowest badge-ware risk), then Guild (richest pool), then Airbyte.
