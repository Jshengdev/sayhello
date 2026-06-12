// server.ts — S0 minimal boot: Express + ws on :8787. GET /health. Seam-logged per docs/BUILD-LOOP.md.
import "dotenv/config";
import http from "node:http";
import express from "express";
import { WebSocketServer } from "ws";

const PORT = 8787;
const t0 = Date.now();

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  console.log(`[seam] GET /health -> {ok} -> ok (${Date.now() - t0}ms uptime)`);
  res.status(200).json({ ok: true });
});

const server = http.createServer(app);

// WS /ws — the WsEvent stream (S0: connection handshake only; orchestrator wires in at S1)
const wss = new WebSocketServer({ server, path: "/ws" });
wss.on("connection", (ws) => {
  console.log(`[seam] ws connect -> /ws -> ok (${Date.now() - t0}ms uptime)`);
  ws.on("close", () => console.log("[seam] ws close -> /ws -> ok"));
});

server.listen(PORT, () => {
  console.log("[seam] server up :8787");
});

server.on("error", (err) => {
  console.error(`[seam] server boot -> :${PORT} -> FAIL (${(err as Error).message})`);
  process.exit(1);
});
