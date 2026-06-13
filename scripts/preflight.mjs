#!/usr/bin/env node
// preflight.mjs — sayhello seam preflight. ZERO dependencies (global fetch + node builtins).
//
// Probes EVERY pipeline seam LIVE with a real data-returning call. Never prints a secret
// value — evidence is key NAMES, status codes, lengths, counts, latencies only.
//
// Usage:
//   node scripts/preflight.mjs          # everything cheap (incl. openrouter/firecrawl — pennies, real data)
//   node scripts/preflight.mjs --deep   # + slow guild chat gate test + local port checks
//
// Exit code = number of FAILs (0 = all green).

import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { connect as netConnect } from "node:net";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEEP = process.argv.includes("--deep");
const DEFAULT_TIMEOUT_MS = 10_000;
const OPENROUTER_TIMEOUT_MS = 20_000; // LLM round-trip headroom; still one tiny max_tokens:10 call
const GUILD_CHAT_TIMEOUT_MS = 25_000; // proven 5-20s

// ---------------------------------------------------------------- .env (manual parser — NOT shell-sourceable: values contain &)
function loadEnv() {
  let raw;
  try {
    raw = readFileSync(path.join(ROOT, ".env"), "utf8");
  } catch {
    return { loaded: false, keys: [] };
  }
  const keys = [];
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let [, key, val] = m;
    val = val.trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
    keys.push(key);
  }
  return { loaded: true, keys };
}
const envFile = loadEnv();
const env = process.env;

// ---------------------------------------------------------------- helpers
async function timedFetch(url, opts = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const t0 = Date.now();
  try {
    const resp = await fetch(url, { ...opts, signal: ctrl.signal });
    const text = await resp.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* non-JSON body is fine */ }
    return { status: resp.status, json, text, ms: Date.now() - t0 };
  } finally {
    clearTimeout(timer);
  }
}

function execFileP(cmd, args, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    execFile(
      cmd,
      args,
      { timeout: timeoutMs, stdio: ["ignore", "pipe", "pipe"], maxBuffer: 4 * 1024 * 1024 },
      (err, stdout, stderr) => {
        resolve({ err, stdout: String(stdout ?? ""), stderr: String(stderr ?? ""), ms: Date.now() - t0 });
      },
    );
  });
}

/** Largest array of objects anywhere in a nested response (Composio responses vary by action). */
function largestArray(result) {
  if (!result || typeof result !== "object") return [];
  const stack = [result];
  let best = [];
  let depth = 0;
  while (stack.length > 0 && depth < 1000) {
    depth++;
    const node = stack.pop();
    if (Array.isArray(node)) {
      if (node.length > best.length) best = node;
      continue;
    }
    if (node && typeof node === "object") {
      for (const v of Object.values(node)) if (v && typeof v === "object") stack.push(v);
    }
  }
  return best;
}

const ok = (evidence) => ({ status: "OK", evidence, fix: "" });
const fail = (evidence, fix) => ({ status: "FAIL", evidence, fix });
const skip = (evidence) => ({ status: "SKIP", evidence, fix: "" });
const trunc = (s, n = 90) => {
  const one = String(s ?? "").replace(/\s+/g, " ").trim();
  return one.length > n ? one.slice(0, n) + "…" : one;
};

// ---------------------------------------------------------------- checks
const REQUIRED_KEYS = [
  "OPENROUTER_API_KEY", "FIRECRAWL_API_KEY", "COMPOSIO_API_KEY",
  "CLICKHOUSE_URL", "CLICKHOUSE_USER", "CLICKHOUSE_PASSWORD",
  "LANGFUSE_PUBLIC_KEY", "LANGFUSE_SECRET_KEY", "LANGFUSE_BASE_URL",
  "RENDER_API_KEY", "DATABASE_URL",
];
const OPTIONAL_KEYS = ["THESYS_API_KEY", "AIRBYTE_CLIENT_ID", "AIRBYTE_CLIENT_SECRET"];

