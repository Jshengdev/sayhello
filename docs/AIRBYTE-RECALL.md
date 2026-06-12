# AIRBYTE-RECALL — the memory/CRM add-on (builds in a parallel worktree, AFTER V2 P0 holds)

> NOT cold enrichment (wrong fit). Airbyte's Context Store = sync data YOU OWN → an agent queries it. Our
> grounded stories ARE data we own. So Airbyte becomes the RECALL layer: the GTM-CRM memory of every story
> sayhello has built. This is a P2 ADD-ON — it must never block or touch the V2 core. Build in a worktree.

## The use case (be very clear)
sayhello produces a grounded story per lead and forgets it. The recall add-on gives it MEMORY: every story
(lead, person, pains, angle, grounded claims, verdict) syncs into Airbyte's Context Store, and an agent queries
it. This is the "co-founder duo with institutional memory" — the harness doesn't just research once, it
remembers what it learned across every lead.

## Real value to the story + output + the creative use
- **Story value:** before building a new story, recall checks "have we touched this person/company before? what
  did we learn last time?" → the new story starts smarter, grounded in prior verified findings, never repeating.
- **Output value:** a **Recall panel** — ask in plain language: "which real-estate leads have we storied?",
  "what pains recur for marketing agencies?", "have we reached this person?", "which angles converted?" Airbyte
  answers across all past stories. The GTM-CRM, queryable.
- **Creative use (the demo beat):** after the live story is approved, it drops into the memory; then ask the
  recall panel "what patterns across all the agencies we've storied?" and it surfaces the cross-lead insight no
  single story has. "Every story becomes memory you can ask later — that's the CRM." A strong closing beat.

## Architecture (uses what's already wired)
```
sayhello story → Neon Postgres `stories` table (DATABASE_URL, already wired)
   → Airbyte source connector (Postgres) → Context Store (indexed)
   → Airbyte Agent MCP (context_store_search) ← the Recall panel queries this
```
Sync the EXISTING Postgres of stories — no new data plumbing. Recall panel = a frontend card + one backend
route that calls the Airbyte MCP and renders results in the cofounder detail-card style.

## Setup (start the signup + sync NOW so indexing has runway — it's slow)
1. Free signup app.airbyte.ai (no card). Add to .env: `AIRBYTE_API_KEY` / MCP per docs.airbyte.com/ai-agents.
2. Connect Neon Postgres as a source → sync the `stories` table → Context Store. **Start this immediately** —
   indexing is minutes-to-days; it must be ready by demo. Seed it with the cached `data/leads/*.json` stories.
3. Wire the Recall panel to the Agent MCP `context_store_search` (structured filter, not semantic).

## Scope guardrails (hard)
- **Worktree-isolated.** Build in a git worktree off the V2 branch; do NOT edit the V2 core files. Merge only
  after P0 (the two-target live demo) is solid and this works.
- **Demo-safe.** Cache the recall results; if the index is slow/down, the panel replays cached answers. The
  core demo NEVER depends on Airbyte.
- **Only reselect the Airbyte Devpost track once the sync actually returns real results.** Don't claim it before.
- Stretch priority: AFTER V2 P0 + P1 visuals. If time runs out, it's cut with zero impact on the core.

## Devpost track blurb (paste into "Best Use of Airbyte's Agent Engine" — ONLY after sync returns real results)
sayhello builds a grounded, source-verified story for every sales lead — and Airbyte's Agent Engine is its
memory. Every story we generate (the person, their pains, the verified claims, the outreach angle) syncs from
our Postgres into Airbyte's Context Store, so an agent can recall it later: "have we touched this person?",
"what pains recur for real-estate agencies?", "which angles worked?". Airbyte turns a one-shot research agent
into an institutional GTM memory — the CRM layer that makes every new story start smarter than the last. We
use the Context Store the way it's meant to be used: unifying data we own into a decision-ready, agent-queryable
surface, with every record traceable to the grounded story that produced it.
