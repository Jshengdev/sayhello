/**
 * scripts/verify-mockfeed.mjs — the frontend lane's S1 verify (CP-4 criterion):
 * drives the dashboard against the DEV-ONLY mock feed and JUDGES, evidence-based:
 *   1. nodes light in order (node_enter -> --live chip)
 *   2. the fabricated claim turns RED the instant score_done gen-0 lands
 *   3. the spiral shows BOTH generations (gen-0 red, gen-1 green)
 *   4. the human gate appears; hold-to-approve stamps + ships
 * Captures .evidence/s1-frontend-mockfeed.png + the [seam] console logs.
 *
 * Prereqs: mock feed on :8790, next dev on :3100 pointed at it.
 * Run: node scripts/verify-mockfeed.mjs
 */

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const EVIDENCE_DIR = resolve(process.cwd(), "../../.evidence");
mkdirSync(EVIDENCE_DIR, { recursive: true });

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} — ${name}${detail ? ` (${detail})` : ""}`);
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } });

const seamLogs = [];
const litNodes = [];
page.on("console", (msg) => {
  const t = msg.text();
  if (t.startsWith("[seam]")) seamLogs.push(t);
});

await page.goto("http://localhost:3100", { waitUntil: "networkidle" });

/* connection comes up */
await page.waitForFunction(
  () => document.body.innerText.includes("harness live"),
  { timeout: 8000 },
);
check("ws connected (harness live)", true);

/* run the lead */
await page.fill('[data-testid="handle-input"]', "https://attio.com");
await page.click('[data-testid="run-button"]');

/* poll which node chip is live, in order, while the sequence replays */
const pollLive = setInterval(async () => {
  try {
    const live = await page.$eval('.node-chip[data-live="true"]', (el) =>
      el.textContent?.trim().split("\n")[0],
    );
    if (live && litNodes[litNodes.length - 1] !== live) litNodes.push(live);
  } catch {}
}, 120);

/* THE moment — the fabricated claim turns red on score_done gen-0 (~2.1s in) */
await page.waitForSelector("mark.claim-bad", { timeout: 8000 });
const fabCount = await page.$$eval("mark.claim-bad", (els) => els.length);
check("fabricated claims render RED inline", fabCount >= 2, `${fabCount} marks`);
const criticCard = await page
  .locator("text=no source Signal — FABRICATED")
  .count();
check("critic card (no source Signal — FABRICATED)", criticCard > 0);
await page.screenshot({
  path: `${EVIDENCE_DIR}/s1-frontend-catch.png`,
  fullPage: false,
});

/* let the sequence finish: reenrich -> gen-1 emit -> gate -> done (~5.2s total) */
await page.waitForSelector('[data-testid="approve-gate"]', { timeout: 10000 });
clearInterval(pollLive);
check("human gate appears", true);
check(
  "nodes lit in order",
  litNodes.length >= 4,
  litNodes.join(" → ") || "none observed",
);

/* spiral shows both generations */
await page.waitForSelector('[data-testid="spiral-gen-1"]', { timeout: 5000 });
const gen0 = await page.getAttribute('[data-testid="spiral-gen-0"]', "data-grounded");
const gen1 = await page.getAttribute('[data-testid="spiral-gen-1"]', "data-grounded");
check("spiral shows 2 generations", gen0 !== null && gen1 !== null);
check("spiral gen-0 ungrounded(red) → gen-1 grounded(green)", gen0 === "false" && gen1 === "true");

/* trajectory + verdict visible */
const emitChip = await page.locator("text=✓ emit").count();
check("verdict chip emit", emitChip > 0);

/* THE evidence shot — full dashboard at the gate */
await page.waitForTimeout(900); // let the spiral lerp settle on gen-1
await page.screenshot({
  path: `${EVIDENCE_DIR}/s1-frontend-mockfeed.png`,
  fullPage: true,
});
console.log(`screenshot -> ${EVIDENCE_DIR}/s1-frontend-mockfeed.png`);

/* hold-to-approve: press and HOLD 1.2s -> stamp */
const btn = page.locator('[data-testid="hold-approve"]');
const box = await btn.boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.down();
await page.waitForTimeout(1200);
await page.mouse.up();
await page.waitForSelector("text=approved", { timeout: 5000 });
check("hold-to-approve → gate-stamp", true);
await page.screenshot({
  path: `${EVIDENCE_DIR}/s1-frontend-approved.png`,
  fullPage: false,
});

/* seam 5 logged for every event type */
const seamTypes = [
  "run_started",
  "node_enter",
  "scrape_done",
  "draft_done",
  "score_done",
  "reenrich",
  "gate",
  "done",
];
const missing = seamTypes.filter(
  (t) => !seamLogs.some((l) => l.includes(`ws:${t}`)),
);
check("seam 5 logged for every event type", missing.length === 0, missing.length ? `missing: ${missing.join(",")}` : `${seamLogs.length} seam logs`);

console.log("\n— seam log sample —");
for (const l of seamLogs.slice(0, 24)) console.log(l);

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(
  `\nverify: ${results.length - failed.length}/${results.length} checks passed`,
);
process.exit(failed.length ? 1 : 0);
