# Open questions

Most are now ANSWERED (moved to CONSTRAINTS/SCOPE-LOCK). Remaining truly-open items only.

## ANSWERED (see docs)
- Idea → SCOPE-LOCK.md (grounded GTM lead-story harness; catches the agent hallucinating).
- Hackathon/theme → Harness Engineering Hack; rubric 5×20% Idea/Tech/ToolUse/Presentation/Autonomy.
- Stack → TS monorepo: backend Express+ws (forks doubles), frontend Next (forks said-built). ARCHITECTURE.md.
- Live vs cached → live-scrape ONE lead; 2-3 cached in data/leads/ as fallback. ARCHITECTURE.md.
- Sponsors → CORE 5 (Firecrawl, ClickHouse, C1/OpenUI, Render, Langfuse) + held-out Critic. SCOPE-LOCK + SPONSORS.md.

## STILL OPEN (Johnny decides — don't block, flag if you collide)
- [ ] Final brand name (working: sayhello).
- [ ] The exact demo lead(s) + the specific fabricated claim to script for the catch beat.
- [ ] Narrative voice/copy in the story slides (tune AFTER the skeleton runs — leave prompts in editable consts).
- [ ] Pioneer parser: include as its own node, or fold into draft? (Include only if a ≤10-min drop-in.)
- [ ] ClickHouse: own Cloud trial for archive, or in-mem Map fallback? (Start in-mem; trial in parallel.)
