# FINAL PROMPT — paste into the build window. Scoped EXACT to the live e2e demo. No deviation.

---

You are the build engine for **sayhello** (`~/code/sayhello`). S0+S1 done (stub end-to-end, validated).
Submit **4:00 PM**. Build V2 with a Workflow + your own judgment, scoped EXACTLY to the one live demo below.
**Read first:** `docs/SCENARIOS.md`, `docs/VISUAL-SPEC.md`, `docs/PERSON-SCRAPE-PORT.md`, `docs/ENV-ADD.md`,
`docs/CONTRACTS.md`, `docs/CONSTRAINTS.md`, `docs/reference/SOUL.md`. Confirm scope in one paragraph, then build.

## THE ONLY THING TO BUILD (the live e2e demo — do not add anything it doesn't display)
"I'm Johnny, an AI-automations marketer." → target **two outreach companies: a real-estate agency and a
marketing agency.** For EACH target, end-to-end on screen:
1. **scrape the company** — Firecrawl.
2. **scrape the person, IN PARALLEL** — `Promise.all([getLead(linkedinUrl), fetchUserTweets(handle,30), sixtyfour(...)])`
   (HeyReach LinkedIn verifier + X timeline + SixtyFour deeper individual data). Merge → person fields; each
   fact becomes a Signal.
3. **ground** — ClickHouse public datasets (proof).  4. **enrich** — Composio (news/SEC/finance).
5. **draft** the grounded story + the **outreach angle** (how to approach them, beyond a basic personalized
   message), given Johnny's positioning.  6. **judge** — held-out critic (different model) catches any
   ungrounded claim about the company OR the person → **FABRICATED** → re-ground → fix.  7. **approve** (human
   gate).  8. **render** the story + outreach report — OpenUI / Thesys C1.
Output per target: a grounded story + the approach. Ground the angles in `~/code/carlos/context/yaps` (real
estate) + `~/code/work/context/yaps` (marketing) — guided, not faked. Johnny's profile: `linkedin.com/in/johnny--sheng/`.

## LIVE + OFFLINE in parallel (continuous)
Run LIVE and write every result to `data/leads/<id>.json` at the same time, then keep looping. The demo shows
the **live wiring working** AND has the **cached/offline replay** ready simultaneously. Modes: LIVE (real
APIs) ∥ REPLAY (cached real, snappy) — both available at once; STUB is the floor. Person-scrape (LinkedIn/X/
SixtyFour) is slow/flaky → run live once per target, cache, replay. The demo CANNOT break.

## EXACT PORTING (copy, don't rewrite — per docs/PERSON-SCRAPE-PORT.md)
`~/code/doubles/src/scrape/{heyreach.ts, x.ts, sixtyfour.ts, tinyfish.ts, linkedin-paste-parser.ts}` +
`../logger.js` → `packages/backend/src/scrape/`. Uses: `getLead(profileUrl)→{firstName,lastName,companyName,
position,location,summary}`, `fetchUserTweets(handle,days)`, sixtyfour enrichment. Keys already in .env.

## ENV (docs/ENV-ADD.md)
`cp ~/code/doubles/.env ./.env` (gives all scrape/person/enrich/LLM/persist keys). ADD only: LANGFUSE_PUBLIC_KEY,
LANGFUSE_SECRET_KEY, LANGFUSE_HOST, THESYS_API_KEY, RENDER_API_KEY. ClickHouse = no key.

## SPONSORS — each step IS a sponsor, captioned on screen (Tool Use = 20%)
scrape=**Firecrawl** · person=**HeyReach**+**X**+**SixtyFour** · ground=**ClickHouse** · enrich=**Composio** ·
draft+judge=**OpenRouter** · trace=**Langfuse** · render=**Thesys C1/OpenUI** · deploy=**Render**. Label each
node and report card with its sponsor. The node graph + roadmap card is the "how we used each sponsor" visual.

## PRIORITY (strict)
1. **All live wiring works** for the two targets, cached in parallel (P0). This is the bar.
2. **THEN it's frontend optimization** (`docs/VISUAL-SPEC.md`): cofounder color + status pop-ups (not chat,
   cycling Ready/Running/Completed/Blocked), the say-hello→spiral entry (p5.js, borrow said-built
   lab/spiral+textures), the bar styling (highlight-top/dark-bottom), OpenUI report cards, live tracker.
Do P1 only after P0 holds. Don't add anything outside the demo above.

## HARD RULES
Fresh code. Critic ≠ drafter. No silent stubs (visible FAILED + loud log). `fabricatedClaims` rendered the
instant it's non-empty. Both targets render end-to-end before any polish. Image generators = video only, never
app UI. Hit a wall → log to `docs/OPEN-QUESTIONS.md`, keep moving, don't overcomplicate.

## STOP
Both outreach targets (real-estate + marketing) run live + cached, each producing a grounded story + approach
with a real fabrication caught, on the cofounder-styled dashboard with the spiral entry, every node sponsor-
captioned. Re-capture `.evidence/` + update `.evidence/journey.html`. Write `docs/STATUS.md`.

Begin: confirm scope in one paragraph, author the Workflow, run it. Live-test from the first node.

---
