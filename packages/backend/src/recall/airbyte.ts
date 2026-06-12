// recall/airbyte.ts — the PRIMARY recall path: Airbyte Agent MCP `context_store_search`.
//
// Airbyte's Agent Engine exposes a streamable-HTTP MCP server at https://mcp.airbyte.ai/mcp. Once the
// Notion connector has synced the "sayhello stories" DB into the Context Store, an agent queries it
// via the `context_store_search` tool. This module is a minimal JSON-RPC client for that single tool
// — no MCP SDK dependency (keeps the add-on self-contained).
//
// Auth: the Airbyte MCP uses an OAuth bearer token. We read it from AIRBYTE_MCP_TOKEN (or
// AIRBYTE_API_KEY). If absent OR the call errors, this returns null — NOT a stub. The recall route
// then falls through to the Notion-direct query and the offline cache. The failure is logged loudly;
// it is never silently masked as a success.
//
// NOTE: the exact `context_store_search` argument schema is finalized by the live MCP `tools/list`
// handshake (Airbyte's tool schema isn't fully public). We send the documented shape and adapt to the
// returned result; if the tool name/args differ on your account, the loud log shows the server's error
// verbatim so you can adjust ARGS_BUILDERS below.

import { log } from "../logger.js";
import type { StoryRecord } from "./storyRecord.js";

const MCP_URL = process.env.AIRBYTE_MCP_URL ?? "https://mcp.airbyte.ai/mcp";
const TOOL_NAME = process.env.AIRBYTE_SEARCH_TOOL ?? "context_store_search";

export function airbyteConfigured(): boolean {
  return Boolean(process.env.AIRBYTE_MCP_TOKEN || process.env.AIRBYTE_API_KEY);
}

function token(): string | null {
  return process.env.AIRBYTE_MCP_TOKEN ?? process.env.AIRBYTE_API_KEY ?? null;
}

interface JsonRpcResult {
  jsonrpc: "2.0";
  id: number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

let rpcId = 1;

/** One JSON-RPC call over the streamable-HTTP MCP transport. */
async function mcpCall(method: string, params: unknown, sessionId?: string): Promise<{ body: JsonRpcResult; sessionId: string | null }> {
  const bearer = token();
  if (!bearer) throw new Error("[airbyte] no AIRBYTE_MCP_TOKEN / AIRBYTE_API_KEY");
  const resp = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      Authorization: `Bearer ${bearer}`,
      ...(sessionId ? { "Mcp-Session-Id": sessionId } : {}),
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: rpcId++, method, params }),
  });
  const returnedSession = resp.headers.get("Mcp-Session-Id") ?? sessionId ?? null;
  const text = await resp.text();
  // streamable-HTTP may answer as SSE ("data: {…}") or plain JSON.
  const jsonPart = text.includes("data:")
    ? text
        .split("\n")
        .filter((l) => l.startsWith("data:"))
        .map((l) => l.slice(5).trim())
        .filter(Boolean)
        .pop() ?? "{}"
    : text || "{}";
  let body: JsonRpcResult;
  try {
    body = JSON.parse(jsonPart) as JsonRpcResult;
  } catch {
    throw new Error(`[airbyte] non-JSON MCP response (${resp.status}): ${text.slice(0, 200)}`);
  }
  if (!resp.ok) throw new Error(`[airbyte] MCP ${method} -> ${resp.status}: ${text.slice(0, 200)}`);
  return { body, sessionId: returnedSession };
}

