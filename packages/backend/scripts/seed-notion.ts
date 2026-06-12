// scripts/seed-notion.ts — seed the "sayhello stories" Notion DB from data/leads/*.json.
//   pnpm --filter backend exec tsx scripts/seed-notion.ts
//
// What it does (docs/AIRBYTE-RECALL.md step 2):
//   1. Normalize every grounded story in data/leads/*.json (storyRecord.ts).
//   2. Ensure the Notion database exists (NOTION_DATABASE_ID, else create under NOTION_PARENT_PAGE_ID).
//   3. Upsert one page per story (re-running UPDATES, never duplicates — keyed on Record Id).
//
// FAIL LOUD: with no NOTION_API_KEY this prints the exact "set NOTION_API_KEY …" message and exits 1.
// It NEVER writes a fake page or pretends success. Secret values are never printed — names only.
//
// --dry-run : normalize + print the record table WITHOUT touching Notion (no key required).

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Parse repo-root .env line-by-line if present (NOT shell-sourceable). Tolerate absence.
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
try {
  for (const line of readFileSync(resolve(repoRoot, ".env"), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*["']?([^"'\r\n]*)/);
    if (m && m[1] && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
  console.log("[seed] .env parsed (values never printed)");
} catch {
  console.log("[seed] no repo-root .env — reading from process env only");
}

const dryRun = process.argv.includes("--dry-run");

const { loadAllRecords } = await import("../src/recall/storyRecord.js");
const records = loadAllRecords();

console.log(`\n[seed] normalized ${records.length} grounded stories from data/leads/*.json:`);
for (const r of records) {
  const fab = r.fabricatedClaims.length;
  const gs = r.groundingScore === null ? "—" : r.groundingScore.toFixed(2);
  console.log(
    `  • ${r.lead.slice(0, 40).padEnd(40)} [${r.industry.padEnd(10)}] angle=${(r.angle ?? "—").padEnd(16)} ` +
      `grounding=${gs} fab=${fab} src=${r.source}`,
  );
}

if (dryRun) {
  console.log("\n[seed] --dry-run: not writing to Notion. Set NOTION_API_KEY + NOTION_DATABASE_ID (or NOTION_PARENT_PAGE_ID) and re-run without --dry-run.");
  process.exit(0);
}

const { ensureDatabase, writeStory, NotionConfigError } = await import("../src/recall/notion.js");

try {
  const { id: databaseId, created } = await ensureDatabase();
  console.log(`\n[seed] Notion database ready (${created ? "CREATED" : "existing"}): ${databaseId}`);

  let ok = 0;
  let failed = 0;
  for (const rec of records) {
    try {
      const url = await writeStory(databaseId, rec);
      ok += 1;
      console.log(`  ✓ wrote "${rec.lead.slice(0, 40)}" -> ${url}`);
    } catch (err) {
      failed += 1;
      console.error(`  ✗ FAILED "${rec.lead.slice(0, 40)}": ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  console.log(`\n[seed] done -> ${ok} written, ${failed} failed (database ${databaseId}).`);
  console.log(`[seed] NEXT: add the Notion connector in Airbyte (app.airbyte.ai) -> sync this DB -> Context Store.`);
  process.exit(failed > 0 ? 1 : 0);
} catch (err) {
  if (err instanceof NotionConfigError) {
    console.error(`\n[seed] BLOCKED — ${err.message}`);
    process.exit(1);
  }
  console.error(`\n[seed] FATAL: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
