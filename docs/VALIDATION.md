# VALIDATION — the 4-layer runbook (2026-06-12, all outputs below are REAL observed)

> Run layers in order. Each layer = exact command + expected output + failure modes. Evidence lives in `.evidence/`.
> All paths absolute from repo root `/Users/johnnysheng/code/sayhello`. NEVER print secret values — names/status/lengths only.

## LAYER 1 — seams (every sponsor reachable, keys alive)

```bash
node /Users/johnnysheng/code/sayhello/scripts/preflight.mjs          # 12 live checks, ~2s, exit code = FAIL count
node /Users/johnnysheng/code/sayhello/scripts/preflight.mjs --deep   # + guild chat BLOCK test (5-20s) + ports 8787/3100
```

Expected (real, from `.evidence/preflight.txt` — default run, exit 0):

```
seam                   | status | evidence
-----------------------|--------|------------------------------------------------------------------------------------------
env                    | OK     | 11/11 required present; THESYS_API_KEY absent (optional — keyless OpenUI proven)
openrouter-drafter     | OK     | 200 model=anthropic/claude-4.6-sonnet-20260217 text="ok" cost=$0.000087 1749ms
openrouter-judge       | OK     | 200 model=qwen/qwen3-235b-a22b-07-25 text="OK" cost=$0.000001 328ms · held-out: family qwen != anthropic
openrouter-renderer    | OK     | 200 model=google/gemini-2.5-flash text="Okay." cost=$0.000006 680ms
firecrawl              | OK     | 200 markdown.length=167 (real scrape of example.com, 1 credit) 502ms
composio               | OK     | 200 results=5 for "Anthropic" (NO_AUTH COMPOSIO_SEARCH_NEWS_SEARCH) 584ms
clickhouse-playground  | OK     | 200 WatchEvents(anthropics/anthropic-sdk-typescript)=1294 elapsed=0.049566227s 336ms
clickhouse-cloud       | OK     | 200 story_runs rows=0 256ms
langfuse               | OK     | 200 projects=1 (us.cloud.langfuse.com) 229ms
render                 | OK     | 200 services=1 231ms
neon                   | OK     | TCP reachable …neon.tech:5432 140ms (pg not installed — SELECT 1 skipped)
guild                  | OK     | auth: authed (gate BLOCK test gated behind --deep)
backend:8787           | SKIP   | gated behind --deep        frontend:3100 | SKIP | gated behind --deep
[preflight] 12 OK · 0 FAIL · 2 SKIP · 1752ms total · exit 0
```

`--deep` adds (real, `.evidence/preflight-deep.txt`): `guild — OK · gate verdict=BLOCK reason="no source Signal for: raised a $40M Series B" 5535ms` · `backend:8787 — OK HTTP 200 /health` · `frontend:3100 — OK HTTP 200` → `14 OK · 0 FAIL · 0 SKIP`.

| Symptom | Root cause | Fix |
|---|---|---|
| `env — FAIL ... MISSING` | `.env` edited and a line merged/corrupted (the CLICKHOUSE_URL incident) | open `.env`, ensure ONE `KEY=value` per line; re-run |
| openrouter-* 401 | OPENROUTER_API_KEY dead/rotated | new key at openrouter.ai → `.env` |
| composio 404 `Tool_ToolNotFound` | wrong slug (`COMPOSIO_SEARCH_NEWS` does not exist) | use `COMPOSIO_SEARCH_NEWS_SEARCH`; body needs `user_id` even NO_AUTH |
| clickhouse-playground FAIL | unqualified table name or `:8443` port | db-qualify (`github.github_events`), plain 443: `https://sql-clickhouse.clickhouse.com/?user=demo` |
| clickhouse-cloud 401/404 | URL or table | `CLICKHOUSE_URL/USER/PASSWORD` from .env; table is `story_runs` (exists, verified today) |
| langfuse 401 | wrong base var | v4 SDK wants `LANGFUSE_BASE_URL` (us.cloud.langfuse.com), NOT `LANGFUSE_HOST` — set both |
| guild `not authed` | CLI auth/file | `guild auth status`; auth is `~/.guild/config.json`, not env |
| guild --deep timeout >25s | CLI auto-update lag or stdin attach | re-run once (update lag); ensure stdin detached (`stdio:["ignore",...]`) |

## LAYER 2 — pipe (stub): one lead streams the full WsEvent sequence

