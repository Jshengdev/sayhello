# PORT-MANIFEST — the literal copy list (fresh repo, lift libraries)

> Full module-by-module detail in docs/reference/PORT-INVENTORY.md. This is the short copy list.

## backend (← ~/code/doubles)
- `.env`                        → sayhello/.env (WORKING keys: OPENROUTER, Neon DATABASE_URL, FIRECRAWL)
- `src/agents/critic.ts` (+prompt) → packages/backend/src/agents/critic.ts (retarget axes to grounding/StoryScore)
- `src/llm/*` (openrouter, models, cost-ledger, invocation-log) → packages/backend/src/llm/  PORT-AS-IS
- `src/orchestrator/*`           → packages/backend/src/orchestrator/ (the loop driver)
- `src/web/server.ts` (express+ws skeleton) → packages/backend/src/server.ts
- `src/scrape/*`                 → reference for the scrape node (or use Firecrawl /v2/scrape directly)

## domain prompts (← ~/code/gtm-tool/photon-gtm) — copy as TS consts, not code
- `agents/1-research/prompt.md`  → the 26-field CompanyBrief schema (already in docs/CONTRACTS.md)
- `specs/narrative-framework.md` → the 6 pitch angles (PitchAngle type)

## frontend (← ~/code/work/apps/said-built)
- `app/globals.css` + paper-light tokens + fonts (Onest, IBM Plex Mono, Departure Mono) → PORT-AS-IS
- `components/mvp/today/LoopCanvas.tsx` + `SlipStrip.tsx` → the dashboard (Element A)
- `components/story/StoryCanvas.tsx` → the story view
- `components/lab/spiral/*` → the interactive generations spiral (Element B)
- `components/lab/{OrgChatFrame,StatusGroupCard,EmailReportPair,SalesTabsCard,EngineerChatCard}.tsx` → the 5 cofounder components to extend
- STRIP: campaigns/outreach/reports routes — not on the demo line.

## Rule
Copy modules, retarget data to StoryRun, build the product TODAY. Do not git-clone-and-rename (fresh-code rule).
