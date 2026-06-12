# PHOTON-TARGETS — seller block (gtm lens) + ranked target list + THE live demo lead

> Every quote verbatim with attribution. Live-site lines scraped via Firecrawl 2026-06-12 (scrape JSON:
> `/tmp/photon_scrape.json`). Repo lines from `/Users/johnnysheng/code/gtm-tool/photon-gtm/`. Repo context
> is April-2026 imessage-kit era; the live site is **Spectrum era** (launched ~Apr 23 2026 per @photon_hq
> tweet) — `context/positioning/index.md` already has `spectrum-v1` templates; **use Spectrum positioning.**

---

## 1. SELLER BLOCK — Photon (for the gtm lens / `data/scenarios/photon.json`)

### Live site (photon.codes, scraped 2026-06-12)
- Hero: **"Bring Agents to the Interfaces Millions Already Use."**
- Subhead: *"Spectrum is an open-source framework that connects your agents to iMessage, Telegram, WhatsApp, Slack, Discord, Instagram, and other interfaces people use every day."*
- CTA: `npm install spectrum-ts` · GitHub `github.com/photon-hq/spectrum-ts` shows **3.2k** stars on site
- Value props (verbatim section heads): *"First-class for the agent era."* / *"Photon delivers reliable, low-latency agent execution and messaging infrastructure. built to scale with real user demand."* / latency: **"Photon Spectrum <1s"** vs **"CPaaS Avg. ~1500 – 2500ms"**, *"fast, reliable messages in under 1 second on Photon's edge network with 99.9% uptime"*
- More verbatim props: *"Adaptive content rendering"* · *"Scale from first user to millions"* · *"Built-in observability and control… detailed audit logs, message histories, and human-in-the-loop controls"* · *"SOC 2 ready for serious teams"*
- The wedge: **"Nobody's going to download an app or visit a website just to talk to your agent."** / **"The best interface for your agent already exists."**
- Manifesto: *"What we do at Photon is taking away yet another barrier of usage of Agents… We call it Agents for the rest of us because Agents aren't for ordinary people."*
- Social proof on page: *"Trusted by the world's best agent teams and developers"* — Nous Research (*"Your Hermes Agent now lives in iMessage via @photon_hq"*, Jun 8 2026, 1.5K likes), matt palmer (*"basically Vercel's Chat SDK but with managed iMessage on top… the DX was excellent"*), David Im (*"i was a photon customer when i built clawra… photon has been the best by far"*), Josh Constine (*"The fastest way to make agents mainstream? Let them text."*)
- Named client on site: **Ditto** — *"Ditto is an iMessage-based matchmaker agent for college students. Learn how we helped them connect 42,000+ users through iMessage."* with counters **"140k+ active users"** / **"4M+ messages processed"**
- Links: docs.photon.codes · app.photon.codes · photon.codes/pricing · /blog · /residency · /builders · status.photon.codes · discord.com/invite/4yXmmFPadR

### Repo self-positioning (verbatim)
- `context/photon/product.md`: *"Photon builds infrastructure that lets AI exist natively inside iMessage — not another app, not a SaaS URL."* Vision: *"AI should not appear as a feature or a tool. It should feel like a form of life, deeply woven into our social structures."* Core pitch: **"The messaging infrastructure that survives platform shifts. Open source, multi-channel, audit-ready."**
- Products: free open-source `imessage-kit` (dev acquisition) + paid **Advanced iMessage Kit** managed "lines" — *"the ONLY product offering tapbacks, typing indicators, and effects programmatically"* — *"This is the moat."*

### Proof points (case-study layer — `context/photon/case-studies.md`, `findings/customers/photon-clients.json`, 26 clients, 2026-04-14)
- **Primary case study: Ditto** (heyditto.ai) — *"42,000+ users across 5 California campuses (UCSD, Berkeley, USC, UCLA, UC Davis)… 99.87% message delivery rate, zero downtime during Apple throttling events, $9.2M seed from Peak XV Partners"* (the live site now says 140k+ users — **use the newer site figure with site attribution**)
- High-confidence clients: Chert, Clarify, Clawdi, Consul, Duet, Fae (fae.so), Hack Club, Layers, MemoV, Panta (YC W26), Paradigm ($7M), Slashy (YC S25), Sume/Clawra, Supaband, **TinyFish ($47M Series A, ICONIQ)**, Webly; medium: Indexed Labs, Loops, Maple, Pickle, Sriya.AI
- **NEVER reference as customers** (they use competitors): **Poke (uses Linq), Tomo, Series** (`case-studies.md` warnings). Phrasing rule: *"SAY: 'Ditto uses our SDK for [purpose]'… NEVER say 'we work with [customer]'."*

