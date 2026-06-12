# INSPIRATION-MAP — where every resource lives + exactly what it feeds

> Synthesized 2026-06-12 from six explorer sweeps (jam-nodes, gtm-tool, doubles, said-built, SOTARE, sponsors-live).
> Reconciled against `docs/SCOPE-LOCK.md` + `docs/CONTRACTS.md`. **Where a brief and CONTRACTS disagree, CONTRACTS wins**;
> contradictions are logged in `docs/OPEN-QUESTIONS.md`. Anything off the 6-step line is marked **CUT-CANDIDATE**.

---

## 1. THE RESOURCE MAP

| Source | Location | What it feeds |
|---|---|---|
| jam-nodes (MIT, @jam-nodes/core 0.2.10) | `/tmp/jam-nodes` (clone, HEAD e8e1abc) | `defineNode`/`NodeRegistry`/`executeNode` pattern → `packages/backend/src/nodes/` |
| jam firecrawl node + http util | `/tmp/jam-nodes/packages/nodes/src/integrations/firecrawl/scrape.ts`, `src/utils/http.ts` | `nodes/scrape.ts` shape + `fetchWithRetry` → `src/llm/http.ts` |
| gtm-tool research schema | `/Users/johnnysheng/code/gtm-tool/photon-gtm/agents/1-research/prompt.md` | `CompanyBrief` fields + drafter prompt lines → `lenses/gtm.ts` |
| gtm-tool narrative angles | `.../photon-gtm/specs/narrative-framework.md`, `context/positioning/hooks-by-archetype.md` | `PITCH_ANGLES` + `RETIRED_LINES` consts → `lenses/gtm.ts` |
| gtm-tool voice/judge language | `.../photon-gtm/context/voice/human-voice-rules.md`, `context/scoring/{signal-guide,disqualifiers}.md`, `agents/3-draft/generate-v2.py` (prompts L278-711) | drafter/judge prompt ingredients → `prompts/draft.ts`, `agents/critic-prompt.ts` |
| doubles orchestrator + critic | `~/code/doubles/src/orchestrator/index.ts`, `src/agents/{critic,critic-prompt}.ts` | regen loop + StoryScore judge → `orchestrator/`, `agents/` |
| doubles LLM layer | `~/code/doubles/src/llm/{openrouter,models,cost-ledger,invocation-log}.ts` | `src/llm/*` near-verbatim; MODELS registry enforces critic≠drafter |
| doubles scrape + server + logger | `~/code/doubles/src/scrape/{portfolio,x}.ts`, `src/web/server.ts`, `src/logger.ts` | `nodes/scrape.ts` cascade, boot readiness, one-line JSON logger |
| doubles `.env` | `~/code/doubles/.env` (names: OPENROUTER_API_KEY, FIRECRAWL_API_KEY, DATABASE_URL, X_BEARER_TOKEN, CEREBRAS_API_KEY, COMPOSIO_API_KEY, GITHUB_TOKEN) | copy at S0. **ClickHouse/Langfuse/Thesys keys NOT here — must be signed up** |
| said-built Version A (dashboard) | `~/code/work/apps/said-built/components/mvp/*` (Shell, StatusCard, LoopCanvas, SlipStrip, bits.tsx, mvp.css) | cockpit: node graph, run-status, FabricationBoard, gate button |
| said-built Version B (spiral) | `~/code/work/apps/said-built/components/lab/spiral/{SpiralEngine.tsx,params.ts,spiral.css,SpiralList.tsx}` | generations hero → `components/spiral/` |
| said-built lab components + CSS law | `.../said-built/components/lab/*`, `components/motion/*`, `lib/{motion,confetti,mvp-data}.ts`, `app/{globals.css,layout.tsx}` | paper-light tokens, shimmer, blur-up, confetti, DrawnWire |
| design law | `~/code/work/design-system/{fingerprint-johnny.md,references/cofounder-dna.md}` | `docs/DESIGN.md` is the same DNA; porting the CSS ports it |
| SOTARE verification research | `/Users/johnnysheng/code/SOTARE/srm-state/` (learned-methods/LM-007*, research-compass.md, constraint-set.md, findings/learnings/loop-learnings.md, methodology/scientific-method.md) | Critic rules R1–R10, voice guide, Devpost framing |
| Sponsor endpoints (live-verified today) | Firecrawl v2, ClickHouse `sql-clickhouse.clickhouse.com/?user=demo`, OpenRouter `/api/v1/models`, Thesys `api.thesys.dev/v1/embed` + `@openuidev/*`, Langfuse v4, `@renderinc/sdk` ^0.5.0, `@composio/core` | §7 playbook — copy-paste-ready shapes |

---

