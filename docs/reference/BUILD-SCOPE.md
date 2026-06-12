# BUILD SCOPE — what to port, what to build, what to skip (Fable 5 judgment call)

> Locked on-site 2026-06-12 ~11:30. Submission 4:00 PM. The single most important decisions are here.
> Principle: ONE language, ONE repo, ONE loop that really runs on ONE lead, ONE hero visual. Everything else is cache or cut.

## THE call: fork `doubles` as the skeleton (not gtm-tool)

`~/code/doubles` already IS a harness, in TypeScript, with the hard parts done:
- `src/agents/critic.ts` + `critic-prompt.ts` → **the held-out judge, already built** (retarget to grounding/story-quality)
- `src/composio/` → **Composio already wired**
- `src/scrape/` + `src/ingestion/` → scrapers
- `src/persona/` + `src/context/layers/` (identity/voice/state/memory/personality) → **story-assembly engine** (retarget persona→company-story)
- `src/orchestrator/` → the loop driver
- `src/memory/` (@xenova/transformers embeddings) → semantic store
- `express` + `ws` + `web/app` + `web/index.html` → **live websocket UI transport, already there** (this is the spiral's pipe)
- `harness/` (TEAR1 config, same pattern as SOTARE) → loop discipline
- `railway.json` → deploys to a node host trivially (→ Render)

gtm-tool is Python + a separate Next.js app. Porting its *infra* means fighting two stacks under time pressure. Instead we **lift gtm-tool's DOMAIN LOGIC as prompts/specs**, not code. doubles wins because TS = one repo, and every remaining sponsor (OpenUI/React, ClickHouse-JS, Langfuse-JS, Render-node) wires into TS in minutes.

⚠️ **Fresh-code framing:** doubles AND gtm-tool are both Johnny's prior work. We are building a NEW product — a GTM story-enrichment harness — that lifts battle-tested libraries from two repos. The harness loop, the grounding judge retarget, the story-slide UI, the parallel-spiral visual, and ALL sponsor wiring are today's build. Say exactly that. Build in a FRESH repo (`story-engine/`), copy modules in, don't `git clone` and rename.

## THE other call: fork `said-built` as the FRONTEND skeleton

`~/code/work/apps/said-built` (Next.js + GSAP + p5) already ships the exact visuals Johnny wants, in his taste, in the CRM/"vortex" domain:
- `app/mvp/` + `components/mvp/today/LoopCanvas.tsx` + `SlipStrip.tsx` → **the clean product**: loop canvas with count clusters, agent rail ("needs you · 3"), about-to-slip strip. This is the `/mvp` screen he called "clean."
- `components/lab/spiral/` (`SpiralEngine.tsx`, `SpiralStudy.tsx`, `SpiralControls.tsx`, `params.ts`, `spiral.css`) → **the spiral** (scroll + right-rail knobs + presets) = the "spiral of watching us distill someone's story."
- `components/story/StoryCanvas.tsx` → already a story canvas.
- Design law = `~/code/work/design-system/fingerprint-johnny.md` (his verbatim shipped system — **authoritative, supersedes DESIGN-BRIEF's guesses**; DESIGN-BRIEF now points here).

**Two-skeleton build:** `doubles` = the harness BACKEND (loop/critic/scrape/composio/ws), `said-built` = the FRONTEND (mvp loop-canvas + spiral + story, paper-light taste). The fresh repo wires said-built's UI to doubles' `StoryRun` stream. Same fresh-code framing: lift components, build the product today.
**Adapt + simplify:** strip said-built to ONLY the screens we demo — `/mvp` (the live loop on leads) + the spiral (hero) + a story view (OpenUI slides). Cut campaigns/outreach/reports routes. Retarget LoopCanvas nodes = leads-being-enriched, SlipStrip = leads needing human approval, agent rail = the harness workers.

## PORT / BUILD / SKIP

### PORT (copy these modules into the fresh repo, retarget)
| From | Module | Becomes |
|---|---|---|
| doubles | `src/agents/critic.ts` + prompt | the **grounding judge**: every story claim must cite a scraped source; flag FABRICATED |
| doubles | `src/scrape/` + `src/ingestion/` | the scrape step (1 real source is enough) |
| doubles | `src/persona/` + `src/context/layers/personality,identity,state` | the **story builder** (company's world, pains, angle) |
| doubles | `src/orchestrator/` | the loop driver (propose→scrape→judge→re-enrich) |
| doubles | `src/composio/` | Composio seam (one real action) |
| doubles | `express`+`ws`+`web/app` | the live spiral UI transport |
| doubles | `src/llm/` + `src/memory/` | model calls + embedding store |
| gtm-tool | `specs/narrative-framework.md` | the **6 story angles** (resilience/competitor/channel-gap/build-v-buy/speed/revenue) — as a prompt, not code |
| gtm-tool | `specs/research-agent.md` | the **story field schema** (what_they_do, pains, tech_stack, why-it-fits, signals) |
| gtm-tool | ICP scoring logic | optional lead-quality score |

### BUILD NEW (the ~20% that's actually today's work)
1. **The grounding loop** — wire scrape → story-draft → critic(grounding) → re-enrich-gaps → archive. (retarget existing critic + orchestrator)
2. **ClickHouse telemetry** — write every story-version + score + source to CH; one live query panel.
3. **The spiral visual** — SIA-style, N leads orbiting, each a card showing scrape/enrich/judge progress + story filling. Hero screen.
4. **OpenUI story slides** — when a lead completes → its story renders as a walkable generated slide deck.
5. **Langfuse traces** — wrap the loop spans.
6. **Render deploy** — ship it live, show the deploy.
7. **Guild gate + hold-to-approve** — can't finalize an ungrounded story; human approves (your "model in the seat" thesis).

### SKIP (do not touch — these eat hours for zero demo value)
- gtm-tool's Next.js/ag-grid dashboard (doubles web replaces it)
- doubles' iMessage/Spectrum sending (we stop at the STORY — human takes next step, by design)
- gtm-tool email/outreach drafting (not our product — we ENRICH, we don't send)
- MiroFish actual code — **borrow the CONCEPT only** (seed → personas → agents simulate a world → report). Use it as a prompt pattern for "agents justify/enrich the story," not a Python port.
- Airbyte, Senso, TrueFoundry, Pioneer training jobs — stretch only (see priority).

## The contract (the one schema everything agrees on)
```ts
type StoryRun = {
  leadId: string; url: string;
  status: 'scraping'|'enriching'|'judging'|'reverting'|'done'|'blocked';
  generation: number;                 // self-improve iteration
  story: {
    headline: string;                 // the company's world, one line
    pains: Pain[];                     // each pain → an angle
    facts: Claim[];                    // every fact carries a source
    angle: 'resilience'|'competitor'|'channel-gap'|'build-v-buy'|'speed'|'revenue';
    openingLine: string;              // the human's first move
  };
  claims: Claim[];                    // {text, sourceUrl|null, verdict:'grounded'|'FABRICATED'|'pending'}
  score: { completeness:number; grounding:number };  // held-out judge, 0-1
  events: Event[];                    // streamed to UI over ws: {t, kind, text}
};
```
Every lane builds against this. WS streams `events`; ClickHouse stores `StoryRun` snapshots per generation; OpenUI renders `story`; the spiral reads `status`+`score`.

## Simplest thing that demos (build THIS first, by 1:00)
ONE lead, real URL → scrape one source → draft story → critic flags one claim FABRICATED → re-enrich → grounded → score → ws streams it all to one card on screen. If only this works, you have a demo. Everything else (parallel-5, OpenUI slides, Guild, Pioneer) layers on top without changing the core.

## Sponsor wiring priority (try all, but in THIS order — ship the top 5, stretch the rest)
1. **Composio** — already in doubles, ~0 cost. One real pull/push action. ✓ easy badge
2. **ClickHouse** — JS client, playground = zero signup. Story-versions + the live "winning angle per segment" query. (covers Langfuse-adjacent observability story too)
3. **Langfuse** — JS SDK, wrap loop spans. ~30 min. Cheap, judge present.
4. **OpenUI** — the story-slide payoff. React, official CC skill installed. The visual wow.
5. **Render** — deploy the node app live; show the harness building while deployed.
--- ship the 5 above; below are stretch in order ---
6. **Guild** — the approval gate + ungrounded-block policy (your thesis). ~1h.
7. **Pioneer** — the small parser model (scrape→fields), A/B vs frontier. ~45m if promo code works.
8. **TrueFoundry** — route proposer vs parser through one gateway. ~30m if 6+7 done.

## Lane split (3 windows, against the contract)
- **BACKEND (plan 2):** fresh repo + port modules → the grounding loop → ClickHouse + Langfuse + Composio. Owns `StoryRun` producer + ws.
- **VISUAL (plan 3):** the spiral (SIA-style) + OpenUI story slides + hold-to-approve, in DESIGN-BRIEF language. Consumes ws `events` + `story`.
- **SETUP/SHIP (plan 1 or rotating):** Render deploy, keys/.env, Guild+Pioneer stretch, Devpost + video.

## The 3-min demo flow (story-first)
"In sales the #1 lesson is: people buy from people who know their story. Agents try to replace that and hallucinate — so we built the opposite." → paste a real lead URL → watch the spiral distill their world live → a claim flags FABRICATED, the harness re-grounds it → ClickHouse names the winning angle → hold-to-approve → the story blooms into OpenUI slides → "here's their world, their pain, your opening line. The human takes it from here."
