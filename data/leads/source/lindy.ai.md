# Lindy — Research Brief

**Domain:** lindy.ai  
**URL:** https://lindy.ai  
**ICP Score:** 90/100 (hot) — source: llm_gradient  
**Signal Strength:** high  
**Recommended Angle:** upgrade_from_sms  
**Stage:** researched  
**Researched:** 2026-04-17 07:08:49

## What They Do

Lindy is a no-code AI agent platform that lets users build AI assistants for inbox management, meeting scheduling, voice calls, and workflow automation across 5,000+ integrations. Users can text their Lindy assistant 24/7 via iMessage/SMS, email, or Slack. Founded 2023 by Flo Crivello, raised ~$50M total (Series A), ~37 employees, $5.1M ARR in 2024.

## Why Photon Fits

Lindy currently uses Linq (a direct Photon competitor) for iMessage, and publicly documented three complete rewrites of iMessage infrastructure including a Mac Mini + Swift daemon setup before giving up and moving to an API. Their blog post 'iMessage API: Three Rewrites, One Apple Ban' is a textbook signal of deep pain Photon solves. Advanced iMessage Kit unlocks features they've explicitly built (voice memos, reactions, read receipts) — and Photon's open-source architecture is the resilience story after their Apple ban incident.

## Company Details

| Field | Value |
|-------|-------|
| Category | already_imessage |
| Funding | Series A $50M |
| Employees | 37 |
| Tech Stack | TypeScript, Node.js, React, Next.js, GraphQL, Python |
| GitHub | None found |
| Partnership Potential | No |

## Signals Detected (7)

- **competitor_usage** (strength 10/10): Lindy's own blog confirms they use Linq for iMessage with SMS fallback. Previously ran a Mac Mini in Las Vegas with Swift daemon before three rewrites.
  Source: https://www.lindy.ai/blog/imessage-api-three-rewrites-one-apple-ban-and-what-actually-works
- **imessage_explicit** (strength 10/10): iMessage listed as first-class channel; product markets 'text your AI assistant 24/7' via iMessage
  Source: https://www.lindy.ai/
- **github_code** (strength 9/10): Built custom iMessage infrastructure (Swift daemon monitoring chat.db, Private Frameworks injection) — exactly Photon's open-source architecture. Eventually gave up and moved to Linq API.
  Source: https://www.lindy.ai/blog/imessage-api-three-rewrites-one-apple-ban-and-what-actually-works
- **ai_companion** (strength 7/10): AI assistant platform with persistent conversational relationship through iMessage/SMS
  Source: https://www.lindy.ai/
- **funding_event** (strength 6/10): Raised $50M total including Series A; investors include Menlo, Battery, Coatue, Tiger
  Source: https://tracxn.com/d/companies/lindy
- **convai_hiring_signals** (strength 6/10): Hiring Full Stack, Staff Engineer, Data Engineer — TypeScript/Node stack matches imessage-kit
  Source: https://careers.lindy.ai/
- **validated_buyer_profile** (strength 8/10): Profile 1 match: AI companion + B2C + already paying Linq = validated buyer profile for iMessage infrastructure.

## Score Breakdown

**Pre-filter:**
- ✓ messaging_first_product: 20 pts
- ✓ no_app_download: 12 pts
- ✓ ai_agent_companion: 12 pts
- ✗ sms_notifications: 0 pts
- ✓ mentions_imessage: 10 pts
- ✗ consumer_touchpoints: 0 pts
- ✓ text_to_start: 8 pts
- ✓ convai_hiring_signals: 6 pts
- ✓ funded_small_team: 6 pts
- ✓ typescript_node_stack: 4 pts
- ✗ high_frequency_b2c: 0 pts

**LLM Judge:**
- messaging_dependency: 9
- ai_agent_presence: 10
- platform_reach: 7
- buying_signal: 10
- adoption_speed: 8
- tech_stack_fit: 10
- competitive_gap: 10
- total: 90

*Lindy is a textbook Photon target: AI agent platform where iMessage is a first-class channel, already paying Linq (direct competitor displacement), and publicly documented three failed rewrites of custom iMessage infrastructure including the exact Swift daemon + chat.db architecture Photon open-sourced. Their blog post about the Apple ban is a signed confession of deep pain. TypeScript/Node stack matches imessage-kit perfectly. At 37 employees with Flo as founder-CEO, this is founder-to-founder SDK adoption — not enterprise BD. Lead with Advanced iMessage Kit unlocking features they've already built (voice memos, reactions) plus the resilience story post-Apple-ban.*
