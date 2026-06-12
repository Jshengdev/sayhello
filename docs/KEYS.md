# KEYS — sponsor-per-step, what you HAVE vs GRAB. Build leans on a sponsor at EVERY step.

> At S0 copy `~/code/doubles/.env` → `./.env`. That gives you the core keys immediately (names below).
> Read the actual values from `./.env` after copying. NEVER paste secret values into chat/logs.

## The pipeline — every step is a sponsor (majority-sponsor-reliant by design)
| # | step (node) | sponsor | env key | status | how |
|---|---|---|---|---|---|
| 1 | **scrape** | **Firecrawl** | `FIRECRAWL_API_KEY` | ✅ HAVE | `POST https://api.firecrawl.dev/v2/scrape` `{url, formats:["markdown"]}`, `Authorization: Bearer ${FIRECRAWL_API_KEY}` |
| 2 | **enrich (firmographics/news/SEC)** | **Composio** | `COMPOSIO_API_KEY` | ✅ HAVE | `composio.tools.execute("COMPOSIO_SEARCH_*", ...)` — start with NO_AUTH `COMPOSIO_SEARCH_NEWS/_SEC_FILINGS/_FINANCE`; Apollo/Crustdata if a key is set |
| 3 | **grounding source (builder-traction)** | **ClickHouse** | — none — | ✅ NO KEY | `https://sql-clickhouse.clickhouse.com:8443/?user=demo` (empty pw). Query `github_events` (star-velocity, releases) + `hackernews` (launch traction). Real facts to ground claims against |
| 4 | **draft the story** | **OpenRouter** (LLM) | `OPENROUTER_API_KEY` | ✅ HAVE | drafter model (e.g. a strong model). OpenAI-compatible base url |
| 5 | **judge (held-out, MUST-FIX linter)** | **OpenRouter** | `OPENROUTER_API_KEY` | ✅ HAVE | **DIFFERENT model/family than the drafter** — held-out. Returns claims with ungrounded ones flagged FABRICATED |
| 6 | **trace the loop** | **Langfuse** | `LANGFUSE_PUBLIC_KEY` `LANGFUSE_SECRET_KEY` `LANGFUSE_HOST` | 🟡 GRAB (free, 2 min) | JS SDK wraps every node executor (one span each). Host: `https://us.cloud.langfuse.com` if US keys |
| 7 | **archive + trajectory** | **ClickHouse** (own) or Neon | `DATABASE_URL` (Neon) | ✅ HAVE (fallback) | in-mem Map first; Neon `DATABASE_URL` works now; own ClickHouse Cloud trial = parallel grab |
| 8 | **render the story → slides** | **Thesys C1 / OpenUI** | `THESYS_API_KEY` | 🟡 GRAB (free, console.thesys.dev) | `POST https://api.thesys.dev/v1/embed/chat/completions` (OpenAI SDK) → React `<C1Component>` from StoryRun JSON |
| 9 | **deploy live** | **Render** | `RENDER_API_KEY` | 🟡 GRAB (free) | `render.yaml` Blueprint: web service (app) + worker (scraper). Or Render MCP `https://mcp.render.com/mcp` |

## Already in doubles/.env (bonus enrichment, optional): `GITHUB_TOKEN`, `HUNTER_API_KEY`, `SIXTYFOUR_API_KEY`, `TINYFISH_API_KEY`, `X_BEARER_TOKEN`.
## NOT needed (cut/stretch): TrueFoundry, Pioneer — only if everything else ships and they're free.

## Start-now rule
Steps 1-5 + 7 work from doubles/.env with ZERO new keys → **the core loop (scrape→enrich→ground→draft→judge→archive) can be built and live-tested immediately.** Grab Langfuse + Thesys + Render in parallel (3 free signups) for steps 6/8/9. No step waits on a key it doesn't have.
