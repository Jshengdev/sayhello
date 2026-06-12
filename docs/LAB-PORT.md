# LAB-PORT — port the said-built /lab visuals into sayhello (Johnny's exact direction)

> From Johnny watching http://localhost:3000/lab. Port these specific interactions. Source files in
> `~/code/work/apps/said-built/components/lab/`. Keep sayhello paper-light + add the cofounder color.

## 1. The TABS (the say-hello nav — top priority feel)
What Johnny loves: the lab tab BUTTONS, the **click + fade-out→fade-in switching** (super clean), the colors,
the FONT + font-color, how it sits in the scheme, the simple tab interaction.
- Port the tab bar with the **little button gaps** (each tab a separate soft key, not a segmented control).
- Switch = **fade-out → fade-in** (opacity 1→0→1, ~220ms each, `cubic-bezier(0.16,1,0.3,1)`). No slide.
- sayhello tabs: `Story · Person · Claims · Trajectory` (or the run views). Selected = solid ink fill / paper
  text; rest = paper fill / ink text — the cofounder active-chip inversion.
- Source: `app/lab/page.tsx` tab nav + `components/lab/LabSection.tsx`.

## 2. The CIRCLE / radial layout (the "general intelligence" one — beautiful)
The radial node arrangement with the **little button gaps** on each node, super simple, the box OFFSET is
good. Apply to sayhello's node graph: nodes as soft keys around a center, thin dashed connectors, generous
gaps. Source: `components/lab/OrgCanvas.tsx` / `OrgChatFrame.tsx`.

## 3. The DETAIL card (email campaign report — "shows details in a very simple way")
Port the EmailReportPair layout for our **outreach report**: label/value rows, one big numeral, a green bar,
a few stat lines — minimal words. This is the OpenUI/C1 render target shape. Source: `components/lab/EmailReportPair.tsx`.

## 4. The PROCESS display (research/contacts stage-4 — "step 1 / step 2 / step 3")
Johnny loves how it shows the ENRICHMENT PROCESS: what it's looking into, step-by-step, "sending outreach".
THIS is our person-scrape + node pipeline display: show "scraping company → verifying LinkedIn → reading X →
enriching → grounding → drafting → judging" as live numbered steps with the status pills. Source: the
roadmap/stage cards + `StatusGroupCard.tsx` (the Ready/Running/Completed/Blocked pop-ups).

## 5. THE SPIRAL — "the iteration river" (Johnny's exact tuning)
Johnny: "distilling down into a single point... spirals down more spaced out, like an iteration river...
on paper mode... higher pitch, a little higher radius, less turns, more camera tilts, more distance, more
focus... top-to-bottom, the cards show the entire process." Each card = a generation/step of the story.

**New preset "iteration river" (paper mode base, tuned per his words):**
```ts
"iteration river": {
  radius: 540,        // ↑ "a little higher radius" (paper was 470)
  pitch: 460,         // ↑↑ "higher pitch" — big vertical rise → spaced out, distilling top→bottom (paper 200)
  itemsPerTurn: 4.5,  // ↓ "less turns" — fewer cards per 360°, more open (paper 7)
  cameraTilt: 26,     // ↑ "more camera tilts" — more top-down (paper 10)
  cameraDist: 880,    // ↑ "more distance" (paper 640)
  focusScale: 1.28,   // ↑ "more focus" — the in-focus card pops (paper 1.1)
  entryBlur: 6,
  entryDim: 0.26,
  depthFade: 0.34,
  smoothing: 0.1,
  direction: 1,
  cardW: 360,
  cardAspect: 1.5,
  theme: "paper",     // paper mode
  grid: false,
}
```
Behavior: top→bottom scroll/auto-advance, each generation card spirals down and distills toward a single
point at the bottom (the final grounded story). Cards = the entire process (scrape → person → ground → draft
→ judge gen0 → gen1 → grounded). This is the hero entry after "say hello".
Source: `components/lab/spiral/{SpiralEngine,SpiralStudy,params.ts,spiral.css}.tsx` — copy wholesale, add this preset.

## Port order (frontend optimization, AFTER live wiring works — P1)
tabs+fade → radial node graph → spiral "iteration river" entry → status-pop-up process display → detail/report card.
Keep ≤1 whimsy per surface; everything in the paper-light + cofounder-color scheme.
