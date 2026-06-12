# OBJECTIVE — the one prompt for the build window (paste into Fable 5 in ~/code/sayhello)

> This is the single goal. It designs its own plan and loops with self-validation. Paste it whole.

---

You are the build engine for **sayhello**, in `~/code/sayhello`. Today is a hackathon; submission is 4:00 PM. Your job is ONE thing: stand up a **wired, verbose-logged, end-to-end skeleton** that runs one company URL through the 6-step harness journey and shows it live — backend loop + frontend visual — so a human can watch the seams and see exactly what needs further wiring. A perfect product is NOT the goal; a running skeleton that reveals its own gaps IS.

**First, read in this exact order, then stop and confirm you understand the scope before writing code:** `CLAUDE.md`, `docs/SCOPE-LOCK.md`, `docs/DECISIONS.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`, `docs/DEMO-SCRIPT.md`, `docs/BUILD-LOOP.md`, `docs/CONSTRAINTS.md`, `docs/PORT-MANIFEST.md`, `docs/SPONSORS.md`, `docs/reference/SOUL.md`. The rest of the deep reference is in `docs/reference/`.

**The one-sentence problem (never lose it):** an AI agent throws together a lead-story and hallucinates a fact; sayhello is the harness that catches the lie and refuses to ship a story it can't prove. **Input = `{industry, handle}`** (a company URL, or a property address for realestate). **Output = the grounded working theory of the lead's pain** — a story with a WHY, the guesses rejected — rendered as slides. The journey is the 6 steps in `docs/SCOPE-LOCK.md`. **Architecture is JAM typed nodes (locked, `docs/DECISIONS.md`)** — borrow the L1/L2/L3 context + MUST-FIX-linter judge INSIDE the nodes. **Visual: cofounder paper-light + the said-built spiral as hero** (port from `~/code/work/apps/said-built`). Do not build anything off the journey line.

**Multi-industry via lens packs (do gtm first; realestate + marketing are cached-lead swaps):** `industry` selects the signal recipes + grounding sources + narrative angles. Build gtm fully; stub the other two lenses' config so the demo can swap them. The harness/judge/visual are identical across lenses — that generalization IS a growth-hack demo moment.

**Method — design your own plan, then loop:** Use the **Workflow tool** to author and run a multi-agent build workflow that designs its own staged plan from the docs and executes it under the constraint discipline in `docs/BUILD-LOOP.md`. Shape it however the docs imply, but it must:
- **Stage in bottleneck-first order** (CP-3): S0 scaffold → S1 one stub lead end-to-end streaming to the dashboard → S2 real scrape+draft+Critic catch → S3 archive/trajectory/spiral/slides → S4 deploy+polish. Stop each stage at its satisficing criterion in `docs/BUILD-LOOP.md` (CP-4) — do not gold-plate.
- **Build backend and frontend in parallel** (separate `packages/`, sharing only `docs/CONTRACTS.md` as the seam), then a **validator agent** that runs the stage's verify command, reads the output, and judges pass/fail on its own evidence (no self-praise). Loop the stage on the same bottleneck until it passes (CP-6, WIP=1).
- **Self-validate with run commands, not claims.** Every "done" needs a command + observed output. `pnpm dev` must boot; `POST /story/run {url}` must stream `WsEvent`s; the dashboard node graph must light through the stages.
- **Verbose-log every wiring seam** listed in `docs/BUILD-LOOP.md` (request → each node in/out → Critic grounding + fabricatedClaims → each WsEvent → frontend consumption → ClickHouse write → failures). These logs are the deliverable's nervous system — they show the human where to iterate.
- **Subtraction audit each stage** (CP-2): delete anything not on the 6-step line.

**Hard rules (from `docs/CONSTRAINTS.md`):** Fresh code (lift modules per `docs/PORT-MANIFEST.md`, don't clone-and-rename). Copy `~/code/doubles/.env` to `./.env` at S0 (working OPENROUTER + Neon + Firecrawl keys). Critic model ≠ drafter model. No silent stubs — failures render a visible FAILED badge and log loudly. `fabricatedClaims` is the hero — render it the instant it's non-empty. Main always demoable; one lead works before any parallelism or polish. CORE 5 sponsors only (Firecrawl, ClickHouse, OpenUI/C1, Render, Langfuse) — don't add a node for a badge.

**When you hit a problem you can't cleanly solve:** log it, add it to `docs/OPEN-QUESTIONS.md`, and keep moving on the skeleton. Do not freeze; do not silently decide a locked thing; do not overcomplicate to route around it.

**Stop condition for this objective:** S1 is met — one lead (stub is fine) flows URL→scrape→draft→judge→fabrication-caught→fix→approve→story across the live node-graph dashboard, end to end, with every seam logged — and you have written a short `docs/STATUS.md` saying what runs, what's stubbed, and the top 3 wiring iterations a human should do next. Reaching S1 cleanly is success. Continue to S2+ only if S1 holds.

Begin by confirming the scope in one paragraph, then author the workflow and run it.

---
