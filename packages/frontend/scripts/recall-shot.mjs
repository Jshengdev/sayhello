// scripts/recall-shot.mjs — drive the /recall panel with Playwright + screenshot to .evidence-airbyte/.
//   node scripts/recall-shot.mjs <baseUrl> <query>
// Verifies the Airbyte recall panel renders REAL results end-to-end (frontend -> backend -> corpus).
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// scripts -> frontend -> packages -> worktree root
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const base = process.argv[2] ?? "http://localhost:3177";
const query = process.argv[3] ?? "which real-estate leads have we storied?";
const outDir = resolve(root, ".evidence-airbyte");
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 1500 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

await page.goto(`${base}/recall`, { waitUntil: "networkidle" });
await page.fill('[data-testid="recall-input"]', query);
await page.click('[data-testid="recall-button"]');

// wait for either a result card or the error badge
await page.waitForSelector('[aria-label="Recall results"], [data-testid="recall-error"]', { timeout: 15000 });

const count = await page.locator('[aria-label="Recall results"] > ul > li').count();
const via = await page.locator('[aria-label="Recall results"] span[title]').first().textContent().catch(() => null);
const err = await page.locator('[data-testid="recall-error"]').textContent().catch(() => null);

const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
const file = resolve(outDir, `recall-${slug}.png`);
await page.screenshot({ path: file, fullPage: true });

console.log(JSON.stringify({ query, resultCards: count, via: via?.trim(), error: err?.trim() ?? null, pageErrors: errors, screenshot: file }, null, 2));
await browser.close();
process.exit(count > 0 ? 0 : 1);
