# RENDER WORKFLOWS — the exact integration shape (from the sponsor booth, 2026-06-12)

> Sponsor rule: **MUST USE Render Workflows to win Render prizes** ($1000/$600/$400 credits).
> Johnny has registered on Render + claimed credits. `RENDER_API_KEY` lands in `.env` when grabbed.
> This file is the verbatim-grounded integration path for S4. Source: Render onboarding pasted by Johnny.

## What Render Workflows is (Beta)
- Durable task orchestration. **TypeScript and Python supported** — we use TS (matches our backend).
- Tasks are plain async functions wrapped in `task()` from `@renderinc/sdk/workflows`.
- **Render reads task definitions directly from the repository during deploy** — push to git = deploy.
- CLI for local dev: starts the project, a local task server, and runs sample tasks.

## The primitive (verbatim from onboarding)
```ts
import { task } from "@renderinc/sdk/workflows"

const calculateSquare = task(
  { name: "calculateSquare" },
  async (n: number) => n * n
);

const processClaim = task(
  {
    name: "processClaim",
    retry: { maxRetries: 3, waitDurationMs: 1000, backoffScaling: 1.5 },
    timeoutSeconds: 300,
    plan: "standard",
  },
  async (claim: { id: string; value: number }) => {
    const result = await calculateSquare(claim.value);
    return { claimId: claim.id, result };
  }
);
```
Note: tasks call tasks (composable), native `retry` with backoff, `timeoutSeconds`, per-task `plan`.

## Setup steps (CLI)
```sh
brew update && brew install render          # CLI
render workflows init --language node       # optional example scaffold
# test locally: CLI walks through starting the project + local task server + sample task
# then: commit + push — Render reads task definitions from the repo during deploy
render skills install render-workflows      # agent skills for scaffold/dev/test
```

## How sayhello maps (honest, on the demo line)
Our orchestrator is already a typed-node sequence with a retry loop — it mirrors Render's task model 1:1:
- **Candidate A (the story-matched one):** each harness node (scrape/enrich/ground/draft/judge/archive/render)
  wrapped as a `task()` — the reenrich retry becomes a native `retry` config on the draft→judge chain.
  A thin `packages/backend/src/workflows/story-run.workflow.ts` that imports the SAME node executors
  (no logic fork) and composes them as tasks. The WsEvent stream stays in the web service; the workflow
  is the durable execution variant of the same pipeline.
- **Candidate B (cheap + load-bearing):** `prewarmLeads` task — scrape + brief + write `data/leads/<id>.json`
  for the demo-fallback cache, with native retries. Small, honest, demo-supporting.
- Ship A if the SDK cooperates within S4's window, else B. Either way the `task()` definitions live in the
  repo so the deploy picks them up.

## Links
- Claim credits: https://credits-portal-mmdm.onrender.com/claim/harness-engineering-hack (DONE — Johnny)
- Signup: https://render.com/register?... (DONE — Johnny)
- LLM/agent docs: https://render.com/docs/llm-support
- Templates: https://render.com/templates
