/**
 * scripts/mock-ws-feed.mjs — DEV-ONLY mock feed (no silent stubs: every emit
 * logs loudly with a [mock-feed] prefix; this never runs in the demo path).
 * A tiny HTTP+WS server on :8790 that replays the full canned WsEvent sequence
 * from docs/CONTRACTS.md with 300ms gaps, so the frontend lane can prove
 * lib/ws.ts + the dashboard against the exact contract while the backend
 * builds in parallel.
 *
 * Run:  node scripts/mock-ws-feed.mjs   (from packages/frontend)
 * Point the app at it:
 *   NEXT_PUBLIC_API_URL=http://localhost:8790 NEXT_PUBLIC_WS_URL=ws://localhost:8790/ws pnpm dev
 */

import { createServer } from "node:http";
import { WebSocketServer } from "ws";

const PORT = 8790;
const GAP_MS = 300;
const LEAD_ID = "mock-lead-001";

/* ——— EDITABLE DEMO COPY (Johnny tunes narrative here) ——— */
const FAB_1 = "just closed a $40M Series B led by Sequoia";
const FAB_2 = "powering notifications for over 5,000 teams including Notion";

const STORY_GEN0 =
  `Attio is shipping at a pace most CRMs can't match — 14 public releases in the last 90 days — and their Show HN launch hit the front page. They ${FAB_1}, and they're already ${FAB_2}. But their entire messaging story is still email-only: every workflow they automate ends in one fragile channel. The angle: bring the multi-channel layer to the CRM teams build themselves. The ask: 20 minutes with their platform team.`;

const STORY_GEN1 =
  `Attio is shipping at a pace most CRMs can't match — 14 public releases in the last 90 days — and their Show HN launch hit the front page with strong developer interest. Yet every workflow their customers build still ends in a single fragile channel: email. For a CRM whose whole pitch is composability, the messaging layer is the one piece teams can't compose. The angle: be the multi-channel layer for the workflows their users already build. The ask: 20 minutes with their platform team.`;

const BRIEF = {
  domain: "attio.com",
  name: "Attio",
  url: "https://attio.com",
  what_they_do:
    "Attio is a data-driven CRM that lets teams build their own customer relationship workflows on top of real-time data.",
  founded_year: 2019,
  key_features: ["real-time data sync", "custom objects", "workflow automation"],
  competitors: ["Salesforce", "HubSpot"],
  tech_stack: ["React", "TypeScript", "PostgreSQL"],
  funding_stage: null,
  funding_amount: null,
  employee_count: null,
  category: "CRM",
  current_messaging_channels: ["email"],
  github_url: "https://github.com/attio",
  partnership_potential: true,
  pitch_angle: "multi_channel",
  features: { api: true, webhooks: true },
  signals: [
    {
      signal_type: "launch_traction",
      source: "hackernews (ClickHouse)",
      source_url: "https://news.ycombinator.com/item?id=mock",
      detail: "Show HN launch hit the front page — 240 points, strong dev interest",
      strength: 0.8,
    },
    {
      signal_type: "release_cadence",
      source: "github_events (ClickHouse)",
      source_url: "https://github.com/attio",
      detail: "14 public releases in the last 90 days — fast shipping cadence",
      strength: 0.7,
    },
    {
      signal_type: "messaging_gap",
      source: "scrape (Firecrawl)",
      source_url: "https://attio.com",
      detail: "Site mentions email notifications only — no SMS/WhatsApp channel story",
      strength: 0.6,
    },
  ],
  brief:
    "Fast-shipping CRM challenger with real launch momentum and a single-channel messaging story.",
};

const SCORE_GEN0 = {
  grounding: 0.42,
  completeness: 0.78,
  narrative_arc: 0.81,
  feasibility: 0.74,
  competitive_diff: 0.7,
  metric_confidence: 0.55,
  verdict: "regen",
  failReason: "2 claims have no matching Signal — grounding is fail-closed",
  fabricatedClaims: [FAB_1, FAB_2],
};

const SCORE_GEN1 = {
  grounding: 0.93,
  completeness: 0.84,
  narrative_arc: 0.88,
  feasibility: 0.82,
  competitive_diff: 0.76,
  metric_confidence: 0.8,
  verdict: "emit",
  failReason: null,
  fabricatedClaims: [],
};

const DONE_RUN = {
  leadId: LEAD_ID,
  url: "https://attio.com",
  status: "done",
  generation: 1,
  brief: BRIEF,
  story: STORY_GEN1,
  score: SCORE_GEN1,
  pitch_angle: "multi_channel",
  generations: [
    {
      generation: 0,
      story: STORY_GEN0,
      score: SCORE_GEN0,
      fabricatedClaims: SCORE_GEN0.fabricatedClaims,
      costCents: 2.1,
      latencyMs: 4200,
      ts: new Date().toISOString(),
    },
    {
      generation: 1,
      story: STORY_GEN1,
      score: SCORE_GEN1,
      fabricatedClaims: [],
      costCents: 1.8,
      latencyMs: 3900,
      ts: new Date().toISOString(),
    },
  ],
  costCents: 3.9,
  totalLatencyMs: 11400,
  createdAt: new Date().toISOString(),
};

