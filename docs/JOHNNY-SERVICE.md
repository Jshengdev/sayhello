# JOHNNY-SERVICE — what Johnny does, with receipts

> Every quote below is verbatim with file attribution. If a claim has no source line it is not in this
> document — same law as the product. Sources: `/Users/johnnysheng/code/carlos/context/yaps/` (7 kickoff
> parts + directives), `/Users/johnnysheng/code/work/context/yaps/` (Aiden calls, signed contract, build
> logs), `/Users/johnnysheng/code/work/context/aiden-materials/` (empty drop zone — "_(awaiting Aiden's
> email)_"). Transcription caveats flagged inline; carlos pt4–pt6 speaker attribution blurs (the files
> themselves warn this) — ambiguous quotes are marked.

---

## WHO I AM (Johnny's voice)

i design memory for a living — verbatim: *"this is the majority of what ai engineering is, honestly and this is what I get like paid for as like a full-time job is is like designing memory"* (`carlos…pt3.md`). the receipts: photon *"has paid me basically two months for to get to the working mvp for the inbound and outbound lead generation thing"* (`2026-05-28-aiden-call-2-pricing.md`) — type a company name, *"clicks find contacts clicks draft and then like instantly sends it"* (same file) — and that channel pulls *"almost like a 40% like reply rate"* where good cold email gets *"like a 2% respond rate"* (`2026-06-01-aiden-kickoff.md`). i build the backbone for solo operators: a knowledge graph so *"everything is semantically correlated with each other"* (`carlos…pt3.md`), a grounded lead engine, and the whole build visible to the client on *"A live flow chart of everything that i'm working on what i'm actively building and what's actively like blocking me"* (`carlos…pt6.md`). i don't larp full autonomy — *"I don't believe in full automation but I just believe in automating the steps before you checking in on them"* (`2026-05-28-aiden-call-2-pricing.md`) — and i'm honest about misses: a linkedin computer-use experiment got my *"account like flagged"* (`carlos…pt2.md`). i'm in sf, living on a floor, *"in the pursuit of money"*, and *"my expertise is literally on the bleeding edge right now"* (`carlos…pt4.md`). flat fee for the core, commission on the upside, verbatim over vibes.

---

## THE SERVICE

**The one-sentence service (assembled only from sourced lines):** Johnny builds AI-native business backbones for solo operators — a memory layer (knowledge graph + CRM), a grounded lead engine (enrichment, stories, signal-based outreach), and a learning loop that feeds outcomes back in — flat-fee core, commission on the upside, with the whole build visible to the client on a live flowchart site.

### Engagement 1 — Aiden / Vortex ("Vortex Did That", experiential-marketing agency)
Hired to make the agency owner-independent and sellable. Aiden's framing, verbatim: *"if I had a coma and I had a coma for one month what would happen to our pipeline uh nothing would happen … an agency that's relying on the owner has no enterprise value at all"* (`work/context/yaps/2026-05-28-aiden-call-transcript.md`). His two priorities: *"figuring out how to make a real consistent pipeline plus like actually building it so those kind of two things that matter the most"* (`2026-05-28-aiden-call-2-pricing.md`).

