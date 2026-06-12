# GUILD CLI — verbatim-grounded reference (pasted by Johnny from docs.guild.ai, 2026-06-12)

> Prize: "Most Innovative Use of Agents (Guild.ai)" — $1k 1st + $2.8k pool. PRIZE-PLAN §2 has the shape
> verdict (being amended by the guild-shape probe). This file = the exact CLI/SDK mechanics for wiring.

## Install / auth (Johnny's hand: only `guild auth login` — browser)
```sh
npm i @guildai/cli -g
guild auth login        # browser → app.guild.ai; also configures npm registry for Guild packages
guild auth status
guild doctor            # full diagnostics (auth, server latency, workspace)
guild workspace select
```

## Agent scaffold
```sh
mkdir sayhello-gatekeeper && cd sayhello-gatekeeper
guild agent init --name sayhello-gatekeeper --template LLM   # or AUTO_MANAGED_STATE (code-first) / BLANK
```
Structure: `agent.ts` (the code) + `package.json` + `guild.json` (CLI-managed, don't edit).

## THE KEY FIND — code-first agent = a DETERMINISTIC gate (better than llmAgent for us)
```ts
"use agent"
import { agent, guildTools, type Task } from "@guildai/agents-sdk"
import { z } from "zod"
const tools = { ...guildTools }
const inputSchema = z.object({ type: z.literal("text"), text: z.string() })   // StoryScore JSON as text
const outputSchema = z.object({ type: z.literal("text"), text: z.string() })  // {"verdict":"BLOCK"|"ALLOW","reason"}
async function run(input, task: Task<typeof tools>) { /* parse score; BLOCK iff fabricatedClaims.length>0 */ }
export default agent({ description, inputSchema, outputSchema, tools, run })
```
- Deterministic (no LLM variance at the gate), fast, and the session is still a Guild audit record.
- llmAgent variant (template LLM): `llmAgent({ description, tools, systemPrompt, mode: "one-shot" })` —
  use one-shot, NOT multi-turn, for a gate.

## Service tools (shape B — governed evidence hunting)
- Import: `import { gitHubTools } from "@guildai-services/guildai~github"` — runtime provides the package;
  do NOT add `@guildai/agents-sdk`, `zod`, or `@guildai-services/*` to package.json.
- Call: `await task.tools.github_search_issues_and_pull_requests({ q, per_page })` — all calls via `task.tools.*`.
- Credentials configured org-level at app.guild.ai Settings → Credentials (Johnny connected firecrawl there,
  publisher `dkountanis` → import path likely `@guildai-services/dkountanis~firecrawl` — VERIFY before relying).
- Runtime ships ~10 service integrations; first use prompts OAuth/credential connect if unconfigured.

## Dev loop + the shell-out seam (our backend call site)
```sh
guild agent test              # interactive; ephemeral versions auto-created from local dir
guild agent chat "message"    # ONE-SHOT — this is the execFile() seam from guildGate.ts
guild agent save --message "..." --wait --publish   # commit → validate → publish to org
```
- `guild agent chat` works from the local agent dir (ephemeral version) — no publish needed to demo locally.
- Backend: `execFile("guild", ["agent","chat", payload], { cwd: agentDir, timeout: 8000 })`, defensive JSON parse,
  visible `guild-gate FAILED` WsEvent on any error (never silent). Env-gated `GUILD_GATE=1`.

## 10-min live verify (run the moment auth lands — decides the S4 slot)
1. `guild doctor` → all green, note server latency.
2. Scaffold gatekeeper (init → paste agent.ts) in `/tmp/guild-verify/sayhello-gatekeeper`.
3. `time guild agent chat '{"fabricatedClaims":["raised a $40M Series B"],"grounding":0.4}'` → expect BLOCK; measure.
4. Same with empty fabricatedClaims → ALLOW. If chat turn > ~8s or auth doesn't persist to child processes → fallback per PRIZE-PLAN.

## Bonus
- `guild setup` installs Guild skills into `.claude/skills/` — run inside the agent project at wiring time.
- `guild agent versions` / `guild agent code` — show the judge the published version history (audit story).
