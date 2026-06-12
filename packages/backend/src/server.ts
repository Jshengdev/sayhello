// server.ts — Express + ws on :8787 (deterministic, docs/CONTRACTS.md API).
//   POST /story/run {industry, handle} -> {leadId}   (RunInput-validated; bad input -> 400 + reason)
//   GET  /story/:leadId                -> StoryRun    (rehydrate on refresh)
//   POST /story/:leadId/approve        -> resolves the human gate
//   GET  /health · WS /ws              -> WsEvent stream broadcast to all clients
// Seam 1 (run received -> validated -> leadId issued) and seam 4 (every WsEvent emitted) logged here.
// .env lives at the REPO ROOT (copied from doubles) — `pnpm --filter backend dev` runs with
// cwd packages/backend, so bare "dotenv/config" finds nothing. Resolve the root path explicitly.
// dotenv parses line-by-line (the file is NOT shell-sourceable — values contain raw `&`).
import dotenv from "dotenv";
import { randomUUID } from "node:crypto";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../.env") });
import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import { assertHeldOutCritic } from "./llm/models.js";
import { hasReplay, replayStory } from "./orchestrator/replay.js";
import { approveGate, runStory } from "./orchestrator/runStory.js";
import { zRunInput } from "./schemas.js";
import { store } from "./store/memory.js";
import type { WsEvent } from "./types.js";

const PORT = 8787;

// ── boot env readiness (docs/VALIDATION.md gap #1) — presence ONLY, never values ──────────
const BOOT_KEYS = [
  "OPENROUTER_API_KEY", "FIRECRAWL_API_KEY", "COMPOSIO_API_KEY",
  "CLICKHOUSE_URL", "CLICKHOUSE_USER", "CLICKHOUSE_PASSWORD",
  "LANGFUSE_PUBLIC_KEY", "LANGFUSE_SECRET_KEY", "LANGFUSE_BASE_URL", "RENDER_API_KEY",
  // person-scrape seams (docs/PERSON-SCRAPE-PORT.md)
  "HEYREACH_MCP_KEY", "X_BEARER_TOKEN", "SIXTYFOUR_API_KEY", "TINYFISH_API_KEY",
];
function envReadiness(): void {
  for (const key of BOOT_KEYS) {
    if (process.env[key]) {
      console.log(`[seam] env -> ${key} -> SET -> ok`);
    } else {
      console.error(`[seam] env -> ${key} -> MISSING -> FAIL (live path using it will refuse; STUB_MODE=1 unaffected)`);
    }
  }
}

const app = express();

// CORS — the dashboard (:3100) fetches the harness (:8787) cross-origin. Hand-rolled
// (no dep): allow-all origin, Content-Type header, preflight answered with 204.
// Without this the browser blocks POST /story/run and POST /story/:id/approve
// (S1 validator finding, docs/OPEN-QUESTIONS.md — demo-path blocker).
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    console.log(`[seam] cors preflight -> ${req.path} -> 204 + Access-Control-Allow-Origin -> ok`);
    res.status(204).end();
    return;
  }
  next();
});

app.use(express.json());

const server = http.createServer(app);

// ── WS /ws — the WsEvent stream ───────────────────────────────────────────────
const wss = new WebSocketServer({ server, path: "/ws" });
wss.on("connection", (ws) => {
  console.log(`[seam] ws connect -> /ws -> ok (clients=${wss.clients.size})`);
  ws.on("close", () => console.log(`[seam] ws close -> /ws -> ok (clients=${wss.clients.size})`));
});

function broadcast(e: WsEvent): void {
  // Seam 4: every WsEvent emitted -> type -> payload keys.
  console.log(`[seam] ws emit -> ${e.type} -> {${Object.keys(e).join(",")}} -> ok (clients=${wss.clients.size})`);
  const payload = JSON.stringify(e);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  }
}

