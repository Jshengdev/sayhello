# INTEGRATE-V2 — self-evaluate what you built, gap-check against V2, plan, then execute

> Build window: this is your entry point. You already built S0+S1 (stub end-to-end, validated). DON'T
> rebuild — INTEGRATE V2 onto what exists. Work in 4 steps. Submit 4:00 PM. Scoped EXACT to the live demo.

## STEP 1 — Evaluate what YOU already made (audit your own repo)
Read your current build and write a short inventory: `packages/backend/src/{nodes,orchestrator,lenses,store,
server}.ts`, `packages/frontend/{app,components,lib}`, `.evidence/*`, and the git log. For each piece note:
exists? real or `stubMode()`? matches the contract? Output a 6–10 line "what I have" summary.

## STEP 2 — Read the V2 spec + gap-check
Read: `docs/FINAL-PROMPT.md` (the exact demo scope — the source of truth), `docs/SCENARIOS.md`,
`docs/VISUAL-SPEC.md`, `docs/PERSON-SCRAPE-PORT.md`, `docs/ENV-ADD.md`, `docs/CONTRACTS.md`,
`docs/CONSTRAINTS.md`, `docs/reference/SOUL.md`. Then write a **GAP TABLE**: for each V2 requirement —
| requirement | already built? | what's missing | port-from / how |. Cover: the two-target outreach demo
(real-estate + marketing agency), the parallel person-scrape (HeyReach `getLead` + X `fetchUserTweets` +
SixtyFour), company scrape live (Firecrawl), ground (ClickHouse), enrich (Composio), draft story + outreach
angle, held-out judge catching a real fabrication, OpenUI report, LIVE∥REPLAY∥STUB modes, the cofounder visual
(status pop-ups + say-hello→spiral entry), sponsor captions, Render deploy.

## STEP 3 — Plan
From the gap table, write a short plan: bottleneck-first order, what to PORT (exact files), what to WIRE LIVE
(flip stubMode), what to ADD (person nodes, modes, visual), and the satisficing stop for each. Keep it lean —
nothing outside `docs/FINAL-PROMPT.md`'s demo. Priority: (P0) all live wiring works for the two targets,
cached in parallel; (P1) frontend optimization to the cofounder look — only after P0 holds.

## STEP 4 — Execute
Author and run a Workflow that does the plan, live-testing from the first node, verbose-logging every seam,
no silent stubs (visible FAILED), critic ≠ drafter. Exact porting per `docs/PERSON-SCRAPE-PORT.md`; env per
`docs/ENV-ADD.md` (`cp ~/code/doubles/.env ./.env` + add Langfuse×3, Thesys, Render). Caption every node with
its sponsor (scrape=Firecrawl · person=HeyReach+X+SixtyFour · ground=ClickHouse · enrich=Composio ·
draft+judge=OpenRouter · trace=Langfuse · render=Thesys C1/OpenUI · deploy=Render).

## STOP
Both outreach targets (real-estate + marketing) run live + cached, each producing a grounded story + outreach
approach with a REAL fabrication caught, on the cofounder-styled dashboard with the spiral entry, every node
sponsor-captioned. Re-capture `.evidence/` + update `.evidence/journey.html`. Write `docs/STATUS.md` (what
runs live, what's cached/stubbed, top 3 next iterations, any key still needed).

Begin with STEP 1. Show me your inventory + gap table + plan, then execute.
