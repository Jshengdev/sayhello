# VIDEO — the 3-min demo + the viral intro

> Submission = ≤3-min demo. 70% real screen-capture of the working product. A cinematic AI-generated
> cold-open (~5-8s) + your voice carry it. Record ~2:50-3:20, submit by 3:50. Trim to 2:55 (never hit 3:00).

## THE VIRAL INTRO (5-8s cold open) — generate NOW in parallel (independent of the build)
**Tool: Higgsfield.** It has a Claude MCP ("Claude Video Generator") + Cinema Studio (directed camera
moves: Dolly Zoom, Orbit) + "Click to Ad" (ad from a product link). Generate from a Claude window via the
MCP, or higgsfield.ai web. Fallbacks on the same platform: Sora, Kling, Veo, Seedance. If paywalled/slow:
Luma Dream Machine or Runway Gen-3 (text→video, free tiers).

**The concept (on-brand: paper-light, warm ink, one violet accent, the contrarian-reel cadence):**
A confident sentence of "facts" about a company types onto warm paper — then one line ("raised $40M
Series B") flushes red and a FABRICATED stamp hits it; the camera dolly-zooms in as the lie is struck
through; cut to clean type: **sayhello**. It embodies the whole product in 6 seconds: the agent's lie,
caught.

**Higgsfield prompt (paste into the MCP or Cinema Studio):**
> "Cinematic macro shot, warm off-white paper (#f5f5f2) under soft lamp light, crisp dark ink text being
> written line by line listing facts about a tech company; one line glitches and flushes red with a rough
> ink 'FABRICATED' stamp slamming over it; slow dolly-zoom push-in on the struck-through lie; shallow
> depth of field, editorial, restrained, one violet accent; ends on clean centered serif wordmark
> 'sayhello' on paper. No music. 6 seconds, 1080p."

**Alt concept (if you want pure punch, @howard.mov reel style):** black screen, white type beats —
"Your AI agent is lying about your leads." / "We built the one that gets caught." / "sayhello." — with a
hard dolly push on each line. Faster to generate, very shareable.

## THE FULL VIDEO (shot list, timed)
| t | beat | on screen | voice |
|---|---|---|---|
| 0:00-0:07 | **viral intro** (above) | the FABRICATED-stamp cold open → sayhello | (silence or one line) |
| 0:07-0:30 | the problem | the paper-light spiral dashboard, quiet | "Throw an AI at sales research and it hallucinates — invents a funding round, sends you to embarrass yourself. Same as trusting an SRE agent blindly." |
| 0:30-0:50 | what it is | paste a real SF SaaS URL, the scrape node lights, facts land as sourced chips (Firecrawl + ClickHouse) | "sayhello builds a *grounded* story around a lead — every claim traced to a real source." |
| 0:50-1:25 | **THE CATCH** (hero) | draft appears confident → judge node lights → grounding 0.4, a line turns red, Critic card: 'no source — fabricated' | "It just wrote a beautiful lie. A held-out judge — a different model — catches it. On screen." |
| 1:25-1:50 | the fix | enrich re-scrapes → claim cited or cut → grounding 0.9, the spiral climbs gen by gen (ClickHouse) | "It re-grounds until the story is true. You watch it shape itself." |
| 1:50-2:15 | approve → out | hold-to-approve gate-stamp → C1/OpenUI slides bloom: their world, the pain, your opening line | "The human approves. We build the patty; you make the pitch." |
| 2:15-2:35 | it generalizes | swap the lens: same harness on a real-estate lead + a marketing lead (cached) | "Same harness, three industries. The discipline is universal." |
| 2:35-2:55 | close | Langfuse trace of the run + the sponsor-lit architecture diagram | "Better models won't fix this — the model already wrote the lie. The harness around it does. sayhello." |

## Production rules
Real footage for the core (1:25-1:50 catch is one continuous take — engineers smell cuts). Caption every
sponsor as its node lights (Tool Use = 20%). 1080p, 125% UI zoom, paper-light reads great on a projector.
VO recorded close-mic in a quiet corner, Adobe Podcast Enhance ~65%, -16 LUFS. Last frame: repo URL +
sayhello + tagline, hold 3s. Keep raw footage for the 5:00 finalist re-cut if selected.