## 2. JAM-SPINE — the spec our defineNode layer implements

CONTRACTS.md §"node graph" says: *our own light typed-node layer, NOT a jam-nodes dependency; doubles' orchestrator is the engine; we just name + type the stages.* The jam sweep confirms this is the only honest shape — **jam's `topologicalSort` THROWS on cycles** (`topological-sort.ts:54-56`) and our judge→reenrich→draft regen loop IS a cycle. Do NOT port `execute-workflow.ts`. Do NOT claim we use jam's DAG executor.

**`packages/backend/src/nodes/defineNode.ts` (~120 lines, verbatim jam shapes trimmed):**
```ts
export type SayhelloNode = 'scrape'|'draft'|'judge'|'reenrich'|'archive'|'render'; // matches WsEvent node union exactly
export interface NodeExecutionResult<TOut=unknown> { success: boolean; output?: TOut; error?: string;
  needsApproval?: { resourceIds: string[]; resourceType: string; message?: string } } // jam first-class human gate
export type NodeExecutor<TIn,TOut> = (input: TIn, ctx: NodeExecutionContext) => Promise<NodeExecutionResult<TOut>>;
export interface NodeDefinition<TIn,TOut> { type: SayhelloNode; name: string; description: string;
  category: 'action'|'logic'|'integration'|'transform';
  inputSchema: z.ZodSchema<TIn>; outputSchema: z.ZodSchema<TOut>; executor: NodeExecutor<TIn,TOut>; estimatedDuration?: number }
export function defineNode<TIn,TOut>(c: NodeDefinition<TIn,TOut>) { return c; } // pure identity — typing IS the feature
```

**Registry:** jam's Map-based class, `register()` throws on duplicate type; serve `getAllMetadata()` (executor-stripped) over HTTP so LoopCanvas renders nodes from real registry data, not frontend constants.