Contract (signed): **"fixed $5,040 / 2 months, 4 modules, work-for-hire to Vortex, commission only via a future signed addendum"** (`work/context/yaps/2026-06-01-contract-signed.md`, the file's own reading of the signed PDF). The 4 modules in Johnny's words: *"the internal CRM the time line and a project tracker it's the outreach slash prospecting and in the final one is reporting analytics … each of them are their own individual kind of product almost"* (`2026-06-01-aiden-kickoff.md`).

### Engagement 2 — Carlos / "Monaco Project" (real estate, distressed-property lead engine)
Take a raw 10,000-address city file, enrich it, tell a story per owner, rank who's most likely to sell. The agreed 5-step plan (carlos pt3): **(1) data enrichment, (2) telling the story + sorting prospects, (3) data/prospect storage — knowledge graph, (4) first-touch outbound, (5) resubmit outreach data for training.** Carlos's scope boundary, verbatim: *"the enrichment and the story and the sorting that's the patty"* — outreach is *"the tomato and lettuce"* (`carlos/context/yaps/2026-06-10-carlos-kickoff-pt2.md`). End goal: *"all really the end goal is is to give us the most likely to sell"* (pt2).

### Deliverables actually shipped (one line each, with source)

| Deliverable | What it IS | Source |
|---|---|---|
| **Photon GTM engine** (prior client, referenced as proof) | Inbound/outbound lead-gen MVP: *"he just like put in the company name and he just like clicks find contacts clicks draft and then like instantly sends it"*; ~2 months @ ~20 hr/wk; includes an ML ICP-fit pipeline and monitoring | `2026-05-28-aiden-call-2-pricing.md` |
| **n8n canvas** (Vortex) | An n8n-style visual build canvas mapping every system input/output for client scoping: *"design it almost exactly like the ui of n8n to show him what we are trying to mange inputs and outputs"* | `2026-06-03-n8n-canvas-and-hermes.md` |
| **Hermes** (concept, not shipped) | *"the hermes agent"* = *"Johnny's name for the end-state meta-agent that defines/optimizes/maintains the system"* (file's note) | `2026-06-03-n8n-canvas-and-hermes.md` |
| **Vortex Next.js build** | The static canvas promoted to a real app: *"flowchart editor + /understand-style semantic drill-down, regenerable from the data model"* | `2026-06-04-vortex-nextjs-build.md` |
| **The hub / source-of-truth** | One React/Next.js control room holding every generated HTML: *"this is a single source or truth that if I appoint an AI agent towards they'll know exactly how to manage everything"* | `2026-06-06-vortex-hub-and-source-of-truth.md` |
| **vortex-os prototype + Brain-Builder framework** | The product prototype + a reusable verbatim→validated-flow method: *"a framework of evenntually how we find hte answer to become saved so that we can use this exact process to build other brains and other clients in seperate fields"* | `2026-06-06-vortex-hub-and-source-of-truth.md` |
| **said-built** (deliverable app) | The componentized Next.js editorial deliverable (Reading Room) + mimic lab + /mvp product scaffold + parametric spiral engine + minted design system (`vortex-ui.tokens.css`), deployed on Vercel as Aiden's progress check | `2026-06-11-crm-from-scratch-and-said-built-window.md` |
| **CRM-from-scratch research** | The exact process to build an Attio/folk-grade CRM from scratch on Neon, *"extremely targeted towards his use case"*; decision still open | `2026-06-11-crm-from-scratch-and-said-built-window.md` |
| **Carlos joint artifacts** (in flight, due ~Jun 13) | Commission math, flowchart-as-MVP-scope-doc, automation-capability map, MVP skeleton questionnaire, the co-working live-flowchart site | `2026-06-10-carlos-kickoff-pt6.md`, the 2026-06-11/12 directive files |

---

## CAPABILITIES INVENTORY (each with receipt)

### AI agent systems / orchestration
- Autonomous lead-gen agent for Photon: *"it's been able to like follow up and autonomously"* with validation fallbacks — *"we didn't want to make something where like if it automatically sent it out like an email and didn't want to — Like so I built like a fallback for that"* (`2026-05-28-aiden-call-2-pricing.md`)
- Ultracode multi-agent workflows: *"use ultracode worflow with independent /goals and finasl intefration /goal"*; hard lesson baked in: *"small sequenced workflows (~6–8 agents, context pre-digested), NOT a 250-agent fan-out — the prior fan-out rate-limited the API into the ground (5.5M tokens, ~0 usable)"* (file's unpacking, `2026-06-04-vortex-nextjs-build.md`)
- Computer-use agents (experimental, honest about limits): *"I've deployed like computer use agents to click around on my account but that I got my account like flagged"* (`carlos…pt2.md`)

### Memory / knowledge-graph design (his self-named core craft)
- *"this is the majority of what ai engineering is, honestly and this is what I get like paid for as like a full-time job is is like designing memory"* (`carlos…pt3.md`)
- *"the thing that I do for maintaining context is create like a knowledge graph so that everything is semantically correlated with each other"* (`carlos…pt3.md`)
- Sold to Aiden as the data model: *"in the structure of a knowledge graph almost everything can be recalled semantically … narrows like a tree"* (`2026-06-01-aiden-kickoff.md`, chunk C24)

### CRM / data systems
- Own baseplate: *"I have my own CRM that I have designed but it's like obviously it's a very it's a baseplate and I just need to tailor it towards whatever we're building"* (`carlos…pt3.md`)
- Durable-data-layer-first conviction, matching Carlos's instinct — Carlos: *"if you do make a really good storage system like CRM … no matter what happens you will always be able to have this information"* (`carlos…kickoff.md`)
- Build-vs-buy fluency: *"a version of attio and folk from scratch but with it extremely targeted towards his use case"* → research recommends custom on Neon (`2026-06-11-crm-from-scratch-and-said-built-window.md`)

### Scraping / enrichment / data hacks
- The LinkedIn hack: *"searching up their company name.com And then [LinkedIn] or their name and [LinkedIn] you search that up and like it had almost like a 85 hit rate"* vs banned scrapers (`carlos…pt2.md`)
- The hacks-library pattern: *"a lot of like these pre-programmed Hacks … give the ai the ability to call it Like with single command"* (`carlos…pt2.md`)

### GTM / lead-gen systems
- Signal-based ICP pipelines: *"the go-to-market side of it that like I've already designed for photon"* (`2026-05-28-aiden-call-2-pricing.md`); signals = *"do these people just raise money like did they just get into a big store like are they going on like a huge hiring blitz"* (Aiden's spec, `2026-06-01-aiden-kickoff.md`)
- Channel performance: *"for Photon it has almost like a 40% like reply rate"* vs *"Cold emails brutal it's like you have like a 2% respond rate if you're doing like good"* (`2026-06-01-aiden-kickoff.md`)

### Machine learning
- *"I had to build I build a little machine learning pipeline in the back where it was [used] to … take all the data of oh, here are your clients and your companies and like the type of wedges that you want to target and I'll try to fit … your highest ICP"* (`2026-05-28-aiden-call-2-pricing.md`)
- Phase-2 vision for Carlos: ML classifier on labeled outcomes + hit-rate tracking per strategy (`carlos…pt2.md`)

### Design / frontend
- Three isolated UX versions built from taste refs in one window; the Reading Room became the client deliverable, deployed to Vercel (`2026-06-11-crm-from-scratch-and-said-built-window.md`, Verbatim 3)
- Design-DNA extraction method (Cofounder), 1:1 mimic lab iterated via Playwright screenshots, a minted design system (`vortex-ui.tokens.css`), GSAP/p5.js motion, the four-pillars taste framework (same file, Verbatim 10–17)
- The bar: *"the entire project look like its insaely well designed and in good hands"* (Verbatim 5)

### Ops / process / client experience
- Verbatim-first context discipline: *"most decisoins should not just be made … very clearly save verbatim what jonhnny would like … the magic is in the abiltiy to create really good sounding stuff and we need to fix the problem that alot of times it loses what it means"* (`2026-05-27-operating-model.md`)
- The co-working transparency site for clients: *"an entire website where You can log on to it And you just like add notes whenever I have a question … A live flow chart of everything that i'm working on what i'm actively building and what's actively like blocking me"* (`carlos…pt6.md`)
- Async intake to cut calls: *"a live website where like i have all these boxes and active decisions … you can just like voice memo just drop like a voice text into that box"* (`2026-06-01-aiden-kickoff.md`)
- Standing rule: *"commit everything after each major succesful feature that ships"* (`2026-06-06-vortex-hub-and-source-of-truth.md`)

---

## WHAT CLIENTS VALUED (verbatim) — and friction (honest)

### Value / trust / asked-for-more
- **Aiden, seeing the knowledge graph of his own business:** *"you really do have everything in here? Yeah."* (`2026-05-28-aiden-call-2-pricing.md`)
- **Aiden endorsing the KG capture method:** *"that's pretty important … I'll take your lead on that but that does sound pretty good solution to it"* (`2026-06-01-aiden-kickoff.md`)
- **Aiden + Mike at plan recap:** *"perfect amazing sounds good"* / *"that sounds great to me excellent"* (`2026-06-01-aiden-kickoff.md`)
- **Aiden, vision alignment:** *"For sure and that's kind of my vision for it is just really build start building these processes now"* (`2026-05-28-aiden-call-transcript.md`)
- **Carlos, at close:** *"I'm super super fucking excited for this Huge potential right here huge AI B2B SAS potential"* (`carlos…pt7.md`)
- **Carlos, wanting Johnny long-term:** *"in terms of like getting new leads and like training like you would become like the best one for that"* and *"your payment would essentially be solely on commission … at least 10% of the uh of each deal"* (`carlos…pt4.md`)
- **Carlos, protecting Johnny:** *"we'll write out a contract. Get it notarized, signed, everything. Saying that if I sell this property, that you are titled. To X percent. And it's like that shit's fucking legally binding, bro."* (`carlos…pt6.md`)
- **Carlos, paying intent:** *"I do want you to get compensated for your work cuz this is like It's gonna be a lot"* and *"I want you to get paid like I want to pay you"* (`carlos…pt5.md`)
- **Trust both ways (attribution blurs, pt4):** *"I know you're not gonna sweep the rug under me"*; Johnny: *"I'm definitely actually willing to do this mainly because I think I believe in … you as a person"* (`carlos…pt5.md`)
- **Design review (Johnny's friend, on said-built):** *"I think this is cute already, the animation is really cute."* (`2026-06-11-crm-from-scratch…md`, Verbatim 9)
- Note: the "felt understood" line is **Johnny's own product spec**, not a client moment: *"he's consistently been surprised when you mentioned this because he felt understood"* (`carlos…pt3.md`) — it is the outcome his systems are designed to produce. (It is also the success marker already baked into `docs/DECISIONS.md` §4 and the gtm lens drafter prompt.)

### Friction / objections (honest — surface these, don't hide them)
- **Aiden price pushback:** *"20 hours a week would be over time 65 So it's like 8 hours a week"* and *"If you could give me a few ranges That'd make my life a lot easier"* (`2026-05-28-aiden-call-2-pricing.md`)
- **Aiden confused by the A/B build options:** *"yeah i don't fully understand the difference between the —"* (same file)
- **Aiden rejected the Photon-style flow:** *"that's still the same issue that i currently have where it's like it's basically just me still handling it … I just don't think that's the best way to do it in my opinion"* → forced the signal-based redesign (same file)
- **Aiden won't fund a technical hire:** *"we're not really a technical company at the end of the day"* (same file)
- **Carlos negotiated him down:** Johnny anchored ~$7k; Carlos: *"If you're able to come down to like Like anywhere from 45 K that would be sick"* (transcribed "45 K"; the file reads it as **$4–5k**) (`carlos…pt5.md`)
- **Carlos's honest commission warning:** *"the first couple it's not gonna seem like much and you might be like You know fuck this guys. Like I did all that work and I don't receive shit But then it's gonna … snowball"* (`carlos…pt5.md`)
- **Johnny's own honest limits:** on Instagram attribution — *"don't really have an exact answer … there's some limits to that"* → don't overpromise (`2026-05-28-aiden-call-2-pricing.md`); LinkedIn computer-use got his *"account like flagged"* (`carlos…pt2.md`)

---

## PRICING / OPERATING MODEL

### Rates (verbatim anchors)
- **Aiden engagement:** *"how much my time is usually worth, like as a developer … close to like 65 right 65 75"*; *"realistically closer to like 10 to 12 hours per week"*; *"I'll work … honestly your budget"* (`2026-05-28-aiden-call-2-pricing.md`). Outcome: **fixed $5,040 / 2 months / 4 modules, work-for-hire, commission only via future signed addendum** (`2026-06-01-contract-signed.md`).
- **Carlos engagement:** *"my dev rate right now is around 85 an hour"* × *"it'll probably take like 84 hours … over just the first second and third steps. But that would put it at around seven K"* (`carlos…pt5.md`). Settled on the call: *"I'm open to something where we can work out between the four to five range and look into what the commission looks like for that"* (`carlos…pt6.md`), paid in thirds July/August/September; deadline Aug 10 for steps 1–3.

### The pricing structure (his standard model, verbatim)
> "the process that I've done for all the other clients has just been flat rate for the core product itself and then everything in terms of like … additional things … For those I have Commission based" (`carlos…pt4.md`)
- Carlos commission worked example (Carlos's numbers): 10–20% *"pretty standard"*, on both buy and sell side; **~$10k per property full-cycle; first 4 properties ≈ $30–40k+** to Johnny; extensible to *"six or whatever"* (`carlos…pt5.md`)
- Payment cadence: *"I take it like incrementally"* (during development) (`carlos…pt5.md`)
- Running costs pass-through, not buried: *"baseline I think roughly like 250"*/mo (AI credits + LinkedIn ~$50–79 + scraper APIs + DB ~$20–30) (`2026-06-01-aiden-kickoff.md`)
- Honest time math: *"being able to know how to like stabilize it and also make it like repeatable. I think that's what's time intensive"* and *"Doing enough research to know what the best method is is the time consuming part more so than like the execution"* (`carlos…pt4.md`)

### Operating model (how he works)
- Verbatim ground truth → synthesis, never paraphrase: *"Verbatim > vibes"* (`2026-05-27-operating-model.md` header); no-orphan-files rule: *"a file is an orphan if its folder's README doesn't link it"*
- Four behavioral guidelines for the AI he runs: Think Before Coding / Simplicity First / Surgical Changes / Goal-Driven Execution (`2026-05-27-operating-model.md`)
- Skeleton-and-approval before commitment: *"we'll do this whole skeleton and approval stage before like I even commit to anything"* (`2026-06-01-aiden-kickoff.md`)
- The two-option framing he sells (consultant vs cofounder): *"the second option is almost more closely if you had hired like a technical co-founder … to turn your company into something that could be … sold"* vs *"designing your mvp on how your brain works to make your personal life easier"* (`2026-05-28-aiden-call-2-pricing.md`)
- Adopted framing: services-as-software ($1 software : $6 services; *"sell managed growth loops not labor; the learning loop is the moat"* — file's note on the pasted Eric Siu essay, `2026-06-06-vortex-hub-and-source-of-truth.md`)
- Personal stakes (pricing posture context): *"I am SF and I am living on a floor right now because I'm in the pursuit of money … I'm a little picky with what I'm willing to work on here. Cause I think my expertise is literally on the bleeding edge right now"* (`carlos…pt4.md`); tooling burn: *"development costs are really high for me like six dollars a month literally just to use all my tools"* (transcribed; file reads ~$600/mo) (`carlos…pt6.md`)

---

## PITCH RAW MATERIAL — 15 verbatim lines

1. *"what I get like paid for as like a full-time job is is like designing memory"* — `carlos…pt3.md`
2. *"I think my expertise is literally on the bleeding edge right now"* — `carlos…pt4.md`
3. *"photon has paid me basically two months for to get to the working mvp for the inbound and outbound lead generation thing"* — `2026-05-28-aiden-call-2-pricing.md`
4. *"he just like put in the company name and he just like clicks find contacts clicks draft and then like instantly sends it"* — `2026-05-28-aiden-call-2-pricing.md`
5. *"for Photon it has almost like a 40% like reply rate"* (vs *"cold emails … 2% respond rate if you're doing like good"*) — `2026-06-01-aiden-kickoff.md`
6. *"I had to build … a little machine learning pipeline in the back … here are your clients and your companies and like the type of wedges that you want to target and I'll try to fit … your highest ICP"* — `2026-05-28-aiden-call-2-pricing.md`
7. *"searching up their company name.com And then [LinkedIn] … it had almost like a 85 hit rate"* — `carlos…pt2.md`
8. *"I'm pretty much at that point with using ai that I'm less about focusing on the tech now and more focused about like what's possible"* — `2026-05-28-aiden-call-2-pricing.md`
9. *"Once you design an mvp most of it from there is edge cases"* — `2026-05-28-aiden-call-2-pricing.md`
10. *"I don't believe in full automation but I just believe in automating the steps before you checking in on them"* — `2026-05-28-aiden-call-2-pricing.md`
11. *"as long as the foundation is good and the backbone that it's built on and also the documentation … you can basically build an infinite amount of things on top of that and it will still work"* — `2026-05-28-aiden-call-2-pricing.md`
12. *"the thing that I do for maintaining context is create like a knowledge graph so that everything is semantically correlated with each other"* — `carlos…pt3.md`
13. *"this could be like … almost like my ongoing source of truth"* (the client's whole business, mapped — what made Aiden say *"you really do have everything in here?"*) — `2026-05-28-aiden-call-2-pricing.md`
14. *"I basically just create an entire website where You can log on to it … A live flow chart of everything that i'm working on what i'm actively building and what's actively like blocking me"* — `carlos…pt6.md`
15. *"i co-found a lot of like tech technical things so it'll just be like in that mentality of like as if i'm co-founding vortex … the best possible sellable company"* — `2026-05-28-aiden-call-2-pricing.md`

---

## HOW THIS FEEDS THE LENSES

**FINDING (per `docs/OPEN-QUESTIONS.md` discipline):** as of 2026-06-12 the lens files
`packages/backend/src/lenses/realestate.ts` and `packages/backend/src/lenses/marketing.ts` are TYPED STUBS
with `TODO(Johnny)` markers and **no `sellerIdentity` const exists yet in the `Lens` type** —
`docs/SCENARIOS.md` calls for a `positioning` field (you) on RunInput, cached per scenario in
`data/scenarios/{johnny,realestate,marketing,photon}.json`. The blocks below are the ready-to-paste
sellerIdentity / positioning content. Not deciding the field name silently — flagging and moving.

### → realestate lens (`packages/backend/src/lenses/realestate.ts`) — the Carlos-grounded seller

| Capability (receipt above) | sellerIdentity line it feeds |
|---|---|
| Memory/KG design (*"designing memory"*, `carlos…pt3.md`) | "i design memory — a knowledge graph where every owner, record, and outcome is semantically correlated" |
| Enrichment + story + sorting (the 5-step plan; *"the enrichment and the story and the sorting that's the patty"*, `carlos…pt2.md`) | "i take your raw 10,000-address file and return the story of each owner, ranked most-likely-to-sell — the patty, not the tomato and lettuce" |
| LinkedIn hack (*"almost like a 85 hit rate"*, `carlos…pt2.md`) | "owner enrichment that actually hits: ~85% hit rate on the identity lookup, vs banned scrapers" |
| CRM baseplate (*"my own CRM … a baseplate"*, `carlos…pt3.md`) | "your prospect data lives in a durable storage layer you keep no matter what" |
| ML learning loop (phase-2 classifier on labeled outcomes, `carlos…pt2.md`) | "every outreach outcome feeds back in — the engine gets better at picking sellers" |
| Human-in-loop boundary (*"I don't believe in full automation…"*, `2026-05-28-aiden-call-2-pricing.md`) | "the system builds the theory; you make the call and close the deal" (Carlos's own boundary, mirrors `docs/DECISIONS.md` §4) |
| Pricing model (flat + commission; *"at least 10%… of each deal"*, `carlos…pt4.md`) | "flat fee for the core build, commission on closed properties — i win when you close" |
| Live-flowchart transparency (`carlos…pt6.md`) | "you watch the build live on a flowchart site — nothing is a black box" |

### → marketing lens (`packages/backend/src/lenses/marketing.ts`) — the Aiden/Vortex-grounded seller

| Capability (receipt above) | sellerIdentity line it feeds |
|---|---|
| Owner-independence build (Aiden's coma test, `2026-05-28-aiden-call-transcript.md`) | "i make the agency run without the owner — pipeline that survives your coma month; an owner-dependent agency has no enterprise value" |
| 4-module backbone (CRM / timeline+tracker / outreach / reporting, `2026-06-01-aiden-kickoff.md`) | "one backbone, four modules: internal CRM, project timeline, prospecting, reporting — each almost its own product" |
| Signal-based ICP pipeline (*"do these people just raise money…"* spec, `2026-06-01-aiden-kickoff.md`) | "outreach fires on signals — funding, retail wins, hiring blitzes — not on a list you grind manually" |
| Channel proof (40% reply vs 2% cold email, `2026-06-01-aiden-kickoff.md`) | "the photon engine pulls ~40% reply where good cold email gets 2%" |
| KG source-of-truth (*"you really do have everything in here?"*, `2026-05-28-aiden-call-2-pricing.md`) | "your whole business mapped into one source of truth an agent can run" |
| Design/frontend craft (Reading Room on Vercel, minted token system, `2026-06-11-crm-from-scratch-and-said-built-window.md`) | "the deliverable looks like it's 'insaely well designed and in good hands' — clients see craft, not scaffolding" |
| Cofounder framing (*"as if i'm co-founding vortex"*, `2026-05-28-aiden-call-2-pricing.md`) | "i work like a technical cofounder building the most sellable version of your company" |
| Services-as-software framing (`2026-06-06-vortex-hub-and-source-of-truth.md`) | "sell managed growth loops not labor; the learning loop is the moat" |

### → gtm lens
The photon seller block lives in `docs/PHOTON-TARGETS.md` (companion file). Johnny-as-seller for scenario 1
("independent AI-automations marketer", `docs/SCENARIOS.md`) = the WHO I AM paragraph above, verbatim-ready
for `data/scenarios/johnny.json`.

### Caveats for whoever uses this
(a) carlos pt4–pt6 speaker attribution blurs (the files warn it) — Carlos quotes above marked as his are the
unambiguous ones; (b) "45 K" = $4–5k and "six dollars a month" = ~$600/mo are the files' own transcription
readings, not raw fact; (c) `aiden-materials/` contains no Aiden documents yet — scope quotes come from
transcripts and the contract-signed yap, not the PDF itself.

> RECONCILE note: `docs/LENSES-CONTENT.md` did not exist at write time (2026-06-12). When it lands, the two
> sellerIdentity tables above are the content to merge into its realestate + marketing seller blocks.
