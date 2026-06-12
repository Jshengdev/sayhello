// server.ts — Express + ws on :8787 (deterministic, docs/CONTRACTS.md API).
//   POST /story/run {industry, handle} -> {leadId}   (RunInput-validated; bad input -> 400 + reason)
//   GET  /story/:leadId                -> StoryRun    (rehydrate on refresh)
//   POST /story/:leadId/approve        -> resolves the human gate
//   GET  /health · WS /ws              -> WsEvent stream broadcast to all clients
// Seam 1 (run received -> validated -> leadId issued) and seam 4 (every WsEvent emitted) logged here.
import "dotenv/config";
import { randomUUID } from "node:crypto";
import http from "node:http";
import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import { approveGate, runStory } from "./orchestrator/runStory.js";
import { zRunInput } from "./schemas.js";
import { store } from "./store/memory.js";
import type { WsEvent } from "./types.js";

const PORT = 8787;

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
  // Seam 1: run received -> validated -> leadId issued.
  console.log(
    `[seam] run received -> {industry:${parsed.data.industry}, handle:${parsed.data.handle}} validated -> leadId=${leadId} issued -> ok`,
  );
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
    res.status(404).json({ error: `unknown leadId: ${req.params.leadId}` });
    return;
  }
  res.status(200).json(run);
});

app.post("/story/:leadId/approve", (req, res) => {
  const leadId = req.params.leadId;
  const run = store.getRun(leadId);
  if (!run) {
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
  console.log(`[seam] server up :${PORT} (STUB_MODE=${process.env.STUB_MODE ?? "default-on"})`);
});

server.on("error", (err) => {
  console.error(`[seam] server boot -> :${PORT} -> FAIL (${(err as Error).message})`);
  process.exit(1);
});
