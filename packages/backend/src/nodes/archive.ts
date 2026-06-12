// nodes/archive.ts — [archive]: generations -> story_runs rows. Sponsor: ClickHouse · archive.
// S1: STUB_MODE in-memory (the store Map already holds the run); logs seam 6 with the row count.
// S3: real ClickHouse insert into story_runs (schema in docs/CONTRACTS.md).
import { z } from "zod";
import { zStoryGeneration } from "../schemas.js";
import { defineNode, stubMode } from "./defineNode.js";

export const archiveNode = defineNode({
  name: "archive",
  sponsor: "ClickHouse · archive",
  wireNode: "archive",
  stubLatencyMs: 500,
  inputSchema: z.object({
    leadId: z.string().min(1),
    url: z.string().min(1),
    generations: z.array(zStoryGeneration).min(1),
  }),
  outputSchema: z.object({ ok: z.boolean(), rows: z.number().int() }),
  async executor({ leadId, generations }) {
    if (stubMode()) {
      console.log("[stub] node:archive canned output (in-mem fallback, no ClickHouse write)");
      // Seam 6 (docs/BUILD-LOOP.md): ClickHouse write + trajectory — row count / result.
      console.log(
        `[seam] clickhouse write -> story_runs leadId=${leadId} -> ${generations.length} rows -> ok (stub in-mem)`,
      );
      return { ok: true, rows: generations.length };
    }
    // S3: INSERT INTO story_runs ... one row per generation; trajectory query feeds the score panel
    throw new Error("archive live mode lands at S3 — run with STUB_MODE unset/1 (no silent stubs)");
  },
});
