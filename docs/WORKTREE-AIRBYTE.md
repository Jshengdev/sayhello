# WORKTREE-AIRBYTE — directive for the PARALLEL build (separate window/worktree)

> Paste into a SEPARATE Fable window. This builds the Airbyte recall add-on in an ISOLATED git worktree so it
> never touches the V2 integration happening in the main repo. Read `docs/AIRBYTE-RECALL.md` first.

You are building an OPTIONAL add-on for sayhello: the **Airbyte recall / memory layer**. Work in an ISOLATED
git worktree — do NOT modify the V2 core or the main working tree.

1. **Set up the worktree:** `cd ~/code/sayhello && git worktree add ../sayhello-airbyte -b feat/airbyte-recall`.
   Work entirely in `~/code/sayhello-airbyte`.
2. **Read:** `docs/AIRBYTE-RECALL.md` (the use case + architecture + value), `docs/CONTRACTS.md` (the StoryRun
   shape), `docs/DESIGN.md` (cofounder detail-card style).
3. **Build the recall add-on** (per AIRBYTE-RECALL.md):
   - Ensure stories persist to Neon Postgres `stories` (use existing DATABASE_URL; create the table if absent;
     seed from `data/leads/*.json`).
   - Sign up app.airbyte.ai, connect Neon Postgres as a source, sync `stories` → Context Store. **Start the
     sync FIRST** (indexing is slow). Add `AIRBYTE_*` keys to `.env`.
   - Backend: one route `GET /recall?q=...` that calls the Airbyte Agent MCP `context_store_search`.
   - Frontend: a **Recall panel** (cofounder detail-card style) — plain-language queries ("which real-estate
     leads have we storied?", "have we touched this person?", "what pains recur?") → rendered results.
   - Cache results to `data/recall/*.json` so the panel replays if the index is slow/down (demo-safe).
4. **Verify live:** a real query returns real results from the synced stories. Screenshot it.
5. **Do NOT merge** until: (a) it works, AND (b) the main V2 P0 demo is solid. Then PR/merge `feat/airbyte-recall`.
6. Write `docs/STATUS-AIRBYTE.md`: what works, index status, whether it's demo-ready.

Hard rules: isolated worktree only; no edits to V2 core; the main demo never depends on this; only claim the
Airbyte track once real results return. If indexing isn't ready by ~3:45, this is CUT — zero impact on core.

Begin: create the worktree, read AIRBYTE-RECALL.md, start the Airbyte signup + Postgres sync immediately, then build.
