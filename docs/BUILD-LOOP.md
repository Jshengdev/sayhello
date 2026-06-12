# BUILD-LOOP — how the build window loops cleanly without overcomplicating

> Discipline borrowed from SOTARE's constraint paradigm (CP-1..CP-10, "constraints as a generative
> development mechanism"). The goal of the FIRST loop is NOT a finished product — it is a WIRED,
> VERBOSE-LOGGED SKELETON that runs one lead end-to-end and reveals exactly where iteration is needed.

## The constraint principles (bind every loop iteration)
- **CP-1 Bounding box.** Each loop opens with a stop condition. No stop condition → don't start. ("Stage 1 done = one lead streams scrape→...→done to the dashboard.")
- **CP-3 Bottleneck-first.** Build the thing currently BLOCKING the demo path next — never the easiest or the most impressive. The bottleneck is whatever breaks the one-lead end-to-end run.
- **CP-4 Satisficing.** Every stage has a pre-registered good-enough criterion + STOP-at-met. Do not gold-plate. Hitting the criterion = move on, even if ugly.
- **CP-5 Visible mechanical constraints.** Caps and failures are detect→LOG→BLOCK, never advisory. Verbose logs at every wiring seam (see below). No silent stubs.
- **CP-6 WIP limit = 1.** Finish the current stage (its verify command passes) before starting the next. Backend and frontend may build in parallel ONLY because they share nothing but `docs/CONTRACTS.md`.
- **CP-7 One-sentence objective** opens every loop iteration, quoted in the log.
- **CP-2 Subtraction audit.** End each stage by removing ≥1 bit of accumulated complexity. If a node/feature isn't on `docs/SCOPE-LOCK.md`'s 6-step line, delete it.

## The self-loop (what the build window's workflow does each pass)
```
OPEN:    state the one-sentence objective + stop condition (CP-1, CP-7)
BUILD:   target the current bottleneck only (CP-3); backend + frontend build to the shared contract
VERIFY:  run the stage's verify command; capture output; the agent JUDGES pass/fail against the
         satisficing criterion (CP-4) — its own judgement, evidence-based, no self-praise
LOG:     verbose structured log of every wiring seam touched (below)
DECIDE:  pass → subtraction audit (CP-2) → next stage (CP-6).  fail → same bottleneck, next pass.
CLOSE:   when the stage criterion is met, stop. Do not exceed it.
```

## The wiring seams that MUST be verbose-logged (where iteration will be needed)
Log every one of these on every run, structurally (`[seam] event → shape → ok/FAIL`):
1. `POST /story/run` received → `{url}` validated → leadId issued
2. each NODE enter/exit → input shape → output shape → latency (scrape, parse, draft, judge, enrich, archive, render)
3. the held-out Critic → grounding score → `fabricatedClaims[]` (log the caught claim verbatim)
4. each `WsEvent` emitted → type → payload shape
5. frontend `lib/ws.ts` → event received → which component consumed it → render ok/FAIL
6. ClickHouse write + trajectory query → row count / result
7. any failure → FAILED badge data + the error (fail loud)
These logs ARE the iteration map: Johnny reads them to see what to wire next.

## Stage criteria (satisficing — STOP when met, CP-4)
- **S0** met when: monorepo runs (`pnpm dev` boots backend ws + frontend), `types.ts` compiles from CONTRACTS.
- **S1** met when: one STUB lead streams the full WsEvent sequence and the dashboard node graph lights through all stages incl. a faked fabrication-catch. (THE skeleton. This is the first-loop goal.)
- **S2** met when: a REAL url scrapes + drafts + the Critic catches a real ungrounded claim once.
- **S3** met when: trajectory renders from archive + spiral shows generations + slides render.
- **S4** met when: deployed on Render + polished to DESIGN + Langfuse trace opens.

## Known unknowns (Johnny flagged: "there are problems with what we're building")
That's expected and fine. The skeleton's job is to MAKE THEM VISIBLE via the seam logs, not to solve
them upfront. List each discovered problem in `docs/OPEN-QUESTIONS.md`; don't block — log, flag, continue.
