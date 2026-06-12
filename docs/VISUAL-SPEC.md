# VISUAL-SPEC v2 — borrow the EXACT cofounder UI, add color + life, few words

> From Johnny's 7 cofounder reference images + the spiral example. Paper-light base (docs/DESIGN.md) STAYS,
> but add the cofounder color system + these specific patterns. Blocks of text, not paragraphs. NOT a chat UI.

## The color + life additions (cofounder status system)
The product was too monochrome. Add the cofounder status colors as the life:
- **Ready to review** — warm tan/amber pill (`bg #f7ecd9 / text #9a6a16`, dot amber)
- **Running** — blue pill + spinner (`bg #e3ecfd / text #2f6df0`, the ◌ spinner)
- **Completed** — green pill (`bg #e3f3e4 / text #2f8a3e`, dot green)
- **Blocked** — red pill (`bg #fbe6e6 / text #b5263a`, dot red)
- **Status-count chips**: `● 4  ◌ 3  ● 2` — colored dot + Departure-Mono count, in a recessed pill (img 11).

## NO chat interface — instead: cycling status pop-ups (the sidebar)
Replace the chat with a sidebar that CYCLES through status cards (img 12/13): sections "Ready to review /
Running / Completed / Blocked", each row = a task + its agent (e.g. `ICP analysis · OUTREACH AGENT`). It
auto-cycles through what's happening — you WATCH, you don't type. Each pop-up is small, colored, few words.

## The bar styling (mimic this exactly — img 15/16)
Every progress/score bar: **highlight inset from the TOP + darker outline on the BOTTOM** (a lit lip on top,
a shadow lip below) — that's the "weight." For stat bars use the pixelated multi-segment green→amber→red
fill (img 16). Big numerals in Departure Mono (`234`, `58%`), small green delta chips (`+34%`).

## The hero entry animation (img 10 radial + the spiral)
1. Center: a big search bar — "enter a URL" + a **"say hello"** button in a human, textured display font.
2. Click → **fade out → fade in**: a granular, textured **spiral pops up in 3D space with depth + a shader
   running through it** (this is the moment). Borrow the working spiral: `~/code/work/apps/said-built/components/lab/spiral/*`
   and the texture/shader feel from `lab/textures` (the glitch-flower). p5.js or WebGL shader.
3. Then you watch the story unfold with a **small progress bar** while the status pop-ups cycle on the side.
4. The node graph follows the cofounder **radial department layout** (img 10) — nodes around a center.

## OpenUI for the generated visualization
Use OpenUI/Thesys C1 to GENERATE the data-viz cards from the StoryRun JSON — the lead-story report and an
**email/outreach campaign report card** (img 15: To/From/Subject + Open Rate 58% with the green bar +
Sent/Delivered/Replied). The UI shapes itself to each lead. That's "OpenUI for the visualization."

## The live tracker (the closer — img 16)
End with a **live tracker**: a signups/active-users style panel + a "Live · [people] reached" popup list
(name · city · status pill). For us: live "leads storied" / "claims caught" ticking. Gives the demo a pulse.

## The roadmap/flowchart (for showing phases + sponsors — img 14)
A kanban "full roadmap": columns = the harness phases (Scrape / Enrich / Ground / Draft / Judge / Render),
cards = tasks tagged `Agent task` / `User approval`, each labeled with its SPONSOR. This is the
"how we use each sponsor" flowchart, in cofounder style.

## HOW to build each (the technique per element)
- Structured UI (status pop-ups, pills, bars, live tracker, roadmap, email report) → **port/extend cofounder React components** from `said-built/components/lab/*` (StatusGroupCard, EmailReportPair, the 5 lab components). Real HTML/CSS, exact style, with color. NOT image generation.
- The living spiral + shader entry → **p5.js / WebGL** (borrow said-built lab/spiral + lab/textures).
- The generated story/campaign report → **OpenUI / Thesys C1** from StoryRun JSON.
- Image generators (Higgsfield) → ONLY the video intro, never the app UI.

## AGENT FRAMING — recorded Johnny directive (2026-06-12 ~2:40 PM). P1 visual lane + closer: implement this.
**Everything acts and looks like an AGENT — we built a harness AROUND it.** Two visually distinct actors:
1. **THE AGENT (the worker)** — the thing doing real work on the open web. It speaks in first person in the
   status pop-ups ("reading their site…", "pulling the founder's posts from X…", "drafting their story…").
   Tool calls render as visible actions (chip: tool name + sponsor + what it fetched). The executing node
   carries the agent presence (shimmer = the agent working THERE). The event ticker IS the agent activity feed.
2. **THE HARNESS (the watcher)** — visually separate layer/voice: mono system voice, stamps and verdicts.
   The judge/critic is NOT the agent — it's the harness catching the agent ("FABRICATED — no source. The agent
   invented this."). Gate, badges, FAILED chips, Guild gate, score panel = harness surfaces.
Rule: never blend the voices. The agent is confident and busy; the harness is terse and skeptical. The demo
line: "watch an autonomous agent work — and watch the harness catch it lying." Devpost + DEMO-SCRIPT use the
same split. This is the hackathon challenge framing verbatim (autonomous agent doing real work, harnessed).

## THE RING RECIPE — no gray borders, ever (Johnny directive ~2:55 PM; refines DESIGN.md 8% → 4%)
Every card/chip/panel edge = stacked shadows, never `border`:
```css
/* the dimensional ring */
box-shadow:
  inset 0 0 0 1px rgba(255,255,255,0.85),  /* 1px white inset — the light edge */
  0 0 0 1px rgba(38,35,35,0.04),           /* 1px black 4% outer — the form edge */
  0 1px 2px rgba(38,35,35,0.04),
  0 2px 6px rgba(38,35,35,0.03);           /* soft depth, 1–6% only */
border: none;
```
ENFORCEMENT (P1 lane + closer audit): grep the frontend for `border: 1px`, `border:1px`, and gray border
colors (`#ccc #ddd #e5e7eb #d1d5db gray- slate- neutral-`) — every hit converts to the ring recipe.
Recessed surfaces invert: white drop-shadow below, dark inset above (see said-built `.bar-track`).

## P1 ENTRY POINTER (3:00 PM): before implementing ANY P1 visual, read docs/LAB-PORT.md — it has the exact
## lab interactions (tab fade, radial graph, detail card, process display) + the tuned "iteration river"
## spiral preset. LAB-PORT.md overrides earlier spiral guidance where they conflict.
