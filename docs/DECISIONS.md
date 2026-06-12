# DECISIONS — locked calls (Fable made these so we can build ASAP; adjust later)

## 1. Architecture: JAM-style typed nodes (NOT the one-execute_code-tool). LOCKED.
**Why (validation effort — the deciding question):** the one-tool agent's behavior is EMERGENT — it writes
arbitrary code, so you validate by running and observing non-deterministic output. That's MORE effort and
a worse demo (the visual can't be deterministic). JAM typed nodes are discrete, independently testable, and
the loop/spiral visual maps 1:1 to nodes — the demo "feels visual about the process" precisely because the
process is a fixed, renderable sequence. Long-term: extensible (add a node or a lens). **Lower validation
effort + better visual + buildable = JAM nodes.**
**Borrow the Shortcut essay's wisdom INSIDE nodes:** L1/L2/L3 layered context in the draft+enrich nodes,
the diff-with-MUST-FIX linter in the judge node, accuracy-first. Best of both — deterministic pipeline,
compressed context, grumpy linter-judge.

## 2. Input: industry + handle. CRYSTAL.
```ts
type RunInput = { industry: "gtm" | "realestate" | "marketing"; handle: string };
// handle = a company URL (gtm/marketing) OR a property address/owner name (realestate)
```
The `industry` selects a **LENS PACK** (which L2 signal recipes, grounding sources, and narrative angles to
use). Same engine, swap the lens. This IS the multi-industry extension and keeps input dead simple.

## 3. Lens packs (the multi-industry demo — same harness, 3 industries)
| industry | input handle | grounding sources | narrative angles | verbatim grounding |
|---|---|---|---|---|
| **gtm** (SF SaaS outreach) | company URL | scrape + ClickHouse github_events/hackernews + SEC/finance | resilience / channel-gap / build-v-buy / speed | ~/code/work/context/yaps (aiden/crm) |
| **realestate** | property address / owner | public records, owner age, sale date, transfer, life-stage | forced-sale / inheritance / relocation | ~/code/carlos/context/yaps (Carlos) |
| **marketing** (agency) | brand URL | brand site, social, recent campaigns/launches | brand-gap / channel / positioning | ~/code/work/context/yaps (aiden/vortex) |
The judge + the loop + the visual are IDENTICAL across lenses. The discipline (ground every claim, reject
the guesses, build the patty) is universal. **Growth hack:** "watch the same harness generalize across 3
industries" is a strong judge moment — show gtm live, then swap the lens to real estate + marketing on cached leads.

## 4. Output: the grounded working theory of the lead's pain (Carlos-grounded). LOCKED.
Not a data dump — a STORY with a WHY and the guesses rejected. The marker is "felt understood" (surprise +
recognition). `{ story, openingLine, pitch_angle, score, fabricatedClaims, sources }`. We build the patty;
the human makes the pitch (the AI explicitly does NOT close — Carlos's own boundary).

## 5. Visual: cofounder paper-light + the said-built SPIRAL as hero + SIA's unique info display. LOCKED.
- **Reference repos (port from):** `~/code/work/apps/said-built` (the vortex MVP — LoopCanvas, SlipStrip, `lab/spiral/*`, the 5 cofounder components, paper-light globals.css) and `~/code/work/design-system/{fingerprint-johnny.md, references/cofounder-dna.md}`.
- **Element B (the HERO) = the spiral**: watch the story get SHAPED across generations — gen-0 (ungrounded, red claims) spiraling up to grounded (green), scroll to scrub. This is "intuitively interactive iterative process of watching how the story is being shaped" (SIA philosophy: show information in a unique way).
- **Element A = the dashboard**: loop canvas (the node graph executing) + status groups + the story/score report. Cofounder paper-light law from docs/DESIGN.md.

## Still open (Johnny, post-build): final name · the exact demo leads per industry · story copy/voice · final visual identity polish.