```bash
lsof -ti tcp:8787 | xargs kill -9 2>/dev/null; lsof -ti tcp:3100 | xargs kill -9 2>/dev/null   # kill stale ports
cd /Users/johnnysheng/code/sayhello && STUB_MODE=1 pnpm --filter backend dev                    # terminal A (STUB_PACE=0 for fast capture)
node /Users/johnnysheng/code/sayhello/packages/backend/scripts/capture-ws.mjs > /tmp/events.ndjson 2>/tmp/capture.err &  # terminal B; exit 0 on done
curl -s -X POST http://localhost:8787/story/run -H 'Content-Type: application/json' -d '{"industry":"gtm","handle":"https://linear.app"}'
```

Expected: `{"leadId":"ld_xxxxxxxx"}`, then 19 events in `/tmp/events.ndjson`, this exact order (real, `.evidence/s1-events.ndjson`, leadId `ld_a589277f` — types per `docs/CONTRACTS.md`):

```
run_started → node_enter:scrape → node_enter:enrich → node_enter:ground → scrape_done(brief, 5 signals)
→ node_enter:draft → draft_done(gen=0, pitch_angle=multi_channel) → node_enter:judge
→ score_done(gen=0, grounding=0.4, verdict=regen, fabricatedClaims=["raised a $40M Series B"])   ← THE CATCH
→ node_enter:reenrich → reenrich(reason="FABRICATED claim: \"raised a $40M Series B\" — no matching Signal...")
→ node_enter:draft → draft_done(gen=1) → node_enter:judge
→ score_done(gen=1, grounding=0.92, verdict=emit, fabricatedClaims=[])
→ gate(story, score) → node_enter:archive → node_enter:render → done(run: status=done, generation=1, generations[2])
```

```bash
LEAD=ld_xxxxxxxx   # from the POST response
curl -s -X POST http://localhost:8787/story/$LEAD/approve     # expect 200 (409 if gate not reached yet)
curl -s http://localhost:8787/story/$LEAD | python3 -c 'import json,sys; r=json.load(sys.stdin); print(r["status"], r["generation"], r["score"]["verdict"], len(r["generations"]))'
# expect: done 1 emit 2     ← rehydrate survives refresh
```

