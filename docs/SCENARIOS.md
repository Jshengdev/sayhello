# SCENARIOS — you-vs-them positioning + the 3 demo scenarios

> Evolution: the product positions YOU against a TARGET. It scrapes the TARGET company AND the target
> PERSON (LinkedIn + X), and frames the working theory of how to reach out given who YOU are and who THEY are.
> "This is my company / who I am + my positioning → target other companies → the grounded outreach angle."

## The richer input (you + target)
- **You** = a short positioning blurb (your company / who you are / what you offer). Cached per scenario.
- **Target** = a company URL + the person (scrape via the gtm-tool verification method: LinkedIn profile
  + X scraper + site). Many scrapers → extract data about the INDIVIDUAL, not just the company.
- The doubles engine fabricates a position from where they are + their mission; the harness judges the
  outreach angle — and the held-out critic still rejects any ungrounded claim about them.

## Demo scenario 1 — Johnny, independent AI-automations marketer
Paste a blurb about Johnny's work → scrape a set of sites → return top 5-10 leads, the **top 2 being a real
estate agency + a marketing agency** → demo the full process on both. Grounding for the angles: the Carlos
(real estate) + founder-fit calls (`~/code/carlos/context/yaps`, `~/code/work/context/yaps`) — guided, not
faked, toward real estate + marketing-agency positioning. Find strong real-estate examples (Carlos-style) to
back what Johnny offers; and a marketing angle for AI automations.

## Demo scenario 2 — the deep-dives (within #1)
Real estate target + marketing-agency target, each run end-to-end: scrape company + person → grounded story →
the outreach angle tuned to that industry's real pains (from the verbatim calls).

## Demo scenario 3 — Photon (AI startup)
"My company = Photon (iMessage infra; known clients)." Scrape a target company → grounded story → outreach
angle to introduce iMessage, using Photon's real GTM angles + successful campaigns (`~/code/gtm-tool/photon-gtm`).
Guided, not fake.

## For the build (keep it shippable)
- Lens packs already exist (gtm/realestate/marketing). Add a `positioning` field (you) to RunInput, cached
  per scenario in `data/scenarios/{johnny,realestate,marketing,photon}.json`.
- The person-scrape (LinkedIn/X) is the richer enrichment; for the demo, CACHE the scraped person data so it's
  real-but-replayable (live LinkedIn/X scraping is slow/flaky). One live scrape on stage, cached fallback.
- The 3 scenarios are 3 buttons/presets on the entry screen. gtm/Photon live; real-estate + marketing cached.