/** Coerce the MCP tool result (content blocks / structured) into StoryRecord-ish rows. */
function parseToolResult(result: unknown, q: string): StoryRecord[] {
  // MCP tool results are { content: [{type:"text", text:"…"}], structuredContent?: {...} }.
  const r = result as { content?: { type: string; text?: string }[]; structuredContent?: unknown };
  let payload: unknown = r?.structuredContent ?? null;
  if (!payload && Array.isArray(r?.content)) {
    const textBlock = r!.content!.find((c) => c.type === "text" && c.text);
    if (textBlock?.text) {
      try {
        payload = JSON.parse(textBlock.text);
      } catch {
        // not JSON — wrap the raw text as a single record so the panel still shows the hit.
        return [rawRow(textBlock.text, q)];
      }
    }
  }
  const rows = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object" && Array.isArray((payload as { results?: unknown[] }).results)
      ? (payload as { results: unknown[] }).results
      : [];
  return rows.map((row) => normalizeAirbyteRow(row as Record<string, unknown>, q));
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/** Airbyte returns Notion-page-shaped rows; map common property names back to StoryRecord. */
function normalizeAirbyteRow(row: Record<string, unknown>, q: string): StoryRecord {
  const props = (row.properties as Record<string, unknown>) ?? row;
  const get = (k: string): string | null => {
    const v = props[k] ?? props[k.toLowerCase()] ?? row[k];
    if (typeof v === "string") return v;
    if (v && typeof v === "object" && "value" in (v as object)) return str((v as { value: unknown }).value);
    return null;
  };
  return {
    id: get("Record Id") ?? get("id") ?? "airbyte",
    lead: get("Lead") ?? get("Name") ?? get("title") ?? "(untitled)",
    person: get("Person"),
    industry: (get("Industry") as StoryRecord["industry"]) ?? "unknown",
    category: get("Category"),
    pains: (get("Pains") ?? "").split("\n").map((s) => s.replace(/^[•\d.\s]+/, "").trim()).filter(Boolean),
    angle: get("Angle"),
    groundingScore: Number.isFinite(Number(get("Grounding Score"))) ? Number(get("Grounding Score")) : null,
    verdict: get("Verdict"),
    keyFact: get("Key Fact") ?? get("Lead") ?? q,
    groundedClaims: (get("Grounded Claims") ?? "").split("\n").map((s) => s.replace(/^[\d.\s]+/, "").trim()).filter(Boolean),
    fabricatedClaims: (get("Fabricated Claims") ?? "").split("\n").map((s) => s.replace(/^[\d.\s]+/, "").trim()).filter(Boolean),
    source: "airbyte-context-store",
    sourceFile: "airbyte://context-store",
    notionUrl: get("url") ?? get("URL") ?? null,
  };
}

function rawRow(text: string, q: string): StoryRecord {
  return {
    id: "airbyte-raw",
    lead: "Airbyte Context Store hit",
    person: null,
    industry: "unknown",
    category: null,
    pains: [],
    angle: null,
    groundingScore: null,
    verdict: null,
    keyFact: text.slice(0, 240),
    groundedClaims: [text.slice(0, 1000)],
    fabricatedClaims: [],
    source: "airbyte-context-store",
    sourceFile: "airbyte://context-store",
    notionUrl: null,
  };
}

/**
 * Query the Airbyte Context Store via MCP. Returns StoryRecord[] on success, or null if Airbyte is
 * unconfigured / unreachable / the tool errors (caller falls back to Notion + cache). NEVER throws to
 * the route — a recall must still answer from the fallback paths.
 */
export async function airbyteSearch(q: string, limit = 25): Promise<StoryRecord[] | null> {
  if (!airbyteConfigured()) {
    log.warn("recall.airbyte.skip", { reason: "no AIRBYTE_MCP_TOKEN / AIRBYTE_API_KEY — falling back to Notion/cache" });
    return null;
  }
  try {
    // 1) initialize handshake (gets a session id).
    const init = await mcpCall("initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "sayhello-recall", version: "0.1.0" },
    });
    const session = init.sessionId ?? undefined;

    // 2) call the search tool. Send a permissive arg set; the server ignores unknown args.
    const call = await mcpCall(
      "tools/call",
      { name: TOOL_NAME, arguments: { query: q, q, limit, top_k: limit } },
      session,
    );
    if (call.body.error) {
      log.error("recall.airbyte.tool_error", new Error(call.body.error.message), {
        tool: TOOL_NAME,
        code: call.body.error.code,
      });
      return null;
    }
    const rows = parseToolResult(call.body.result, q).slice(0, limit);
    log.info("recall.airbyte.ok", { tool: TOOL_NAME, q, rows: rows.length });
    return rows;
  } catch (err) {
    log.error("recall.airbyte.failed", err, { q, tool: TOOL_NAME });
    return null;
  }
}