function checkEnv() {
  if (!envFile.loaded) return fail(".env not readable at repo root", `create ${path.join(ROOT, ".env")} (copy from ~/code/doubles/.env)`);
  const missing = REQUIRED_KEYS.filter((k) => !env[k]);
  const optNotes = OPTIONAL_KEYS.map((k) => {
    const present = Boolean(env[k]);
    if (k === "THESYS_API_KEY") return `${k} ${present ? "present" : "absent (optional — keyless OpenUI proven)"}`;
    return `${k} ${present ? "present" : "absent (optional)"}`;
  });
  if (missing.length > 0) return fail(`missing required: ${missing.join(", ")}`, `missing: ${missing.join(", ")}`);
  return ok(`${REQUIRED_KEYS.length}/${REQUIRED_KEYS.length} required present; ${optNotes.join("; ")}; GUILD auth via CLI (~/.guild), not env`);
}

async function openrouterCheck(model, extraBody = {}) {
  if (!env.OPENROUTER_API_KEY) return fail("no key", "missing: OPENROUTER_API_KEY");
  const r = await timedFetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: "say ok" }],
      max_tokens: 10,
      usage: { include: true },
      ...extraBody,
    }),
  }, OPENROUTER_TIMEOUT_MS);
  if (r.status !== 200) {
    return fail(`HTTP ${r.status} ${trunc(r.json?.error?.message ?? r.text, 70)}`, `check OPENROUTER_API_KEY / model id ${model}`);
  }
  const echoed = r.json?.model ?? "?";
  const text = r.json?.choices?.[0]?.message?.content ?? "";
  const cost = r.json?.usage?.cost;
  return ok(`200 model=${echoed} text="${trunc(text, 24)}"${cost != null ? ` cost=$${Number(cost).toFixed(6)}` : ""} ${r.ms}ms`);
}

async function checkJudge() {
  const drafterFamily = "anthropic", judgeFamily = "qwen";
  const r = await openrouterCheck("qwen/qwen3-235b-a22b-2507");
  if (r.status !== "OK") return r;
  if (drafterFamily === judgeFamily) return fail("judge family == drafter family", "pick a held-out judge model family");
  return ok(`${r.evidence} · held-out: family ${judgeFamily} != drafter ${drafterFamily}`);
}

async function checkFirecrawl() {
  if (!env.FIRECRAWL_API_KEY) return fail("no key", "missing: FIRECRAWL_API_KEY");
  const r = await timedFetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url: "https://example.com", formats: ["markdown"] }),
  }, 15_000);
  if (r.status !== 200) return fail(`HTTP ${r.status} ${trunc(r.json?.error ?? r.text, 70)}`, "check FIRECRAWL_API_KEY / credits");
  const mdLen = r.json?.data?.markdown?.length ?? 0;
  if (mdLen === 0) return fail(`200 but markdown empty`, "inspect firecrawl response shape (data.markdown)");
  return ok(`200 markdown.length=${mdLen} (real scrape of example.com, 1 credit) ${r.ms}ms`);
}

async function checkComposio() {
  if (!env.COMPOSIO_API_KEY) return fail("no key", "missing: COMPOSIO_API_KEY");
  // doubles v3 REST pattern: POST /api/v3/tools/execute/{ACTION}, x-api-key header,
  // body {user_id, arguments} — userId required even for NO_AUTH slugs.
  // Exact slug verified live via GET /api/v3/tools?toolkit_slug=composio_search:
  // COMPOSIO_SEARCH_NEWS_SEARCH (the bare COMPOSIO_SEARCH_NEWS returns 404 Tool_ToolNotFound).
  const r = await timedFetch("https://backend.composio.dev/api/v3/tools/execute/COMPOSIO_SEARCH_NEWS_SEARCH", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": env.COMPOSIO_API_KEY },
    body: JSON.stringify({ user_id: "preflight", arguments: { query: "Anthropic" } }),
  }, 15_000);
  if (r.status !== 200) {
    return fail(
      `HTTP ${r.status} slug=${r.json?.error?.slug ?? "?"} ${trunc(r.json?.error?.message ?? r.text, 60)}`,
      "see ~/code/doubles/src/composio/v3-execute.ts for the exact REST shape",
    );
  }
  if (r.json?.error) return fail(`200 but error: ${trunc(JSON.stringify(r.json.error), 70)}`, "check COMPOSIO_SEARCH_NEWS arguments shape");
  const results = largestArray(r.json?.data);
  if (results.length === 0) return fail("200 but 0 results for 'Anthropic'", "inspect response: data payload had no result array");
  return ok(`200 results=${results.length} for "Anthropic" (NO_AUTH COMPOSIO_SEARCH_NEWS_SEARCH) ${r.ms}ms`);
}