**`executeNode` (jam's, minus rate-limit, PLUS output validation — our deliberate hardening):**
```ts
const valid = node.inputSchema.parse(input);            // jam: input validated at the boundary
hooks?.onStart?.(node.type);                            // → WsEvent node_enter
const r = await node.executor(valid, ctx);
if (r.success) node.outputSchema.parse(r.output);       // STRICTER than jam (jam only validates output in registry.validateOutput, never at runtime) — say so in the demo
// thrown errors → { success:false, error } — executors NEVER throw upward (execute-node.ts:89-101)
```
Hook→WsEvent map: `onStart→node_enter`, `onComplete→{scrape_done|draft_done|score_done}`, `onError→failed` (visible FAILED badge). `needsApproval` from the gate → `gate` WsEvent.

**Reconciliations (CONTRACTS wins, details → OPEN-QUESTIONS):**
1. CONTRACTS L17 `Node = { name, in: StoryRun, out: StoryRun, run(): emits WsEvent }` vs jam: nodes take **narrow slices** and never emit — hooks emit. CONTRACTS L7 itself says "typed StoryRun slice as I/O", so resolve toward slices: `scrape:{url}→{brief}`, `draft:{brief, priorFabricated?}→{story,pitch_angle}`, `judge:{story,brief}→StoryScore`; orchestrator merges slices into StoryRun (jam's `storeNodeOutput` role). Same observable WsEvent stream.
2. Two retry vocabularies, never conflate: jam `ExecutionConfig.retry` = same-node HTTP flake retry (lives in `fetchWithRetry`); `generation` = the semantic regen loop (`maxRetries: 2`, orchestrator-driven).
3. Cache seam = cached-lead fallback: wrap `scrape` with jam's `CacheStore` interface (`{get,set,delete}`, only `success:true` cached) whose miss-path reads `data/leads/<id>.json` — architecturally legitimate, not a stub.
4. Per-node file layout (jam's ai nodes): executor in `nodes/draft.ts`, schemas in `types.ts`, **prompts in `prompts/draft.ts` as Johnny-editable consts** — directly satisfies CLAUDE.md's editable-copy rule. Section headers: `// ===== Constants / Schemas / API Functions / Node Definition =====`.

License: MIT "Copyright (c) 2026 Jam" — pattern-borrowing safe; credit in Devpost.

---

## 3. GTM-LENS — `packages/backend/src/lenses/gtm.ts` + prompts

**CompanyBrief provenance:** CONTRACTS' 26-field shape IS gtm-tool's `agents/1-research/prompt.md` schema. The load-bearing structure is `signals[]: { signal_type, source: website|github|job_posting|news, source_url, detail: "specific evidence (quote or description)", strength: 1-10 }` — **this is the per-claim evidence format the Critic grounds against**: drafted claim ↛ signal with source_url ⇒ FABRICATED.

**`drafterSystemPrompt` — quote these verbatim:**
- "Output ONLY a raw JSON object. No markdown fences. No explanation text before or after."
- "Never hallucinate funding amounts, employee counts, or founding dates — use null if unknown."
- "Be specific. 'Uses iMessage infrastructure, confirmed via job postings' is better than 'uses messaging tools.'"
- "must be NAMED features from their website, not generic descriptions." / competitors = "actual companies, not categories."
- "Do NOT force positivity. [The reader] makes better decisions with honest weak-fit calls."
- Form: "ONE CTA per message. Not two." / "Reference one specific thing about the company." / no generic openers / never "just following up".
- Voice: "Compliments are SHORT (3-7 words max)"; "the register is peer respect, not fan mail"; NEVER "we work with [customer]" — SAY "[Customer] uses our SDK."
- Per SOTARE #33-R3: the drafter's context is the scraped brief ONLY — "no larping possible: source isn't there to recall." The harness, not the instruction, is the control.

**`PITCH_ANGLES` const (the 7-row deterministic if-chain — codeable, no extra node; selection happens inside the draft prompt):**
1. uses competitor → `upgrade_from_sms` ("Lead with what Photon unlocks that they're missing")
2. CX platform missing iMessage → `multi_channel` 3. iMessage job postings → `build_vs_buy` ("You're spending $200K/yr on an iMessage engineer. We built this already.")
4. just raised + conv-AI → `speed_to_market` ("npm install imessage-kit. Try it in 5 minutes.")
5. platform 1,000+ customers → `revenue_share` 6. agentic notifications → `agentic_notifications` 7. default → `resilience`.

**`RETIRED_LINES` const (judge flags as soft violation):** never lead "98% open rate"; never "AI as a friend in your iMessage"; never feature-dump without a pain. (Validated: "infrastructure durability 42 likes vs 98% open rate 2 likes".)

**`judgePrompt` ingredients:** require drafter to emit per-claim `signals[]` evidence; tier confidence (Tier 1 "company has already identified the problem" 8-10 / Tier 2 5-7 / Tier 3 "speculative" 1-4); hard-disqualifier pattern (forces 0, overrides positives) = model for `fabricatedClaims.length > 0 ⇒ verdict:"regen"` regardless of style; humanizer line "What makes the below so obviously AI generated?" as a style sub-probe.

**Signal recipes for `reenrich`:** scrape paths `homepage, /about, /pricing, /docs, /team, /careers, /blog`; funding via "Crunchbase, LinkedIn, or About page"; github code/issue search (Tier-1 signal, strength 9).

**The pitch line (demo narration for the judge node):** the GTM pipeline we forked says "never hallucinate funding" in its prompt and then ships whatever comes back — its length validator "always exits 0", its only catch is the human. sayhello makes the instruction enforceable: claim ↛ source ⇒ FABRICATED ⇒ no ship.

**Other lenses (realestate, marketing):** per CONTRACTS, same engine, loose `LeadBrief` union — lens packs are signal recipes + angles only. Build gtm fully; the other two get a recipes const and a cached lead each, nothing more (SCOPE-LOCK simplicity law).

---

## 4. ENGINE — doubles port guidance

**Orchestrator (`orchestrator/index.ts` pattern):** `MAX_REGEN_ATTEMPTS=2`, `while(true)`: deterministic pre-check → LLM critic → `verdict==="emit"` breaks; else push rejected candidate and **thread the full AVOID set** (prior `generations[]` + `fabricatedClaims`) into the redraft — without it the drafter reproduces the identical rejected output (documented regen-diversity bug). On exhaustion: typed `RunFailedError{lastCandidate,lastScore}` → status `"failed"`, visible badge — and per SOTARE R8 this is the harness *succeeding* (refusal to ship), render it that way.

**Critic (`agents/critic.ts` + `critic-prompt.ts`):** prompt is a pure string-composition module, separate from the runner; temp 0.1, maxTokens ~250, "respond with json only." Skeleton: role → `# SCRAPED SOURCES` evidence block (replaces doubles' KNOWN-REAL-ENTITIES roster) → candidate in `"""` fences → per-axis 0..1 calibration prose → verdict recomputed **in code** from numbers (`allPass ≥ 0.7` — "LLM cannot bypass") → JSON-only output contract. Keep doubles' **anti-over-flag guard** ("When unsure, score it grounded — a false fabrication-flag wrongly kills a true reply") — a false FABRICATED regen-spirals the demo. Parser: `JSON.parse` then substring `indexOf("{")..lastIndexOf("}")`; `clamp01` per field; fail-direction explicit — score axes fail-closed, `fabricatedClaims` default `[]`. Deterministic floor: claim not substring-traceable to any source ⇒ grounding capped 0.2 (`Math.min(llm, floor)`). Relax non-grounding axes on retry 2 so the demo converges; **NEVER relax the fabrication axis**. Parse failure throws → `failed` WsEvent.

**LLM layer:** copy `src/llm/openrouter.ts` verbatim minus the Postgres audit insert (`generate()` returns `{text, model, latencyMs, costCents (Math.ceil(usage.cost*100)), tokens}`; throws on missing key at import; throws on empty completion). `models.ts` = the single seam enforcing critic≠drafter; no slugs in agent files. Prompt-cache the stable rubric prefix (`cache_control:{type:"ephemeral"}` blocks) — retries within 5-min TTL hit cache. `invocation-log.ts` row (`{turnId→leadId, agentName, 200ch summaries, success, latencyMs, costCents, modelUsed}`) IS the `generations[]` archive schema — repoint INSERT at ClickHouse/Map.

**MODEL SHORTLIST (different families, locked constraint #3):**
| Role | Slug | Why |
|---|---|---|
| DRAFTER | `anthropic/claude-sonnet-4.6` | doubles MODELS.VOICE, live-proven |
| JUDGE (primary) | `qwen/qwen3-235b-a22b-2507` + `provider:{order:["Cerebras"],allow_fallbacks:true}` | true cross-family, fast, benched in doubles |
| JUDGE (swap-in) | `anthropic/claude-haiku-4.5` | most reliable structured JSON; one-line change in models.ts if Qwen misbehaves |
| JUDGE (3rd family) | `openai/gpt-5.4` or `google/gemini-3.5-flash` | live-listed on OpenRouter today, unverified in our code |
| AVOID for judge | `zai-glm-4.7` | wraps output in ```json fences — parse hazard |

**Server:** doubles has NO ws server (its `ws` dep is Neon's driver) — `/ws` broadcast is NEW code, but doubles' in-memory `jobs Map` pattern IS the StoryRun store + `GET /story/:leadId` rehydrate. Port `envReadiness()`/`bootBlockers()` — list OPENROUTER/FIRECRAWL/CLICKHOUSE/LANGFUSE key readiness at boot so a dead key is caught before 3 PM. Port `src/logger.ts` one-JSON-line logger; each log line IS the ws payload shape.

**Scrape:** `scrape/portfolio.ts` verbatim — Firecrawl → raw fetch+cheerio cascade, `source: "firecrawl"|"fetch"` field flows into `CompanyBrief.sources` (provenance for judge + names Firecrawl on screen). `scrapeX(handle)` available if a lens wants X grounding — not scheduled work.

**Composio scrape-fallback (SCOPE-LOCK step 2 alt):** doubles' v3 REST `v3Execute()` is the working path (SDK 0.5.39 hits deprecated v2), and the sponsor sweep live-verified NO_AUTH slug `COMPOSIO_SEARCH_FETCH_URL_CONTENT` via `@composio/core` `tools.execute(slug, {userId:"default", arguments})`. Keep as the tertiary fallback after fetch+cheerio; do not budget time on it.

---

## 5. UI — port maps (source: `~/code/work/apps/said-built/`)

**Stack:** Next 15 / React 19 / Tailwind 3; motion = GSAP + canvas-confetti + rAF/CSS. **No framer-motion; no p5 needed** (LoopCanvas + spiral are pure SVG/CSS/rAF). Frontend deps: `gsap @gsap/react canvas-confetti clsx`.

### Version A — cofounder dashboard (the cockpit)
| Component | Port | Rebind |
|---|---|---|
| `mvp/Shell.tsx` | medium | app shell; WorkspaceChip → industry lens switcher feeding `POST /story/run {industry, handle}`; timestamp → `leadId · status` |
| `mvp/today/LoopCanvas.tsx` | medium — **S1's first deliverable** | 520 viewBox, R=178 ring, nodes at `DEG` map → our 6 nodes (reenrich inside the ring = the regen branch). **Kill the BEAT_MS timer; drive from WsEvents:** `node_enter`→live module + dot travel; `score_done verdict:"regen"`→judge→reenrich on `.mvp-wire-reengage` (violet marching dashes, already built); `gate`→`data-live="gate"` red dot; `failed`→blocked tint. Caption strip = humanized last event. Center card → lead domain |
| `mvp/SlipStrip.tsx` | trivial-medium | **the FabricationBoard — the money shot.** Row = one fabricated claim; red WHY chip = "NO SOURCE"; strip pills = `{fabricated n, grounded n, retries n/2}`; resolve swap via `dash-pop`. Render the instant `score.fabricatedClaims` non-empty (CONSTRAINT 4) |
| `mvp/StatusCard.tsx` | trivial | run-status panel; `groups` from WsEvent stream (`running`=node_enter, `blocked`=failed, `ready`=gate); `swapKey=\`${leadId}:${generation}\`` triggers blur-up |
| `mvp/bits.tsx` | trivial | `Btn gate` (⛋ red crunch-dark) = the APPROVE button + `confettiFrom`; `useCountUp` for grounding % reveal; `LiveTimer` on executing node; `Cluster` pills = per-node counts |
| `mvp/RoleProvider.tsx` | trivial | → LensProvider; the `Money` masking pattern = `<Claim grounded={bool}>` primitive (claim masked/struck until a Signal matches) |
| `lab/EmailReportPair.tsx` | trivial-medium | draft story card + **StoryScore report sliding in when Critic returns** — the verdict physically lands on the draft (IO threshold .3, translateX 40px→0) |
| `lab/SalesTabsCard.tsx` | trivial | tabs = `gen 0 · gen 1 · gen 2` trajectory; panel = that generation's story + score; pager cycles sources |
| `lab/EngineerChatCard.tsx` | trivial | run narrator: user pill = `{industry, handle}`; delegation rows = nodes w/ ticking timers; **shimmer overlay = the executing node**; paragraphs = Critic `failReason` |
| `lab/StatusGroupCard.tsx` | medium | node-detail inspector: buttons = 6 nodes, dotted elbow stub re-points, card blur-swaps to that node's I/O |
| `mvp/mvp.css` | trivial | copy whole file, rename mvp→sh: `data-live` glows, `.mvp-collapse`, `.mvp-wire-reengage`, `.mvp-drain` (3s arm-the-approve), `.mvp-resolved` |

### Version B — spiral hero (`components/lab/spiral/` → `components/spiral/`)
Port `SpiralEngine.tsx` (265L) + `params.ts` + `spiral.css` verbatim — pure CSS 3D, zero deps. Sticky-stage scroll scrub (`VH_PER_ITEM=55`), inertial lerp `k=1-(1-smoothing)^(dt*60)`, params read from a ref per frame (zero re-renders), style-string diffing, rAF paused by IntersectionObserver. **`"paper mode"` preset already exists** (`radius 470, pitch 200, itemsPerTurn 7, tilt 10°, dist 640`) and `[data-theme="paper"]` retokens to paper-light with `--sp-accent:#6e2bff`.

The intent map — gen-0 (red) → grounded (green):
- items = `[scrape card, signal cards, gen-0, gen-1, gen-2, gate card]` — one per `StoryRun.generations[i]`; short runs padded with scrape/signal cards (tells the distillation story).
- `tone: linear-gradient(...color-mix(in srgb, var(--bad) ${(1-g)*100}%, var(--good))...)` from `score.grounding`; `meta = \`gen ${i} · grounding ${pct}%\``; `caption = n ? \`${n} FABRICATED\` : "grounded ✓"`.
- **The actual work (3 changes, geometry untouched):** (1) replace the `item.src ? <img> : tone` ternary with a `renderCard?: (item) => ReactNode` prop so a card holds story excerpt + score chips + red struck claims; (2) live appends — engine already re-binds on `[items]`; add auto-advance `scrollToIndex(items.length-1)` on `score_done`; (3) last card = the gate — focus lands and STOPS; approve = `Btn gate` + gate-stamp + `confettiFrom`.
- Reduced-motion/mobile → `SpiralList` = generation index rows (free accessibility story).
- Funnel taper (per-card `radius*(1-taper*i/n)`) — one-line, **optional, flag don't block**.

### CSS / fonts / motion (copy first, S1)
- `app/globals.css`: paper tokens, gate vocabulary (`--gate-human:#d0421b`), `.dash-ui` scope trick (one class re-tones a subtree + sets Onest weights 430/450/480/520), shadow recipes (`.ring-card/.ring-float/.key-bevel/.bar-track+.bar-fill` — the recessed bar is perfect for the 6 StoryScore axes), `.vx-load` entry overlay = the "scraping…" hold, paper grain.
- `lab.css`: **the shimmer recipe** (gradient strip, `lab-shimmer 2.4s`) = "shimmer on executing node"; **the blur-up** (re-key container, blur 7px→0 420ms) = "blur-up swap between generations"; reduced-motion kill switch.
- `lib/motion.ts` (`EASE="expo.out"`, DUR, STAGGER) + `lib/confetti.ts` `confettiFrom(el)` = confetti-only-on-approval; `motion/DrawnWire` = LoopCanvas wires drawing in on first render.
- Fonts: Onest + IBM_Plex_Mono via next/font/google. **Departure Mono is NOT on Google Fonts** — needs `next/font/local` woff2 or substitute Plex Mono `tabular-nums` (→ OPEN-QUESTIONS).

---

## 6. SOUL+VOICE (source: `/Users/johnnysheng/code/SOTARE/srm-state/`)

**Critic rules (each research-backed; build into `agents/critic.ts` + the judge node):**
- **R1 mechanical-before-soft (LM-007):** LLM judges gave grounding 9/10 where only 20-45% of quotes existed; actionability correlated r=-0.834 with verifiability. → deterministic claim→source containment pass BEFORE the LLM critic; soft dims scored only on surviving claims.
- **R2 the verifier can lie (LM-007 v2):** a buggy verifier inflated fabrication 3-10x. → normalize (case/whitespace-fold) and search the FULL corpus (every Firecrawl page + ClickHouse rows) before stamping FABRICATED — a false flag is its own demo-killer (pairs with doubles' anti-over-flag guard).
- **R3 confidence ≠ evidence (G2, Wave-25 p_true=0.90):** judge input = claim + sources ONLY, never drafter self-assessment; every retry re-verifies ALL claims (redrafts introduce new fabrications).
- **R4 held-out catches what self-review never does (N≥4: Wave-25/30/31/34 — "NONE found by self-review"):** the empirical justification for critic≠drafter; cite the N in Devpost.
- **R5 verbatim-accurate ≠ grounded (Wave-25: 0 fabricated numbers, 5/5 headlines failed re-derivation):** claim taxonomy — FACT (must trace, else FABRICATED) vs ANGLE (allowed, labeled as interpretation).
- **R6 mechanical beats the eye (Wave-34 F2):** the gate caught a silently-retyped quote on its FIRST run — quote-claims matched by normalized containment, not LLM vibes; this arc = the demo story shape.
- **R7 every gate must be able to FAIL:** ship a fixture lead in `data/leads/` that **provably trips the FABRICATED gate** (never depend on the model happening to hallucinate); `archive` reads back what it wrote and asserts; a judge that all-passes the fixture is broken, not lucky.
- **R8 kill condition:** maxRetries=2; after retry 2 still-fabricated → REFUSE and render the refusal as the harness succeeding; `generations[]` keeps every failed draft (the trajectory is the product).
- **R9 don't bulk-stuff on retry (H-PRIMING-ROI: -20%):** reenrich adds *targeted* facts for the flagged claims only — one page, one query — never "more context" wholesale.
- **R10 proven rubric shape:** SA/RF/AP 0-10 PASS≥7 at 90% — informs the CONTRACTS 6-axis calibration prose (CONTRACTS axes are law; this is the prose behind them).
- Prompt asymmetry: "'don't' rules get 100% compliance, 'do' rules 50%" — grounding requirements as numbered steps, prohibitions as rules. G4 token law: WsEvents stay thin pointers; StoryRun keeps verbatim source quotes lossless (evidence panel shows the actual scraped sentence).

**System-voice microcopy (IBM Plex Mono surfaces) — terse stamps with receipts:**
`FABRICATED — no source. 0/3 quotes verify.` · `grounded 4/4 · shipped` · `retry 2/2 burned → REFUSED`

**Voice mechanics for human-facing copy:** lowercase, momentum, "right?", numbers always exact, headline-first then receipts, honest misses surfaced. Vocabulary: larp, grounded, verbatim, the catch, fail loud, held-out, kill condition, "the loop IS the product", machines prove / humans mean.

**Devpost framing lines (Johnny's voice, ready):**
1. "we measured this before we built it: an llm judge gave grounding 9/10 to research where only 20% of the quotes were real. the eval rewarded fabrication. sayhello is that finding turned into a product — a held-out critic that mechanically greps every claim against the scraped source before anything ships. the agent never grades its own homework."
2. "confidence is not evidence. we've watched a loop stamp p_true=0.90 on a claim that died the second its own deferred test actually ran. so the harness runs the test — every claim either traces to a real scraped source or it gets stamped FABRICATED on screen, and the story does not ship until it's cut or proven. fail loud, never silent."
3. "machines prove, humans mean. the loop scrapes, drafts, catches itself lying, re-enriches, and re-judges — and then it stops and hands you the receipts: claim, source quote, score. you make the call. before you say hello, know their story — and know it's actually true."
Bonus beat: stage the demo so the catch fires on the FIRST lead (Wave-34 F2 arc), not after warmup. Forecast-before-run: DEMO-SCRIPT states the expected catch before each rehearsal; note hit/miss.

---

## 7. SPONSOR-PLAYBOOK (all shapes live-verified 2026-06-12; ClickHouse queries executed)

| Sponsor (prize) | API shape (verified) | Creative angle | On screen | Min |
|---|---|---|---|---|
| **Firecrawl** | `POST api.firecrawl.dev/v2/scrape` Bearer key, `{url, formats:["markdown"], onlyMainContent:true, maxAge?}` → `{success, data:{markdown, links, metadata}}`; `POST /v2/search` `{query≤500ch, sources:[{type:"web"|"news"}], tbs:"qdr:m", scrapeOptions}` | reenrich calls `/v2/search` with **the fabricated claim text as the query** — a judge-targeted evidence hunt; high `maxAge` on the demo lead = Firecrawl's cache IS the cached-lead layer | scrape node labeled "Firecrawl /v2/scrape" + char count; reenrich shows the claim-as-query verbatim | ~15 |
| **ClickHouse** (impact/useful) | `https://sql-clickhouse.clickhouse.com/?user=demo` empty pw, POST SQL, append `FORMAT JSON` → `{data, statistics:{elapsed, rows_read}}`. Tables are db-qualified: **`github.github_events`** (`event_type Enum8 'WatchEvent'…`, `repo_name`, `actor_login`, `created_at`), **`hackernews.hackernews`**, cheap `github.repo_stars`/`github.repo_events_per_day` | Critic shows **claimed vs actual**: "~10k stars/mo" vs ClickHouse's real 1,371 → FABRICATED with the true number attached; render `rows_read` ("9.1B rows checked in 0.4s"). 2nd seam: archive `story_runs` → `avg(grounding) BY generation` trajectory | grounding panel = SQL + claimed-vs-actual diff + rows_read badge; score panel = trajectory | ~25 (queries done — star-velocity + HN-mentions SQL in sponsor brief, copy-paste) |
| **OpenRouter** | base `/api/v1` OpenAI-compatible; live ids: `anthropic/claude-sonnet-4.6`, `openai/gpt-5.4-mini`, `google/gemini-3.5-flash` | one client, two model strings = the held-out constraint made visible | drafter + critic model ids printed on their nodes ("never grades its own homework") | ~10 (port doubles `llm/*`) |
| **Thesys C1 / OpenUI** (most unique use) | hosted: OpenAI SDK `baseURL:"https://api.thesys.dev/v1/embed"`, models `c1/anthropic/claude-sonnet-4/v-20251230`…; frontend `@thesysai/genui-sdk` `<C1Component c1Response isStreaming onAction/>`. OSS path: repo pivoted to **OpenUI Lang** (`@openuidev/lang-core`, `react-ui`, `openui-cli`) — any LLM incl. our OpenRouter key emits it | render the **VERIFICATION ARTIFACT**, not a chat card: `Table`+`Tag` claims ledger (GROUNDED/FABRICATED/CUT), `Accordion` per-claim evidence drill-down, `ChartsV2` grounding trajectory, `Steps`+`Carousel` story slides, `FollowUpBlock onAction` = the gate AS generated UI ("Approve & ship" POSTs back into the harness) | whole right panel post-gate; blur-up gen-0 (red tags)→final (green) | ~30-45 incl. signup; build LLM-swappable (OSS = zero-signup fallback) |
| **Langfuse** (most impressive use) | v4: `@langfuse/tracing`+`@langfuse/otel`+`@langfuse/client`; `new NodeSDK({spanProcessors:[new LangfuseSpanProcessor()]})` in `instrumentation.ts`; wrap = `observe(executor, {name:"judge", asType:"span"})` one line in defineNode; `propagateAttributes({sessionId: leadId})`; `langfuse.score.create({traceId, name:"grounding", value, dataType:"NUMERIC"})`. **Env var is `LANGFUSE_BASE_URL`** (set `LANGFUSE_HOST` too) | the **flight recorder of self-correction** — one trace per lead, span tree mirrors the node graph, 3 scores per judge pass (`grounding`, `fabricated_claims`, `shipped` BOOLEAN at gate) climbing 0.4→1.0 across generations | "trace ↗" link opening the real Langfuse trace live; score chips per generation | ~25 (free signup) |
| **Render** (MUST USE Workflows to win) | `@renderinc/sdk` ^0.5.0: `task(runStory, {timeoutSeconds, retries})`, JSON-serializable args (our `{industry,handle}`→StoryRun qualifies); trigger `client.workflows.startTask("sayhello/runStory",[...])` → `taskRunId`, `await result.get()`. **render.yaml does NOT support Workflows** (dashboard/CLI creation); no native scheduling (cron service calls startTask) | two lanes, zero new nodes: live demo in-process (keeps ws streaming); register the SAME `runStory` as a task in `workflows/index.ts` | "Runs on Render" badge; **CUT-CANDIDATE per SCOPE-LOCK** (multi-lead = only-if-time): scale-lane button fanning 2 cached lenses as parallel task runs w/ visible taskRunIds | ~40-60 (web 15 + workflow 20 + startTask 10 + cron 10) |
| Composio ("Best Agent Execution") | `@composio/core` `tools.execute(slug, {userId:"default", arguments})` → `{data, successful}`; 22 NO_AUTH `COMPOSIO_SEARCH_*` slugs verified (`_WEB`, `_NEWS`, `_FETCH_URL_CONTENT`, `_EXA_ANSWER`, `_SEC_FILINGS`…) | claim-typed tool routing (funding→`_SEC_FILINGS`, news→`_NEWS`, tech→`_FETCH_URL_CONTENT`) | **CUT-CANDIDATE — SCOPE-LOCK cuts Composio SEC/finance toolkits.** On the line ONLY as the NO_AUTH scrape fallback (`_FETCH_URL_CONTENT`/`_WEB`); claim-router is S4 only-if-free-time | ~20 if revived |

Cross-cutting: ClickHouse port 443 works (no `:8443`); Thesys hosted vs OSS = keep render node LLM-agnostic; Composio requires `userId` even NO_AUTH; ClickHouse/Langfuse/Thesys keys are NOT in doubles `.env`.

---

## 8. STAGE HOOKS — bottleneck-first

**S1 (pipe on stub) — prerequisites pulled forward:**
1. JAM-SPINE §2 verbatim: `defineNode.ts` + registry + `executeNode` w/ hook→WsEvent map (~120 lines) — everything downstream hangs on this boundary.
2. LoopCanvas port (§5): kill BEAT timer, WsEvent reducer; copy globals.css/lab.css/mvp.css first so S1 already looks like the product.
3. doubles jobs-Map → StoryRun store + `GET /story/:leadId` rehydrate + NEW thin `/ws` broadcast; `envReadiness()` at boot.

**S2 (real scrape + drafter + Critic — the catch must fire):**
1. **Bottleneck: the fixture lead (SOTARE R7).** Pick the demo lead + author a `data/leads/` fixture that provably trips FABRICATED — the catch can never depend on luck. Wire the cached-lead fallback as the scrape node's CacheStore miss-path (§2.3).
2. Critic = doubles skeleton + R1/R2 mechanical pre-pass + ClickHouse claimed-vs-actual (the live star-velocity SQL is copy-paste ready) + code-recomputed verdict + deterministic grounding floor; models.ts pins sonnet-4.6 / qwen3-235b (haiku-4.5 one-line swap).
3. Regen loop: AVOID-set threading (doubles' documented bug), R9 targeted reenrich (Firecrawl `/v2/search` with the fabricated claim as query), re-verify ALL claims each pass (R3), refusal-after-2 rendered as success (R8).

**S3 (archive + trace + spiral + slides):**
1. Archive: invocation-log row shape → ClickHouse `story_runs` (Map fallback first per CONTRACTS); R7 roundtrip read-back assert; trajectory query feeds SalesTabsCard + spiral.
2. Langfuse: `instrumentation.ts` + one `observe()` in defineNode + `score.create` in judge + gate — set BOTH `LANGFUSE_BASE_URL` and `LANGFUSE_HOST`; open the live trace in the demo.
3. Spiral hero: render-prop + auto-advance + grounding→tone (§5B, 3 changes); OpenUI render node LLM-agnostic (`Table`+`Tag` claims ledger first — it's the unique-use-case claim), slides after.

**S4 (deploy + polish + stretch):**
1. Render web service via render.yaml (15 min); workflow service is dashboard/CLI separately — do it only after the deployed demo runs end-to-end.
2. Gate polish: `Btn gate` + `.mvp-drain` arm + gate-stamp + `confettiFrom` (the one whimsy on the approve surface); EmailReportPair verdict slide-in.
3. Only-if-time, in order: Render Workflows scale-lane (CUT-CANDIDATE), Composio claim-router (CUT-CANDIDATE), spiral funnel taper.

**Devpost:**
1. Lead with framing line 1 (§6) + the LM-007 measured table (grounding 9/10 at 20% real quotes) — the product is a measured finding, not a vibe.
2. The jam claim that survives scrutiny: built on the jam-nodes pattern (MIT) — pure typed nodes, one Zod-validated executeNode boundary, hooks driving the live graph — "plus one hardening jam leaves optional: we runtime-validate node *outputs* too, because this harness exists to distrust its own agent."
3. Per-sponsor prize sentences from §7 angles (claimed-vs-actual w/ rows_read; gate-as-generated-UI; flight-recorder-of-self-correction; evidence-hunt-by-claim); credit jam-nodes; cite R4's N≥4 for the held-out constraint.
