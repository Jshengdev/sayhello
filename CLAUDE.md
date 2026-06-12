# CLAUDE.md — sayhello (Harness Engineering Hack, Jun 12 2026)

You are working in **sayhello**, Johnny Sheng's hackathon project. This file is your map and operating contract. Read it first; drill into linked docs only when your task needs them.

> **Status: LOCKED & BUILDING.** Idea, stack, contract, design, and demo are decided (below + `docs/`). Submission **4:00 PM today**. Build the end-to-end skeleton first; tune story content after it runs.

## TL;DR — what this is

**sayhello** is a self-improving GTM harness that builds a *grounded* story around a sales lead. Input a company URL → it scrapes → drafts a lead-story (problem→fit→traction→angle→ask) → a **held-out Critic** (different model than the drafter) scores it and flags any claim with no scraped source as **FABRICATED** → the loop re-enriches and redrafts (≤2 retries) until grounded → archives every generation → the human approves → the story renders as walkable slides. The whole loop is a **watchable typed-node graph**. The judge sees the harness catch itself inventing a fact and refuse to ship a story it can't prove. Tagline: *before you say hello, know their story.*

## The harness loop (the node graph — this IS the product)

```
[scrape] → [draft] → [judge] ──emit──→ [archive] → [render]
                       │
                      regen
                       ↓
                  [enrich] ──(max 2 retries)──→ back to [draft]
```
Each stage is a **JAM-style typed node**: `defineNode({ inputSchema: zod, outputSchema: zod, executor })`. The accumulating `StoryRun` flows through; each node reads + writes its slice. Clean conduct = one Zod-validated boundary per node, no spaghetti. See `docs/ARCHITECTURE.md`.

**Engine I/O:** input `{ url, hint?, maxRetries? }` → output a complete `StoryRun` (grounded story + StoryScore w/ `fabricatedClaims` + `generations[]` trajectory + `slides`). Per-node I/O table in `docs/ARCHITECTURE.md`.

## Operating distinctions (these change how you behave)

