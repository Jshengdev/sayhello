# LOCKED IDEA: "The Story Engine" (name TBD — see candidates)

> Re-locked on-site 2026-06-12 11:00 AM. Supersedes the abstract "glass harness" framing. Same kernel,
> now with a REAL workload Johnny is passionate about + ~80% reusable code in ~/code/gtm-tool/photon-gtm.
> Name candidates: Storyforge · Dossier · The Enrichment Engine · Lead Story Engine · Verity (story-as-truth).

## One-Liner
A self-improving harness that builds a *true story* around every sales lead — watch it scrape, enrich, and fact-check itself, then walk the story as living slides.

## The Problem (Johnny's own, from real estate)
The #1 lesson in sales: **people buy from people who know their story.** Personalized messages get old; mail-merge "Hi {firstName}, loved your work at {company}" is dead on arrival. To actually convert, you need the *story* of the individual/company — their pains, their context, the world they operate in — and an output that paints a clear, true picture. Today that's hours of manual research per lead, and the moment you hand it to an agent it hallucinates facts and embarrasses you in front of the prospect.

## The Insight (why a harness, why now)
People go about agents wrong — **the agent can't replace the salesperson, it should arm them.** So build a harness that does the research labor as a watchable, self-improving loop, and keeps a human in the seat for the judgment. The harness's job isn't to send messages — it's to *construct a justified world around each lead* so the human can target real pain points. And because hallucinated enrichment is worse than none, the loop has a **held-out fact-check judge**: every claim in the story must ground in something actually scraped (no-LARP). That fact-check IS the harness-engineering theme and the GTM value at once.

## The Loop (our prepped kernel, bound to this workload)
```
URL/lead in
  → PROPOSE: research agent drafts the lead's story (who they are, their world, the pain)   [gtm-tool research-agent, ~80% built]
  → EXECUTE: scrape + enrich from real sources (web, Apollo, GitHub, jobs, G2)               [gtm-tool connectors]
  → EVALUATE: held-out judge scores the story — completeness + GROUNDING (every claim cites a source; flags fabrication)
  → SELF-IMPROVE: gaps/low-confidence claims trigger targeted re-scrape (the loop enriches itself)   ← the self-improvement
  → ARCHIVE: every story version + score + source → ClickHouse (A/B which narrative angle wins per segment)
  → HUMAN GATE: hold-to-approve → the finished story renders as walkable OpenUI slides → human picks next step
```
Self-improvement = the harness keeps enriching until the story passes the grounding judge, learning which sources/angles produce winning stories (A/B'd in ClickHouse). Watchable, iterative, live.

## Why It's "HOLY SHIT" not "cool"
You WATCH a lead's world assemble itself in real time — scrape events streaming, claims landing with green "grounded" / red "FABRICATED" verdicts, the story filling in — and when it's done it becomes a beautiful walk-through narrative, not a CSV row. The wow beats: (1) a fabricated claim caught and re-grounded live; (2) the same lead scored under two narrative angles, ClickHouse picking the winner; (3) hold-to-approve → the story blooms into OpenUI slides.

## Track fit (every sponsor load-bearing, mapped to a real seam)
| Track | Seam in this product | Confidence |
|---|---|---|
| **OpenUI** $2k/7 slots | The finished story renders as creative, generated slide walkthrough — UI generated per-lead from the story data | 5 |
| **ClickHouse** $1.6k | OLAP store of leads × story-versions × scores × A/B narrative results; "which angle wins per segment" queried live | 5 |
| **Composio** | The action layer — pull from real lead sources / push the approved story+next-step to CRM/outreach | 4 |
| **Guild** $2.8k/7 slots | Governance: harness can't finalize a story containing an ungrounded claim OR target an existing customer (gtm-tool already has `is_customer` rule); hold-to-approve = "model in the seat, human approves" | 4 |
| **Pioneer** $500+credits | The "one smaller model" that parses scraped info into structured story fields; A/B'd against the frontier proposer | 4 |
| **Render** | Each enrichment task deploys to Render; "see what the harness is building while the model is in the seat" — live build visibility | 4 |
| **Langfuse** $350 | Trace every enrichment loop + judge span | 5 |
| **TrueFoundry** $1k | Route strong proposer (story writer) vs cheap parser (Pioneer/Haiku) through one gateway | 3 |
| **Airbyte** | If time: pull lead context from a CRM/external system as the context layer | 2 |

## Autonomy rubric answer (now STRONG)
"Acts on real-time data without manual intervention" — the loop scrapes the live web and self-enriches unattended; the human appears only at the approval gate. Real-time data is literally the input, not a contrivance.

## The 80/20 build (this is why it's feasible by 4:00)
- **Borrow from ~/code/gtm-tool/photon-gtm (~80%):** research agent (URL → company brief + ICP + narrative angle), connectors (firecrawl/apollo/crawl/github/hunter/g2/jobspy), narrative-framework spec, ICP scoring, Next.js dashboard (ag-grid). FRESH-CODE caveat → see risks.
- **Build new (~20%):** the WATCHABLE loop UI in Johnny's design language (live scrape/enrich/verdict stream), the held-out grounding judge, the OpenUI story-slide renderer, ClickHouse A/B telemetry, Guild gate, Render task deploy.

## The One Demo Case (3 min, story-flow)
Paste a real lead's URL → watch the harness scrape and assemble their world live → a claim flags FABRICATED, harness re-grounds it → story scored under two angles, ClickHouse names the winner → hold-to-approve → story blooms into OpenUI slides → "here's the world, here's the pain, here's your opening line — the human takes it from here."

## Risks / guards
- ⚠️ **FRESH-CODE RULE:** judges check for recycled projects. gtm-tool is Johnny's prior work → we are NOT submitting gtm-tool. We lift *libraries/patterns* (connectors, scoring logic) into a fresh repo built today around the NEW harness framing. Frame honestly: "the research plumbing is battle-tested; the harness, the judge, and the story UI are today's build."
- Scraping reliability in 6h → cache 2-3 real leads pre-scraped as fallback; live-scrape one on stage.
- Held-out judge must be a different model/family than the proposer (doctrine + Guild story).
- Don't over-build connectors — one or two real sources is enough for the demo; mock the periphery, never the core loop.
