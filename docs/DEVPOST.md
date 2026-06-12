# DEVPOST — submission draft (fill [BRACKETS] at the end; everything else ready)

## Project name
sayhello  ·  (tagline) **Before you say hello, know their story.**

## Elevator pitch (≤200 chars)
Your AI is lying about your leads. sayhello is the harness that catches it — it builds a grounded story around any lead and refuses to ship a single claim it can't prove.

### Alt pitches (pick the punchiest on the day)
- A self-improving sales harness with a held-out judge that catches its own model hallucinating — and won't ship a lead-story it can't prove. Same idea as Resolve does for SRE, for GTM.
- Every tool gives you more data on a lead. sayhello gives you the one true reason they'd buy — and shows you the lie it caught getting there.

## The problem (Inspiration)
Throw an AI agent at sales research and it hallucinates — invents a funding round, a customer, a tech stack — and you send outreach built on a lie. It's the same failure as trusting an autonomous SRE agent on an incident blindly: unverified agent autonomy does damage. And the #1 lesson in sales (from a real-estate closer we interviewed) is that people buy from people who know their story — the marker of a real connection is "they felt understood." Every tool gives you *more data*. None give you the *grounded working theory of the lead's pain*, with the guesses rejected.

## What it does
You give sayhello one lead (a company URL, or a property address). It runs a typed-node harness:
**scrape → enrich → ground → draft → judge → (re-enrich on failure) → archive → render.**
A **held-out Critic** (a different model than the one that wrote the story) scores every claim against real scraped evidence and flags anything ungrounded as **FABRICATED**. The loop re-enriches and redrafts until the story is grounded, then a human approves it, and it renders as a walkable slide story: the lead's world, their one real pain, and your opening line. You watch the whole thing shape itself live on a spiral. It works across industries by swapping a lens pack — GTM/SaaS, real estate, marketing — same harness, same discipline.

## How we built it
TypeScript monorepo. Backend: Express + WebSocket harness with JAM-style typed nodes (Zod-validated I/O), a held-out grumpy-critic linter, and a layered (L1/L2/L3) context cache for accuracy. Frontend: Next.js, a paper-light "cofounder" design system, and a live spiral that renders each generation of the story. Every step leans on a sponsor (see Built With). The Critic is the heart — it's a linter on the agent's own story.

## Sponsor tracks (submitting to)
- **Guild — Most Innovative Use of Agents:** a governed, self-correcting agent that refuses to ship ungrounded work; the human-approval gate is the control point.
- **OpenUI / Thesys C1:** the grounded story renders as a generated, adaptive slide UI per lead.
- **ClickHouse:** free public datasets (github_events, hackernews) as a real grounding source + the generation-by-generation score trajectory.
- **Langfuse:** every node traced; open the trace of the run you just watched.
- **Composio:** the enrichment action layer (news, SEC filings, finance, firmographics).
- **Render:** deployed live; the harness ships from one Blueprint.
- (Firecrawl scrape, OpenRouter models throughout.)

## Challenges
Grounding is fail-closed: a claim with no source is FABRICATED, not "probably fine." Building a critic grumpy enough to reject its own side's work (models love to say "you're absolutely right") without false-flagging real facts. Keeping context small enough that accuracy stays high (L1/L2/L3 cache).

## Accomplishments
A harness that catches itself lying, live, on a real company — and a story output a salesperson actually trusts because every claim is cited or cut.

## What we learned
A good agent is a faithful compression of its task distribution. Accuracy is the product — 99% is worth 10x 95%. And the verification layer, not the model, is what makes autonomy safe — in GTM exactly like in SRE.

## What's next
More lens packs; the "felt understood" feedback loop (learn from which stories closed); voice-of-the-rep tuning.

## Built with
typescript · node · express · websocket · next.js · react · zod · openrouter · firecrawl · composio · clickhouse · langfuse · thesys-c1 · openui · render · gsap

## Links
- GitHub (public): [PUSH + PASTE URL]
- Demo video (≤3 min): [YOUTUBE UNLISTED URL]
- Live demo: [RENDER URL]

## Numbers to drop in at the end
- [N] industries from one harness · [grounding 0.X → 0.Y across N generations] · [X fabricated claims caught] · [cost per story ¢]
