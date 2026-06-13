# ARCHITECTURE — sayhello

## The node graph (JAM-style typed nodes; doubles' orchestrator is the engine)
```
[scrape] → [parse] → [draft] → [judge] ──emit──→ [archive] → [render]
                                  │
                                 regen
                                  ↓
                             [enrich] ──(≤2 retries)──→ back to [draft]
```
Each node = `defineNode({ inputSchema:zod, outputSchema:zod, executor })`. The accumulating `StoryRun`
is the context; each node reads its slice, writes its slice, emits a `WsEvent`. One Zod boundary per node.

## Per-node I/O (the typed contract)
| node | input | output | sponsor on this node |
|---|---|---|---|
| scrape | `{ url }` | `{ rawMarkdown }` | Firecrawl `/v2/scrape` (or Composio `COMPOSIO_SEARCH_FETCH_URL_CONTENT`, no-key) |
| parse | `{ rawMarkdown }` | `{ brief: CompanyBrief }` | Pioneer GLiNER `/inference` (zero-shot fields) |
| enrich-signals | `{ brief }` | `{ brief+signals }` | ClickHouse (github_events+hackernews) · Composio (SEC/news/finance free, Apollo/Crustdata paid) |
| draft | `{ brief, retryContext? }` | `{ story, pitch_angle }` | LLM via TrueFoundry gateway (optional) |
| judge | `{ brief, story }` | `{ score: StoryScore }` | held-out Critic (different model) |
| enrich (regen) | `{ brief, fabricatedClaims }` | `{ brief augmented }` → draft | re-scrape targeting gaps |
| archive | `{ StoryGeneration }` | `{ ok }` | ClickHouse story_runs (in-mem Map fallback) |
| render | `{ StoryRun }` | `{ slides }` | Thesys C1 / OpenUI |
Langfuse wraps EVERY node's executor (one span each).

## Engine I/O
- Input: `{ url: string, hint?: PitchAngle, maxRetries?: 2 }`
- Output: complete `StoryRun` — grounded story + StoryScore (w/ fabricatedClaims) + generations[] + slides + cost/latency.

## Monorepo layout
```
packages/backend  (TS, Express+ws)  ← forks ~/code/doubles
  src/server.ts            Express + ws (POST /story/run, GET /story/:id, WS /ws)
  src/orchestrator/        the loop driver (runStory)
  src/nodes/               scrape.ts parse.ts enrich.ts draft.ts judge.ts archive.ts render.ts  (defineNode each)
  src/agents/critic.ts     ← doubles (retarget to grounding axes)
  src/llm/                 ← doubles (openrouter, models, cost-ledger)  PORT-AS-IS
  src/enrich/              firecrawl.ts pioneer.ts clickhouse-public.ts composio.ts
  src/store/               clickhouse.ts (archive) + memory.ts (in-proc Map fallback)
  src/types.ts             ← verbatim from docs/CONTRACTS.md
packages/frontend (Next)  ← forks ~/code/work/apps/said-built
  app/page.tsx             Element A dashboard (node graph + status groups + report)
  components/              LoopCanvas, SlipStrip, StoryCanvas, spiral/*, the 5 lab/ components
  lib/ws.ts                useStoryRun hook → Context (binds components to live stream)
  app/globals.css          ← said-built paper-light tokens  PORT-AS-IS
data/leads/<id>.json       cached pre-scraped demo leads (fallback if live scrape 404s)
```

## Data flow
`POST /story/run {url}` → orchestrator runs nodes → each emits `WsEvent` over `/ws` → `lib/ws.ts` routes
events into LoopCanvas (node lights) / StoryCanvas (story) / spiral (generations) / SlipStrip (gate).
Every generation also → ClickHouse + in-proc Map, so `GET /story/:id` rehydrates on refresh.
The live trajectory query feeds the score panel.

## Real vs cached vs mocked
- Real: scrape/parse/judge live (default).
- Cached: 2-3 pre-scraped demo leads in `data/leads/` — live-scrape ONE on stage, cached as fallback.
- Mocked: dev-only, `MOCK_*=1`. No silent stubs — failures render a visible FAILED badge.
