# DEMO-SCRIPT — the judge-facing 3 minutes (= the demo path)

> The demo path is sacred. This exact sequence gets polish + error handling. Nothing else does.

## One-breath pitch
"Throw an AI agent at sales research and it hallucinates — invents a funding round, sends you to embarrass
yourself. Same as trusting an SRE agent blindly. sayhello is the harness that catches the agent lying and
won't ship a lead-story until every claim is proven."

## The 6 beats (one lead, live)
1. **[0:00] The screen.** Paper-light canvas, a node graph: scrape → draft → judge → enrich → render. Quiet, breathing.
2. **[0:20] Run.** Paste a real company URL. `scrape` node lights violet. Facts land as sourced chips. (Firecrawl + ClickHouse signals.)
3. **[0:40] Draft.** A confident story appears: "...raised a $40M Series B...". Reads great.
4. **[0:55] THE CATCH.** `judge` lights. Held-out Critic (different model). Grounding 0.4. The "$40M Series B" line turns red. Critic card: "no source Signal — fabricated." The agent's own lie, caught on screen.
5. **[1:15] The fix.** `enrich` re-scrapes the gap → claim gets a citation or is cut → re-judge → grounding 0.9. Story is now true. Trajectory sparkline climbs (ClickHouse). 
6. **[1:40] Approve → out.** Hold-to-approve gate-stamp (human in the seat — never auto-sends). Story blooms into slides (C1/OpenUI): problem, their world, the pain, your opening line. "The human takes it from here."
7. **[2:10] (if time) scales.** Cached leads flow through the graph in parallel; one shows a FAILED badge (we fail loud).
8. **[2:40] Close.** "Better models won't fix this — the model already wrote a beautiful lie. The harness around it does. That's sayhello."

## Fallback
Live-scrape ONE lead; 2 cached leads in `data/leads/` if wifi/scrape fails. Recorded backup video by 3:15.
