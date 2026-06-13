# STATUS-AIRBYTE — the recall / memory add-on (worktree `feat/airbyte-recall`)

> Built in the isolated worktree `~/code/sayhello-airbyte`. Touches NO core demo files except one
> additive, env-guarded change to `server.ts` (a `/recall` route block + `PORT` made env-overridable).
> The main V2 demo does not depend on any of this. **Do NOT merge until V2 P0 is solid AND this works
> live against Notion/Airbyte** (see "What's blocked", below).

## TL;DR
sayhello's grounded stories become an **agent-queryable GTM memory**. Each story (lead, person,
industry, pains, angle, grounding score, grounded claims, fabricated/rejected claims) is written to a
Notion database "sayhello stories"; Airbyte's Notion connector syncs that DB into the Context Store;
a `/recall` panel queries it in plain language. Three tiers, demo-safe:
**Airbyte Context Store → Notion-direct → always-on local grounded corpus.**

## What works RIGHT NOW (verified, no external keys)
- **Normalizer** (`packages/backend/src/recall/storyRecord.ts`) — flattens both physical story shapes
  in `data/leads/*.json` (CompanyBrief fixtures + replay tapes) into one `StoryRecord`, de-duped by
  richness (a judged tape beats a brief; a failed/empty tape is skipped, never coerced into junk).
  **Verified: 6 grounded stories** across gtm / realestate / marketing (Lindy + RE-1/RE-2 + MK-1/MK-2
  + Retell), each carrying its angle + the planted/fabricated claim.
- **`GET /recall?q=…`** (+ `GET /recall/status`) wired into `server.ts` — plain-language queries
  ("which real-estate leads have we storied?", "what pains recur for marketing agencies?", "have we
  touched Lindy?") return correct, real, relevance-ranked results. `?cache=1` replays the last cached
  answer offline. Empty query → 400.
- **Answer caching** to `data/recall/*.json` — every recall is cached so the panel replays offline if
  the network is down at demo time (the `cache-replay` tier).
- **Recall panel** (`packages/frontend/app/recall/page.tsx`) — a SEPARATE `/recall` route (does NOT
  alter the main dashboard). Cofounder paper-light detail cards: lead, industry, angle, the key
  grounded fact, held-out grounding + verdict, the fabricated/rejected claim (pomegranate, the money
  shot), recurring pains, source provenance, and a Notion-page link when present. An honest tier badge
  shows WHICH memory layer answered (live vs replay).
- **Story → Notion writer** (`packages/backend/src/recall/notion.ts`) + seed
  (`packages/backend/scripts/seed-notion.ts`) — REST (no SDK), one page per story, upsert (re-seeding
  UPDATES, never duplicates), ensure-database (use `NOTION_DATABASE_ID` or create under
  `NOTION_PARENT_PAGE_ID`). **FAILS LOUD** with an actionable "set NOTION_API_KEY …" message + exit 1
  when unconfigured — no silent stub. Verified via `--dry-run` (normalizes + prints the table, no key).

### Evidence (`.evidence-airbyte/`)
- `recall-which-real-estate-leads-have-we-storied.png` — 2 RE cards (RE-1 forced_sale, RE-2 inheritance)
- `recall-have-we-touched-lindy.png` — the judged tape: grounding **0.50 · regen** + 3 fabricated claims caught
- `recall-what-pains-recur-for-marketing-agencies.png` — 3 marketing cards
- `api-recall-realestate.json`, `api-recall-lindy-cachereplay.json` (proves the `cache-replay` tier),
  `recall-status.json`, `seed-dryrun.txt`

## Is Airbyte Context Store indexing live yet? — NO (blocked on credentials)
The Airbyte tier is **built but not yet exercised live**. The MCP client (`recall/airbyte.ts`) targets
`https://mcp.airbyte.ai/mcp`, does the `initialize` handshake, and calls `context_store_search`. It is
NOT yet proven against a real account because:
1. Airbyte signup + Notion connector + Context Store sync have not been run (no `AIRBYTE_MCP_TOKEN`).
2. The exact `context_store_search` argument schema is finalized by the live `tools/list` handshake;
   Airbyte's public docs don't publish it. The client sends a permissive arg set and logs the server's
   verbatim error loudly if the tool name/args differ, so it's a 1-line adjustment once authenticated
   (`AIRBYTE_SEARCH_TOOL` / the `arguments` map in `airbyteSearch`).
When Airbyte is unconfigured/unreachable it logs loudly and falls through to Notion → local corpus —
it never fakes an Airbyte result.

## Is it demo-ready? — YES for the panel; NOT YET for the live Airbyte claim
- **Demo-ready now:** the `/recall` panel answers every plain-language query with real grounded
  stories from the local corpus (the `offline-cache` tier), with honest provenance and offline replay.
  This stands alone as a strong closing beat ("every story becomes memory you can ask later").
- **NOT yet:** the live "Best Use of Airbyte's Agent Engine" claim. Per the scope guardrail, only
  reselect that Devpost track once `context_store_search` returns real rows. Until then the panel
  honestly badges results as `via local grounded corpus` (replay), not Airbyte.

## What env keys the user still needs to set (to go fully live)
See `.env.example`. In priority order:
1. **`NOTION_API_KEY`** — internal integration token (https://www.notion.com/my-integrations). REQUIRED
   for the Notion writer + Notion-direct recall. **Share the target page/DB with the integration** or
   writes 404.
2. **`NOTION_DATABASE_ID`** (preferred) — an existing "sayhello stories" DB. OR **`NOTION_PARENT_PAGE_ID`**
   — a page the integration can edit, under which `seed-notion.ts` will CREATE the DB.
3. **`AIRBYTE_MCP_TOKEN`** (or `AIRBYTE_API_KEY`) — bearer/OAuth token for the Airbyte Agent MCP, after
   free signup at https://app.airbyte.ai, adding the Notion connector, and syncing the DB → Context
   Store. Indexing is slow — start this FIRST.

## Run it (worktree, parallel-safe ports)
```bash
# backend on 8799 (8787 is the main demo)
PORT=8799 STUB_MODE=1 pnpm --filter backend exec tsx src/server.ts
# frontend on 3177, pointed at the recall backend
NEXT_PUBLIC_API_URL=http://localhost:8799 pnpm --filter frontend exec next dev -p 3177
# open http://localhost:3177/recall

# seed Notion once creds are set (dry-run needs no key):
pnpm --filter backend exec tsx scripts/seed-notion.ts --dry-run
pnpm --filter backend exec tsx scripts/seed-notion.ts            # writes real pages

# re-capture screenshots:
node packages/frontend/scripts/recall-shot.mjs http://localhost:3177 "which real-estate leads have we storied?"
```

## Files (all in this worktree)
- `packages/backend/src/recall/storyRecord.ts` — normalizer (leads/*.json → StoryRecord[])
- `packages/backend/src/recall/notion.ts` — Story→Notion writer + Notion-direct query (REST, FAIL LOUD)
- `packages/backend/src/recall/airbyte.ts` — Airbyte Agent MCP `context_store_search` client
- `packages/backend/src/recall/recall.ts` — 3-tier engine + plain-language ranker + cache
- `packages/backend/scripts/seed-notion.ts` — seed the Notion DB from data/leads/*.json
- `packages/backend/src/server.ts` — **+** `GET /recall`, `GET /recall/status`, env-overridable `PORT`
- `packages/frontend/app/recall/page.tsx` — the recall panel (separate route)
- `packages/frontend/scripts/recall-shot.mjs` — Playwright verify + screenshot
- `data/recall/*.json` — cached recall answers (offline replay)
- `.env.example` — the env delta
