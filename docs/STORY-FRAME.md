# STORY-FRAME — the 5-beat customer-as-hero spine (Johnny, 2026-06-12 ~2:20 PM)

> The drafter, the judge's narrative_arc axis, the OpenUI report slides, and the Devpost all tell the SAME
> story shape. The CUSTOMER (the lead) is the main character — never us. Not manipulation: a clear
> explanation of why they should care NOW. If the story is consistent everywhere, customers repeat it back.

## The 5 beats (drafter output structure + slide structure)
1. **THE GOAL** — what this lead is trying to achieve (from their site/posts/person signals — their words).
2. **THE OBSTACLE** — what's in the way (the pain, grounded in Signals: the spam-blocked launch, the 30%-wrong data).
3. **THE OLD WAY FAILS** — why their current approach is no longer good enough (grounded, never invented).
4. **THE BETTER PATH** — how the seller (Johnny / Photon) creates it (sellerIdentity proof points, receipts only).
5. **THE BETTER OUTCOME** — what they get (specific, forward-looking, offers agency — Carlos's "powerful position" move).

## Wiring
- `drafterSystemPrompt` (all 3 lenses): "Structure the story as the lead's 5-beat arc (goal → obstacle →
  old-way-fails → better path with us → outcome). The lead is the protagonist. Every beat grounds in a Signal
  or it gets cut. The outreach angle = beat 4 spoken in one line, in the seller's voice."
- `judge` narrative_arc calibration: score 1.0 = all 5 beats present, lead-as-protagonist, each beat sourced;
  cap at 0.5 if the seller is the main character or a beat is invented.
- `render` (OpenUI report): 5 slides = the 5 beats + the claims-ledger receipt slide. Same words as the story.
- Devpost: sayhello itself told in the same 5 beats (GTM teams have a goal → agents hallucinate → trust-the-
  model fails → the harness catches the lie → outreach you can stand behind).
