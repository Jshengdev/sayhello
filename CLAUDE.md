# CLAUDE.md — sayhello (hackathon project)

You are working in **sayhello**, Johnny Sheng's hackathon project. This file is your map and your operating contract. Read it first; drill into linked docs only when your task needs them.

> **Status: PRE-IDEATION.** The project concept is not locked yet. Sections marked `[TBD — lock at kickoff]` get filled in once the idea, theme, and stack are decided. Everything else is in force from day one.

## TL;DR — what this project is

`[TBD — lock at kickoff]` One paragraph: what the demo does end-to-end, what's live vs. pre-rendered, and what the judge sees. Keep it to 3 sentences max. If you can't write this paragraph, the idea isn't scoped yet — say so.

## Operating distinctions (read these — they change how you behave)

These are clear, non-negotiable distinctions between modes of work. Know which one you're in.

### 1. Ideation vs. execution
- **Ideation mode:** Johnny articulates the idea; Claude sharpens. **Reflect, don't propose.** Ask questions that surface tensions, name trade-offs Johnny hasn't seen, pressure-test scope. Do NOT generate project ideas or pitch concepts unprompted.
- **Execution mode:** once a thing is locked in this file or `docs/`, build it without re-litigating. Locked decisions are guardrails, not discussion prompts.

### 2. Demo path vs. everything else
- The **demo path** is the exact sequence of actions shown to judges. Code on the demo path gets tests, error handling, and polish.
- Everything off the demo path gets the minimum to not crash. Do not refactor, generalize, or harden code the judge will never see. When in doubt ask: "does this make the 3-minute demo better?"

### 3. Real vs. pre-rendered vs. mocked
- **Real:** computed live during the demo. Default for anything cheap and reliable.
- **Pre-rendered:** expensive/flaky pipelines run ahead of time, outputs committed as artifacts (e.g. `data/prerendered/<id>/*.json`). The demo reads artifacts; it never re-runs the pipeline live.
- **Mocked:** allowed ONLY in dev, gated behind an explicit env flag (`MOCK_*=1` / `import.meta.env.DEV`). **No silent stubs, ever.** A failure must log structurally and render a visible "FAILED" state — never fake success.

### 4. Locked vs. open
- **Locked** decisions live in `docs/CONSTRAINTS.md`. Changing one requires Johnny's explicit say-so, recorded in that file.
- **Open** questions live in `docs/OPEN-QUESTIONS.md`. If your task collides with an open question, flag it as a finding and keep moving — don't freeze, don't silently decide it yourself.

### 5. Hackathon clock vs. engineering instinct
- Ship > elegant. Working ugly beats broken beautiful. Cut scope, not the demo.
- But: no silent stubs (see #3), and claims of "done/working" require a run command + observed output (verification before completion).

## Read these first (in order)

1. `docs/ARCHITECTURE.md` — canonical pipeline + repo layout. Single source of truth. `[TBD]`
2. `docs/CONSTRAINTS.md` — locked rules. Before any code change.
3. `docs/CONTRACTS.md` — data schemas + API surface. Before changing any data shape.
4. `docs/DEMO-SCRIPT.md` — the judge-facing walkthrough. The demo path is defined here.

If a doc doesn't exist yet, the decision isn't made yet — treat it as open.

## Repo map

```
sayhello/
├── CLAUDE.md              ← this file
├── docs/                  ← canonical context (constraints, contracts, architecture, demo script)
│   └── OPEN-QUESTIONS.md  ← running list of undecided things
├── [TBD]                  ← app code layout locked at kickoff (frontend/, backend/, etc.)
└── ...
```

Update this map whenever the top-level layout changes. A stale map is worse than no map.

## Skills to load (per task type)

**Always:**
- `superpowers:verification-before-completion` — claims need run commands + output
- `superpowers:writing-plans` — for any multi-step task, plan before touching code

**Building features:**
- `superpowers:brainstorming` — before creative work (remember: reflect, don't propose)
- `superpowers:test-driven-development` — demo-path code only; skip for throwaway scaffolding
- `superpowers:subagent-driven-development` — when work decomposes into independent tasks

**Frontend:**
- `frontend-design:frontend-design` — production-grade UI, avoid generic AI aesthetics

**When stuck:**
- `superpowers:systematic-debugging` — root-cause before patching
- `bmad-advanced-elicitation` — Socratic / pre-mortem / red-team when a decision feels shaky

**Packaging / pitch:**
- `ship-velocity` — scope cuts, MVP slicing, story-first packaging

## API surface

`[TBD — lock at kickoff]` Table of method/path/returns. Every frontend panel must consume a real endpoint listed here (distinction #3: real data only on the demo path).

## Design tokens

`[TBD — lock at kickoff]` Colors, type, radius, shadows go here once the design direction is picked. Until then, do not invent a design system ad hoc — flag it as an open question.

## Key constraints (locked)

1. **No silent stubs.** Failures are visible and logged. Mocks are env-gated dev-only.
2. **Demo path is sacred.** Polish lives there; nowhere else.
3. **Ideation is Johnny's.** Claude sharpens, questions, and pressure-tests — it does not name the idea.
4. **Don't be a blocker.** Constraints are guardrails — flag conflicts as findings, don't freeze.
5. `[TBD — project-specific constraints land here at kickoff]`

## Kickoff checklist (delete this section once done)

- [ ] Lock the idea → write the TL;DR paragraph above
- [ ] Write `docs/ARCHITECTURE.md` (pipeline + what's real vs. pre-rendered)
- [ ] Write `docs/CONSTRAINTS.md` + `docs/CONTRACTS.md`
- [ ] Lock stack + scaffold app layout → update repo map
- [ ] Write `docs/DEMO-SCRIPT.md` skeleton (even before the code exists — story first)
- [ ] Fill in design tokens + API surface
