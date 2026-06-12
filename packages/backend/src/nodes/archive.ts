// nodes/archive.ts — [archive]: generations -> story_runs rows. Sponsor: ClickHouse · archive.
// V2: LIVE by DEFAULT — INSERT one row per generation into ClickHouse CLOUD story_runs
// (CLICKHOUSE_URL/USER/PASSWORD from .env; table exists, preflight-verified). Logs the row count
// from the X-ClickHouse-Summary header. On failure: LOUD fallback to the in-memory store (which
// already holds the full run) — visible degraded, never silent, never fatal. Stub when STUB_MODE=1.
import { z } from "zod";
import { zPitchAngle, zStoryGeneration } from "../schemas.js";
import { insertGenerations } from "../store/clickhouse.js";
import { defineNode, stubExplicit } from "./defineNode.js";

export const archiveNode = defineNode({
  name: "archive",
  sponsor: "ClickHouse · archive",
  wireNode: "archive",
  stubLatencyMs: 500,
  stubWhen: stubExplicit, // V2: LIVE default; stub only when STUB_MODE=1
  inputSchema: z.object({
    leadId: z.string().min(1),
    url: z.string().min(1),
    generations: z.array(zStoryGeneration).min(1),
    pitch_angle: zPitchAngle.nullable().optional(),
    status: z.string().optional(),
  }),
  outputSchema: z.object({ ok: z.boolean(), rows: z.number().int() }),
  async executor({ leadId, url, generations, pitch_angle, status }) {
    if (stubExplicit()) {
      console.log("[stub] node:archive canned output (in-mem fallback, no ClickHouse write)");
      // Seam 6 (docs/BUILD-LOOP.md): ClickHouse write + trajectory — row count / result.
      console.log(
        `[seam] clickhouse write -> story_runs leadId=${leadId} -> ${generations.length} rows -> ok (stub in-mem)`,
      );
      return { ok: true, rows: generations.length };
    }
    // LIVE: ClickHouse Cloud insert; insertGenerations logs the seam-6 line with written_rows.
    try {
      const rows = await insertGenerations({
        leadId,
        url,
        pitchAngle: pitch_angle ?? null,
        status: status ?? "blocked",
        generations,
      });
      return { ok: true, rows };
    } catch (err) {
      // LOUD memory fallback — the store Map already holds the full run; archive is degraded, not fatal.
      console.error(
        `[seam] clickhouse write -> story_runs leadId=${leadId} -> FAIL (${(err as Error).message.slice(0, 160)}) -> falling back to in-memory store LOUDLY (archive degraded, run survives)`,
      );
      return { ok: false, rows: 0 };
    }
  },
});
