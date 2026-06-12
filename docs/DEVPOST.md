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
This is the productization of a problem I've studied directly: **AI's faithfulness gap** — the distance between
what a model *says* it did and what's actually true. In my own research lab (SOTARE) I built a faithfulness
probe and watched a self-scoring loop report it was improving (58.8 → 58.9) while a held-out judge measured it
*collapsing* to 45.0. The lesson — **machines should prove, humans should mean; never let a model be its own
judge** — is the entire architecture of sayhello. Reward-hacking, context rot, confident hallucination,
self-grading: these are the named failure modes of agents in 2026, and sayhello is one place they all get
solved at once, for a real job.

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
