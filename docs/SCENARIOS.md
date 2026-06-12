# SCENARIOS — the 3 demo scenarios (seller-side evolution, recorded 1:30 PM 2026-06-12)

> **JOHNNY'S EVOLUTION (1:30 PM, recorded):** the lens pack grows a SELLER side. Same engine, same judge,
> same one-lead law — but every run now knows WHO is reaching out, and the Critic grounds seller claims too.
> Content for the lens consts lives in `docs/LENSES-CONTENT.md` (paste-ready at S3).

## SCOPE-LOCK conflicts — recorded, not silently decided
1. **SCOPE-LOCK says "Crystal INPUT: one company URL."** Resolution: the seller is LENS-PACK DATA selected by
   `industry` — `RunInput` stays `{industry, handle}` (CONTRACTS wins, already resolved). No input change.
2. **"Multi-lead parallelism → ONE lead is the demo."** Stands. Top-N discovery = a CACHED entry surface
   (honestly labeled "pre-computed"); exactly one lead runs per scenario.
3. **Step 2 "SCRAPE the company."** Person-scraping joins the same cascade as extra `signals[]` on the brief —
   no new node, no new WsEvent. LinkedIn live is IMPOSSIBLE (Firecrawl 403, hard unsupported-site) → cached
   fixture; X live is off the demo line (free-tier 429 reality) → one setup-time scrapeX run, cached.
4. **`PitchAngle` union is gtm-flavored** (existing OPEN-QUESTIONS finding). The cached lens swap needs
   realestate/marketing angle names — build lane: widen the union or render angle from the lens const.

## How the seller side rides (zero judge changes)
`run.seller` = a PersonBrief (Johnny, scenarios 1–2) or company-shaped brief (Photon, scenario 3). The
orchestrator concatenates `brief.signals + brief.person?.signals + run.seller?.signals` into the ONE evidence
corpus the judge already greps. A claim about the seller must trace or it's FABRICATED — **the harness won't
even let the AI exaggerate its own user.** Person FACTs must trace; ANGLEs (the Carlos life-stage read) are
allowed, labeled interpretation. "Guided not fake": fixtures are real curated source material (SOTARE R7).

**Demo order:** scenario 3 LIVE first (the spine), then swap the lens to 1 and 2 on cached fixtures —
DECISIONS §3's growth hack: *"watch the same harness generalize across 3 industries."*

---

## Scenario 1 — realestate lens · seller = Johnny → real-estate agencies
**The seller (johnny voice):** i build the patty. independent ai-automations marketer out of SF — i turn a
team's raw lead data into grounded stories of who's actually likely to sell, every claim traced to a real
record. receipts: a marketing agency signed at $5,040 fixed (2 months, 4 modules), a real-estate investor
team agreed $4–5k flat + 10–20% commission. their words for the pain: email data "consistently 30% wrong,"
the vendor they refused wanted "$15k and it's like 40 enriched." accuracy is the offer. the ai never closes —
"this ai is not going to be able to get us the clients" is the client's own boundary. i make the human walk
in already knowing the story.

**Entry surface (CACHED, labeled "pre-computed · discovery-call corpus"):** 2-row target list — **RE-1
boutique off-market/distressed team (TOP PICK, highlighted)**, RE-2 "we buy houses cash" wholesaling outfit.
**The live lead:** RE-1 (`data/leads/re-1-offmarket-team.json`).

| stage | mode | detail |
|---|---|---|
| scrape | **CACHED + GUIDED** | fixture brief authored verbatim from the Carlos call corpus; CacheStore miss-path |
| draft / judge / reenrich | **LIVE** | real LLM loop, critic ≠ drafter, lens swapped only |
| seller pack | **GUIDED** | Johnny's proof points as seller signals (Carlos/Aiden verbatim) |
| person slice (X) | **CACHED** | one setup-time scrapeX run, provenance-labeled (stretch) |
| person slice (LinkedIn) | **CACHED** | manual-paste fixture — Firecrawl 403s LinkedIn |
| entry top-N list | **CACHED** | display-only, "pre-computed" badge |