// ── routes ────────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.post("/story/run", (req, res) => {
  const parsed = zRunInput.safeParse(req.body);
  if (!parsed.success) {
    const reason = parsed.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ");
    console.error(`[seam] run received -> invalid -> 400 (${reason}) -> FAIL`);
    res.status(400).json({ error: `invalid RunInput: ${reason}` });
    return;
  }
  const leadId = `ld_${randomUUID().slice(0, 8)}`;
  // V2 mode resolution: per-run {mode:"replay"} or env REPLAY=1 -> re-emit a recorded LIVE tape.
  const mode = parsed.data.mode ?? (process.env.REPLAY === "1" ? "replay" : "live");
  // Seam 1: run received -> validated -> leadId issued.
  console.log(
    `[seam] run received -> {industry:${parsed.data.industry}, handle:${parsed.data.handle}, mode:${mode}, person:${Boolean(parsed.data.person)}} validated -> leadId=${leadId} issued -> ok`,
  );
  if (mode === "replay") {
    if (!hasReplay(parsed.data.handle)) {
      console.error(`[seam] replay -> no recorded tape for handle=${parsed.data.handle} -> 404 -> FAIL (run LIVE once first)`);
      res.status(404).json({ error: `no recorded replay for ${parsed.data.handle} — run it live once first` });
      return;
    }
    void replayStory(leadId, parsed.data, broadcast).catch((err) => {
      const error = err instanceof Error ? err.message : String(err);
      console.error(`[seam] replay crash -> leadId=${leadId} -> ${error} -> FAIL`);
      broadcast({ type: "failed", leadId, stage: "replay", error });
    });
    res.status(200).json({ leadId, mode: "replay" });
    return;
  }
  // Run async; runStory handles its own failures (emits {type:"failed"}). Outer catch = belt and braces.
  void runStory(leadId, parsed.data, broadcast).catch((err) => {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[seam] orchestrator crash -> leadId=${leadId} -> ${error} -> FAIL`);
    broadcast({ type: "failed", leadId, stage: "orchestrator", error });
  });
  res.status(200).json({ leadId });
});

app.get("/story/:leadId", (req, res) => {
  const run = store.getRun(req.params.leadId);
  if (!run) {
    // Seam 6 gap (docs/VALIDATION.md): a refresh-rehydrate miss must be visible in backend logs.
    console.error(`[seam] GET /story/${req.params.leadId} -> unknown leadId -> 404 -> FAIL`);
    res.status(404).json({ error: `unknown leadId: ${req.params.leadId}` });
    return;
  }
  res.status(200).json(run);
});

// V2 contract add (OPENUI-RENDER CONTRACT-ADD-2): the receipt delivery channel — frontend
// fetches on gate/approve/done. openuiLang null = OpenUI render failed (visible fallback badge).
app.get("/story/:leadId/receipt", (req, res) => {
  const leadId = req.params.leadId;
  const run = store.getRun(leadId);
  if (!run) {
    console.error(`[seam] GET /story/${leadId}/receipt -> unknown leadId -> 404 -> FAIL`);
    res.status(404).json({ error: `unknown leadId: ${leadId}` });
    return;
  }
  res.status(200).json({
    openuiLang: store.getReceipt(leadId) ?? null,
    slides: store.getSlides(leadId) ?? [],
  });
});

app.post("/story/:leadId/approve", (req, res) => {
  const leadId = req.params.leadId;
  const run = store.getRun(leadId);
  if (!run) {
    console.error(`[seam] approve -> POST /story/${leadId}/approve -> unknown leadId -> 404 -> FAIL`);
    res.status(404).json({ error: `unknown leadId: ${leadId}` });
    return;
  }
  if (!approveGate(leadId)) {
    console.error(`[seam] approve -> leadId=${leadId} status=${run.status} -> no pending gate -> FAIL`);
    res.status(409).json({ error: `no pending gate for ${leadId} (status: ${run.status})` });
    return;
  }
  console.log(`[seam] approve -> leadId=${leadId} -> gate resolved -> ok`);
  res.status(200).json({ ok: true, leadId });
});

// ── boot ──────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  // V2 polarity: scrape/enrich/ground/archive are LIVE by default (stub only when STUB_MODE=1).
  const polarity =
    process.env.STUB_MODE === "1" ? "STUB floor (all nodes canned)"
    : process.env.STUB_MODE === "0" ? "FULL LIVE requested (STUB_MODE=0)"
    : "LIVE default (scrape/enrich/ground/archive live; legacy nodes stub until their lane flips)";
  console.log(`[seam] server up :${PORT} (STUB_MODE=${process.env.STUB_MODE ?? "unset"} -> ${polarity}; REPLAY=${process.env.REPLAY ?? "0"})`);
  envReadiness();
  assertHeldOutCritic(); // critic family != drafter family — fail CLOSED at boot
});

server.on("error", (err) => {
  console.error(`[seam] server boot -> :${PORT} -> FAIL (${(err as Error).message})`);
  process.exit(1);
});
