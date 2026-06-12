# Win Assessment + Framework Lock — Story Engine

> Fable 5 judgment, on-site 2026-06-12. Scored against the real rubric (5×20%) + this organizer's
> documented winner patterns (research/tokens-and-past-events-winners.md). Honest, not cheerleading.

## Verdict: STRONG CONTENDER for multiple prizes. Realistic to win 1-3 sponsor tracks + a shot at Top Overall — IF execution lands and we lead with the HARNESS, not the outreach.

## Score against the rubric (5 × 20%)
| Criterion | Score | Why / risk |
|---|---|---|
| **Idea** | 4.5/5 | Real problem (sales = knowing the story), real insight (agents hallucinate enrichment → embarrassing), on-theme (a harness). RISK: reads as "another GTM tool" if pitched as outreach. Fix: it's a *harness that catches itself lying*, that happens to do GTM. |
| **Technical** | 4/5 | Held-out grounding judge + self-improving loop + typed-node DAG execution is genuinely technical and on-theme. RISK: half-working loses; protect the core. |
| **Tool Use** | 4.5/5 | THIS is where we win. Composio + ClickHouse + OpenUI + Langfuse + Render all load-bearing, node-graph makes each visible. 5 sponsors deep clears the bar most teams miss. |
| **Presentation** | 4.5/5 potential | Paper-light node-graph + spiral + story slides = a beautiful, differentiated demo in a room of Grafana-grey dashboards. Story-flow pitch is strong. Entirely execution-dependent. |
| **Autonomy** | 4.5/5 | Loop runs on real-time scraped web data, unattended, human only at the approval gate. Hits "acts on real-time data without manual intervention" literally. |

## Which prizes are realistically winnable
- **OpenUI ($2k, 7 slots)** — the generated story-slide payoff in our taste is a strong entry. HIGH.
- **ClickHouse ($1.6k)** — A/B "winning angle per segment" over live story telemetry is exactly their ask. HIGH.
- **Composio** — already wired, cross-app actions visible. MEDIUM-HIGH (small prize, easy badge).
- **Guild ($2.8k, 7 slots)** — the approval gate as governance + "ungrounded claim blocked" IS their thesis. MEDIUM (stretch wiring, big payoff).
- **Langfuse ($350)** — trace the loop. HIGH for that small prize.
- **Render** — deploy live + show it. MEDIUM.
- **Top Overall** — possible IF the demo is clean and the harness/honesty angle reads. The node-graph visual is "best presentation" bait.

## The 3 things that decide win vs forgotten
1. **Lead with the harness, not the outreach.** Cold-open on the judge catching a FABRICATED claim and re-grounding it. The GTM workload is the vehicle; the harness is the product. (Anti-pattern: "we personalize sales emails" = dead.)
2. **One beautiful continuous run that WORKS.** Protect the simplest core (one lead, real scrape, one fabrication caught, story renders). Cut anything amber at 2:30. A clean 1-lead demo beats a broken 5-lead one.
3. **Make every sponsor VISIBLE on screen, named.** Tool Use is 20% and judges skim — each node/panel captioned with its sponsor.

## FRAMEWORK LOCK: model the harness as a typed-node DAG (the jam-nodes pattern)

jam-nodes (https://github.com/wespreadjam/jam-nodes) is the right substrate pattern, and validates the bet:
- **Why it fits perfectly:** our loop IS a pipeline — `scrape → parse → enrich → judge → archive → render`. jam-nodes models exactly this: `defineNode` (typed I/O via Zod), `NodeRegistry`, `execute-workflow` + `topological-sort`, `ExecutionContext`, memory-cache + rate-limit. And it already ships `integrations/{apollo,firecrawl,social,openai}` + `ai/{analyze-posts,draft-emails,keyword-generator}` — GTM enrichment nodes, built.
- **Why a node graph WINS:** a node canvas you watch execute is the most demo-able possible form of "watch the harness work." Each node lights up as a lead flows through. It makes Autonomy + Technical + Presentation visible in one view. Judges love node canvases.

### The decision (decisive)
**Adopt the node-graph PATTERN; reuse jam-nodes' connector nodes as reference (or as a dependency — it's MIT-style OSS, a library, fully legit at a hackathon — NOT a recycled hackathon project).** Build:
- **Execution = a typed-node DAG.** Each harness step = a node with a Zod-validated `StoryRun` slice as I/O. Steal/port `defineNode` + registry + `execute-workflow`/`topological-sort` (jam-nodes core is small and clean). Optionally `npm i @jam-nodes/core @jam-nodes/nodes` and use its apollo/firecrawl/openai nodes directly to save hours.
- **Nodes:** scrape (jam firecrawl/apollo node) → parse (Pioneer SLM node) → enrich (the story builder, gtm narrative angles) → **judge (doubles critic node — grounding)** → archive (ClickHouse node) → render (OpenUI node). Composio = an action node. Guild = a gate node. Langfuse = wraps every node's execution.
- **Visual = said-built's paper-light loop-canvas/spiral rendering the node graph executing**, fed by the ws `StoryRun` stream. The graph IS the cockpit.
- **doubles** still provides the critic logic + composio + ws; **gtm-tool** provides the domain prompts; **said-built** provides the aesthetic. jam-nodes provides the execution spine + ready connector nodes.

### Why this is better than the earlier "fork doubles' orchestrator" plan
The PRD workflow (running now) scoped doubles' bespoke orchestrator. jam-nodes' DAG is cleaner, typed, demo-native, and comes with connector nodes — it REPLACES the hand-rolled loop with a registry of nodes. When the PRD lands I'll reconcile: keep doubles' critic + composio + ws, swap doubles' orchestrator → jam-nodes execution, keep said-built frontend. This is an upgrade, not a restart.

## What to do RIGHT NOW to lock it
1. Confirm the node-graph framework call (above) — it changes the backend spine.
2. Name it.
3. Let the PRD workflow finish; I fold the jam-nodes spine into it + write CONTRACTS.md (StoryRun as the node I/O type).
4. Decide the ONE P0 scrape node that must work live (likely firecrawl on a company URL — jam-nodes has it) + cache 2 leads as fallback.
