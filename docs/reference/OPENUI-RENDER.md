# OPENUI-RENDER.md — S3 render-node spec (OpenUI OSS path, proven live 2026-06-12)

> Written by the spec lane. Build lane owns `packages/`. Evidence: `.evidence/openui-probe/{probe.mjs, output.openui, parse-report.json, system-prompt.txt}` · working tree `/tmp/openui-probe/` · docs `/tmp/openui/`.

## 1. VERDICT
**The no-key OpenUI path WORKS, proven live.** Our 7-component custom library + `library.prompt()` (4,618-char / ~1,150-token system prompt) → OpenRouter `google/gemini-2.5-flash` (temp 0, `reasoning:{enabled:false}`) → valid OpenUI Lang on **attempt 1**: 703 ms, $0.00147, 1,576 prompt / 397 completion tokens, real `createParser` reports `errors:[] unresolved:[] orphaned:[] incomplete:false`, all 7 components used, the $40M Series B rendered `"FABRICATED"`, gate action exactly `"approve_story"`, zero invented content. (`gemini-3.5-flash` also works but reasoning is mandatory on OpenRouter → 18x cost, 5x latency — don't.)
**THESYS_API_KEY rec for Johnny:** skip unless it's free in <5 min of idle time — the keyless OSS path is proven and is the stronger "most unique use" story; a key is insurance only, never a blocker.

## 2. BACKEND — render node live path (replaces the C1 stub seam in `nodes/render.ts`)
Input stays `{ run: zStoryRun }` (whole StoryRun at render time: `status:"blocked"`, `story/score/brief` non-null, `generations[]` full trajectory, `brief.signals` = evidence pool). Executor:
1. `import { createLibrary, createParser } from "@openuidev/lang-core"` (server-safe, no React) + shared component schemas (§3); components pass `component: () => null` on the server.
2. `const systemPrompt = lib.prompt({ preamble, additionalRules, examples: [PROBE_EXAMPLE] })` — recipe in §5. Keep all three in a clearly-marked `export const RECEIPT_PROMPT = {...}` for Johnny.
3. OpenRouter via the already-installed `openai@4.104.0`: `baseURL "https://openrouter.ai/api/v1"`, model `"google/gemini-2.5-flash"`, `temperature: 0`, `reasoning: { enabled: false }`, `usage: { include: true }`. User msg: `"Render the verification receipt for this StoryRun:\n" + JSON.stringify(slimRun)` where `slimRun` = `{ url, story, score, generations: [{generation, score: {grounding, verdict}, fabricatedClaims}], brief: {name, signals: [{detail, source_url}]} }` (~425 tokens probed; don't ship the whole brief).
4. `stripFences(text)` → `createParser(lib.toJSONSchema(), "Receipt").parse(...)`. Valid = `root && !meta.errors.length && !meta.unresolved.length && !meta.incomplete`. Invalid → ONE corrective retry appending `meta.errors` as a user message; still invalid → fall back to `carveSlides` typed slides (already built), log structurally, emit nothing silent.
5. **Output / contract additions (FLAG for build lane — do not change types.ts from this lane):**
   - `CONTRACT-ADD-1`: render `outputSchema` → `{ slides: zSlide[].min(1), openuiLang: z.string().nullable() }`; `store.setReceipt(leadId, openuiLang)` beside `setSlides`. `StoryRun` stays untouched (locked — no `slides` field).
   - `CONTRACT-ADD-2`: new `GET /story/:leadId/receipt` → `{ openuiLang: string|null, slides: Slide[] }`. This is the delivery channel (today slides die in the Map; `done` carries `run` only). No WsEvent union change needed — frontend fetches on approve/done. (Optional later: `{type:"render_done"}` event; unknown types already pass the reducer harmlessly.)
   - `ORCH-1 (the prize move)`: run `renderNode` **before** emitting `gate` so the human approves looking at the generated receipt and `GateBlock`'s `onAction` IS the approve POST. Fallback if sequencing stays locked: receipt renders post-approve with GateBlock in its stamped/approved state — still generated UI, just confirmatory.
   - Failures: throw → existing `NodeFailure("render")` → `{type:"failed", stage:"render"}` → FailedBadge. Node already auto-emits `node_enter:"render"`; footer credit becomes "render Thesys OpenUI".

## 3. FRONTEND — the paper-light verification library
One shared schema module (e.g. `lib/receipt-schema.ts`, mirrored backend/frontend; **Zod key order = positional arg order — never reorder without regenerating the prompt**), `import { z } from "zod/v4"` (mandatory subpath even on zod 3.25.x). Components (`defineComponent` from `@openuidev/react-lang`, all-custom — NO `@openuidev/react-ui`, no zustand, no ThemeProvider, no components.css):
- `Receipt` (root) — `{ company, headline, children: ref[] }` → `bg-raised ring-panel` shell, headline in `font-mono`.
- `ClaimsLedger` + `ClaimRow` — `{ claim, verdict: enum GROUNDED|FABRICATED|CUT, source? }` → verdict chips on `text-good`/`claim-bad`/`text-mute`, source as `font-mono` chip.
- `EvidenceAccordion` + `EvidenceItem` — `{ claim, excerpt, sourceUrl: nullable }` → drill-down with the verbatim scraped sentence; null source renders "NO SOURCE FOUND" in `claim-bad`.
- `TrajectoryChart` — `{ points: {generation, grounding}[] }` → `font-numeral` (Departure Mono) sparkline/strip, 0.4→0.92.
- `GateBlock` — `{ label, action, summary }` → the approve button; `onAction` where `e.humanFriendlyMessage`/action `"approve_story"` → existing `approve()` from `useStoryRun()`; success → `gate-stamp` + confetti (the one allowed whimsy).
- `StorySlides` + `StorySlide` — `{ title, body }` → walkable slides (Tabs-like, our CSS).
`createLibrary({ root: "Receipt", components: [...], componentGroups: [{ name: "Ledger", notes: ["- Any claim the Critic ever flagged FABRICATED must render verdict \"FABRICATED\", even if a later generation cut it."] }] })`.
**Mount:** new `ReceiptPanel.tsx`, full-width between the StoryCanvas/Score grid and `EventTicker` in `app/page.tsx` (the post-gate finale slot; ApproveGate.tsx:97 already promises "rendered by Thesys" with nothing behind it). Fetch `GET /story/:leadId/receipt` when `gate` arrives (ORCH-1) or `approved===true` (fallback), then:
```tsx
<Renderer library={sayhelloLibrary} response={revealedText} isStreaming={revealing}
  onAction={handleApprove} onError={(errs) => errs.length && setRenderFailed(errs)} />
```
**Streaming/blur-up:** backend call is one-shot (703 ms — SSE not worth the plumbing). Client replays the received Lang text line-by-line (~80 ms/line interval) into `response` — hoisting gives the documented top-down reveal: shell → ledger skeleton → verdicts pop in, each new row wearing our `blur-up` class. Between generations (stretch): re-stream gen-N's text into the same `<Renderer>`. **Non-empty `onError` → visible FAILED badge** (OpenUI drops invalid lines silently by design; our no-silent-stubs law requires surfacing it).

## 4. THE PRIZE PITCH (Johnny's voice)
everyone points generative ui at making chat prettier. we point it at the receipts: the claims ledger with the FABRICATED stamp, the per-claim evidence with the verbatim scraped sentence, the grounding trajectory climbing 0.4→0.92, and the human approve gate are all openui lang — emitted by the model, rendered from our own paper-light component library, not a chat card. the harness catches the agent lying, then a model composes the verification artifact you judge it with — machines prove, humans mean, and the ui between them is generated too.

## 5. WIRING PLAN (~80 min total)
| # | Step | Min |
|---|---|---|
| 1 | Deps (pin exact, 0.x churn): backend `pnpm add @openuidev/lang-core@0.2.5`; frontend `pnpm add @openuidev/react-lang@0.2.6 zod@4.4.3` (react 19.2.7 OK; backend's zod 3.25.76 OK via `zod/v4`) | 5 |
| 2 | Shared `receipt-schema.ts` + backend library (`component: () => null`) + `RECEIPT_PROMPT` const | 15 |
| 3 | render.ts live path: OpenRouter call → stripFences → parse → validity gate → 1 corrective retry → carveSlides fallback; output `{slides, openuiLang}` (CONTRACT-ADD-1) | 15 |
| 4 | `GET /story/:leadId/receipt` (CONTRACT-ADD-2) | 5 |
| 5 | Frontend: 6 components on existing tokens + `library.tsx` + `ReceiptPanel` + replay streamer + onAction→approve + onError→badge | 20 |
| 6 | ORCH-1 sequencing (render pre-gate) or post-approve fetch; footer → "Thesys OpenUI" | 10 |
| 7 | Rehearse: FABRICATED row red on first lead; force an invalid response to verify fallback + badge | 10 |
**System-prompt recipe (copy-paste):** `lib.prompt({ preamble: "You render the verification receipt for a GTM lead-story harness. Terse system voice. Numbers exact. Never invent a claim, source, or score not present in the payload.", additionalRules: ["Any claim the Critic ever flagged FABRICATED must render with verdict FABRICATED, even if a later generation cut it.", "Root first line must be `root = Receipt(...)`.", "Use every claim in the payload exactly once in the ledger."], examples: [<the 13-line probe output from .evidence/openui-probe/output.openui, verbatim>] })`. One full example dramatically improves validity — the probe's IS the example.

## 6. RISKS & FALLBACKS
- **Verdict steering is literal** (probe gotcha 1): without the FABRICATED rule the model renders the cut claim as `CUT` — technically right, demo-dead. Rule is baked into §5; verify `fabricatedRendered` in rehearsal.
- **Model trap** (gotcha 2): `gemini-3.5-flash` can't disable reasoning on OpenRouter (18x cost, 5x latency). Pin `google/gemini-2.5-flash` + `reasoning:{enabled:false}`.
- **Output is richer than the example** (gotcha 3): model hoists data objects (`p1 = {...}`) and passes explicit `null` — consume `ElementNode.props` generically, never pattern-match literal text; `stripFences` always; gate on all four validity signals.
- **Silent drops by design** vs our no-silent-stubs law: unknown components/excess args/unreferenced statements vanish — `onError` + `meta` wiring is mandatory, not optional.
- **Foot-guns:** `zod/v4` subpath or it throws; Zod key order = arg order (regenerate prompt on any schema change); pin 0.x versions exactly; no `nodePlaceholder` prop exists.
- **Sequencing collision:** gate currently precedes render — ORCH-1 is flagged, not assumed; the confirmatory-gate fallback keeps the demo whole either way.
- **Fallback ladder:** (1) corrective retry with `meta.errors`; (2) hosted Thesys C1 (`baseURL https://api.thesys.dev/v1/embed`, `<C1Component>`) IF a key lands — render node stays LLM-agnostic; (3) **floor that never blocks:** existing `carveSlides` typed slides + visible "openui fallback" log — already built, already demoable.