/* the full canned sequence — run_started … score_done gen-0 WITH fabricatedClaims
   … reenrich … score_done gen-1 emit … gate … done (docs/CONTRACTS.md WsEvent) */
const SEQUENCE = [
  { type: "run_started", leadId: LEAD_ID, url: "https://attio.com" },
  { type: "node_enter", leadId: LEAD_ID, node: "scrape" },
  { type: "scrape_done", leadId: LEAD_ID, brief: BRIEF },
  { type: "node_enter", leadId: LEAD_ID, node: "draft" },
  { type: "draft_done", leadId: LEAD_ID, generation: 0, story: STORY_GEN0, pitch_angle: "multi_channel" },
  { type: "node_enter", leadId: LEAD_ID, node: "judge" },
  { type: "score_done", leadId: LEAD_ID, generation: 0, score: SCORE_GEN0 },
  { type: "reenrich", leadId: LEAD_ID, generation: 0, reason: "re-scrape targeting the funding + customer claims" },
  { type: "node_enter", leadId: LEAD_ID, node: "reenrich" },
  { type: "node_enter", leadId: LEAD_ID, node: "draft" },
  { type: "draft_done", leadId: LEAD_ID, generation: 1, story: STORY_GEN1, pitch_angle: "multi_channel" },
  { type: "node_enter", leadId: LEAD_ID, node: "judge" },
  { type: "score_done", leadId: LEAD_ID, generation: 1, score: SCORE_GEN1 },
  { type: "node_enter", leadId: LEAD_ID, node: "archive" },
  { type: "node_enter", leadId: LEAD_ID, node: "render" },
  { type: "gate", leadId: LEAD_ID, story: STORY_GEN1, score: SCORE_GEN1 },
  { type: "done", leadId: LEAD_ID, run: DONE_RUN },
];

/* ——— the server ——— */
const clients = new Set();
let replaying = false;
let snapshot = null; // GET /story/:id rehydrate payload

function broadcast(ev) {
  const payload = JSON.stringify(ev);
  for (const ws of clients) {
    if (ws.readyState === 1) ws.send(payload);
  }
  const extra =
    ev.type === "score_done"
      ? ` gen=${ev.generation} grounding=${ev.score.grounding} fabricated=${ev.score.fabricatedClaims.length}`
      : ev.type === "node_enter"
        ? ` node=${ev.node}`
        : "";
  console.log(`[mock-feed] emit ws:${ev.type}${extra} -> ${clients.size} client(s) -> ok`);
}

function replay() {
  if (replaying) {
    console.log("[mock-feed] replay already in flight — ignoring");
    return;
  }
  replaying = true;
  snapshot = null;
  SEQUENCE.forEach((ev, i) => {
    setTimeout(() => {
      broadcast(ev);
      if (ev.type === "done") {
        snapshot = ev.run;
        replaying = false;
        console.log("[mock-feed] sequence complete — gate is armed, awaiting approve");
      }
    }, i * GAP_MS);
  });
}

const server = createServer((req, res) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (req.method === "OPTIONS") {
    res.writeHead(204, cors);
    res.end();
    return;
  }
  const url = req.url ?? "/";

  if (req.method === "POST" && url === "/story/run") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      console.log(`[mock-feed] POST /story/run ${body} -> {leadId:${LEAD_ID}} -> replay starts`);
      res.writeHead(200, { "Content-Type": "application/json", ...cors });
      res.end(JSON.stringify({ leadId: LEAD_ID }));
      replay();
    });
    return;
  }

  if (req.method === "GET" && url.startsWith("/story/")) {
    if (snapshot) {
      console.log(`[mock-feed] GET ${url} -> done run snapshot -> ok`);
      res.writeHead(200, { "Content-Type": "application/json", ...cors });
      res.end(JSON.stringify(snapshot));
    } else {
      console.log(`[mock-feed] GET ${url} -> no snapshot yet -> 404`);
      res.writeHead(404, { "Content-Type": "application/json", ...cors });
      res.end(JSON.stringify({ error: "run not finished" }));
    }
    return;
  }

  if (req.method === "POST" && /^\/story\/.+\/approve$/.test(url)) {
    console.log(`[mock-feed] POST ${url} -> human approved -> ok`);
    res.writeHead(200, { "Content-Type": "application/json", ...cors });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(404, cors);
  res.end();
});

const wss = new WebSocketServer({ server, path: "/ws" });
wss.on("connection", (ws) => {
  clients.add(ws);
  console.log(`[mock-feed] ws client connected (${clients.size} total)`);
  ws.on("close", () => clients.delete(ws));
});

server.listen(PORT, () => {
  console.log(
    `[mock-feed] DEV-ONLY mock on http://localhost:${PORT} (ws path /ws) — POST /story/run starts the replay (${SEQUENCE.length} events, ${GAP_MS}ms gaps)`,
  );
});
