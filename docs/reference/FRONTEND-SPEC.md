# FRONTEND SPEC — two elements, extended from the cofounder 5-component library

> Working name: **sayhello** ("before you say hello, know their story"). Visual law = DESIGN-BRIEF.md +
> `~/code/work/design-system/references/cofounder-dna.md` (the paper-light world). Port from `said-built`.

## The cofounder 5-component library (`said-built/components/lab/`, ground truth to extend)
1. **OrgCanvas + ChatRail** (`OrgChatFrame`) — a canvas of nodes on cream + a side chat rail. → our **dashboard canvas**.
2. **Status-group card + department row** (`StatusGroupCard`) — grouped status pills/counts. → our **lead status groups**.
3. **Email preview + campaign report pair** (`EmailReportPair`) — a content preview beside a metrics report. → our **story preview + score report**.
4. **Tabbed sales card** (`SalesTabsCard`) — tabbed data surface. → our **per-lead detail tabs** (brief / story / claims / trajectory).
5. **Engineer chat card** (`EngineerChatCard`) — an agent's reasoning as chat. → our **Critic's reasoning card** (why it flagged a claim).

## Element A — THE DASHBOARD (the cockpit, default view `/`)
The harness watching N leads at once. Extends components 1+2+3.
- **OrgCanvas → LoopCanvas**: each lead is a node on the cream canvas; the node-graph stages (`scrape→draft→judge→reenrich→archive→render`) light up as the lead flows; shimmer on the executing stage, packet dots on the wires (DESIGN-BRIEF motion). One **violet `#6e2bff`** node = the lead executing right now.
- **StatusGroupCard → lead groups**: "enriching · 3", "needs you · 2" (gate), "done · 5", "blocked · 1" (FAILED badge). Counts in IBM Plex Mono.
- **EmailReportPair → story-preview + score-report**: selected lead's current story draft beside its StoryScore axes (grounding/completeness/...) with the live ClickHouse trajectory sparkline (`avg(grounding) by generation`).
- **SlipStrip**: the approval row — leads whose Critic said `emit`, awaiting the human gate-stamp.
This is the "watch 5 in parallel" dashboard. Consumes the `StoryRun` + `WsEvent` stream.

## Element B — THE INTERACTIVE STUDY (one lead, deep, the wow)
Click a lead → the spiral takes over. Extends the spiral + components 4+5.
- **Spiral (`said-built/components/lab/spiral/*`)**: the lead's generations as the spiral gallery — gen 0 draft (low grounding, red claims) spiraling up to gen N (grounded, green). Scroll = scrub generations; right-rail knobs stay (presets). The blur-up swap between generations (420ms). THIS is "the spiral of watching us distill someone's story."
- **EngineerChatCard → Critic reasoning**: the held-out judge's verdict as a chat card — "flagged: 'raised $40M Series B' — no source Signal. grounding 0.4." The fabrication caught, in the system's own voice.
- **SalesTabsCard → lead detail tabs**: brief / story / claims (each claim with source ✓ or FABRICATED) / trajectory.
- **Payoff → OpenUI story slides**: hold-to-approve gate-stamp → the final grounded story renders as a walkable OpenUI slide deck (problem → fit → traction → angle → opening line). "Here's their world. The human takes it from here."

## Build order (frontend lane)
1. Port `said-built` globals.css + paper-light tokens + Onest/IBM Plex Mono/Departure Mono (PORT-AS-IS).
2. Element A dashboard with STUB StoryRun (LoopCanvas + StatusGroups + report pair) by ~1:00.
3. `lib/ws.ts` useStoryRun hook → bind A to real stream.
4. Element B spiral + critic card on a real lead.
5. OpenUI slides payoff + gate-stamp.
Strip everything in said-built not on this list (campaigns/outreach/reports routes). ≤1 whimsy per surface.
