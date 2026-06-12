# DESIGN BRIEF — defers to the real shipped system

> ⚠️ AUTHORITATIVE SOURCE: `~/code/work/design-system/fingerprint-johnny.md` (Johnny's verbatim, shipped in
> `~/code/work/apps/said-built`). That file wins over anything here. This is the load-bearing extract,
> mapped onto the Story Engine cockpit. The frontend lane PORTS said-built components, it does not invent.

## The system: "the paper-light world" — surfaces modeled by LIGHT, not lines

### Palette (5 neutrals, one relationship + one accent)
```css
--page:     #f5f5f2;   /* page (never pure white) */
--raised:   #fbfbf8;   /* raised surface */
--white:    #ffffff;   /* ONLY the single most important object — "earning white" (the live lead) */
--canvas:   #f1f1ee;   /* canvas / loop background */
--recessed: #e7e7e3;   /* recessed wells */
--ink:      #262323;   /* ONE warm ink at 6 alphas: .9 .85 .8 .7 .5 .4 — does ALL text. no other greys */
--live:     #6e2bff;   /* the ONE violet accent — only on the thing executing right now */
```
- **No borders.** Every card = 1px white inset ring + 1px 8%-black outer ring + stacked 1–6% blurs. Recessed things get WHITE drop-shadows beneath (`1px 2px 2px #fff, 1px 4px 5px #fff`) — light catching the lower lip.
- **Thin lines are law:** no stroke > 1px. Dashed wires 1.1–1.2; hairlines to 0.56px. Strokes show relation/motion, never weight. Depth = light.
- **Two modes, never blended mid-surface:** *complementary greys* = working mode (95% of screen, violet only on the live thing) · *full contrast* = ONE statement/hero moment per page (the spiral hero can be the dark/contrast moment).

### Type
- **Onest** (soft variable grotesque) at IN-BETWEEN weights: 340 numerals · 430 body · 450 quiet emphasis · 480 strong. Never 400, never 600. Headings rely on SIZE not weight.
- **IBM Plex Mono** = the system's voice: every label, count, timer, status, breadcrumb. 8–13px, tabular-nums, lowercase kickers.
- "Show less words always" is a hard rule.

### Motion
- One ease family: `cubic-bezier(0.16, 1, 0.3, 1)` (siblings `.23,1,.32,1`, `.22,1,.36,1`) — fast out, long settle. 140–150ms button light · 350–500ms reveals · one earned 2600ms stat beat. Nothing bounces. **Motion only depicts something true** (data flowing, time passing, a result landing).
- Organic stagger: `i × 0.7s` alternating, spinner cells `i × 0.12s` — breathes, never ticks in lockstep.

## The game-mechanic catalog → mapped to OUR cockpit (this IS the distinction)
| His shipped gesture | In the Story Engine |
|---|---|
| **Packet dots** (3.2px traveling dashed wires, 5.6s, 0.7s stagger) | scraped facts flowing from sources into a lead's story |
| **Confetti only on human approval** (26 particles, from the button) | the moment you approve a finished story — scarce, earned |
| **Count-ups on scroll-into-view** (2600ms easeOutQuint, once) | grounding score / facts-found landing with weight |
| **Blur-up swaps** (420ms blur 7px→0) | each new story generation develops like a photo, never a hard cut |
| **Breathing pixel-grid spinner** (3×3 ink cells, 0.12s stagger) | a lead actively enriching — calm heartbeat, never a flash |
| **Gate stamp** (pressed-ink chop w/ feTurbulence → resolves to mono chip `grounded ✓`) | the held-out judge's verdict landing on a claim; human-approve stamp |
| **Key-bevel buttons + 1px press** (2px white top-lip, `:active translateY(1px)`) | every control is a physical key — the approve button especially |
| **Live mono timers** (`2m 47s`, 9.5px tabular) | enrichment time per lead — "work is measurably happening" |
| **Shimmer** (one light band crossing only the row executing this second) | which lead the harness is on RIGHT NOW |
| **Run-the-loop replay** (canvas re-performs the run as a 10s pulse) | replay a lead's whole distillation for the demo |

→ The "hold-to-approve" I speculated earlier becomes his real **gate stamp + confetti-on-approval**. The "fill tick" becomes **blur-up swap + count-up**. Use HIS gestures.

## Ban list (his, verbatim)
borders doing a shadow's job · decorative gradients · hover that scales · bounce/elastic easing · mid-scale (20–40px) padding inside components · pure black text or pure white ground · more than one accent · dark mode by default · motion that depicts nothing. **≤1 whimsy element per surface, ever.**

## What to port (frontend lane)
From `~/code/work/apps/said-built`: `components/mvp/today/LoopCanvas.tsx` + `SlipStrip.tsx` (the live loop on leads) · `components/lab/spiral/*` (the hero spiral) · `components/story/StoryCanvas.tsx` (story view → OpenUI slides). Strip everything else. Onest + IBM Plex Mono already loaded there. The whole paper-light CSS system is already shipped — copy it, retarget the data to `StoryRun`.