### Voice + sequence rules (for the drafter prompt)
- `context/positioning/spectrum-message-template.md`: 4-touch sequence (LinkedIn connect → email → LinkedIn DM → email), **"Validated against AtomChat outreach 2026-05-06."** Voice: lowercase *"hey [Name] -"*, ≤2 sentences/<50 words, *"90/10 rule: 90% about them, 10% about us"*; banned: em-dashes, "I'd love to", "leverage", sign-offs. Validated example verbatim: *"hey Erick - really cool what you guys are doing with Atom. ever considered iMessage / Telegram as a touchpoint for your users? we just shipped Spectrum, if you wouldn't mind a quick look it might fit, photon.codes/spectrum"*
- Angles (`specs/narrative-framework.md`): resilience (default), competitor displacement, channel gap, build vs buy, speed to market, revenue share. **Retired, never use:** *"'98% open rate' as lead"* and *"'AI as a friend in your iMessage'"*. Receipt for resilience-first: MiroFish simulation — *"'infrastructure durability' (42 likes) vs '98% open rate' (2 likes)"*.
- `findings/learnings/outreach-patterns.md` (2026-03-27, n=10, flagged **"INSUFFICIENT DATA"**): **40% overall reply rate**. Winners: Pain_Question 1/1, Direct_Value 2/3 (66%); platform_gap 1/1, resilience 2/3; **iMessage channel 1/1 (100%)** vs email 33%. Losers: PAS 0/2, AIDA 0/2, competitor_displacement 0/2, speed_to_market 0/2.
- `findings/learnings/2026-04-28-x-launch-discovery.md`: **"Don't search for the thing you sell"** — *"Target the current touchpoint (SMS, WhatsApp, Telegram, voice, in-app chat) and pitch iMessage as the next layer."* Also: *"Website-first qualification beats tweet-first."*
- `context/photon/case-studies.md`: *"Credibility comes in the follow-up message, not the first."*

### Targeting machinery (what scored the list below)
- `context/scoring/icp-rubric.md` — 7 weighted dimensions: **messaging_dependency (3x)**, **ai_agent_presence (2x)**, adoption_speed (1.5x), platform_reach (1.5x), buying_signal (1.5x), tech_stack_fit (1x), competitive_gap (1x). Framing: *"Would this company's users benefit from a text-based interaction?"*
- `context/scoring/disqualifiers.md` — hard DQ: direct competitor (Sendblue, Linq, Blooio, LoopMessage, Project Blue), defunct, >10,000 employees **unless platform** (then `partnership_potential=TRUE`); soft DQ: contacted <90 days, DNC, gov/edu/nonprofit, no technical buyer.
- `context/market/target-patterns.md` — 5 validated buyer profiles: AI Companion B2C (highest conversion), Recently-Funded ConvAI, CRM/Engagement platform missing iMessage, DevTool w/ consumer distribution, **Agentic Notifications** (*"The AI takes action and needs to tell the user about it"*).

---

## 2. RANKED TARGET LIST

Repo scores from `findings/companies/<domain>.md` headers. Cached-brief availability verified on disk
2026-06-12 (`findings/companies/` + `findings/campaigns/`).

| # | Company | URL | Why (angle that fires) | Source | Cached brief |
|---|---|---|---|---|---|
| 1 | **Poke** | poke.com | 95/100 hot. Confirmed Linq customer, *"actively looking to switch"*; prior provider *"blocked all their messages as spam on the day they closed their fundraise"* → upgrade_from_sms/displacement | repo | yes (brief + contacts + 4 campaigns) |
| 2 | **Ollie** | ollie.ai | 91/100 hot, upgrade_from_sms | repo | yes (brief + 3 campaigns; **no contacts file**) |
| 3 | **Lindy** | lindy.ai | 90/100 hot, upgrade_from_sms — AI assistant platform, agents need user-facing channels | repo | yes (brief + contacts + campaigns) |
| 4 | **Dippy** | dippy.ai | 90/100 hot, agentic_notifications — consumer AI companion | repo | yes (brief + contacts + campaigns) |
| 5 | **Tomo** | tomo.ai | 88/100 hot, upgrade_from_sms — uses a competitor (displacement; **never cite as customer**) | repo | yes (brief + contacts + campaigns) |
| 6 | **Retell AI** | retell.ai | 88/100 hot, revenue_share — voice-agent platform, text follow-up channel gap | repo | yes (brief + contacts + campaigns) |
| 7 | **Text.ai** | text.ai | 87/100 hot, speed_to_market — messaging-native AI startup | repo | yes (brief + contacts + campaigns) |
| 8 | **Jack & Jill** | jackandjill.ai | 85/100 hot, agentic_notifications | repo | yes (brief + contacts + campaigns) |
| 9 | **Parloa** | parloa.com | 84/100 hot, revenue_share — CX/conv-AI platform missing iMessage (Profile 3 channel gap) | repo | yes (brief + contacts + campaigns) |
| 10 | **Bland AI** | bland.ai | 83/100 hot, revenue_share — phone-agent platform, one integration = whole customer base | repo | yes (brief + contacts + campaigns) |
| 11 | **Replika** | replika.com | 83/100 hot, resilience — flagship AI-companion B2C (Profile 1) | repo | yes (brief + contacts + campaigns) |
| 12 | **Intercom** | intercom.com | 83/100 hot, revenue_share — big CX platform; partnership motion, not SDK sale (adoption_speed low but *"still a massive opportunity"* per rubric) | repo | yes (brief + contacts + campaigns) |
| + | Tolan (Portola) | tolans.com | **SUGGESTED, NOT IN REPO — verify before use.** SF consumer AI-companion app (Profile 1 shape); no repo source line | suggested | no |
| + | Delphi | delphi.ai | **SUGGESTED, NOT IN REPO — verify before use.** SF "digital mind" clones conversing with audiences via text/voice (Profile 1/5 shape); no repo source line | suggested | no |

