# OPENUI — verified links (from the Thesys booth + Johnny, 2026-06-12)

> OpenUI = Thesys's OSS Generative UI framework. **NO separate API key** — works with any
> OpenAI-format provider; our OPENROUTER_API_KEY is the only credential. Judging: "most unique use case."
> Live proof + integration spec: `docs/reference/OPENUI-RENDER.md` (written by the openui-proof workflow).

- Docs root: https://www.openui.com/docs
- **Defining custom components (THE seam for us):** https://www.openui.com/docs/openui-lang/defining-components
- Lang spec v0.5: https://www.openui.com/docs/openui-lang/specification-v05
- How it works / architecture: https://www.openui.com/docs/openui-lang/how-it-works
- Token benchmarks (67% vs JSON): https://www.openui.com/docs/openui-lang/benchmarks
- Repo: https://github.com/thesysdev/openui
- Example w/ standard library (shadcn): https://github.com/thesysdev/openui/tree/main/examples/shadcn-chat
  — reference only; our unique-use case registers OUR paper-light verification components instead.
- OpenRouter BYOK (Anthropic via OpenAI format): https://openrouter.ai/docs/guides/overview/auth/byok
- Anthropic OpenAI-compatible SDK: https://platform.claude.com/docs/en/cli-sdks-libraries/libraries/openai-sdk

## Our angle (locked): the VERIFICATION ARTIFACT as generative UI
The LLM composes the harness receipts from our registered component library:
ClaimsLedger (GROUNDED/FABRICATED/CUT tags) · EvidenceAccordion (per-claim source quotes) ·
TrajectoryChart (grounding by generation) · StorySlides · GateBlock (the human approve-gate AS generated UI).
Streamed line-by-line (structure first, data fills) — rides our blur-up gesture. Hosted Thesys C1 = optional upgrade, not a dependency.
