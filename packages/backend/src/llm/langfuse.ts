// llm/langfuse.ts — the Langfuse trace seam (sponsor: Langfuse, ON the demo line —
// docs/FINAL-PROMPT.md; the page footer captions "trace Langfuse").
// One trace per run (id = leadId, so drafter/critic/extractor/renderer calls group),
// one generation observation per OpenRouter call. NEVER fatal: missing keys -> LOUD
// disabled notice once; ingestion errors -> LOUD degrade, the run is unaffected.
// Keys from .env only (LANGFUSE_PUBLIC_KEY / LANGFUSE_SECRET_KEY / LANGFUSE_BASE_URL) — never printed.
import { Langfuse } from "langfuse";
import type { ChatMessage } from "./openrouter.js";

let _client: Langfuse | null | undefined; // undefined = undecided · null = disabled (keys missing)

function client(): Langfuse | null {
  if (_client !== undefined) return _client;
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  const baseUrl = process.env.LANGFUSE_BASE_URL;
  if (!publicKey || !secretKey) {
    console.error(
      "[seam] trace -> langfuse DISABLED (LANGFUSE_PUBLIC_KEY/SECRET_KEY missing) -> DEGRADED (runs untraced, visible)",
    );
    _client = null;
    return _client;
  }
  _client = new Langfuse({ publicKey, secretKey, ...(baseUrl ? { baseUrl } : {}) });
  return _client;
}

const TRUNC = 4000; // keep trace payloads sane; full text lives in the run record

export interface TraceGenerationParams {
  runId?: string;
  agentName: string;
  model: string;
  messages: ChatMessage[];
  output: string;
  promptTokens: number;
  completionTokens: number;
  costCents: number;
  startTime: Date;
  endTime: Date;
}

/** Fire-and-forget: queue one generation onto the run's trace. Never throws. */
export function traceGeneration(p: TraceGenerationParams): void {
  try {
    const lf = client();
    if (!lf) return;
    const traceId = p.runId ?? `untracked-${p.agentName}`;
    const trace = lf.trace({ id: traceId, name: "story-run" });
    trace.generation({
      name: p.agentName,
      model: p.model,
      startTime: p.startTime,
      endTime: p.endTime,
      input: p.messages.map((m) => ({ role: m.role, content: m.content.slice(0, TRUNC) })),
      output: p.output.slice(0, TRUNC),
      usage: { input: p.promptTokens, output: p.completionTokens },
      metadata: { costCents: p.costCents },
    });
    void lf
      .flushAsync()
      .then(() => {
        console.log(
          `[seam] trace -> langfuse generation {agent=${p.agentName}, model=${p.model}, trace=${traceId}} -> flushed -> ok`,
        );
      })
      .catch((err: unknown) => {
        console.error(
          `[seam] trace -> langfuse flush -> ${String(err).slice(0, 140)} -> DEGRADED (trace dropped, run unaffected)`,
        );
      });
  } catch (err) {
    console.error(
      `[seam] trace -> langfuse -> ${String(err).slice(0, 140)} -> DEGRADED (trace dropped, run unaffected)`,
    );
  }
}
