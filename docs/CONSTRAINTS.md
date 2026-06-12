# CONSTRAINTS — locked (changing one needs Johnny's explicit say-so, recorded here)

1. **No silent stubs.** Every failure logs structurally + renders a visible FAILED badge. Mocks env-gated (`MOCK_*=1`) dev-only.
2. **Critic model ≠ drafter model.** Held-out judging. The agent never grades its own homework. (This is the theme.)
3. **`fabricatedClaims` is the demo's heart.** Render it the instant it's non-empty (red claim + Critic reasoning card).
4. **Demo path is sacred.** Polish + error-handling there (`docs/DEMO-SCRIPT.md`); minimum-to-not-crash everywhere else.
5. **One lead end-to-end before any parallelism or polish.** Main always demoable.
6. **≥5 sponsors load-bearing AND named on screen.** Core: Firecrawl/scrape, Pioneer/parse, Composio/enrich, ClickHouse/signals+archive, Thesys-C1/render, Render/deploy, Langfuse/trace. Stretch: TrueFoundry gateway, Guild gate, Airbyte memory.
7. **Grounding is fail-CLOSED.** A claim with no matching Signal is FABRICATED. Verdict `emit` iff grounding≥0.7 AND all axes≥0.7.
8. **Fresh repo, fresh code.** We LIFT libraries/patterns from doubles/said-built/gtm-tool; we do not submit those repos. Frame honestly.
9. **Freeze 2:50 PM. Submit by 3:50.** Anything amber at 2:30 gets cut, not heroically fixed.
10. **Don't be a blocker.** Constraints are guardrails — flag conflicts as findings, keep moving.
