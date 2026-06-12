# SCOPE-LOCK — the ONE problem, crystal I/O, no complexity. READ BEFORE BUILDING.

> Johnny's law (2026-06-12): do not overcomplicate. EXTREMELY clear input and output. The whole journey
> flow defined. No time wasted on features or complexity. We are NOT building a toolset. We solve ONE
> problem. If a thing is not on the line below, we do not build it.

## The ONE problem
You throw an AI agent at GTM lead research and it **hallucinates facts about the company** — invents a
funding round, a customer, a tech stack — and you send outreach built on a lie. Same failure as throwing
an autonomous **SRE agent** at an incident and trusting it blindly: unverified agent autonomy does damage.
**sayhello is the verification layer: a harness that catches the agent lying and refuses to ship what it can't prove.**

## Crystal INPUT
**One company URL.** That's it. `{ url: "https://acme.com" }`. Optionally a pre-cached demo lead id.

## Crystal OUTPUT
**One grounded lead-story** = `{ story, openingLine, pitch_angle, score, fabricatedClaims, sources }`,
rendered as a short slide walkthrough. Every claim in it traces to a real scraped source, or it was cut.

## The journey (linear — 6 steps, no branches except the one retry)
```
1. URL in
2. SCRAPE the company           (Firecrawl)
3. DRAFT the story              (LLM)
4. JUDGE it (held-out)          → catches a FABRICATED claim   ← THE moment
5. FIX it (re-scrape/cut) → re-judge → grounded                (one retry loop)
6. APPROVE (human) → STORY OUT  (slides)
```
That's the entire product. Watch it happen live on a node graph. Done.

## CORE sponsors (5 — each ON the line above, nothing off it)
1. **Firecrawl** — step 2, scrape. (or Composio NO_AUTH fetch as fallback)
2. **ClickHouse** — the GROUNDING source (github_events/hackernews = real facts to ground against) + archives each generation for the score trajectory. On the line twice.
3. **Thesys C1 / OpenUI** — step 6, render the story out.
4. **Render** — the output has to live somewhere (deploy).
5. **Langfuse** — passive trace of the loop (zero added complexity, one wrapper).
The held-out **Critic** (step 4) is the heart — it's our code, not a sponsor.

## CUT — do NOT build (off the one line)
- Pioneer parser as a separate node → FOLD parsing into the draft LLM unless it's a 10-min drop-in. Don't add a node for a badge.
- Composio Apollo/Crustdata paid firmographics, SEC/finance toolkits → CUT. ClickHouse + scrape is enough grounding.
- Airbyte (no cold data, slow) → CUT.
- TrueFoundry, Guild, Bright Data, Apify → CUT (TrueFoundry/Guild only if literally free and on-path at the very end).
- Multi-lead parallelism → ONE lead is the demo. Show "and it scales" with cached leads only if time remains.
- Any feature that doesn't make step 4 (the catch) land harder.

## The success test
Can you explain the demo in one breath? "Paste a company URL, watch the agent write a story, watch our
harness catch it inventing a fact and refuse to ship it until every claim is proven." If a feature doesn't
serve that sentence, it's cut.
