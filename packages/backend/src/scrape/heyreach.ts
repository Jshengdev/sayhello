import { log } from "../logger.js";

const HEYREACH_MCP_URL = "https://mcp.heyreach.io/mcp";
const REQUEST_TIMEOUT_MS = 30_000;

const HEYREACH_MCP_KEY = process.env.HEYREACH_MCP_KEY ?? "";
const HEYREACH_ACCOUNT_ID = parseInt(process.env.HEYREACH_ACCOUNT_ID ?? "", 10);

export interface HeyReachLead {
  profileUrl: string;
  firstName?: string;
  lastName?: string;
  headline?: string;
  about?: string;
  location?: string;
  currentCompany?: string;
  currentTitle?: string;
  experience?: Array<{ company: string; title: string; startDate?: string; endDate?: string }>;
  education?: Array<{ school: string; degree?: string; startYear?: number; endYear?: number }>;
  connectionsCount?: number;
  raw: unknown;
}

export interface HeyReachNetworkConnection {
  profileUrl: string;
  firstName?: string;
  lastName?: string;
  headline?: string;
}

async function callMcp(toolName: string, args: object): Promise<unknown> {
  const url = `${HEYREACH_MCP_URL}?xMcpKey=${HEYREACH_MCP_KEY}`;

  log.info("heyreach_call_start", { tool: toolName, hasArgs: !!args });

  const startMs = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let responseText: string;
  try {
    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        // The Accept header is required — HeyReach's MCP server returns HTTP 406 without
        // `text/event-stream` in Accept. Learned from live-mcp.sh when curl got 406 silently.
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          params: { name: toolName, arguments: args },
          id: 1,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const bodySnippet = (await response.text()).slice(0, 500);
      throw new Error(
        `[heyreach] non-200 response: POST ${HEYREACH_MCP_URL} tool=${toolName} → ${response.status} ${response.statusText}. body=${bodySnippet}`,
      );
    }

    responseText = await response.text();
  } catch (err) {
    const latencyMs = Date.now() - startMs;
    log.error("heyreach_call_failed", err, { tool: toolName, latencyMs });
    throw err;
  }

  // Response is an SSE stream. Each data line carries one JSON-RPC event.
  // We walk content[*].text and return the first successfully JSON-parsed payload.
  const dataLines = responseText
    .split("\n")
    .filter((line) => line.startsWith("data: "))
    .map((line) => line.slice("data: ".length).trim())
    .filter(Boolean);

  if (dataLines.length === 0) {
    const latencyMs = Date.now() - startMs;
    log.error("heyreach_call_failed", new Error("no data lines in SSE response"), { tool: toolName, latencyMs });
    throw new Error(`[heyreach] tool=${toolName}: SSE response contained no data lines. raw=${responseText.slice(0, 500)}`);
  }

  for (const line of dataLines) {
    let envelope: unknown;
    try {
      envelope = JSON.parse(line);
    } catch {
      continue;
    }

    const env = envelope as Record<string, unknown>;
    if (!env.result) continue;

    const result = env.result as Record<string, unknown>;
    const content = result.content;
    if (!Array.isArray(content) || content.length === 0) {
      throw new Error(`[heyreach] tool=${toolName}: result.content missing or empty`);
    }

    for (const item of content as Array<Record<string, unknown>>) {
      const text = item.text;
      if (typeof text !== "string") continue;
      try {
        const parsed = JSON.parse(text);
        const latencyMs = Date.now() - startMs;
        log.info("heyreach_call_complete", { tool: toolName, latencyMs, hasResult: true });
        return parsed;
      } catch {
        // text wasn't JSON — keep scanning
        continue;
      }
    }
  }

  const latencyMs = Date.now() - startMs;
  log.error("heyreach_call_failed", new Error("no parseable content in SSE data lines"), { tool: toolName, latencyMs });
  throw new Error(`[heyreach] tool=${toolName}: no parseable JSON content found in response`);
}

export async function getLead(profileUrl: string): Promise<HeyReachLead> {
  if (!HEYREACH_MCP_KEY) {
    throw new Error("[heyreach] HEYREACH_MCP_KEY is not set — add it to .env before calling getLead()");
  }

  const raw = await callMcp("get_lead", { profileUrl });
  const r = raw as Record<string, unknown>;

  const experience = Array.isArray(r.experience)
    ? (r.experience as Array<Record<string, unknown>>).map((e) => ({
        company: String(e.company ?? e.companyName ?? ""),
        title: String(e.title ?? e.position ?? ""),
        startDate: typeof e.startDate === "string" ? e.startDate : undefined,
        endDate: typeof e.endDate === "string" ? e.endDate : undefined,
      }))
    : undefined;

  const education = Array.isArray(r.education)
    ? (r.education as Array<Record<string, unknown>>).map((e) => ({
        school: String(e.school ?? e.schoolName ?? ""),
        degree: typeof e.degree === "string" ? e.degree : undefined,
        startYear: typeof e.startYear === "number" ? e.startYear : undefined,
        endYear: typeof e.endYear === "number" ? e.endYear : undefined,
      }))
    : undefined;

  return {
    profileUrl: typeof r.profileUrl === "string" ? r.profileUrl : profileUrl,
    firstName: typeof r.firstName === "string" ? r.firstName : undefined,
    lastName: typeof r.lastName === "string" ? r.lastName : undefined,
    headline: typeof r.headline === "string" ? r.headline : undefined,
    about: typeof r.about === "string" ? r.about : (typeof r.summary === "string" ? r.summary : undefined),
    location: typeof r.location === "string" ? r.location : undefined,
    currentCompany: typeof r.currentCompany === "string" ? r.currentCompany : undefined,
    currentTitle: typeof r.currentTitle === "string" ? r.currentTitle : undefined,
    experience,
    education,
    connectionsCount: typeof r.connectionsCount === "number" ? r.connectionsCount : undefined,
    raw,
  };
}

export async function getNetwork(
  opts: { pageNumber?: number; pageSize?: number } = {},
): Promise<HeyReachNetworkConnection[]> {
  if (!HEYREACH_MCP_KEY) {
    throw new Error("[heyreach] HEYREACH_MCP_KEY is not set — add it to .env before calling getNetwork()");
  }
  if (isNaN(HEYREACH_ACCOUNT_ID)) {
    throw new Error("[heyreach] HEYREACH_ACCOUNT_ID is not set or not a number — add it to .env before calling getNetwork()");
  }

  const raw = await callMcp("get_my_network_for_sender", {
    senderId: HEYREACH_ACCOUNT_ID,
    pageNumber: opts.pageNumber ?? 0,
    pageSize: opts.pageSize ?? 100,
  });

  const items: Array<Record<string, unknown>> = Array.isArray(raw)
    ? (raw as Array<Record<string, unknown>>)
    : Array.isArray((raw as Record<string, unknown>).items)
      ? ((raw as Record<string, unknown>).items as Array<Record<string, unknown>>)
      : [];

  return items.map((item) => ({
    profileUrl: typeof item.profileUrl === "string" ? item.profileUrl : "",
    firstName: typeof item.firstName === "string" ? item.firstName : undefined,
    lastName: typeof item.lastName === "string" ? item.lastName : undefined,
    headline: typeof item.headline === "string" ? item.headline : undefined,
  }));
}
