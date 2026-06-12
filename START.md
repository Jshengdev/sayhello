# START — paste this whole block into a fresh Fable 5 window opened in ~/code/sayhello

---

You are the build engine for **sayhello** (`~/code/sayhello`). Hackathon; submit by 4:00 PM. Your single act: stand up a **clean, beautiful, live-tested, end-to-end skeleton** where one lead flows through a JAM-style typed-node harness that catches itself hallucinating — backend loop + frontend visual — leaning on a sponsor at every step. Build it gorgeous and working from the first stage, not bolted on later.

## STEP 1 — read your context, then confirm scope (do this before any code)
Read, in order: `CLAUDE.md`, `docs/SCOPE-LOCK.md`, `docs/DECISIONS.md`, `docs/KEYS.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`, `docs/DEMO-SCRIPT.md`, `docs/BUILD-LOOP.md`, `docs/CONSTRAINTS.md`, `docs/PORT-MANIFEST.md`, `docs/SPONSORS.md`, `docs/reference/SOUL.md`. Skim `docs/reference/` (PRD, FRONTEND-SPEC, DESIGN-BRIEF) as needed. Then write ONE paragraph confirming: the problem, the input, the output, the architecture, and the sponsor at each step. If anything contradicts, flag it and proceed with the locked docs.

## The locked truth (do not re-litigate)
- **Problem:** an AI agent writes a lead-story and hallucinates a fact; sayhello is the harness that catches the lie and won't ship a story it can't prove. (The SRE-agent failure, for GTM.)
- **Input:** `{ industry: "gtm"|"realestate"|"marketing", handle }` — a company URL (gtm/marketing) or property address (realestate). Build **gtm fully**; stub the other two lens configs so the demo can swap them.
- **Output:** the **grounded working theory of the lead's pain** — a story with a WHY, the guesses rejected — rendered as slides. We build the patty; the human makes the pitch (`docs/reference/SOUL.md`).
- **Architecture:** **JAM-style typed nodes** (`defineNode`, Zod I/O). Nodes: `scrape → enrich → ground → draft → judge → (enrich-retry ≤2) → archive → render`. Borrow L1/L2/L3 context + the MUST-FIX-linter judge INSIDE the nodes (`docs/reference/SOUL.md`). One repo: `packages/backend` (TS Express+ws, forks `~/code/doubles`) + `packages/frontend` (Next, forks `~/code/work/apps/said-built`).
- **Visual:** cofounder **paper-light** law (`docs/DESIGN.md`) + the **said-built spiral as the hero** (watch the story get shaped across generations). Port the components per `docs/PORT-MANIFEST.md`. Beautiful from S0.

## Your resources (what you have at your disposal)
- **Lift FROM** (don't clone-rename — fresh code, per `docs/PORT-MANIFEST.md`): `~/code/doubles` (harness loop, `agents/critic.ts`, llm, ws server, Composio), `~/code/work/apps/said-built` (LoopCanvas, SlipStrip, spiral, 5 cofounder components, paper-light CSS), `~/code/gtm-tool/photon-gtm` (story-field schema + narrative angles as prompts).
- **Keys (`docs/KEYS.md`):** at S0 copy `~/code/doubles/.env` → `./.env`. You then HAVE: `OPENROUTER_API_KEY` (draft + judge), `FIRECRAWL_API_KEY` (scrape), `COMPOSIO_API_KEY` (enrich), `DATABASE_URL` (Neon persist). ClickHouse grounding needs NO key (playground `sql-clickhouse.clickhouse.com:8443` user `demo`). GRAB free in parallel: Langfuse, Thesys/OpenUI, Render. **Read values from `./.env`; never print secrets.**
- **Sponsor at every step (majority-sponsor-reliant — this is graded 20% Tool Use):** scrape=Firecrawl · enrich=Composio · ground=ClickHouse · draft+judge=OpenRouter · trace=Langfuse · archive=ClickHouse/Neon · render=Thesys-C1/OpenUI · deploy=Render. Caption each on screen with its sponsor.

## STEP 2 — author and run an ultracode Workflow (goal-looped, self-validating)
Use the **Workflow tool** to author and run a multi-agent build workflow that designs its own staged plan from these docs and executes it under `docs/BUILD-LOOP.md` (SOTARE constraint discipline: CP-1 stop-condition, CP-3 bottleneck-first, CP-4 satisfice-then-stop, CP-6 WIP=1). It must:
- **Stage bottleneck-first:** S0 scaffold + copy `.env` + `types.ts` from CONTRACTS → S1 one gtm lead end-to-end on STUB streaming the full WsEvent sequence to the paper-light spiral dashboard → S2 REAL scrape+enrich+ground+draft+judge (the fabrication-catch fires on a real URL) → S3 archive/trajectory/spiral-generations/C1-slides + Langfuse → S4 Render deploy + polish to DESIGN. Stop each stage at its satisficing criterion (`docs/BUILD-LOOP.md`); do not gold-plate.
- **Build backend + frontend in parallel** (separate `packages/`, sharing only `docs/CONTRACTS.md`), then a **validator agent** that RUNS the verify command, reads output, judges pass/fail on evidence (no self-praise), and loops the same bottleneck until it passes.
- **LIVE-TEST continuously, not at the end.** Every "done" needs a real run + observed output: `pnpm dev` boots backend ws + frontend; `curl -X POST localhost:PORT/story/run {industry:"gtm",handle:"<a real SF SaaS url>"}` streams real `WsEvent`s; the dashboard node graph lights through the stages; the Critic catches a real ungrounded claim. Hit a real sponsor API on the first live test of each node — surface failures loudly (visible FAILED badge), never fake them.
- **Keep it clean + beautiful from the get-go:** apply the paper-light tokens + the said-built components in S1, not S4. The spiral is the hero from first render. ≤1 whimsy per surface. No generic AI-dashboard look.
- **Verbose-log every wiring seam** in `docs/BUILD-LOOP.md` (request → each node in/out → grounding score + fabricatedClaims → each WsEvent → frontend consumption → sponsor API call ok/FAIL). These logs are how the human finds the next wiring.
- **Subtraction-audit each stage:** delete anything off `docs/SCOPE-LOCK.md`'s 6-step line.

## Hard rules
Fresh code. Critic model ≠ drafter model (held-out). No silent stubs (visible FAILED + loud log). `fabricatedClaims` rendered the instant it's non-empty (the hero beat). One gtm lead works before any parallelism, the other lenses, or polish. CORE sponsors only (Firecrawl, Composio, ClickHouse, OpenRouter, Langfuse, Thesys/OpenUI, Render) — don't add a node for a badge. When you hit a problem you can't cleanly solve: log it, add to `docs/OPEN-QUESTIONS.md`, keep moving — don't freeze, don't overcomplicate around it.

## STOP condition for this act
S1 is met — one gtm lead flows handle→scrape→enrich→ground→draft→judge→fabrication-caught→fix→approve→story across the live, paper-light, spiral dashboard, end to end, every seam logged and every step hitting its real sponsor where keyed — and you've written `docs/STATUS.md` (what runs live, what's stubbed, the top 3 wiring iterations next, and any sponsor key still needed). Reaching S1 cleanly and beautifully is success. Continue to S2+ only if S1 holds.

Begin: confirm scope in one paragraph, then author the workflow and run it. Live-test from the first node.

---