**Expected catch:** the fixture plants *"closed 14 properties in the last 12 months"* in the brief prose with
ZERO signal carrying a transaction count → drafter uses it → judge can't trace it → FABRICATED on gen-0,
deterministic. (Real scale in the corpus: ~4 properties ≈ "$30 to 40 thousand" commission.)

**30-second narration:** "same harness, new lens — real estate. the seller is me. this team's brief is real
discovery-call material: 'our email thing has been consistently 30% wrong,' and the last vendor wanted $15k
to be 40% right. watch the drafter reach for traction — 'closed 14 properties last year' — no source says
that. FABRICATED. cut, redraft. what ships only claims what the calls actually contain. it won't let me larp."

---

## Scenario 2 — marketing lens · seller = Johnny → marketing agencies
**The seller (johnny voice):** same seller, different pain. agencies grow on referrals and the founder's
face — "if i had a coma for one month, nothing would happen to our pipeline." that's the coma test, and an
agency that fails it has "no enterprise value at all." my offer: the signal-driven pipeline — "this person
just raised, this person just got into whole foods" → reach out — built as a durable data system, not
automation slop that "needs to be completely rebuilt every two months." proof that landed: linkedin outreach
~40% reply rate vs cold email's 2%; the photon build shipped in 2 months at ~20 hr/wk; vortex signed $5,040.

**Entry surface (CACHED, "pre-computed"):** **MK-1 experiential/event agency (TOP PICK)**, MK-2 boutique
branding studio. **The live lead:** MK-1 (`data/leads/mk-1-experiential-agency.json`).
**LIVE/CACHED/GUIDED:** identical table to scenario 1 — only the lens and fixture change.

**Expected catch:** planted *"ran 40 campus activations last year"* — no signal carries an activation count
→ FABRICATED, deterministic. The grounded redraft keeps what IS sourced: 8 simultaneous campaigns, the
website rebuild, the coma test.

**30-second narration:** "marketing lens, same seller. this target fails the coma test — founder-led
everything, referral-only, website mid-rebuild: the agency that sells brand has a broken brand surface.
that's the angle, and every line of it is their own words. the drafter invents an activation count — judge
kills it. grounded story, opening line in the founder's own metaphor, and the human sends it."

---

## Scenario 3 — gtm lens · seller = Photon → AI startups (THE LIVE SPINE)
**The seller:** Photon — "open-source iMessage infrastructure for AI agents." imessage-kit: ~2,300 GitHub
stars, 20K+ developers. Ditto: 42,000+ users across 5 campuses, 99.87% delivery, zero downtime through Apple
throttling. 26 named clients — and three companies Photon must NEVER claim (Poke, Tomo, Series use
competitors): the notCustomers list is Critic-trap material baked into the lens.

**Entry surface (CACHED, "pre-computed 2026-04 · photon-gtm research" — real ICP scores):** **lindy.ai 90
(TOP PICK)**, retell.ai 88, zo.computer 71. **The live lead:** lindy.ai.

| stage | mode | detail |
|---|---|---|
| scrape lindy.ai + blog post | **LIVE** | Firecrawl /v2/scrape; `data/leads/lindy.ai.json` as 404/failover |
| draft / judge / reenrich | **LIVE** | OpenRouter, critic ≠ drafter |
| ClickHouse grounding check | **LIVE** | playground claimed-vs-actual (stars, github_events) |
| seller pack (Photon) | **GUIDED** | curated verbatim from photon-gtm repo; judge grounds against it |
| contacts / person layer | **CACHED** | `lindy.ai-contacts.md` fixture |
| entry top-N list | **CACHED** | real photon-gtm research, labeled pre-computed |

