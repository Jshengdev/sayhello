# PROMPT V2 — paste into the build window (evolve the working S1 build to the you-vs-them outreach harness)

---

You are the build engine for **sayhello** (`~/code/sayhello`). S0 + S1 are DONE and validated (stub
end-to-end on the paper-light dashboard). Submission **4:00 PM today**. Evolve the working build to **V2**
using your own judgment + a Workflow, guided by the docs. **First read:** `docs/SCENARIOS.md`,
`docs/VISUAL-SPEC.md`, `docs/DECISIONS.md`, `docs/CONTRACTS.md`, `docs/SCOPE-LOCK.md`, `docs/CONSTRAINTS.md`,
`docs/KEYS.md`, `docs/reference/SOUL.md`. Then confirm scope in one paragraph before coding.

## The V2 shift (the product)
sayhello positions **YOU against a TARGET**. Input = your positioning (who you are / what you offer) + a
target. It scrapes the target **company AND the target person** (LinkedIn + X, the gtm-tool verification
method). It builds the **grounded story of the lead** and the **working theory of how to approach them — the
outreach angle, beyond a basic personalized message**. The held-out critic still rejects any ungrounded claim
about them (fail-closed). We build the angle; the human makes the pitch (`docs/reference/SOUL.md`).

Data: add `positioning: string` (you) to RunInput; the target brief gains person fields (role, background,
recent activity from LinkedIn/X); the story output gains `outreach_angle` / `approach` (the grounded way in).
Keep the contract loose; the critic grounds whatever was populated.

## Build for THIS live demo exactly
"I'm Johnny — an independent AI-automations marketer." Target **two outreach companies: a real estate agency
and a marketing agency.** For each, produce the grounded story + the approach. Ground the angles in the real
calls: `~/code/carlos/context/yaps` (real estate, Carlos) + `~/code/work/context/yaps` (founder-fit /
marketing). Guided by those, not faked. Third preset: **Photon** (AI startup) targeting a company to
introduce iMessage, using gtm-tool angles (`~/code/gtm-tool/photon-gtm`).

## Priorities (ship by 4 — do P0/P1 first; P2/P3 if time)
- **P0 — GO LIVE + CACHE.** Real path behind each `stubMode()` guard: Firecrawl (company scrape), ClickHouse
  public (ground), Composio (enrich), OpenRouter (draft + judge, critic≠drafter). Run the **real-estate
  agency target** live end-to-end; the critic must catch a REAL ungrounded claim about them; save the run +
  events to `data/leads/` and add `REPLAY_MODE` (cached real, snappy timing). Person-scrape (LinkedIn/X) =
  **cached real** (live is slow/flaky). Modes: LIVE → REPLAY → STUB (floor). The demo can't break.
- **P1 — the cofounder look (`docs/VISUAL-SPEC.md`).** Add color + life: the status pop-up system (Ready to
  review / Running / Completed / Blocked — tan/blue/green/red), NOT a chat — cycling status cards in the
  sidebar. The bar styling (highlight inset top + darker outline bottom). The **entry animation**: a center
  search bar + a textured "say hello" button → fade out/in → a 3D textured **spiral with a shader** pops up
  (p5.js/WebGL; borrow `~/code/work/apps/said-built/components/lab/spiral/*` + `lab/textures`) → watch the
  story with a small progress bar. Port cofounder React components for the structured UI; OpenUI/Thesys C1
  for the generated **story + outreach report card** from the StoryRun JSON.
- **P2 — the 3 scenario presets** on the entry screen (Johnny→RE+marketing; Photon). Cached person data.
- **P3 — a live tracker** (leads storied / claims caught ticking) + **Render deploy** (`render.yaml`).

## Hard rules
Build to `docs/VISUAL-SPEC.md` + `docs/SCENARIOS.md`; keep the paper-light base (`docs/DESIGN.md`) and add
the cofounder color on top. Fresh code. Critic ≠ drafter. No silent stubs (visible FAILED + loud log).
`fabricatedClaims` rendered the instant it's non-empty. The two outreach stories must each render end-to-end
before any polish. Don't overcomplicate — image generators are for the video only, never the app UI. Hit a
problem you can't solve cleanly → log it, add to `docs/OPEN-QUESTIONS.md`, keep moving.

## Stop condition
The live demo works: Johnny's positioning + the **two outreach targets (real-estate + marketing)** each
produce a grounded story + an approach, on the cofounder-styled dashboard with the say-hello→spiral entry,
real data cached for replay. Re-capture the journey into `.evidence/` and update `.evidence/journey.html`.
Write `docs/STATUS.md` (what runs live, what's cached/stubbed, the top 3 next iterations, any key still needed).

Begin: confirm scope in one paragraph, then author the Workflow and run it. Live-test from the first node.

---
