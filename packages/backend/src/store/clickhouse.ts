// store/clickhouse.ts — both ClickHouse halves (sponsor: ClickHouse).
//   playgroundQuery: the PUBLIC playground (sql-clickhouse.clickhouse.com, user=demo, no key) —
//     the [ground] node's claimed-vs-actual source (db-qualified tables: github.github_events,
//     hackernews.hackernews — per docs/VALIDATION.md debug tree, port 443 only).
//   insertGenerations: ClickHouse CLOUD write into story_runs (CLICKHOUSE_URL/USER/PASSWORD from
//     .env; table exists, verified by preflight). Logs written_rows from the X-ClickHouse-Summary
//     header. Failure -> throws; the archive node falls back to memory LOUDLY (never silent).
// Seam logs: host + HTTP status + row counts. NEVER credentials.
import type { PitchAngle, StoryGeneration } from "../types.js";

const PLAYGROUND_URL = "https://sql-clickhouse.clickhouse.com/?user=demo";
const TIMEOUT_MS = 15_000;

export interface PlaygroundResult {
  rows: Array<Record<string, unknown>>;
  rowsRead: number;
  elapsed: number;
}

/** POST a read-only SQL string to the public playground. Throws on non-200 (callers degrade loudly). */
export async function playgroundQuery(sql: string): Promise<PlaygroundResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const t0 = Date.now();
  try {
    const resp = await fetch(PLAYGROUND_URL, { method: "POST", body: `${sql} FORMAT JSON`, signal: ctrl.signal });
    const text = await resp.text();
    if (resp.status !== 200) {
      console.error(
        `[seam] node:ground -> sql-clickhouse.clickhouse.com -> HTTP ${resp.status} -> FAIL (body ${text.length} bytes)`,
      );
      throw new Error(`[clickhouse-playground] HTTP ${resp.status}: ${text.slice(0, 120)}`);
    }
    const json = JSON.parse(text) as {
      data?: Array<Record<string, unknown>>;
      statistics?: { rows_read?: number; elapsed?: number };
    };
    const rows = json.data ?? [];
    const rowsRead = json.statistics?.rows_read ?? 0;
    console.log(
      `[seam] node:ground -> sql-clickhouse.clickhouse.com -> HTTP 200 rows_read=${rowsRead} data_rows=${rows.length} -> ok (${Date.now() - t0}ms)`,
    );
    return { rows, rowsRead, elapsed: json.statistics?.elapsed ?? 0 };
  } finally {
    clearTimeout(timer);
  }
}

/** Escape a string for single-quoted ClickHouse SQL literals. */
export function chEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

/**
 * INSERT one row per generation into ClickHouse Cloud story_runs (schema: docs/CONTRACTS.md).
 * Returns written_rows. Throws with WHICH env key is missing or the HTTP status — the archive
 * node catches and falls back to memory LOUDLY.
 */
export async function insertGenerations(args: {
  leadId: string;
  url: string;
  pitchAngle: PitchAngle | null;
  status: string;
  generations: StoryGeneration[];
}): Promise<number> {
  const { leadId, url, pitchAngle, status, generations } = args;
  const missing = ["CLICKHOUSE_URL", "CLICKHOUSE_USER", "CLICKHOUSE_PASSWORD"].filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`[clickhouse] missing ${missing.join(", ")} -> FAIL (set in .env)`);
  }
  const rows = generations
    .map((g) =>
      JSON.stringify({
        leadId,
        generation: g.generation,
        url,
        story: g.story,
        pitch_angle: pitchAngle ?? "",
        grounding: g.score.grounding,
        completeness: g.score.completeness,
        narrative_arc: g.score.narrative_arc,
        verdict: g.score.verdict,
        fabricated: g.fabricatedClaims,
        cost_cents: g.costCents,
        status,
      }),
    )
    .join("\n");
  const sql =
    "INSERT INTO story_runs (leadId, generation, url, story, pitch_angle, grounding, completeness, narrative_arc, verdict, fabricated, cost_cents, status) FORMAT JSONEachRow\n" +
    rows;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const t0 = Date.now();
  try {
    const resp = await fetch(process.env.CLICKHOUSE_URL as string, {
      method: "POST",
      headers: {
        "X-ClickHouse-User": process.env.CLICKHOUSE_USER as string,
        "X-ClickHouse-Key": process.env.CLICKHOUSE_PASSWORD as string,
      },
      body: sql,
      signal: ctrl.signal,
    });
    const text = await resp.text();
    if (resp.status !== 200) {
      throw new Error(`[clickhouse] insert -> HTTP ${resp.status} (body ${text.length} bytes): ${text.slice(0, 120)}`);
    }
    let written = generations.length;
    const summary = resp.headers.get("x-clickhouse-summary");
    if (summary) {
      try {
        written = Number((JSON.parse(summary) as { written_rows?: string }).written_rows ?? written);
      } catch {
        /* keep the sent count */
      }
    }
    // Seam 6 (docs/BUILD-LOOP.md): ClickHouse write — row count from the summary header.
    console.log(
      `[seam] clickhouse write -> story_runs leadId=${leadId} -> HTTP 200, ${written} rows -> ok (${Date.now() - t0}ms)`,
    );
    return written;
  } finally {
    clearTimeout(timer);
  }
}
