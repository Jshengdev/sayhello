# DEVPOST — one-shot draft (Johnny's narration, wrapped). Fill [LINKS] + numbers at the end.

## Project name
**sayhello** — before you say hello, know their story.

## Elevator pitch (≤200 chars)
AI should augment relationships, not replace them. sayhello is a swarm of agents that gathers the real story of a person and their company, so you connect like a human instead of blasting soulless spam.

---

Before you say hello, know their story.

AI should augment go-to-market. GTM agents, AI SDRs, whatever you want to call them — they should all augment relationships, not replace them.

**What everyone thinks GTM is**

Everyone thinks go-to-market means one thing. Harvest more data. Get more leads. Blast more messages. Automate the spam. Generate your list, target your ICP, spin up a personalized message for each one.

That's why your inbox is always full of "Hi {firstName}, love what you're doing" with no soul behind it. It sounds like it could fit. But really it's just a machine that filled in a couple of details and called it personalized. That's not connection.

I don't think go-to-market should try to do relationship building *without* people. That's the whole mistake. People confused volume with the relationship. The playbook is: buy a list, create some fields, spin up personalized prose, send thousands of them, scrape everything about every individual, collect all that data, and harvest.

But if everybody does this, inboxes only get stricter. Reply rates only fall. And people's desire for an actual connection only gets higher.

So how do you build around that, when the game changes from volume to understanding? From information to a story?

**This is why we built sayhello**

The work you do before you say hello, so the first hello actually lands.

Here's the line it all rests on. You can offload the research. You can offload the thinking. But you cannot offload the understanding, or the feeling.

The number one lesson in sales is that people buy from people who get them. Only a human can sit where somebody actually is, recognize the moment they're in, and feel what to say. That's the part that closes. That's the part that secures the deal.

So we built a swarm of agents to go out into the open web and gather the real story of a person and their company. Their mission. Their purpose. A deep read of what they're actually interacting with right now. The agents bring back the pieces. You put the puzzle together. You make the call. Your agents never send a thing on their own, and everything they bring back is guarded by strong validation before you ever see it.

AI does the 90 percent that scales. You keep the 10 percent that actually matters, the part that's human.

That's our honest use of scraping. Not to harvest people at scale. To understand someone well enough to talk to them like a person.

**How it works**

Scrape the company. Scrape the person, in parallel, from across the open web. Ground every fact against a real public source. Draft the story and the angle to open with. Then a held-out critic — a *different* model, whose only job is to be skeptical — flags anything it can't trace as FABRICATED, and the loop re-grounds and rewrites until the story is actually true. You approve it. It renders live as a spiral that goes from guessing to grounded.

**Why we built it this way**

We did the research on where AI actually breaks. A model left to check its own work will tell you you're absolutely right — it can't catch its own confident lie, and it'll happily invent the one detail that makes a story sing. That's the lie that blows up the second you hit send. So the writer and the judge are different models. Grounding is fail-closed: no source means fabricated, not "probably fine." And the human stays in the seat, always. This comes straight from my research lab, SOTARE: two eyes, always. Machines prove, humans mean. Never let a model grade its own homework.

**Why it takes the whole suite**

We're putting an agent on the open internet to research real people. That only works if every piece is clean, governed, and traceable. So this isn't a single API, it's a suite built together:

> **Guild** governs it.
> **OpenUI** shows it.
> **ClickHouse** proves it.
> **Langfuse** traces it.
> **Composio** enriches it.
> **Render** ships it.
> **Airbyte** remembers it.

Plus the people intelligence underneath: an open web scrape (Firecrawl), identity and signal (HeyReach, X, SixtyFour), and the held-out critic on a separate model (OpenRouter). Built together so the scraping is never the enemy.

**The honest intention**

Web search and public data are never the problem. Intent is. Without the right intent, data can be used a hundred ways — and the same data that powers spam can power understanding. We're choosing that angle. We use it to enrich your CRM, your Notion, with the actual stories and missions of the people you want to reach. A real glimpse into who they are and what they're building. So that you know their story, in order to build for them.

## Submitting to
Guild · OpenUI / Thesys C1 · ClickHouse · Langfuse · Composio · Render · Airbyte (if the sync lands).

## Built with
typescript, node, express, websocket, next.js, react, zod, openrouter, firecrawl, heyreach, sixtyfour, composio, clickhouse, langfuse, thesys-c1, openui, render, airbyte, notion, gsap, p5.js

## Links (fill at the end)
GitHub: [URL] · Demo video: [URL] · Live demo: [RENDER URL]
Numbers: grounding [0.4 to 0.9] across [N] generations, [X] fabricated claims caught.
