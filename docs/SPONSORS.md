# SPONSORS — real capabilities + the enrichment stack (verified 2026-06-12)

> Focus on ABILITIES, not marketing. Each sponsor = a real seam in the node graph, named on screen.

## The enrichment data-source stack (URL → richest grounded story)
1. **scrape** — Firecrawl `POST /v2/scrape` `formats:["markdown"]` (fastest, already in gtm-tool, `Authorization: Bearer fc-...`). Zero-key fallback: Composio `COMPOSIO_SEARCH_FETCH_URL_CONTENT`.
2. **parse** — Pioneer `POST https://api.pioneer.ai/inference`, `X-API-Key`. GLiNER2 zero-shot: `{model_id:"fastino/gliner2-base-v1", text, schema:{entities:["funding_round","employee_count","tech_stack","founder_name","headquarters"]}, threshold:0.5}`. 15k/min cheap. ⚠️ MAKE ONE LIVE CALL to pin the response shape (field names `score` vs `confidence`, grouped vs flat) before building the parser.
3. **firmographics** — Composio `tools.execute(slug, user_id, arguments)`. FREE-FIRST (NO_AUTH `COMPOSIO_SEARCH`): `COMPOSIO_SEARCH_NEWS`, `_SEC_FILINGS` (EDGAR 10-K/8-K), `_FINANCE`. Then paid BYO-key: `APOLLO_ORGANIZATION_ENRICHMENT` (domain→firmographics), `CRUSTDATA_SCREENER_COMPANY_INFORMATION` (+ LinkedIn-person via `CRUSTDATA_ENRICH_PERSON_SCREENER`). NOTE: Composio `LINKEDIN` toolkit is publish-only, NOT a scraper — use Crustdata.
4. **builder-traction (THE DIFFERENTIATOR, free)** — ClickHouse public playground, no login: `https://sql-clickhouse.clickhouse.com:8443/?user=demo` (empty pw), CORS-enabled JSON-over-HTTP. `github_events` (9B+ rows, hourly): star-velocity (`event_type='WatchEvent'`), release cadence, distinct contributors. `hackernews` (28M+): launch score, mention trend, raw comment text. Run `SHOW TABLES` to confirm names. ~60-200 q/hr, best-effort.
5. **internal memory (optional)** — Airbyte Agent MCP `https://mcp.airbyte.ai/mcp`, `context_store_search` (structured filter, NOT semantic) over EXISTING HubSpot/Salesforce/Gong: "have we touched this account?". CANNOT source cold external data; initial indexing minutes-to-days → only if we have a CRM to demo.
6. **draft LLM routing (optional)** — TrueFoundry gateway: OpenAI-compatible proxy, all LLM calls → fallback + per-stage cost + OTel. Bring your own tools (no native search/scrape).
7. **render** — Thesys C1 `POST https://api.thesys.dev/v1/embed/chat/completions` (OpenAI SDK) → renderable React UI from JSON. Inline the StoryRun JSON into the message; `<C1Component>` renders adaptive dashboard/cards per company density. $10 + 5M tokens free.
8. **archive** — ClickHouse `story_runs` table (own Cloud trial or in-mem Map fallback). The trajectory query (`avg(grounding) by generation`) feeds the score panel.
9. **deploy** — Render: web service (the app) + cron/background-worker (scraper). One `render.yaml` Blueprint deploys the whole pipeline from one git push. Nightly cron pre-warms demo cache.
10. **trace** — Langfuse JS SDK wraps every node executor (one span each); open the trace in the demo.

## Innovative angles (abilities > marketing) — the lines that make each judge lean forward
- **ClickHouse:** "builder-traction lead score" — GitHub star-velocity + release cadence + HN launch sentiment, a growth signal that fires BEFORE funding/hiring data, from a free SQL endpoint. No competitor's static data has this.
- **Composio:** zero-config first-touch on NO_AUTH `COMPOSIO_SEARCH` (URL+news+SEC+finance), escalate to credit-burning Apollo/Crustdata only past a relevance threshold. SEC primary-source enrichment with no key is the non-obvious piece.
- **Pioneer:** two-tier confidence-gated extractor — GLiNER2 catches ~80%, only sub-threshold records escalate to Opus (via Pioneer's Anthropic-compatible gateway); feed LLM corrections back to sharpen GLiNER on company-data.
- **Thesys C1:** a self-designing report that morphs to each company's story density — data-rich → dashboard, thin → lean card. No hand-authored templates.
- **Render:** one `render.yaml` deploys cron-scraper + queue + enrichment worker + web frontend atomically.
- **TrueFoundry:** every harness LLM call through one endpoint = cross-provider fallback if Anthropic rate-limits mid-demo + judge-facing cost/OTel observability.

## WIRE vs SKIP
- **WIRE (core):** Firecrawl, Pioneer, Composio (NO_AUTH search first), ClickHouse playground, Thesys C1, Render, Langfuse.
- **WIRE IF TIME:** TrueFoundry (cheap, strong observability story), Guild gate.
- **SKIP:** Airbyte as enrichment source (no cold data, slow indexing); Bright Data/Apify (Firecrawl covers it faster); Composio LINKEDIN toolkit (publish-only).
- **UNVERIFIED — confirm before relying:** Pioneer `/inference` response field names; ClickHouse exact table names (`SHOW TABLES`); Composio Crunchbase/Hunter/Clearbit toolkits (likely absent); C1 production model id + data-payload field; Firecrawl free-credit count.
