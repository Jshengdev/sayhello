// llm/openrouter.ts — the single OpenRouter gateway (PORT-AS-IS pattern from doubles src/llm/openrouter.ts,
// pared: no invocation-log DB, turnId -> leadId cost attribution).
//
// FAIL LOUD: missing OPENROUTER_API_KEY throws on first use; every call surfaces its error;
// EMPTY completion throws. No fallback completions, no silent stubs.
// COST: `usage: {include: true}` is sent on every request so OpenRouter returns usage.cost (USD);
// cents = ceil(usd * 100) — every paid call lands >= 1 cent in the run ledger (costCents > 0 guaranteed).
import OpenAI from "openai";
import { recordRunCost } from "./cost-ledger.js";

let _client: OpenAI | null = null;
function client(): OpenAI {
  if (_client) return _client;
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error("[openrouter] FATAL: OPENROUTER_API_KEY env var is required (read from .env)");
  }
  _client = new OpenAI({
    apiKey: key,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://github.com/johnnysheng/sayhello",
      "X-Title": "sayhello",
    },
  });
  return _client;
}

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export interface GenerateOptions {
  model: string;
  /** Omit for models that pin temperature (gpt-5.x reasoning family rejects non-default values). */
  temperature?: number;
  maxTokens?: number;
  provider?: { order: string[]; allow_fallbacks?: boolean };
  /** V2: OpenRouter reasoning control — the OpenUI renderer pins {enabled:false} (proven recipe). */
  reasoning?: { enabled: boolean };
  /** Seam-log + cost attribution name (drafter / critic / extractor). */
  agentName: string;
  /** leadId — every paid call tallies into the run's cost ledger. */
  runId?: string;
}

export interface GenerateResult {
  text: string;
  model: string;
  latencyMs: number;
  /** USD cents, rounded UP (>=1 per paid call). */
  costCents: number;
  promptTokens: number;
  completionTokens: number;
}

/** Single LLM call. Throws on any failure — the node boundary turns it into a visible FAILED event. */
export async function generate(messages: ChatMessage[], options: GenerateOptions): Promise<GenerateResult> {
  const t0 = Date.now();
  const response = await client().chat.completions.create({
    model: options.model,
    messages,
    ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
    max_tokens: options.maxTokens ?? 2000,
    ...(options.provider ? { provider: options.provider } : {}),
    ...(options.reasoning ? { reasoning: options.reasoning } : {}),
    // OpenRouter accounting field — returns usage.cost (USD) on the response.
    usage: { include: true },
    // Extra fields ride the request body; cast keeps the non-streaming overload.
  } as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming);

  const latencyMs = Date.now() - t0;
  const text = response.choices[0]?.message?.content ?? "";
  if (!text) {
    throw new Error(
      `[openrouter] EMPTY_COMPLETION: model=${options.model} agent=${options.agentName} ` +
        `finishReason=${response.choices[0]?.finish_reason ?? "unknown"} latency=${latencyMs}ms`,
    );
  }

  const promptTokens = response.usage?.prompt_tokens ?? 0;
  const completionTokens = response.usage?.completion_tokens ?? 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const costUsd = (response.usage as any)?.cost ?? 0;
  const costCents = Math.ceil(costUsd * 100);
  if (options.runId) recordRunCost(options.runId, costCents, options.agentName);

  console.log(
    `[seam] llm -> agent=${options.agentName} model=${options.model} -> ` +
      `{${promptTokens}pt,${completionTokens}ct,${costCents}c} -> ok (${latencyMs}ms)`,
  );
  return { text, model: options.model, latencyMs, costCents, promptTokens, completionTokens };
}

/**
 * Robust JSON extraction from an LLM completion: direct parse, then fenced-block strip,
 * then first-{...last-} slice. Throws (fail LOUD) when nothing parses.
 */
export function parseJsonLoose(raw: string, who: string): unknown {
  const text = raw.trim();
  try {
    return JSON.parse(text);
  } catch {
    /* fall through */
  }
  const unfenced = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(unfenced);
  } catch {
    /* fall through */
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      /* fall through */
    }
  }
  throw new Error(`[${who}] FATAL: failed to parse JSON from completion: ${text.slice(0, 200)}`);
}
