# SPONSOR-PITCH — per-sponsor "why they'd back it" + the 2 industry theses (researched, sourced)

> For the Devpost sponsor section + the per-track submission blurbs. Each: how it's a MAIN feature + the
> "your product sits at the future of GTM, you'd be proud to back this" angle.

## Per-sponsor (main feature → future-of-GTM unlock → why proud)
- **OpenRouter** — writer and held-out critic on DIFFERENT models through one API → verification isn't a
  model grading its own homework; cross-provider judging is the structural guarantee behind "every claim cited
  or rejected." *They'd back it: their value is choosing the right independent model per job — we made that a
  trust primitive.* (openrouter.ai)
- **Langfuse** — every node traced; the critic runs as an LLM-as-a-judge evaluator, rejected claims logged as
  failing scores → the trace tree IS the audit trail; outreach ships with replayable, scored provenance.
  *They'd back it: they make AI debuggable/trustworthy — we made that the product promise to a buyer.* (langfuse.com)
- **Firecrawl** — `/scrape`+`/extract` the company + person's public footprint into clean, schema'd, source-
  carrying claims → every outreach claim anchored to a fresh live web source. *They'd back it: their bet is
  "AI is only as good as its context" — we made that context verifiable.* (firecrawl.dev)
- **SixtyFour** — citation-first people intelligence across 23+ sources into one sourced profile → signal-based
  selling triggers on real sourced events (a hire, a launch, a raise). *They'd back it: they built enrichment
  that cites its sources — we're proof citation-first data is the only data a trustworthy sales agent should
  act on.* (sixtyfour.ai, YC)
- **ClickHouse** — every signal/citation/claim/verdict a queryable row; public Playground datasets (github/
  pypi) double as grounding → outreach becomes a queryable signal warehouse, provenance per claim in ms.
  *They'd back it: "the database for AI" — we made every agent claim an auditable cited record.* (clickhouse.com)
- **Thesys C1 / OpenUI** — the grounded story (each claim + citation + accept/reject) streamed to C1 as a live
  "evidence cockpit" (clickable sources, struck-through rejects) → a verifiable interactive surface per
  prospect, not a static draft. *They'd back it: they make AI output trustworthy as a live interface; we make
  it trustworthy as a cited story.* (thesys.dev)
- **Composio** — authenticated connectors on BOTH ends: pull grounded signal + (optionally) send the verified
  angle via Gmail/Slack/HubSpot → research→action closed in one run. *They'd back it: they bet the future is
  agents taking real actions — we ground a story then act on it.* (composio.dev)
- **HeyReach** — once a claim survives the critic, the grounded angle sends on LinkedIn across rotated accounts;
  unified inbox closes the reply loop → individually-grounded messages at agency volume, ending the
  personalization-vs-reach tradeoff. *They'd back it: they scale safe, human-quality outreach — we guarantee
  only judge-certified messages send.* (heyreach.io)
- **Guild AI** — the governance gate on the critic→send handoff: pre-dispatch policy blocks any message whose
  claims didn't pass the judge → "every claim cited or rejected" becomes an ENFORCED policy, not a prompt.
  *They'd back it: their thesis is ungoverned agents are a liability — we put their control plane on the
  critical path of revenue.* (guild.ai, $44M Series A)
- **Render** — hosts the whole harness (API web service + background scrape workers + per-run previews),
  autoscaling absorbs burst scraping → an always-on GTM harness building stories against FRESH public data.
  *They'd back it: "the cloud for builders" backing a builder shipping trustworthy-AI GTM end-to-end.* (render.com)

## Thesis 1 — Verification is the missing layer for trustworthy agents (the harness theme)
Bessemer's AI Infrastructure Roadmap names eval/observability a core 2026 frontier: ~78% of AI failures are
invisible and persist across 93% of cases even with bigger models — they stem from interaction dynamics, not
capability. A bigger model won't save you; a verification layer will. Anthropic ("Demystifying Evals"): the
grader must be held out and calibrated to humans. LangChain: "an agent can have 99% uptime but still
confidently provide incorrect information" — monitoring can't catch a wrong tool/claim. sayhello fills exactly
that gap: it doesn't just generate outreach, it verifies every claim against source before it ships.
Sources: bvp.com/atlas/ai-infrastructure-roadmap-five-frontiers-for-2026 · anthropic.com/engineering/demystifying-evals-for-ai-agents · langchain.com/articles/llm-monitoring-observability

## Thesis 2 — The future of GTM is story/signal-based, not volume
Outbound flipped from volume to signal because volume died at the inbox. Apollo (Signal-Based Selling):
"Stricter inbox enforcement killed high-volume outbound in 2025... shifted to precision targeting on real
buyer signals." Instantly: B2B reply rates fell 6.8% (2023) → 4–6% (2025); the agencies still hitting 10–15%
"are not sending more emails, they are sending smarter"; Google now rejects senders above a 0.3% spam-complaint
threshold. Clay (coined "GTM engineer", $100M @ $3.1B) builds its whole platform around outreach that "starts
with buyer signals and enrichment instead of mass cold outreach." That is sayhello's wedge: grounded, signal-
triggered, story-based outreach with a held-out critic guaranteeing truth before send.
Sources: apollo.io/insights/signal-based-selling · instantly.ai/blog/future-of-cold-email · builtin.com/articles/clay-secures-100m-20250808
(UNVERIFIED: the viral "15-25% vs 2-4%" reply stat — use Instantly's 6.8%→4-6%/10-15% instead. Render AI SLAs + C1 default model/pricing unverified.)