async function checkClickhousePlayground() {
  const q = "SELECT count() AS c FROM github.github_events WHERE repo_name = 'anthropics/anthropic-sdk-typescript' AND event_type = 'WatchEvent' FORMAT JSON";
  const r = await timedFetch("https://sql-clickhouse.clickhouse.com/?user=demo", { method: "POST", body: q }, 15_000);
  if (r.status !== 200) return fail(`HTTP ${r.status} ${trunc(r.text, 70)}`, "playground https://sql-clickhouse.clickhouse.com/?user=demo unreachable");
  const count = r.json?.data?.[0]?.c;
  const elapsed = r.json?.statistics?.elapsed;
  if (count == null) return fail("200 but no data row", "inspect playground response shape");
  return ok(`200 WatchEvents(anthropics/anthropic-sdk-typescript)=${count} elapsed=${elapsed}s ${r.ms}ms — grounding source live`);
}

async function checkClickhouseCloud() {
  if (!env.CLICKHOUSE_URL || !env.CLICKHOUSE_USER || !env.CLICKHOUSE_PASSWORD) {
    const missing = ["CLICKHOUSE_URL", "CLICKHOUSE_USER", "CLICKHOUSE_PASSWORD"].filter((k) => !env[k]);
    return fail("no creds", `missing: ${missing.join(", ")}`);
  }
  const r = await timedFetch(env.CLICKHOUSE_URL, {
    method: "POST",
    headers: { "X-ClickHouse-User": env.CLICKHOUSE_USER, "X-ClickHouse-Key": env.CLICKHOUSE_PASSWORD },
    body: "SELECT count() AS c FROM story_runs FORMAT JSON",
  });
  if (r.status !== 200) {
    return fail(`HTTP ${r.status} ${trunc(r.text, 70)}`, "run docs/VALIDATION.md §clickhouse to recreate table");
  }
  const count = r.json?.data?.[0]?.c;
  if (count == null) return fail("200 but no count row", "run docs/VALIDATION.md §clickhouse to recreate table");
  return ok(`200 story_runs rows=${count} ${r.ms}ms`);
}

async function checkLangfuse() {
  if (!env.LANGFUSE_PUBLIC_KEY || !env.LANGFUSE_SECRET_KEY || !env.LANGFUSE_BASE_URL) {
    const missing = ["LANGFUSE_PUBLIC_KEY", "LANGFUSE_SECRET_KEY", "LANGFUSE_BASE_URL"].filter((k) => !env[k]);
    return fail("no creds", `missing: ${missing.join(", ")}`);
  }
  const auth = Buffer.from(`${env.LANGFUSE_PUBLIC_KEY}:${env.LANGFUSE_SECRET_KEY}`).toString("base64");
  const base = env.LANGFUSE_BASE_URL.replace(/\/+$/, "");
  const r = await timedFetch(`${base}/api/public/projects`, { headers: { Authorization: `Basic ${auth}` } });
  if (r.status !== 200) return fail(`HTTP ${r.status} ${trunc(r.text, 70)}`, "check LANGFUSE_PUBLIC_KEY/SECRET_KEY/BASE_URL");
  const n = Array.isArray(r.json?.data) ? r.json.data.length : 0;
  return ok(`200 projects=${n} (${base.replace(/^https?:\/\//, "")}) ${r.ms}ms`);
}

async function checkRender() {
  if (!env.RENDER_API_KEY) return fail("no key", "missing: RENDER_API_KEY");
  const r = await timedFetch("https://api.render.com/v1/services?limit=20", {
    headers: { Authorization: `Bearer ${env.RENDER_API_KEY}`, Accept: "application/json" },
  });
  if (r.status !== 200) return fail(`HTTP ${r.status} ${trunc(r.text, 70)}`, "check RENDER_API_KEY (Account Settings → API Keys)");
  const n = Array.isArray(r.json) ? r.json.length : 0;
  return ok(`200 services=${n}${n === 0 ? " (0 is OK pre-deploy)" : ""} ${r.ms}ms`);
}

