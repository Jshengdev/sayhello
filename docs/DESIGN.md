# DESIGN — the paper-light world (pointer)

Authoritative law: `~/code/work/design-system/fingerprint-johnny.md` (Johnny's shipped system).
Full extract: `docs/reference/DESIGN-BRIEF.md`.

## The minimum to not get it wrong
- Palette: `--page:#f5f5f2 · --raised:#fbfbf8 · --white:#fff(earning-white, the live lead) · --canvas:#f1f1ee · --recessed:#e7e7e3 · --ink:#262323 (6 alphas, ALL text) · --live:#6e2bff (ONLY the executing node)`.
- No borders — depth from light: 1px white inset ring + 1px 8%-black outer ring + 1–6% blurs. Recessed = white drop-shadows.
- Thin lines ≤1px law. Type: Onest (340/430/450/480, never 400/600) + IBM Plex Mono (system voice) + Departure Mono (numerals).
- Motion: `cubic-bezier(0.16,1,0.3,1)`, depicts something true. ≤1 whimsy per surface.
- Signature gestures: gate-stamp on approve · confetti only on human approval · blur-up swap between generations · shimmer on the executing node · packet dots on the wires.
- BAN: borders-as-shadow, gradients, hover-scale, bounce/elastic, pure black/white, >1 accent, dark-by-default, motion that depicts nothing.