1. **Ideation vs execution.** The idea is LOCKED. Build it; don't re-litigate. Ideation (story copy, the demo lead) is Johnny's — sharpen, don't invent.
2. **Demo path vs everything else.** The demo path = `docs/DEMO-SCRIPT.md`. That code gets polish + error handling. Everything else gets the minimum to not crash. Ask: "does this make the 3-min demo better?"
3. **Real vs cached vs mocked.** Real = computed live (default). Cached = pre-scraped demo leads in `data/leads/<id>.json` as fallback (the demo reads these if a live scrape 404s). Mocked = dev-only, env-gated (`MOCK_*=1`). **No silent stubs, ever** — a failure logs structurally and renders a visible FAILED badge.
4. **Locked vs open.** Locked → `docs/CONSTRAINTS.md` (change needs Johnny). Open → `docs/OPEN-QUESTIONS.md` (flag a collision as a finding, keep moving, don't decide it silently).
5. **Hackathon clock.** Ship > elegant. Working ugly beats broken beautiful. But: no silent stubs, and "done/working" requires a run command + observed output.

## Read these first (in order)
0. `docs/SCOPE-LOCK.md` — **the ONE problem, crystal input/output, the 6-step linear journey, and the CUT list. The simplicity law. Read before anything.**
0b. `docs/DECISIONS.md` — **the locked architecture/input/lens/visual calls. JAM typed nodes; input = {industry, handle}; 3 lens packs; spiral-hero visual.** Then `docs/reference/SOUL.md` (the Carlos sales grounding + agent-architecture principles).
1. `docs/ARCHITECTURE.md` — the node graph, monorepo layout, per-node I/O, data flow. Single source of truth.
2. `docs/CONTRACTS.md` — `StoryRun` / `CompanyBrief` / `StoryScore` / `WsEvent` + ClickHouse schema + API. Build to this EXACTLY.
3. `docs/CONSTRAINTS.md` — locked rules.
4. `docs/DEMO-SCRIPT.md` — the judge-facing walkthrough = the demo path.
5. `docs/PORT-MANIFEST.md` — which doubles/said-built/gtm file copies where (the literal copy list).
6. `docs/SPONSORS.md` — each sponsor's seam + minimal integration + where it shows on screen.

7. `docs/reference/INSPIRATION-MAP.md` — **the distilled port guide (synthesized 6-12): JAM-spine spec, gtm-lens prompt ingredients, doubles port map + model shortlist, UI port tables (LoopCanvas/SlipStrip/spiral paper-mode), SOTARE critic rules R1–R10, live-verified sponsor API shapes. Builders/fixers: read the section for your lane before coding.**
8. `docs/PRIZE-PLAN.md` — prize targeting (Johnny override 6-12): Render Workflows mandatory, Guild ship-gate, Airbyte conditional; S3 sharpening chips.
9. `docs/reference/RENDER-WORKFLOWS.md` — the verbatim Render Workflows onboarding + our task() mapping.

Deep reference (only when needed): `docs/reference/` — full PRD, FRONTEND-SPEC, DESIGN-BRIEF, WIN-ASSESSMENT, BUILD-SCOPE, PORT-INVENTORY, IDEA.

## Repo map
```
sayhello/
├── CLAUDE.md                  ← this file (the map)
├── docs/                      ← canonical context (read order above)
│   ├── ARCHITECTURE.md · CONTRACTS.md · CONSTRAINTS.md · DEMO-SCRIPT.md
│   ├── PORT-MANIFEST.md · SPONSORS.md · DESIGN.md · OPEN-QUESTIONS.md
│   └── reference/             ← full planning docs (PRD, specs)
├── packages/
│   ├── backend/               ← TS · Express + ws · the harness (forks ~/code/doubles)
│   │   └── src/{server,orchestrator,agents,llm,enrich,store,nodes,types.ts}
│   └── frontend/              ← Next · the cockpit (forks ~/code/work/apps/said-built)
│       ├── app/ · components/ · lib/ws.ts
├── data/leads/                ← cached pre-scraped demo leads (fallback)
└── .env                       ← copied from ~/code/doubles/.env (working keys)
```
Update this map whenever the top-level layout changes. A stale map is worse than no map.

## Source repos (copy FROM — fresh repo, fresh code)
- `~/code/doubles` → backend: orchestrator, `agents/critic.ts`(+prompt), `llm/*`, ws server, scrape, composio. **`.env` has working OPENROUTER + Neon DATABASE_URL + FIRECRAWL — copy it.**
- `~/code/work/apps/said-built` → frontend: LoopCanvas, SlipStrip, StoryCanvas, `lab/spiral/*`, the 5 `lab/` components, globals.css/paper-light tokens.
- `~/code/gtm-tool/photon-gtm` → domain as prompts: `agents/1-research/prompt.md` (26-field schema), `specs/narrative-framework.md` (6 angles), connectors.

## Design tokens (the paper-light world — full law in `docs/DESIGN.md`)
`--page:#f5f5f2 · --raised:#fbfbf8 · --white:#fff (earning-white, the live lead) · --canvas:#f1f1ee · --recessed:#e7e7e3 · --ink:#262323 (6 alphas, all text) · --live:#6e2bff (only on the executing node)`. No borders (depth from light: 1px white inset ring + 1px 8%-black outer ring + 1–6% blurs). Thin lines ≤1px law. Type: Onest (in-between weights 340/430/450/480) + IBM Plex Mono (system voice) + Departure Mono (numerals). Motion: `cubic-bezier(0.16,1,0.3,1)`, depicts something true, ≤1 whimsy/surface. Signature gestures: gate-stamp on approve, confetti only on human approval, blur-up swap between generations, shimmer on the executing node.

## API surface
| Method | Path | Returns |
|---|---|---|
| POST | `/story/run` `{url}` | `{leadId}` — starts a run |
| GET | `/story/:leadId` | `StoryRun` (rehydrate on refresh) |
| WS | `/ws` | `WsEvent[]` stream (see `docs/CONTRACTS.md`) |

Every frontend panel consumes a real endpoint/event — no panel renders invented data.

## Key constraints (locked — full list `docs/CONSTRAINTS.md`)
1. **No silent stubs.** Failures visible + logged; mocks env-gated dev-only.
2. **Demo path is sacred.** Polish there; nowhere else.
3. **Critic model ≠ drafter model.** Held-out judging — the agent never grades its own homework.
4. **`fabricatedClaims` is the demo's heart.** Render it the instant it's non-empty.
5. **Main always demoable.** One lead end-to-end before any parallelism or polish.
6. **CORE 5 sponsors, each ON the demo line, named on screen:** Firecrawl (scrape), ClickHouse (grounding source + archive), Thesys-C1/OpenUI (render story), Render (deploy), Langfuse (trace). Everything else is CUT unless free + on-path (see `docs/SCOPE-LOCK.md`). Don't add a node for a badge.
7. **Don't be a blocker.** Flag conflicts as findings, keep moving.

## Build order (stages — full detail `docs/reference/PRD.md`)
- **S0** (~15m): scaffold monorepo (pnpm workspace), copy doubles `.env`, write `packages/backend/src/types.ts` verbatim from `docs/CONTRACTS.md`.
- **S1** (by ~1:00): one lead end-to-end on STUB — nodes emit the full WsEvent sequence with canned content; dashboard renders the node graph from the live ws stream. Prove the pipe before the intelligence.
- **S2**: real scrape + drafter + Critic. The fabrication-catch fires on a real lead.
- **S3**: ClickHouse archive + trajectory (in-memory Map fallback first) + Langfuse traces + spiral + OpenUI slides.
- **S4**: Composio action + Guild gate (stretch) + Render deploy + polish to `docs/DESIGN.md`. **Freeze 2:50, submit by 3:50.**

Leave story COPY/prompts in clearly-marked editable consts so Johnny tunes narrative after the skeleton runs.
