# SOUL — the sales truth (Carlos) + the agent architecture (Shortcut essay)

> Two inputs, one synthesis. Carlos grounds WHAT sayhello is for (the human truth of sales).
> The Shortcut essay grounds HOW to build the agent well (and it SIMPLIFIES us). Both verbatim-sourced.

## Part 1 — the sales soul (Carlos, real-estate, verbatim from ~/code/carlos/context/yaps/)
- **"The story of the individual"** is the whole game. Not a row, not a score — a story with a WHY.
- The marker of a real connection: **"he felt understood."** Surprise + feeling understood = yes. (Their email data was "consistently 30% wrong" — being wrong breaks the spell; grounding is everything.)
- **Read the life/business STAGE, not a score.** An 82-year-old owner isn't a "hot lead flag" — they're a person facing a predictable transition (pass-down → heirs fight → sells). A 24-year-old owner has an active plan. Same data, opposite story.
- **Connect a real event to their specific situation + offer agency.** The SpaceX-moving-to-Texas example: "he's probably gonna sell in 2 years — let's be first, tell him he's in a powerful position because he can plan for this." That's the move: a true, specific, forward-looking read that gives them agency.
- **"Enrichment is the patty... the meat and potatoes."** The story + sorting is the substance; the outreach line is "the tomato and lettuce." Build the patty.
- **The AI builds the patty; the human makes the pitch.** Carlos's own boundary: "this AI is not going to be able to get us the clients." The system enriches, builds the story, ranks "most likely to sell," and flags the approach ("they work in real estate → change the pitch"). The call, the voice, the reassurance, the YES — stays human. ← our "human in the seat" thesis, in a real salesperson's words.
- Manual "name + linkedin" search beats scraping (85% hit) — **go through what a person would actually do**, not what an algorithm guesses.

## Part 2 — the agent architecture (Shortcut spreadsheet agent essay) — this SIMPLIFIES us
- **"A good agent is a faithful compression of its task distribution."** Tune sayhello to what salespeople actually need, weighted by how often they need it — not a general toolset.
- **ONE tool, not thirty.** Model accuracy degrades as you add tools. The agent writes CODE; the enrichment sources (Firecrawl, ClickHouse, web, SEC) are FUNCTIONS the code calls, behind ONE `execute_code` tool. → collapses our many-nodes/many-sponsors worry into one decision: write code. The node-graph VISUAL stays (each function call = a node lighting up); the architecture underneath is just one tool + functions.
- **Context as a layered cache (L1/L2/L3) = faithful compression of the SALES distribution:**
  - **L1 (always resident, the 80%):** the bread-and-butter of knowing a lead — who is this person/company, their stage, the ONE likely pain. Token-efficient, consequence-reporting.
  - **L2 (on-demand curated specs, ~15%):** the signal-reading recipes — "read GitHub release cadence into a pain," "read owner-age into a forced-sale story," SEC/finance lookups. Curated English, gotcha-aware, one call to load.
  - **L3 (escape hatch, the long tail):** raw web / grep — the unanticipatable lookup (the SpaceX news event). The "name + linkedin" manual hack is the escape hatch.
- **The write-diff-with-MUST-FIX linter = our grounding judge.** Shortcut returns every changed cell grouped+sampled, then pulls suspicious ones into "Cells that need review / MUST FIX." → sayhello's judge returns the story's claims, with ungrounded ones pulled into **"NEEDS REVIEW / FABRICATED"** at the top. A linter on the agent's own story.
- **Accuracy IS the product** — "99% is worth 10x 95%." Grounding = accuracy = the thing customers pick you for (Carlos: 30%-wrong data is the pain).

## The synthesis — what this makes sayhello
The output is **the grounded story of one lead's pain — a working theory with a WHY and the guesses
rejected** — built so a human can walk in already feeling the person. Architecturally: ONE code-writing
agent over a layered sales-context cache, with a grumpy linter-judge that flags every claim it can't ground.
We build the patty. The human makes the pitch.