**Notes:**
- **AtomChat** (atomchat.io, 76/100, brief + contacts + 3 campaigns cached) is the **validated-sequence reference** target — the 4-touch template was *"Validated against AtomChat outreach 2026-05-06."*
- Most top-12 already have campaign drafts in `findings/campaigns/` — the <90-day soft disqualifier may apply for real outreach; irrelevant for the demo.
- **Do not target** customers (Ditto, Fae, Slashy, etc. — full list `findings/customers/photon-clients.json`) or competitors (Linq, Sendblue, Blooio, LoopMessage, Project Blue).

---

## 3. THE LIVE DEMO LEAD — **Poke (poke.com)**

**Pick: Poke.** It is the site that most tempts an ungrounded claim, and the catch is the demo
(`docs/SCOPE-LOCK.md` step 4; `docs/reference/INSPIRATION-MAP.md` §6 R7: ship a lead that **provably trips
the FABRICATED gate**, and the bonus beat: *"stage the demo so the catch fires on the FIRST lead"*).

**Why Poke tempts the fabrication (each leg sourced):**
1. **The juicy facts are NOT on poke.com.** In the repo brief (`findings/companies/poke.com.md`), the
   funding signal — *"$15M seed at $100M valuation led by General Catalyst, Sep 2025"* — cites
   **techstartups.com** as its source, and the competitor signal — Poke *"chose Linq for iMessage
   infrastructure after previous provider blocked all messages as spam during fundraise day"* — cites
   **linqapp.com/s/customer-stories/poke**. The signals sourced to **poke.com itself** are only the soft
   ones (imessage_explicit, text_to_start, consumer_engagement). So a drafter that scrapes only poke.com
   has every incentive to assert the famous funding/valuation/Linq facts it "knows" — with zero scraped
   source. The gtm lens is fail-CLOSED on exactly this (`packages/backend/src/lenses/gtm.ts`: *"Funding
   claims are fail-CLOSED: no scraped page, news hit, or SEC filing = FABRICATED"*).
2. **The recovery arc is built in.** When the judge stamps the funding claim FABRICATED, reenrich runs
   Firecrawl `/v2/search` with **the fabricated claim text as the query** (`docs/reference/INSPIRATION-MAP.md`
   §7 Firecrawl row), finds the techstartups/linqapp pages, and the redraft grounds. Catch → targeted
   re-enrich → grounded: the full 6-step journey on one lead.
3. **Highest-scored target anyway** (95/100 hot, `findings/companies/poke.com.md` header) with the richest
   cache: brief + contacts + 4 campaign drafts (`findings/campaigns/poke-com-*.md`) — so the cached-lead
   fallback (`docs/SCOPE-LOCK.md` cached layer) is strongest exactly where the live demo runs.
4. **Built-in "never say customer" tripwire:** `context/photon/case-studies.md` lists Poke under **NEVER
   reference as customers** — a second class of claim the judge can visibly police.

**Caveat:** per R7 do not depend on the model happening to hallucinate — keep a fixture generation in
`data/leads/` that provably trips the gate, and treat a live hallucination on stage as the bonus, not the plan.

**Runner-up:** Replika (83/100) — famous enough that training data overflows with off-site user-count
claims — but Poke beats it on score, cache depth, and the displacement story already in the repo.

---

> RECONCILE note: `docs/LENSES-CONTENT.md` did not exist at write time (2026-06-12). When it lands, merge
> from here: §1 (the Spectrum-era seller block + voice rules) into the gtm lens seller/positioning const,
> §2's top-5 + AtomChat note into the gtm demo-lead pool, and §3's Poke pick + fixture caveat into the
> demo-lead entry. Key file paths for the lens builder: live scrape `/tmp/photon_scrape.json`; repo evidence
> `/Users/johnnysheng/code/gtm-tool/photon-gtm/{context/photon/product.md, context/photon/case-studies.md,
> context/scoring/icp-rubric.md, context/scoring/disqualifiers.md, context/market/target-patterns.md,
> context/positioning/spectrum-message-template.md, specs/narrative-framework.md,
> findings/customers/photon-clients.json, findings/learnings/outreach-patterns.md,
> findings/learnings/2026-04-28-x-launch-discovery.md, findings/companies/poke.com.md}.