**Expected catch (forecast before run, per INSPIRATION-MAP §6):** the killer grounding signal is REAL — Lindy's
own blog post "iMessage API: Three Rewrites, One Apple Ban." Live path: drafter invents a Linq detail or a
star count → judge + ClickHouse claimed-vs-actual stamps FABRICATED. Failover path (deterministic): the cached
brief plants *"now pays Linq five figures a month for iMessage delivery"* — no source. Seller-side trap: if
the drafter writes "Photon powers Poke" → FABRICATED-class (notCustomers).

**30-second narration:** "photon sells imessage infrastructure. firecrawl scrapes lindy live and pulls their
own blog post — 'three rewrites, one apple ban.' that's not us claiming they have the pain; that's them.
drafter writes the story — and the judge just stamped FABRICATED on a pricing claim no source contains. one
targeted re-enrich, redraft, every claim traces — clickhouse checked the star count against 9 billion github
events. gate's mine. approve. that's a hello i can actually send."

---

## The person-scrape slice (X live-capable, LinkedIn fixture)
- **X:** port doubles `fetchUserTweets` (2 GETs/person). Free-tier 429 reality ⇒ run ONCE at setup, cache
  into the fixture provenance-labeled; live call only as a rehearsed flourish with the cache as failover.
  Signals: `x_bio` + per-tweet `x_post` rows, `detail` = VERBATIM post text, `source_url` = real status URL.
- **LinkedIn:** Firecrawl 403s linkedin.com (tested live today) ⇒ `data/leads/person-johnny.json` hand-built
  from Johnny's real paste (handle `linkedin.com/in/johnny--sheng`), `provenance` field says exactly that.
  **BLOCKER: needs Johnny's paste + X handle in hand — inventing it is forbidden.**
- **On screen:** person signals ride `scrape_done`'s brief and render as ordinary evidence rows in the
  evidence panel — no new node, no new WsEvent, no new panel. The seller chip names the seller next to the
  lens switcher.

---

## THE CLOCK TRIAGE (freeze 2:50 PM)

| Lane | Item | Why / dependency |
|---|---|---|
| **SHIPS BY FREEZE** | gtm scenario live end-to-end: lindy.ai live scrape → draft → catch → reenrich → gate → slides | the demo spine; constraint 5 (one lead first) |
| **SHIPS BY FREEZE** | cached lens swap: realestate (RE-1) + marketing (MK-1) fixtures run through the SAME loop | the DECISIONS growth-hack moment — "same harness, 3 industries" |
| **SHIPS BY FREEZE** | lens consts pasted into `lenses/{gtm,realestate,marketing}.ts` from LENSES-CONTENT.md (sellerIdentity, angles, recipes, prompts) | Johnny-editable copy; 0 new nodes |
| **SHIPS BY FREEZE** | planted-catch fixtures: `data/leads/{lindy.ai,re-1-offmarket-team,mk-1-experiential-agency}.json` | SOTARE R7 — the catch never depends on luck |
| **SHIPS BY FREEZE** | entry surface: 3 scenario presets + cached top-N list with "pre-computed" badge | display-only; one-lead law stands |
| **SHIPS BY FREEZE** | seller-signal corpus merge in orchestrator (one concat; judge untouched) | ~15 min per person-scrape plan |
| **SHIPS BY FREEZE** | PitchAngle widening (or angle-from-lens-const) so RE/MK angles render | flagged; needed by the lens swap |
| **STRETCH** (only after the gtm catch fires live) | `data/leads/person-johnny.json` + seller-side catch beat ("it won't even let the AI exaggerate ME") | BLOCKED on Johnny's LinkedIn paste + X handle |
| **STRETCH** | one setup-time scrapeX run filling the fixture's X slice with real posts | ~25 min; 429-failover already designed |
| **STRETCH** | secondary fixtures (retell.ai, RE-2, MK-2) as full runnable briefs, not just entry rows | nice-to-have depth |
| **POST-HACKATHON** | live scrapeX on the demo line; live LinkedIn (needs enterprise intake); real top-N discovery as a computed step; multi-seller onboarding | off the one line per SCOPE-LOCK |
