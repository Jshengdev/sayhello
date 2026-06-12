# DEVPOST — full project writeup (storytelling + founder-fit + sponsor-as-AI-problem). Fill [LINKS] at end.

## Project name
**sayhello** — *before you say hello, know their story.*

## Elevator pitch (≤200 chars)
Your AI lies about your leads. sayhello is the harness that catches it — it builds a grounded story about a real person from public data, and refuses to ship a single claim it can't prove.

---

## Inspiration — the founder-fit journey
I'm an independent AI-automations marketer. I land agency and real-estate clients, and the hardest, most
valuable part of my own go-to-market isn't sending email — it's *knowing the person* before I reach out. The
best closer I know (a real-estate veteran) put it simply: people buy from people who know their story, and you
know it's landing when they feel **understood**. A real estate owner who's 82 and facing a pass-down is a
completely different story than a 24-year-old who just bought — same data, opposite human.

So I tried to automate it with an AI agent. I asked it to write me a story about a lead. It did — beautifully.
It said the company had "raised a $40M Series B." **They hadn't. The model made it up.** That's the quiet
disaster: AI doesn't just get sales research wrong, it gets it wrong *confidently*, and the moment you send
outreach built on a fabricated fact, the spell of "this person knows me" breaks and your brand becomes slop.

sayhello is the tool I actually needed — and this demo is literally my own GTM: I point it at a real
real-estate agency and a marketing agency and let it build the story I'd use to reach out.

## The problem we're solving
**Throwing AI at outreach blindly produces confident lies, and mass-personalization tools make it worse** —
they blast templated "Hi {firstName}" slop and you lose your brand. The real job in high-touch sales isn't
volume; it's the *expensive* part: crafting a true, specific story about one person from public data so a human
can close. That's what agencies and high-trust sellers (real estate especially) actually need, and it's
exactly the part AI fails at, because **a model will happily invent the detail that makes the story sing.**