async function checkNeon() {
  if (!env.DATABASE_URL) return fail("no url", "missing: DATABASE_URL");
  let host, port;
  try {
    const u = new URL(env.DATABASE_URL);
    host = u.hostname;
    port = Number(u.port) || 5432;
  } catch {
    return fail("DATABASE_URL not URL-parseable", "fix DATABASE_URL format (postgresql://…)");
  }
  const hostLabel = "…" + host.split(".").slice(-2).join("."); // never print the full endpoint id
  // Prefer a real SELECT 1 if pg resolves from packages/backend.
  try {
    const req = createRequire(path.join(ROOT, "packages/backend/package.json"));
    const pgPath = req.resolve("pg");
    const { default: pg } = await import(pgPath);
    const client = new pg.Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: DEFAULT_TIMEOUT_MS });
    const t0 = Date.now();
    await client.connect();
    const res = await client.query("SELECT 1 AS one");
    await client.end();
    return ok(`SELECT 1 → ${res.rows?.[0]?.one} on ${hostLabel}:${port} ${Date.now() - t0}ms`);
  } catch (e) {
    if (!/Cannot find|MODULE_NOT_FOUND/i.test(String(e?.message ?? e))) {
      // pg resolved but query failed — that IS a finding.
      return fail(`pg SELECT 1 failed: ${trunc(e?.message ?? e, 70)}`, "check DATABASE_URL / Neon project status");
    }
  }
  // Fallback: TCP reach test.
  const reach = await new Promise((resolve) => {
    const sock = netConnect({ host, port });
    const timer = setTimeout(() => { sock.destroy(); resolve({ ok: false, why: "timeout" }); }, DEFAULT_TIMEOUT_MS);
    const t0 = Date.now();
    sock.on("connect", () => { clearTimeout(timer); sock.destroy(); resolve({ ok: true, ms: Date.now() - t0 }); });
    sock.on("error", (err) => { clearTimeout(timer); resolve({ ok: false, why: err.code ?? err.message }); });
  });
  if (!reach.ok) return fail(`TCP ${hostLabel}:${port} unreachable (${reach.why})`, "check DATABASE_URL host / network");
  return ok(`TCP reachable ${hostLabel}:${port} ${reach.ms}ms (pg not installed in packages/backend — SELECT 1 skipped; install pg in backend to enable)`);
}

async function checkGuild() {
  const auth = await execFileP("guild", ["auth", "status"], { timeoutMs: DEFAULT_TIMEOUT_MS });
  if (auth.err) {
    const why = auth.err.code === "ENOENT" ? "guild CLI not on PATH" : trunc(auth.stderr || auth.err.message, 60);
    return fail(why, "brew install guild CLI then `guild auth login`");
  }
  const statusLine = trunc(auth.stdout.split("\n").find((l) => l.trim()) ?? "authed", 70);
  if (!DEEP) return ok(`auth: ${statusLine} (gate BLOCK test gated behind --deep — 5-20s guild chat)`);

  // --deep: published-gate BLOCK test. StoryScore with fabricatedClaims non-empty → expect verdict BLOCK.
  const payload = JSON.stringify({
    grounding: 0.42, completeness: 0.8, narrative_arc: 0.7, feasibility: 0.75,
    competitive_diff: 0.6, metric_confidence: 0.5, verdict: "regen",
    failReason: "ungrounded funding claim",
    fabricatedClaims: ["raised a $40M Series B"],
  });
  const chat = await execFileP(
    "guild",
    ["chat", "--agent", "jshengdev~sayhello-gatekeeper", "--once", "--no-splash", payload],
    { timeoutMs: GUILD_CHAT_TIMEOUT_MS },
  );
  if (chat.err) {
    return fail(`guild chat failed in ${chat.ms}ms: ${trunc(chat.stderr || chat.err.message, 60)}`, "verify agent: guild workspace agent add jshengdev~sayhello-gatekeeper");
  }
  // Reply arrives with a session-context preamble — extract the verdict JSON.
  let verdictJson = null;
  const idx = chat.stdout.lastIndexOf('{"verdict"');
  if (idx >= 0) {
    const candidate = chat.stdout.slice(idx, chat.stdout.indexOf("}", idx) + 1);
    try { verdictJson = JSON.parse(candidate); } catch { /* fall through */ }
  }
  if (!verdictJson) {
    const first = chat.stdout.indexOf("{"), last = chat.stdout.lastIndexOf("}");
    if (first >= 0 && last > first) {
      try { verdictJson = JSON.parse(chat.stdout.slice(first, last + 1)); } catch { /* unparseable */ }
    }
  }
  if (!verdictJson?.verdict) return fail(`gate replied but no verdict JSON in stdout (${chat.ms}ms)`, "capture raw stdout — agent prompt must emit raw JSON only");
  if (verdictJson.verdict !== "BLOCK") return fail(`expected BLOCK on fabricated claim, got ${verdictJson.verdict} (${chat.ms}ms)`, "gate prompt drift — re-test agent v1.0.5");
  return ok(`auth: ${statusLine} · gate verdict=${verdictJson.verdict} reason="${trunc(verdictJson.reason, 48)}" ${chat.ms}ms`);
}