| Symptom | Root cause | Fix |
|---|---|---|
| POST hangs / ECONNREFUSED | backend not up or port stolen | kill-ports line above; check `[seam] server up :8787 (STUB_MODE=...)` boot line |
| capture exit 2 (90s timeout) | run stalled mid-pipe | read last `[seam] node:* enter` in backend log — that node is the bottleneck |
| capture exit 1 | `failed` event emitted | the event carries `{stage, error}` — FAILED badge data; fix that node |
| capture exit 3 | ws connect failed | backend ws not mounted at `/ws`, or Node <22 (needs global WebSocket) |
| events fire instantly, no pacing | `STUB_PACE=0` set | unset for demo-feel (~6.1s handle→gate) |
| approve → 404 | wrong leadId — and backend logs NOTHING (seam gap #6) | check leadId; gap #6 in the list below |
| pnpm install/dev flakes | pnpm lockfile race (parallel workflows installing) | re-run once; never `pnpm install` while the build workflow is mid-install |

## LAYER 3 — real data (STUB_MODE=0): every sponsor fires on the demo line

> NOTE: as of the S1 audit every live branch throws `"X live mode lands at S2"` — this layer goes green only after the S2 flip. The proof lines below are the acceptance criteria for that flip.

```bash
lsof -ti tcp:8787 | xargs kill -9 2>/dev/null
cd /Users/johnnysheng/code/sayhello && STUB_MODE=0 pnpm --filter backend dev    # stubs are default-ON; live REQUIRES explicit STUB_MODE=0
node /Users/johnnysheng/code/sayhello/packages/backend/scripts/capture-ws.mjs > /tmp/live-events.ndjson &
curl -s -X POST http://localhost:8787/story/run -H 'Content-Type: application/json' -d '{"industry":"gtm","handle":"<DEMO LEAD URL>"}'
```

Proof each sponsor fired (grep backend log; shapes match preflight's live-verified calls):
- **Firecrawl**: `[seam] node:scrape ... POST api.firecrawl.dev/v2/scrape -> HTTP 200 markdown.length=<n>` (n>0; preflight saw 167 for example.com)
- **Composio**: `[seam] node:enrich ... COMPOSIO_SEARCH_NEWS_SEARCH -> HTTP 200 results=<n>` — slug MUST be the `_SEARCH`-suffixed one
- **ClickHouse grounding**: `[seam] node:ground -> sql-clickhouse.clickhouse.com -> HTTP 200 rows_read=<n>` (db-qualified `github.github_events`)
- **OpenRouter both models, held-out**: drafter echoes `anthropic/claude-4.6-sonnet-20260217`, judge echoes `qwen/qwen3-235b-a22b-07-25` (aliases resolve to canonical ids — assert on FAMILY prefix `qwen != anthropic`, not exact id)
- **THE CATCH**: `[seam] critic -> ... fabricatedClaims=["<claim verbatim>"] -> verdict=regen` — gen-0 `score_done` has non-empty `fabricatedClaims`
- **ClickHouse archive**: `[seam] clickhouse write -> story_runs leadId=... -> HTTP 200, <n> rows` then `curl` cloud `SELECT count() FROM story_runs` > 0 (was 0 pre-archive)
- **OpenUI render**: `[seam] node:render -> google/gemini-2.5-flash (reasoning disabled) -> HTTP 200` (~703ms proven; keyless — no THESYS_API_KEY gate)
- **Money is real**: final `done` run has `costCents > 0` (stub runs show 0)

**Fixture-lead rule (SOTARE R7):** the demo catch must NEVER depend on the model happening to hallucinate. Ship a `data/leads/<id>.json` fixture whose brief provably trips FABRICATED (e.g. funding claim with `funding_stage=null` and no funding Signal) and demo against it; live-lead catch is a bonus, not the plan.

| Symptom | Root cause | Fix |
|---|---|---|
| run uses canned Linear data while "live" | STUB_MODE polarity — stubs default-ON, opt-OUT | `STUB_MODE=0` everywhere incl. any Render deploy env |
| node throws `live mode lands at S2` | that executor's live branch not written yet | this layer waits on the S2 flip for that node |
| scrape 402 | Firecrawl credits | log shows `HTTP 402 (body <n> bytes)` — top up or fall back to `data/leads/` cached |
| judge passes the planted claim | judge prompt drift, or fixture's Signal accidentally supports it | fixture must have NO matching Signal; verdict is fail-CLOSED on grounding<0.7 |
| renderer hangs/expensive | gemini **3.5** has mandatory reasoning | stay on `google/gemini-2.5-flash` with reasoning disabled (703ms proven) |
| archive write OK but rows=0 on read | async insert not flushed / wrong db | read CH summary header `written_rows`; query same `CLICKHOUSE_URL` database |

## LAYER 4 — UI live (:3100, the judge's view)

Open http://localhost:3100 (backend up per Layer 2/3), enter industry=gtm + handle in the form, run. Checklist:
- [ ] "harness live" ws indicator on load (ws connected before run)
- [ ] nodes light IN ORDER scrape→enrich→ground→draft→judge(→reenrich→draft→judge)→archive→render; violet `--live` ONLY on the executing node (never two)
- [ ] red FABRICATED claim renders the INSTANT gen-0 `score_done` lands (real check: `mark.claim-bad="raised a $40M Series B" color=rgb(200,36,26)`) + Critic card with grounding=0.4
- [ ] spiral shows gen-0 → gen-1 (blur-up swap between generations)
- [ ] gate appears after `emit`; hold-to-approve → gate-stamp + confetti (confetti ONLY here)
- [ ] induced failure (kill backend mid-run / bad handle) → FAILED badge with stage+error, no blank panel

Playwright (uses frontend's own playwright install; writes PASS/FAIL lines + `.evidence/s1-mid.png`, `s1-done.png`, `s1-ui-checks.json`):
```bash
node /Users/johnnysheng/code/sayhello/.evidence/s1-ui-drive.cjs        # full drive: form-run, node lighting, red claim, spiral, hold-to-approve
node -e 'const{chromium}=require("/Users/johnnysheng/code/sayhello/packages/frontend/node_modules/playwright");(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.goto("http://localhost:3100");await p.waitForSelector("text=harness live",{timeout:15000});console.log("PASS: ws live");await b.close()})()'
```

| Symptom | Root cause | Fix |
|---|---|---|
| form run → FAILED badge instantly | CORS (was the S1 blocker, fixed in server.ts) | check `Access-Control-Allow-Origin: *` on OPTIONS preflight |
| dashboard silent during run | ws clients=0 (dashboard connected after run start, or wrong port) | refresh BEFORE POSTing; rehydrate via GET covers refresh mid-run |
| nodes light but no red claim | reducer consumed `score_done` but component didn't paint (seam gap #5 — no paint-confirm logs) | check browser console `[seam] ... fabricatedClaims` RED line; gap #5 below |
| chips all light at once | `STUB_PACE=0` | unset it |

## THE DEBUG DECISION TREE — "X is broken → look at Y → run Z"

- **Everything 401/MISSING at once** → `.env` corrupted by a merged line (the CLICKHOUSE_URL incident: a value containing `&` ate the next line) → open `.env`, one `KEY=value` per line → `node scripts/preflight.mjs`
- **`source .env` errors in shell** → `.env` is NOT shell-sourceable (raw `&` in a value) → never `source` it; parse line-by-line (preflight.mjs has the parser to copy)
- **Guild output unparseable** → session preamble before the JSON → regex-extract the LAST `{...}` from stdout; never `JSON.parse(stdout)` raw
- **Guild hangs forever** → stdin attached → spawn with stdin detached/ignored; budget 5-20s; first call after install/auto-update is slowest → warm it once pre-demo
- **Guild agent behaves stale after edit** → publish/auto-update lag → re-`guild agent save --publish`, then `guild agent list` to confirm version (proven good: jshengdev~sayhello-gatekeeper v1.0.5)
- **ClickHouse playground 404/unknown table** → unqualified name or `:8443` → `github.github_events` / `hackernews.hackernews` / `github.repo_stars`, port 443, `?user=demo`
- **Langfuse SDK silently no-ops** → `LANGFUSE_HOST` set but v4 reads `LANGFUSE_BASE_URL` → set both, base = `https://us.cloud.langfuse.com`
- **Render node slow/looping thoughts** → someone swapped to gemini 3.5 (reasoning mandatory) → pin `google/gemini-2.5-flash`, reasoning disabled (703ms proven)
- **Held-out assert fires wrongly** → OpenRouter returns canonical ids, not the alias you sent (`anthropic/claude-sonnet-4.6` → `anthropic/claude-4.6-sonnet-20260217`) → assert on family prefix before `/`-segment, not full id
- **Composio 404** → un-suffixed slug → `COMPOSIO_SEARCH_NEWS_SEARCH`, body `{"user_id":"<any>","arguments":{...}}`, header `x-api-key`
- **pnpm explodes mid-build** → lockfile race with the parallel build workflow → wait, re-run; don't run two installs concurrently
- **Live run looks right but data is canned** → STUB_MODE default-ON → boot log says `STUB_MODE=...`; demand `STUB_MODE=0` for live, also on Render

## SEAM-LOG GAP LIST — feed to next fixer round (verbatim from the S1 audit)

| # | Seam | Current state (file:line evidence) | What's missing for debuggability | Exact suggested log line |
|---|---|---|---|---|
| 1 | **Boot env readiness** (INSPIRATION-MAP §4 pattern) | ABSENT. Only `server.ts:111` `[seam] server up :8787 (STUB_MODE=...)`. Zero sponsor-key checks anywhere in packages/ | An `envReadiness()` in server boot that checks presence (not value) of `FIRECRAWL_API_KEY OPENROUTER_API_KEY COMPOSIO_API_KEY CLICKHOUSE_URL CLICKHOUSE_USER CLICKHOUSE_PASSWORD LANGFUSE_PUBLIC_KEY LANGFUSE_SECRET_KEY LANGFUSE_BASE_URL RENDER_API_KEY` and prints one line per key at startup. Never print values/lengths of secrets in app logs — SET/MISSING only | `[seam] env -> FIRECRAWL_API_KEY -> SET -> ok` / `[seam] env -> CLICKHOUSE_PASSWORD -> MISSING -> FAIL (live scrape will refuse; STUB_MODE unaffected)` |
| 2 | **Seam 3: critic → grounding → fabricatedClaims verbatim** | Present ONLY inside `if (stubMode())` — judge.ts:55-61. Live branch (judge.ts:64) throws before any seam-3 log could fire | The demo-heart log will silently vanish when the S2 live executor replaces the stub branch. Hoist the log AFTER score is produced, shared by stub+live paths (e.g. log in executor just before `return {score}`, or in orchestrator after `judgeNode.run`) | `[seam] critic -> model=qwen/qwen3-235b-a22b-2507 (held-out vs anthropic/claude-sonnet-4.6) -> grounding=${score.grounding} -> fabricatedClaims=${JSON.stringify(score.fabricatedClaims)} -> verdict=${score.verdict} -> ok` |
| 3 | **Live-path failure specificity** (all 6 sponsor nodes) | Every live branch throws generic placeholder: scrape.ts:57, enrich.ts:93+124, ground.ts:45, draft.ts:73, judge.ts:64, archive.ts:29, render.ts:40 — `"X live mode lands at S2 — run with STUB_MODE unset/1"`. None names an env key or an HTTP status | When fixers write live executors: (a) pre-check the key and throw naming it; (b) on HTTP failure log status + body length, never the key. Per-node keys: scrape→FIRECRAWL_API_KEY; enrich/reenrich→COMPOSIO_API_KEY; ground→none (playground, log host+HTTP status); draft/judge→OPENROUTER_API_KEY (+model id); archive→CLICKHOUSE_URL/USER/PASSWORD; render→keyless OpenUI via OPENROUTER_API_KEY (THESYS_API_KEY intentionally absent — do NOT gate on it) | `[seam] node:scrape -> FIRECRAWL_API_KEY missing -> FAIL (set it in .env or run STUB_MODE=1)` and `[seam] node:scrape -> POST api.firecrawl.dev/v2/scrape -> HTTP 402 -> FAIL (body 88 bytes)` |
| 4 | **Seam 6: ClickHouse write + trajectory query** | Write: stub-only, archive.ts:23-25 logs `[seam] clickhouse write -> story_runs leadId=... -> N rows -> ok (stub in-mem)` — correctly marked stub. Trajectory QUERY: **zero code anywhere** (backend has no read path; frontend spiral feeds off ws `generations[]` only) | Live insert must log row count from CH summary header + FAIL with which of CLICKHOUSE_URL/USER/PASSWORD is missing or the HTTP status. Trajectory query needs its own seam line when S3 lands (BUILD-LOOP seam 6 names both halves) | `[seam] clickhouse write -> story_runs leadId=${leadId} -> HTTP 200, ${written_rows} rows -> ok (${ms}ms)` and `[seam] clickhouse trajectory -> SELECT ... WHERE lead_id='${leadId}' -> ${rows.length} rows -> ok` |
| 5 | **Seam 5: frontend event → consumer → render ok/FAIL** | Present, ws.ts:267-279 (incl. dedicated fabricatedClaims-RED line at :273). BUT "consumed by X" is a static lookup (CONSUMERS map ws.ts:58-68) and "ok" = the reducer didn't throw — no component confirms it painted; components/ have zero console statements (grep clean) | Low-cost fix: one mount-effect log in the two demo-critical components so "render ok" is real for the catch beat and the FAILED badge | In ScorePanel/StoryCanvas claim list: `console.log('[seam] render -> ScorePanel fabricatedClaims(${n}) painted RED -> ok')`; in FailedBadge: `console.log('[seam] render -> FailedBadge stage=${failure.stage} painted -> ok')` |
| 6 | **Seam 1/route FAILs: unlogged 404s** | Seam 1 itself solid (server.ts:66 FAIL, :72-74 ok). But `GET /story/:leadId` 404 (server.ts:85-90) and approve 404 (server.ts:95-99) return errors with NO `[seam]` log; only the approve 409 logs (server.ts:101) | A refresh-rehydrate miss during the demo would be invisible in backend logs (frontend does log it, ws.ts:329-332) | `console.error('[seam] GET /story/${leadId} -> unknown leadId -> 404 -> FAIL')` (and same shape for approve 404) |
| 7 | **Seam 2: node enter/exit** | GOOD — centralized defineNode.ts:83 (enter, input keys + sponsor), :97 (exit, output keys + latency), :101 (FAIL + latency); zod errors carry field paths. node_enter WsEvent emitted before execute (:85) | Nothing blocking. Nice-to-have once live: append `mode=stub\|live` so a mixed-mode run (some nodes live, some stubbed) is readable at a glance | `[seam] node:draft enter -> {brief,generation,industry} (sponsor: OpenRouter · drafter, mode=live)` |
| 8 | **Seam 4: WsEvent emitted** | GOOD — server.ts:50 logs type + payload keys + client count on every broadcast | None. (If clients=0 during a run, that's the silent-dashboard bug — worth a WARN) | `[seam] ws emit -> ${e.type} -> clients=0 -> WARN (no dashboard connected)` |
