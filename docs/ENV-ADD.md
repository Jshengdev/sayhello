# ENV — exact delta. Copy doubles/.env, then ADD 5 keys. Nothing else.

## Step 1: `cp ~/code/doubles/.env ~/code/sayhello/.env`
That gives you (verified present — do NOT re-add): OPENROUTER_API_KEY, FIRECRAWL_API_KEY, COMPOSIO_API_KEY,
DATABASE_URL, HEYREACH_API_KEY, HEYREACH_MCP_KEY, HEYREACH_ACCOUNT_ID, X_BEARER_TOKEN, SIXTYFOUR_API_KEY,
TINYFISH_API_KEY. → scrape, person-scrape, enrich, draft, judge, persist all work with ZERO new keys.
ClickHouse grounding needs NO key (public playground).

## Step 2: append these 5 (free grabs, ~5 min total)
```bash
# Langfuse — trace every node (free signup → langfuse.com)
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=https://us.cloud.langfuse.com
# Thesys C1 / OpenUI — the generated story + outreach report (console.thesys.dev)
THESYS_API_KEY=sk-th-...
# Render — deploy the live URL (render.com → Account → API Keys)
RENDER_API_KEY=rnd_...
```
That's the entire env. 10 keys copied + 5 added = the whole sponsor stack.