## What it does
You give sayhello who *you* are + a target (a company URL and the person you're reaching). It runs a
**typed-node harness**: scrape the company → scrape the *person* (LinkedIn + X + deeper enrichment, in
parallel) → ground every fact against real public data → draft the story **and the outreach angle** → hand it
to a **held-out critic** (a different model whose only job is to be skeptical) that flags any claim with no
source as **FABRICATED** → re-ground and rewrite until it's true → a human approves → it renders as a clean,
walkable story + outreach report. You watch it happen live as a spiral that distills from "guessing" to
"grounded." We build the story; you make the call. **The AI never sends anything on its own.**

## How it works + how each sponsor solves a real AI problem
We didn't bolt sponsors on for prizes — each one answers a specific, named failure mode of AI agents.

- **Firecrawl — the grounding floor (problem: hallucination starts with no evidence).** An agent with no
  real input invents. Firecrawl turns the company URL into clean, structured facts that become the *citations*
  every later claim is checked against. Scraping isn't data collection here, it's the evidence base.

- **HeyReach + X + SixtyFour — multi-source person truth (problem: people-data is fragmented and stale).**
  No single source knows a person. We verify identity via HeyReach's own LinkedIn index (zero translation gap —
  it's the same index outreach fires against), read recent intent from their X timeline, and enrich with
  SixtyFour — **in parallel** — so the story is about a real human's current situation, not a guess.

- **ClickHouse — proof, not storage (problem: agents assert momentum they can't back).** We query
  ClickHouse's free public datasets (GitHub `github_events`, Hacker News) as a *live grounding source* —
  star-velocity, release cadence, launch traction — real public signals a claim must match. We also archive
  every generation so the grounding score's climb is queryable. Most teams store their own data in ClickHouse;
  we use its public data as evidence.

- **Composio — frugal multi-app reach (problem: enrichment is either shallow or burns credits blindly).** A
  free-first chain (zero-auth search for news / SEC / finance) that only escalates to paid lookups once a lead
  clears a relevance bar — the agent reaches across apps without spray-and-pay cost.

- **OpenRouter — the two minds (problem: models grade their own homework and over-praise themselves).** This is
  the heart. The drafter writes; a **different model** is the held-out critic. An agent literally cannot catch
  its own confident lie — a separate model family can. The whole product hinges on this generator/evaluator
  split.

- **Langfuse — auditable honesty (problem: agent reasoning is a black box; you can't trust what you can't
  see).** Every node is traced. You open the trace of the run you just watched and see it think, fail, and
  recover, span by span. The product's honesty is itself made auditable.

- **Thesys C1 / OpenUI — generated, adaptive presentation (problem: static templates can't fit every lead).**
  The grounded story + outreach report render as a UI generated from the StoryRun JSON — a data-rich lead
  becomes a full report, a thin one a lean card. No hand-authored template.

- **Render — the live stage (problem: a demo that only runs on a laptop isn't real).** One Blueprint ships the
  whole harness live; the agent's work runs where it's deployed.

## The deeper idea (where this comes from)
This productizes a problem I've studied directly in my own research lab (SOTARE): **AI's faithfulness gap** —
the distance between what a model *says* it did and what's actually true. SOTARE's core law is
**"machines PROVE, humans MEAN"** and **Two-Eyes-Testing**: never let a model be its own judge — use a second,
independent eye, because a system that persists a claim without verifying it is just LARPing. I built
detectors for exactly this (a faithfulness probe; an "LLM-larp" detector) after watching self-scoring loops
report progress that an independent judge showed wasn't real. That lesson is the entire architecture of
sayhello: the drafter proves with cited data, the held-out critic is the second eye, and the human means.
Reward-hacking, confident hallucination, self-grading, context rot — the named failure modes of agents in
2026 — all get solved here at once, for a real job.

## Why now — sayhello sits at two industry inflections
Two shifts make this the moment. **One: verification, not model size, is the binding constraint on agents.**
Bessemer's 2026 AI Infrastructure Roadmap names eval/observability a core frontier — ~78% of AI failures are
*invisible* and persist across 93% of cases even with bigger models, because they come from interaction
dynamics, not capability. Anthropic says the grader must be held out and human-calibrated; LangChain notes an
agent "can have 99% uptime but still confidently provide incorrect information." A bigger model writes a more
convincing lie; only a verification layer catches it. **Two: GTM has flipped from volume to signal.** Stricter
inbox enforcement killed spray-and-pray in 2025 (Google now rejects senders past a 0.3% spam-complaint rate;
B2B reply rates fell to ~4–6%); the agencies still hitting 10–15% "are not sending more emails — they're
sending smarter." Clay built a $3.1B company on signal-and-enrichment-first outreach. sayhello is the
intersection: a held-out-verified, signal-and-story-based GTM harness. (Sources: Bessemer AI Infra Roadmap;
Anthropic "Demystifying Evals"; LangChain observability; Apollo Signal-Based Selling; Instantly; Clay.)

## The underlying value — why a story, not a data dump
The information is never the problem, and the information is never the solution. **The story is.** A story
carries far more, far more densely, than a giant blurb of data — and understanding someone's story is *the*
thing that makes a great GTM person great. Not the tools, not the automation, not the personalized agents:
how well you understand a person, and sell them a pain out of it. sayhello is a GTM-CRM-style scraping layer
that lets an agent live as a harness on the open web, distills a person's true *story* from public data, and
hands it to your sales team — a tag-team duo of you and a co-founder-grade agent. The future of GTM isn't
more volume and more slop; it's deeper, verified *understanding*, at the speed of an agent, with a human
making the call.

## Challenges
Grounding is **fail-closed**: no source means fabricated, not "probably fine." The hard part was a critic
skeptical enough to reject its own side's work — models love to agree with themselves — without false-flagging
real facts. And keeping context small enough that accuracy stays high (a layered cache, not a giant prompt).

## What we learned
The model isn't the product — the **harness** around it is. A better model just writes a more convincing lie.
What makes AI safe to trust — in sales exactly like in production engineering — is the layer that checks it.
And founder-fit beats cleverness: we built the tool we personally sell with.

## What's next
More industries; learning from which stories actually closed (the "felt understood" feedback loop); tuning to
each rep's voice. The expensive, story-driven outreach that agencies live on — automated, grounded, on-brand.

## Submitting to
**Guild** (most innovative agents — a self-correcting, governed harness with a human approval gate) ·
**OpenUI/Thesys C1** (generated story + outreach UI) · **ClickHouse** (public datasets as grounding + the
trajectory) · **Langfuse** (trace the loop) · **Composio** (multi-app enrichment) · **Render** (deployed live).

## Built with
typescript · node · express · websocket · next.js · react · zod · openrouter · firecrawl · heyreach · sixtyfour · composio · clickhouse · langfuse · thesys-c1 · openui · render · gsap · p5.js

## Links (fill at the end)
- GitHub (public): [URL] · Demo video (≤3 min): [URL] · Live demo: [RENDER URL]
- Numbers: grounding [0.4 → 0.9] across [N] generations · [X] fabricated claims caught · [scrapers run in parallel]