async function checkLocalPort(name, url) {
  if (!DEEP) return skip("local port check gated behind --deep");
  try {
    const r = await timedFetch(url, {}, 3_000);
    return ok(`HTTP ${r.status} at ${url} ${r.ms}ms`);
  } catch (e) {
    const code = e?.cause?.code ?? e?.code ?? e?.name;
    if (code === "ECONNREFUSED" || /ECONNREFUSED/.test(String(e?.cause ?? e))) {
      return skip(`not running — pnpm dev (connection refused at ${url}; NOT a wiring failure)`);
    }
    return skip(`unreachable (${trunc(code ?? e, 30)}) at ${url} — pnpm dev to start`);
  }
}

// ---------------------------------------------------------------- run
async function runCheck(name, fn) {
  try {
    const res = await fn();
    return { name, ...res };
  } catch (e) {
    const why = e?.name === "AbortError" ? "timeout" : trunc(e?.message ?? e, 70);
    return { name, status: "FAIL", evidence: why, fix: `unexpected error in ${name} — rerun / inspect` };
  }
}

const CHECKS = [
  ["env", checkEnv],
  ["openrouter-drafter", () => openrouterCheck("anthropic/claude-sonnet-4.6")],
  ["openrouter-judge", checkJudge],
  ["openrouter-renderer", () => openrouterCheck("google/gemini-2.5-flash", { reasoning: { enabled: false } })],
  ["firecrawl", checkFirecrawl],
  ["composio", checkComposio],
  ["clickhouse-playground", checkClickhousePlayground],
  ["clickhouse-cloud", checkClickhouseCloud],
  ["langfuse", checkLangfuse],
  ["render", checkRender],
  ["neon", checkNeon],
  ["guild", checkGuild],
  ["backend:8787", () => checkLocalPort("backend", "http://127.0.0.1:8787/health")],
  ["frontend:3100", () => checkLocalPort("frontend", "http://127.0.0.1:3100/")],
];

const t0 = Date.now();
console.log(`[preflight] sayhello seam preflight ${DEEP ? "(--deep: + guild chat gate + local ports)" : "(default: all live seams; guild chat + local ports need --deep)"} · ${new Date().toISOString()}`);

const results = await Promise.all(CHECKS.map(([name, fn]) => runCheck(name, fn)));

for (const r of results) {
  const line = r.status === "OK" ? `OK ${r.evidence}`
    : r.status === "SKIP" ? `SKIP -> ${r.evidence}`
    : `FAIL -> ${r.fix.startsWith("missing:") ? r.fix : r.evidence + (r.fix ? ` · fix: ${r.fix}` : "")}`;
  console.log(`[preflight] ${r.name} — ${line}`);
}

// summary table
const pad = (s, n) => String(s).padEnd(n);
const w = { seam: 22, status: 6, evidence: 88 };
console.log("\nSUMMARY");
console.log(`${pad("seam", w.seam)} | ${pad("status", w.status)} | ${pad("evidence", w.evidence)} | fix`);
console.log(`${"-".repeat(w.seam)}-|-${"-".repeat(w.status)}-|-${"-".repeat(w.evidence)}-|----`);
for (const r of results) {
  console.log(`${pad(r.name, w.seam)} | ${pad(r.status, w.status)} | ${pad(trunc(r.evidence, w.evidence), w.evidence)} | ${r.fix || "—"}`);
}

const fails = results.filter((r) => r.status === "FAIL").length;
const oks = results.filter((r) => r.status === "OK").length;
const skips = results.filter((r) => r.status === "SKIP").length;
console.log(`\n[preflight] ${oks} OK · ${fails} FAIL · ${skips} SKIP · ${Date.now() - t0}ms total · exit ${fails}`);
process.exit(fails);
