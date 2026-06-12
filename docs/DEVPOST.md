# DEVPOST — storytelling draft (simple, easy to read; fill [LINKS] at the end)

## Project name
**sayhello** — *before you say hello, know their story.*

## Elevator pitch (≤200 chars)
Your AI is lying about your leads. sayhello is the harness that catches it — it builds a grounded story around any lead and won't ship a single claim it can't prove.

## The story (Inspiration + What it does, told straight)
We threw an AI agent at a sales lead and asked it to write us a story about the company. It did. It was
beautiful. It said the company had "raised a $40M Series B."

They hadn't. The AI made it up.

That's the quiet disaster of using AI for sales: it doesn't just get things wrong, it gets them wrong
*confidently*, and you send outreach built on a lie. It's the same failure as trusting an AI agent to fix a
production incident blindly — unchecked autonomy does damage. And it kills the one thing sales runs on. The
best closer we know put it simply: people buy from people who know their story, and you know it's working
when they feel *understood*. A made-up fact breaks that spell instantly.

So we built **sayhello** — not another tool that floods you with more data, but a harness that builds the
**grounded story** of a lead and refuses to include anything it can't prove.

Here's how it works. You give it one lead — a company URL. It reads the company, drafts the story, and then
hands that draft to a **held-out critic**: a second AI, a different model, whose only job is to be skeptical.
The critic checks every claim against real evidence and flags anything unsupported as **FABRICATED**. When
it catches a lie, the harness goes back, digs for the truth, and rewrites — until the story is grounded.
Then a human approves it, and it becomes a clean, walkable story: the company's world, their real pain, and
your opening line. You watch the whole thing happen, live, as a spiral that climbs from "guessing" to
"grounded." And because the discipline is universal, the same harness works across industries — we show it
on a SaaS company, a property, and a brand.

We build the story. You make the call. The AI never sends anything on its own — that part stays human.

## Why us (founder-fit)
This isn't a tool we imagined — it's the one we use. I'm an independent AI-automations marketer who lands
agency and real-estate clients, and this demo is literally my own go-to-market: I point sayhello at a real
real-estate agency and a marketing agency and let it build the story I'd use to reach out. It's deliberately
**not** a mass-send tool — those blast templated slop and you lose your brand. sayhello automates the
*expensive* part instead: crafting a true story about a specific person from public data, the way a great
closer does. More cost per lead, on purpose — because it's for high-touch sellers and agencies where the
brand and the relationship are the whole game. The positioning angles are grounded in real founder-fit calls
(a real-estate closer, agency founders), not invented. Real estate is the proof case: the highest-trust,
most story-dependent sale there is — get that right and you've shown the thesis.

## How we built it (and how each sponsor plays its part)
A TypeScript harness of typed nodes, each leaning on a sponsor:
**Firecrawl** is the eyes — it turns the URL into facts. **ClickHouse** is the truth source — we query its
free public GitHub and Hacker News data as live proof of a company's momentum, and archive every draft so
the score-climb is queryable. **Composio** is the reach — news, SEC filings, and firmographics through one
interface. **OpenRouter** runs the two minds — one model writes, a different one judges, so the writer can't
hide its own lies. **Langfuse** is the glass — every step is traced, so you can open the receipts. **Thesys
C1 / OpenUI** is the voice — the finished story renders as a generated slide UI that shapes itself to each
lead. **Render** is the stage — one Blueprint ships the whole thing live.

## Challenges
Grounding is fail-closed: no source means fabricated, not "probably fine." The hard part was a critic
skeptical enough to reject its own side's work — AI loves to agree with itself — without false-flagging real
facts.

## What we learned
The model isn't the product — the harness around it is. A better model just writes a more convincing lie.
The thing that makes AI safe to trust, in sales exactly like in production, is the layer that checks it.

## What's next
More industries; learning from which stories actually closed; tuning to each rep's voice.

## Submitting to
Guild (Most Innovative Use of Agents) · OpenUI/Thesys C1 · ClickHouse · Langfuse · Composio · Render.

## Built with
typescript · node · express · websocket · next.js · react · zod · openrouter · firecrawl · composio · clickhouse · langfuse · thesys-c1 · openui · render · gsap

## Links (fill at the end)
- GitHub (public): [URL] · Demo video (≤3 min): [URL] · Live demo: [RENDER URL]
- Numbers: grounding [0.4 → 0.9] across [N] generations · [X] fabricated claims caught · [¢] per story
