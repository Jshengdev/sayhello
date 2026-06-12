# PERSON-SCRAPE PORT — LinkedIn (HeyReach) + X scraper (copy-paste from doubles, TS, ready)

> The person-scrape already exists as clean TypeScript in doubles. COPY these into the backend and the
> person-enrich node calls them. ALL keys are in doubles/.env (copied at S0). This is the gtm-tool
> verification method, already ported to TS — do not rewrite it.

## Copy these files: `~/code/doubles/src/scrape/*` → `packages/backend/src/scrape/`
| file | size | exports | key |
|---|---|---|---|
| **heyreach.ts** | 199 | `getLead(profileUrl) → HeyReachLead {firstName,lastName,companyName,position,location,summary}` · `getNetwork(...)` | `HEYREACH_MCP_KEY`, `HEYREACH_ACCOUNT_ID` |
| **x.ts** | 254 | `scrapeX(handle) → XScrapeResult` · `fetchUserTweets(handle, days) → XUserTweet[]` (FAIL LOUD) | `X_BEARER_TOKEN` |
| **sixtyfour.ts** | 152 | person/company enrichment | `SIXTYFOUR_API_KEY` |
| **tinyfish.ts** | 368 | site scraper (Firecrawl fallback) | `TINYFISH_API_KEY` |
| **linkedin-paste-parser.ts** | 349 | parse a pasted LinkedIn profile → structured | none |
(Also copy the tiny `../logger.js` dep, or swap to console.)

## Keys — ALL present in doubles/.env (verified): `HEYREACH_API_KEY`, `HEYREACH_MCP_KEY`, `X_BEARER_TOKEN`, `SIXTYFOUR_API_KEY`, `TINYFISH_API_KEY`. Copy .env at S0 → person-scrape works with zero new keys.

## Wire it (the person-enrich node)
The target = company URL + the person. The person-enrich node:
1. `getLead(linkedinUrl)` → name, company, position, location, summary (HeyReach — free lookup, zero translation gap, it's the same index your CR fires against).
2. `fetchUserTweets(handle, 30)` → recent X activity (signal: what they care about right now).
3. (optional) `sixtyfour` / `tinyfish` for deeper enrichment.
→ merge into the target brief's person fields. Every fact becomes a Signal the held-out critic grounds against.
For Johnny's own profile in the demo: `https://www.linkedin.com/in/johnny--sheng/`.

## Demo-safe: CACHE the person-scrape
LinkedIn/X live calls are slow/flaky. Run ONCE for each demo target (real-estate + marketing person), save
to `data/leads/<id>.json`, and REPLAY at demo time. One live scrape on stage, cached fallback. (Reference
logic, if needed: gtm-tool `agents/2-contacts/heyreach_verify.py` + `agents/discovery/twitter-launches.py`.)
