# LENSES-CONTENT — paste-ready consts for `packages/backend/src/lenses/{gtm,realestate,marketing}.ts`

> **These consts are Johnny-editable; the build lane pastes them into `lenses/*.ts` at S3.** Every quote is
> VERBATIM from mined source (Carlos/Aiden call corpus, photon-gtm repo). Each fixture deliberately contains
> ONE plausible-but-unsourced claim (marked `PLANTED`) so the catch provably fires (SOTARE R7).
> **Build-lane dependency:** the plant only trips if the judge's evidence corpus = `signals[].detail`
> (+ scraped page text), NOT the brief summary prose. Keep that boundary (flagged in OPEN-QUESTIONS).

---

## 1. gtm lens — seller = Photon

```ts
export const sellerIdentity = {
  who: "Photon — open-source iMessage infrastructure for AI agents. CEO Daniel Tian. ~5 months old.",
  offer: "imessage-kit (open-source TS SDK) + Advanced iMessage Kit (paid: tapbacks, typing indicators, effects, read receipts, voice messages, edit/recall) + Spectrum (one-SDK iMessage/Telegram/Discord layer, photon.codes/spectrum).",
  proofPoints: [ // each becomes a seller-side Signal; FACTs must trace
    "imessage-kit: ~2,300 GitHub stars, 20K+ developers, github.com/photon-hq/imessage-kit",
    "Ditto: 42,000+ users across 5 campuses (UCSD, Berkeley, USC, UCLA, UC Davis), 20% of matches convert to in-person dates, 99.87% message delivery, zero downtime during Apple throttling events, $9.2M seed from Peak XV Partners",
    "TinyFish runs enterprise web agents on the SDK ($47M Series A, ICONIQ Growth)",
    "MiroFish simulation: 'infrastructure durability' (42 likes) vs '98% open rate' (2 likes) — resilience resonates 21x",
    "We shipped a full SDK in one week, infrastructure in one month",
  ],
  notCustomers: ["Poke (uses Linq)", "Tomo (uses a competitor)", "Series (uses a competitor)"], // Critic-trap: claiming these = FABRICATED-class
};

export const drafterSystemPromptAdditions = `
Never hallucinate funding amounts, employee counts, or founding dates — use null if unknown.
Be specific. 'Uses iMessage infrastructure, confirmed via job postings' is better than 'uses messaging tools.'
Do NOT force positivity. The reader makes better decisions with honest weak-fit calls.
NEVER say 'we work with [customer]' or 'we power [customer].' SAY: 'Ditto uses our SDK for [purpose]' or '20K+ developers use the open source SDK.'
Voice: 'hey [Name] -' regular hyphen; 1-2 sentences, under 50 words; Compliments are SHORT (3-7 words); the register is peer respect, not fan mail; one !! max; GitHub link in msg 1; NO customer mentions in message 1. 90/10 rule: 90% about them, 10% about us. ONE CTA per message. Not two.
BANNED (instant fail): em-dashes, smart quotes, "same shape", "circling back/checking in/just following up", "I'd love to", "streamline/leverage/unlock/empower".
RETIRED: never lead with "98% open rate"; never "AI as a friend in your iMessage"; never feature-dump without a pain.`;

export const signalRecipes = [ // L2: signal X → story Y
  "'iMessage coming soon' on site / iMessage in feature list → they already named the problem (strength 10)",
  "confirmed Sendblue/Linq via tech stack, npm deps, docs → proven need, ready to switch (9)",
  "iMessage job posting → build_vs_buy: '$200K/yr engineer vs we built this already' (9)",
  "SMS-sender today / WhatsApp/Telegram touchpoint → pitch iMessage as the NEXT layer — never search for the thing you sell",
  "platform with 1,000+ customers → revenue_share: one integration, whole customer base",
  "agents proactively reach users → agentic_notifications: 'a channel users actually open'",
  "Seed/Series A, <30 people, technical founder → sdk_adoption motion, decides in days",
  "DISQUALIFY (icp=0): direct competitor (Sendblue/Linq/Blooio/LoopMessage/Project Blue); defunct 12+ mo; >10k employees unless platform → partnership_potential",
];

export const angles = [ // selection order is the if-chain; happens inside the draft prompt
  { angle: "upgrade_from_sms",       trigger: "uses Sendblue/Linq or home-built iMessage", line: "Lead with what Photon unlocks that they're missing: tapbacks, typing indicators, effects, voice messages." },
  { angle: "multi_channel",          trigger: "CX/support platform missing iMessage",      line: "You support 7 channels but not the one with the highest engagement in the US." },
  { angle: "build_vs_buy",           trigger: "iMessage engineering job postings",         line: "You're spending $200K/yr on an iMessage engineer. We built this already." },
  { angle: "speed_to_market",        trigger: "just raised + conversational AI",           line: "npm install imessage-kit. Try it in 5 minutes. No sales call." },
  { angle: "revenue_share",          trigger: "platform with 1,000+ customers",            line: "Add iMessage to your platform. One integration, your entire customer base gets access." },
  { angle: "agentic_notifications",  trigger: "agents proactively reach users",            line: "Your agents need a channel users actually open. iMessage has 98% read rates — better than push or email." },
  { angle: "resilience",             trigger: "DEFAULT",                                   line: "The messaging infrastructure that survives platform shifts. Open source, multi-channel, audit-ready." },
];

export const openingLineShapes = [ // Daniel's real DMs that got replies
  `hey Stephen - really impressed by the Axel chat feature!! was wondering if you've considered iMessage at all?`,
  `hey Andrew - hope you are doing well! Was wondering if you guys had ever explored the iMessage option to reach more audience :)`,
  `hey Erick - really cool what you guys are doing with Atom. ever considered iMessage / Telegram as a touchpoint for your users? we just shipped Spectrum, if you wouldn't mind a quick look it might fit, photon.codes/spectrum`,
  // Day-3 follow-up shape (credibility goes in msg 2, never msg 1):
  `hey Erick - just wanted to follow up. TinyFish runs their enterprise web agents on our SDK ($47M Series A from ICONIQ), figured if you wouldn't mind a quick look it might be relevant for what Atom is doing, photon.codes/spectrum`,
];
```

### gtm fixtures (`data/leads/*.json`) — facts trace to `data/leads/source/{lindy.ai,retell.ai}.md`
**PLANTED in lindy.ai.json (no signal):** *"now pays Linq five figures a month for iMessage delivery."*
```json
{ "domain": "lindy.ai", "name": "Lindy", "url": "https://lindy.ai",
  "what_they_do": "No-code AI agent platform: inbox, scheduling, voice, workflows across 5,000+ integrations. Users text their Lindy assistant 24/7 via iMessage/SMS, email, or Slack. Founded 2023 by Flo Crivello, ~$50M total (Series A), ~37 employees, $5.1M ARR 2024. Uses Linq for iMessage and now pays Linq five figures a month for iMessage delivery.",
  "founded_year": 2023, "funding_stage": "Series A", "funding_amount": "$50M total", "employee_count": 37,
  "category": "already_imessage", "tech_stack": ["TypeScript","Node.js","React","Next.js","GraphQL","Python"],
  "github_url": null, "partnership_potential": false, "pitch_angle": "upgrade_from_sms",
  "signals": [
    {"signal_type":"competitor_usage","source":"website","source_url":"https://www.lindy.ai/blog/imessage-api-three-rewrites-one-apple-ban-and-what-actually-works","detail":"Lindy's own blog confirms they use Linq for iMessage with SMS fallback. Previously ran a Mac Mini in Las Vegas with Swift daemon before three rewrites.","strength":10},
    {"signal_type":"imessage_explicit","source":"website","source_url":"https://www.lindy.ai/","detail":"iMessage listed as first-class channel; product markets 'text your AI assistant 24/7' via iMessage","strength":10},
    {"signal_type":"github_code","source":"website","source_url":"https://www.lindy.ai/blog/imessage-api-three-rewrites-one-apple-ban-and-what-actually-works","detail":"Built custom iMessage infrastructure (Swift daemon monitoring chat.db, Private Frameworks injection) — exactly Photon's open-source architecture. Eventually gave up and moved to Linq API.","strength":9},
    {"signal_type":"funding_event","source":"news","source_url":"https://tracxn.com/d/companies/lindy","detail":"Raised $50M total including Series A; investors include Menlo, Battery, Coatue, Tiger","strength":6},
    {"signal_type":"convai_hiring_signals","source":"job_posting","source_url":"https://careers.lindy.ai/","detail":"Hiring Full Stack, Staff Engineer, Data Engineer — TypeScript/Node stack matches imessage-kit","strength":6} ],
  "brief": "Textbook target: AI agent platform where iMessage is first-class, already paying Linq, publicly documented three failed rewrites incl. the exact Swift daemon + chat.db architecture Photon open-sourced. Founder-to-founder SDK adoption at 37 people." }
```
**PLANTED in retell.ai.json (no signal):** *"customers send 10M+ SMS follow-ups monthly."*
```json
{ "domain": "retell.ai", "name": "Retell AI", "url": "https://www.retellai.com",
  "what_they_do": "YC W24 voice-AI platform: AI phone agents for sales, support, scheduling. 50M+ real-time AI calls/month for 1,000+ business customers incl. PWC, Twilio. $40M+ ARR, ~25-person team. Customers send 10M+ SMS follow-ups monthly.",
  "founded_year": 2023, "funding_stage": "Seed", "funding_amount": "$4.7M", "employee_count": 25,
  "category": "platform_integration", "tech_stack": ["TypeScript","Python","Node.js","React","Twilio"],
  "github_url": "https://github.com/RetellAI", "partnership_potential": true, "pitch_angle": "revenue_share",
  "signals": [
    {"signal_type":"platform_opportunity","source":"website","source_url":"https://www.retellai.com","detail":"1,000+ business customers deploying AI agents — one Photon integration unlocks iMessage for entire customer base","strength":7},
    {"signal_type":"cx_platform_gap","source":"website","source_url":"https://www.retellai.com/integrations","detail":"Supports voice, SMS, chat, and email but has zero iMessage support. Jan 2026 press release explicitly lists all channels — iMessage absent.","strength":7},
    {"signal_type":"funding_event","source":"news","source_url":"https://www.retellai.com/blog/seed-announcement","detail":"$4.7M seed led by Alt Capital and Y Combinator (Aug 2024). Now at $40M+ ARR, profitable.","strength":5} ],
  "brief": "Near-perfect platform fit: multi-channel AI agents (voice/SMS/chat/email), iMessage completely absent. SDK-level integration, founder-to-founder at ~25 people." }
```

---

## 2. realestate lens — seller = Johnny

```ts
export const sellerIdentity = {
  who: "Johnny Sheng — independent AI-automations marketer, SF. linkedin.com/in/johnny--sheng.",
  offer: "Enrichment + story + sorting on YOUR lead data — 'the patty, the meat and potatoes' (outreach is 'the tomato and lettuce'). Durable CRM-style data system, rerunnable, not automation slop that 'needs to be completely rebuilt every two months.' Flat base + commission ($65-85/hr anchor).",
  proofPoints: [
    "Real-estate investor client agreed $4-5k flat + 10-20% commission ('anywhere from 4 5 K would be sick')",
    "Marketing agency signed fixed $5,040 / 2 months / 4 modules + ~$250/mo running costs",
    "'name + linkedin' Google-search hack: ~85% hit rate where scrapers get accounts flagged",
    "LinkedIn outreach ~40% reply rate vs cold email ~2% ('if you're doing like good')",
    "The pricing anchor to beat: refused vendor at '$15,000 and it's like 40 enriched'",
  ],
};

export const drafterSystemPromptAdditions = `
Read the life/business STAGE, not a score. An 82-year-old owner is a person facing a predictable transition; a 24-year-old 'probably going to remodel it... they have an active plan.' Same data, opposite story.
The success metric: the prospect is 'surprised when you mentioned this because he felt understood.' One wrong fact breaks the spell — their own email data was 'consistently 30% wrong.'
Shape: connect a real event to THEIR specific situation, then hand them agency ('you're in a very powerful position because you can plan for this').
The AI builds the patty; the human makes the pitch. NEVER write the close — 'this ai... it's not going to be able to get us the clients.' Stop at the opening line + working theory.
Never invent transaction counts, team sizes, deal values, owner ages, or sale dates — use null if unknown.
FACT claims must trace to a signal. ANGLE claims (life-stage reads) are allowed, labeled as interpretation, grounded on the traced fact underneath.`;

export const signalRecipes = [
  "owner age 82 vs 24 → opposite stories from the same data (82: predictable transition; 24: active remodel plan)",
  "last sale decades ago + same owner → elderly-owner/transition read ('1967 and still the same owner')",
  "trust transfer hiding behind an old sale date → younger-heir flip ('michael's 30... moving up in his career')",
  "inheritance to multiple kids → forced sale ('they fight over it... ends up getting sold')",
  "employer news event → relocation window (SpaceX leaving Hawthorne → 'sell his house in the next 2 years... lets be the first ones to talk to him')",
  "mailing ≠ site address → absentee/rental read, ~50/50 ('just want to get rid of this investment property')",
  "owner-occupied + business mailing elsewhere → business-registry lookup → sophistication read",
  "owner works in real estate → change the PITCH, not the target",
  "tax delinquent → 'prime house that they're probably gonna be forced to sell'",
  "divorce filing → sell-likely regardless of property age ('all public knowledge')",
  "equity position via title run → options read (outright vs owes 90%: 'different Outlook')",
  "phone number on Zillow → active intent, 30-60 day window; just sold 2 days ago → skip ('likelihood is seven percent')",
  "year built old + no remodel since 1980 → distress proxy; zoning → developer-attractiveness gate",
];

export const angles = [ // NOTE: PitchAngle union must widen (OPEN-QUESTIONS) — these are the lens names
  { angle: "forced_sale",      trigger: "tax delinquent / divorce filing / foreclosure risk",  proof: "would you rather the banks foreclosed you'll never get a loan ever again... or we make an [all-cash] offer get you out of your situation and you're good" },
  { angle: "inheritance",      trigger: "transfer to multiple kids / trust behind old sale",   proof: "most times when real estate property gets transferred to kids they fight over it if they have multiple and then it ends up getting sold and so they would be like a high prospect" },
  { angle: "relocation",       trigger: "employer news event tied to the owner",               proof: "it just hit the news that spacex is closing down in hawthorne... hes probably gonna sell his house in the next 2 years... lets be the first ones to talk to him" },
  { angle: "absentee_fatigue", trigger: "mailing ≠ site address + expense signals",            proof: "it has so many expenses that they're like i just want to get fucking rid of this investment property" },
];

export const openingLineShapes = [
  "True + specific + forward-looking + offers agency: 'lets be the first ones to talk to him... tell him like hey you're in a very powerful position because you can plan for this'",
  "Name the pain in their own metaphor; reflect the prospect's own structure back",
  "The judge rubric, not copy: surprise + recognition = 'he felt understood'",
  "The human close stays HUMAN (harness stops before it): 'I have 10 investors that are ready to pay cash like today... Just you give us a price'",
  "Anti-pattern: one false fact (the 30%-wrong data) breaks 'felt understood' — maps 1:1 to fabricatedClaims",
];
```

### realestate fixtures — facts trace to the Carlos call corpus (source: `discovery_call`, "guided not fake")
**PLANTED in re-1-offmarket-team.json (no signal):** *"closed 14 properties in the last 12 months"* (real corpus scale ≈ 4 properties / "$30 to 40 thousand" total commission).
```json
{ "industry": "realestate", "domain": null, "name": "RE-1 — boutique off-market acquisitions team (LA)  // JOHNNY-EDITABLE name/handle",
  "what_they_do": "Founder-led team (2-5) doing off-market / distressed acquisitions in predetermined key areas of LA. Just completed a major project cycle and closed 14 properties in the last 12 months. Researches owners manually (title runs, BeenVerified-style lookups, driving-for-dollars). Holds a raw ~10k-row county data CSV. No CRM or automation tooling. Wants to expand to other cities.",
  "category": "re_investor_brokerage", "pitch_angle": "forced_sale", "employee_count": null,
  "signals": [
    {"signal_type":"pipeline_gap","source":"discovery_call","source_url":"call://carlos-kickoff-2026-06-10","detail":"we finally sold everything on it. So right now I have like no houses","strength":9},
    {"signal_type":"manual_research","source":"discovery_call","source_url":"call://carlos-kickoff-2026-06-10#M10","detail":"The way that we've typically found distressed properties is straight up just driving","strength":8},
    {"signal_type":"data_pain","source":"discovery_call","source_url":"call://carlos-kickoff-2026-06-10#M32","detail":"Our email thing has been like consistently 30% wrong","strength":9},
    {"signal_type":"vendor_refusal","source":"discovery_call","source_url":"call://carlos-kickoff-2026-06-10#M18","detail":"fifteen thousand dollars and it's like 40 enriched... this is just way too much so... we'll stick doing it manually","strength":8},
    {"signal_type":"expansion_intent","source":"discovery_call","source_url":"call://carlos-kickoff-2026-06-10#M19","detail":"either we need to hire someone else on the team or i could get... like an assistant... the goal is is to start moving to other cities","strength":7} ],
  "brief": "Carlos-shaped primary: pipeline gap + manual stack + 30%-wrong data + refused $15k vendor + city-expansion ambition. The system replaces the hire." }
```
**PLANTED in re-2-cash-buyer-outfit.json (no signal):** *"mails 5,000 handwritten letters a quarter."*
```json
{ "industry": "realestate", "domain": null, "name": "RE-2 — 'we buy houses cash' wholesaling outfit  // JOHNNY-EDITABLE",
  "what_they_do": "Direct-mail/door-knock investor outfit; farms target neighborhoods and mails 5,000 handwritten letters a quarter. Buys tax-delinquent/probate lead lists. Stale contact data complaints. Investor-buyer roster.",
  "category": "re_wholesaler", "pitch_angle": "inheritance", "employee_count": null,
  "signals": [
    {"signal_type":"farm_marketing","source":"discovery_call","source_url":"call://carlos-kickoff-2026-06-10#M17","detail":"handwritten-letter neighborhood farming as the core marketing motion","strength":7},
    {"signal_type":"stale_contacts","source":"discovery_call","source_url":"call://carlos-kickoff-2026-06-10#M16","detail":"sometimes they'll have like 10 emails... an email from... high school that I don't use anymore","strength":8},
    {"signal_type":"forced_sale_targeting","source":"discovery_call","source_url":"call://carlos-kickoff-2026-06-10#M26","detail":"that's a prime house that they're probably gonna be forced to sell","strength":7},
    {"signal_type":"cash_buyer_roster","source":"discovery_call","source_url":"call://carlos-kickoff-2026-06-10#M7","detail":"I have 10 investors that are ready to pay cash like today","strength":7} ],
  "brief": "Secondary: forced-sale + inheritance recipes ground directly against this profile; contact-liveness verification is the concrete deliverable." }
```

---

## 3. marketing lens — seller = Johnny (same person, different pain)

```ts
export const sellerIdentity = {
  who: "Johnny Sheng — same seller as realestate lens (one person, two lens packs).",
  offer: "Signal-driven pipeline as a durable system: 'this person just raised this person just got into whole foods' → reach out, name-in-a-box, the founder still handles the relationship. Fixes the coma test.",
  proofPoints: [
    "Vortex (experiential agency): signed fixed $5,040 / 2 months / 4 modules",
    "Photon build: 2 months @ ~20 hr/wk",
    "LinkedIn ~40% reply rate vs cold email ~2% — the stat that landed ('Aiden bought it')",
    "'there are like all these little markers that would indicate that somebody has a budget to spend'",
  ],
};

export const drafterSystemPromptAdditions = `
Name their business shape better than they do: 'you're literally running a whole production company bro' → 'that's actually a pretty good analysis of it.' Reflecting the prospect's own structure back = instant rapport.
Use the prospect's own metaphor as the diagnosis (replay 'the coma test' back to them).
The inbound shape to engineer: specific recognition + perceived uniqueness ('I really love your channel... I don't really know anybody else is doing that').
Never invent client counts, campaign counts, headcount, or revenue — use null if unknown.
The AI builds the patty; the human makes the pitch. Stop at the opening line + working theory.`;

export const signalRecipes = [
  "founder on every sales call / no CRM → coma-test pain ('as far as like sales and business development... that's all me')",
  "Gmail-only tooling → systems gap ('pretty much gmail dude... amazing I've gotten this far with such like little systems')",
  "referral/in-person-only growth language → channel gap ('we don't even really prospect that much')",
  "website rebuild in flight / thin case studies → brand-gap in motion",
  "campaign count scaling → ops bottleneck ('eight back school campaigns at one time... I'm one person')",
  "founder talks exit/sale → enterprise-backbone story ('relying on the owner has no enterprise value at all')",
  "reporting case-by-case → attribution gap ('it's case by case in my head which is really bad')",
  "napkin-math pricing → margin-risk read ('a lot of our pricing is... napkin math... pretty imprecise')",
];

export const angles = [ // NOTE: PitchAngle union must widen (OPEN-QUESTIONS)
  { angle: "brand_gap",   trigger: "own site stale / rebuild in flight / thin case studies", proof: "we're revamping our website because our website was buns so it's just trash... a full rebuild like tons of case studies... way more photos of our activations" },
  { angle: "channel",     trigger: "referral-only + founder-geography-bound growth",          proof: "our whole flow is based on referrals and me meeting people in person... there's only so many people I can meet — vs LinkedIn 'almost like a 40% reply rate' / cold email '2% if you're doing like good'" },
  { angle: "positioning", trigger: "founder-dependence + exit ambition",                      proof: "an agency that's relying on the owner has no enterprise value at all... if I had a coma for one month... nothing would happen [to the pipeline]" },
];

export const openingLineShapes = [
  "Reflect their structure: 'you're literally running a whole production company bro'",
  "Their metaphor as diagnosis: 'the coma test basically which is that sales is only you'",
  "Specific recognition + uniqueness: 'what you're doing makes total sense, I don't really know anybody else is doing that'",
];
```

### marketing fixtures — facts trace to the Aiden call corpus (source: `discovery_call`, "guided not fake")
**PLANTED in mk-1-experiential-agency.json (no signal):** *"ran 40 campus activations last year."*
```json
{ "industry": "marketing", "domain": null, "name": "MK-1 — experiential/event-marketing agency  // JOHNNY-EDITABLE (Vortex-shaped)",
  "what_they_do": "Founder-led experiential agency: campus/CPG activations, client logos but no reported metrics. Ran 40 campus activations last year. Founder's personal brand is the channel; referral-only growth; website redesign in progress; no visible CRM/outbound tooling.",
  "category": "experiential_agency", "pitch_angle": "brand_gap", "employee_count": null, "funding_stage": null,
  "signals": [
    {"signal_type":"founder_led_bd","source":"discovery_call","source_url":"call://aiden-call-2026-05-28","detail":"as far as like sales and business development like those are that's all me","strength":9},
    {"signal_type":"referral_only","source":"discovery_call","source_url":"call://aiden-kickoff-2026-06-01#C21","detail":"our whole flow is based on referrals and me meeting people in person... we really haven't done that kind of outreach","strength":9},
    {"signal_type":"brand_gap_in_motion","source":"discovery_call","source_url":"call://aiden-call-2026-05-28#seg1","detail":"we're revamping our website because our website was buns so it's just trash... a full rebuild like tons of case studies... way more photos of our activations","strength":8},
    {"signal_type":"ops_bottleneck","source":"discovery_call","source_url":"call://aiden-call-2026-05-28","detail":"we're running eight back school campaigns at one time I'm not really gonna be able to be as aggressive at expanding because I'm one person","strength":8},
    {"signal_type":"coma_test","source":"discovery_call","source_url":"call://aiden-call-2026-05-28#seg2","detail":"if I had a coma for one month what would happen to our pipeline... nothing would happen... it would just be a gridlock","strength":9},
    {"signal_type":"systems_gap","source":"discovery_call","source_url":"call://aiden-call-2026-05-28","detail":"pretty much gmail dude... it's kind of amazing I've gotten this far with such like little systems","strength":7} ],
  "brief": "Vortex-shaped primary: the agency that sells brand image has a broken brand surface; fails the coma test; 8 campaigns at once on one founder." }
```
**PLANTED in mk-2-branding-studio.json (no signal):** *"rebrands lift client revenue by 30% on average."*
```json
{ "industry": "marketing", "domain": null, "name": "MK-2 — boutique branding/creative studio  // JOHNNY-EDITABLE",
  "what_they_do": "2-10 person studio, strong client work, stale own-site (cobbler's children). Their rebrands lift client revenue by 30% on average. Founder does all BD; geography-bound; eventual-exit ambition.",
  "category": "branding_studio", "pitch_angle": "positioning", "employee_count": null,
  "signals": [
    {"signal_type":"geography_bound","source":"discovery_call","source_url":"call://aiden-call-2026-05-28#seg2","detail":"I'm one person and i'm in Los Angeles or New York or SF and there's only three places I really ever am... we really need to go attack the whole world","strength":8},
    {"signal_type":"exit_ambition","source":"discovery_call","source_url":"call://aiden-call-2026-05-28","detail":"I do want to eventually sell in next few years so I really want to build out these systems today or sooner","strength":8},
    {"signal_type":"reporting_gap","source":"discovery_call","source_url":"call://aiden-kickoff-2026-06-01#C22","detail":"it's case by case in my head which is really bad","strength":7},
    {"signal_type":"pricing_napkin","source":"discovery_call","source_url":"call://aiden-kickoff-2026-06-01#C5","detail":"a lot of our pricing is... napkin math... pretty imprecise","strength":6} ],
  "brief": "Secondary: brand-gap primary angle, positioning (owner-independence/enterprise-value) secondary." }
```

---

## Cross-cutting (for the build lane)
- **Critic microcopy near the FabricationBoard** (system voice, IBM Plex Mono): render one of
  `"Our email thing has been like consistently 30% wrong"` or `"surprised when you mentioned this because he felt understood"` — the WHY of `fabricatedClaims`.
- Seller proofPoints become seller-side Signals (source `seller_pack`, source_url to the corpus file) so seller claims trace through the SAME judge — zero judge changes.
- Fixture provenance is honest: `source: "discovery_call"` / `"linkedin_fixture"` labels render on the evidence rows.
