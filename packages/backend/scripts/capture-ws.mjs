// capture-ws.mjs — connects to ws://localhost:8787/ws, prints each WsEvent as one NDJSON line.
// Usage: node scripts/capture-ws.mjs [leadId]
//   exit 0 on "done" (for the leadId if given, else any), exit 1 on "failed", exit 2 on 90s timeout.
// Uses the Node >=22 global WebSocket client — no deps.
const leadIdFilter = process.argv[2] ?? null;

const timer = setTimeout(() => {
  console.error("[capture] 90s timeout -> hard exit");
  process.exit(2);
}, 90_000);

const ws = new WebSocket("ws://localhost:8787/ws");

ws.onopen = () => {
  console.error(`[capture] connected ws://localhost:8787/ws${leadIdFilter ? ` (filter: ${leadIdFilter})` : ""}`);
};

ws.onmessage = (ev) => {
  const line = typeof ev.data === "string" ? ev.data : Buffer.from(ev.data).toString("utf8");
  console.log(line); // NDJSON: one event per line
  try {
    const e = JSON.parse(line);
    const mine = !leadIdFilter || e.leadId === leadIdFilter;
    if (mine && (e.type === "done" || e.type === "failed")) {
      clearTimeout(timer);
      ws.close();
      process.exit(e.type === "done" ? 0 : 1);
    }
  } catch {
    /* non-JSON frame: printed above, keep listening */
  }
};

ws.onerror = (ev) => {
  console.error(`[capture] ws error -> ${ev?.message ?? "connection failed"}`);
  process.exit(3);
};
