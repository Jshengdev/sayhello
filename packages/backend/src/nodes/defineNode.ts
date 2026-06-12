// defineNode.ts — the JAM-style typed node layer (docs/DECISIONS.md §1).
// One Zod-validated boundary per node, seam-logged per docs/BUILD-LOOP.md seam 2.
// A zod failure or executor throw bubbles up as NodeFailure -> orchestrator emits {type:"failed"} (fail LOUD).
import { z } from "zod";
import type { WsEvent } from "../types.js";

/** The node names the WsEvent contract knows how to light on the frontend graph. */
export type WireNode = Extract<WsEvent, { type: "node_enter" }>["node"];

export interface NodeCtx {
  leadId: string;
  emit: (e: WsEvent) => void;
}

/** Carries the stage name so the orchestrator can emit {type:"failed", stage}. */
export class NodeFailure extends Error {
  constructor(
    public readonly stage: string,
    message: string,
  ) {
    super(message);
    this.name = "NodeFailure";
  }
}

export interface NodeDef<I extends z.ZodTypeAny, O extends z.ZodTypeAny> {
  /** Internal node name (seam logs). */
  name: string;
  /** Display string the frontend captions, e.g. "Firecrawl", "OpenRouter · held-out critic". */
  sponsor: string;
  /**
   * The WsEvent node this lights on the wire. node_enter union widened to include
   * enrich/ground (S1 validator finding — CONTRACTS.md updated in lockstep), so every
   * node lights its own chip; StoryRun.status still folds the gather phase into "scraping".
   */
  wireNode: WireNode;
  inputSchema: I;
  outputSchema: O;
  executor: (input: z.output<I>, ctx: NodeCtx) => Promise<z.input<O>>;
  /**
   * STUB-ONLY pacing (ms) so the node graph is watchable — canned executors complete in
   * ~0ms, which commits too few DOM states for the demo beat (S1 validator finding).
   * Applied ONLY when stubMode(); live executors at S2 have real latency. Logged [stub].
   */
  stubLatencyMs?: number;
}

export interface RunnableNode<I extends z.ZodTypeAny, O extends z.ZodTypeAny> {
  name: string;
  sponsor: string;
  wireNode: WireNode;
  run: (rawInput: z.input<I>, ctx: NodeCtx) => Promise<z.output<O>>;
}

function keysOf(v: unknown): string {
  if (v !== null && typeof v === "object") return Object.keys(v as object).join(",");
  return typeof v;
}

/** STUB_MODE default ON until S2 flips it (set STUB_MODE=0 for live executors). */
export function stubMode(): boolean {
  return process.env.STUB_MODE !== "0";
}

/** Default stub pace when a node doesn't set stubLatencyMs (demo-beat watchability). */
const STUB_PACE_DEFAULT_MS = 550;

/** Set STUB_PACE=0 to disable pacing (fast CI/capture runs). Stub-mode only. */
function stubPaceMs(def: { stubLatencyMs?: number }): number {
  if (process.env.STUB_PACE === "0") return 0;
  return def.stubLatencyMs ?? STUB_PACE_DEFAULT_MS;
}

export function defineNode<I extends z.ZodTypeAny, O extends z.ZodTypeAny>(
  def: NodeDef<I, O>,
): RunnableNode<I, O> {
  return {
    name: def.name,
    sponsor: def.sponsor,
    wireNode: def.wireNode,
    async run(rawInput, ctx) {
      const t0 = Date.now();
      console.log(`[seam] node:${def.name} enter -> {${keysOf(rawInput)}} (sponsor: ${def.sponsor})`);
      // Light the node on the frontend graph BEFORE executing.
      ctx.emit({ type: "node_enter", leadId: ctx.leadId, node: def.wireNode });
      if (stubMode()) {
        const pace = stubPaceMs(def);
        if (pace > 0) {
          console.log(`[stub] node:${def.name} pacing ${pace}ms (demo-beat watchability, stub-mode only)`);
          await new Promise((r) => setTimeout(r, pace));
        }
      }
      try {
        const input = def.inputSchema.parse(rawInput);
        const rawOutput = await def.executor(input, ctx);
        const output = def.outputSchema.parse(rawOutput);
        console.log(`[seam] node:${def.name} exit -> {${keysOf(output)}} -> ok (${Date.now() - t0}ms)`);
        return output;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[seam] node:${def.name} exit -> ${msg} -> FAIL (${Date.now() - t0}ms)`);
        throw err instanceof NodeFailure ? err : new NodeFailure(def.name, msg);
      }
    },
  };
}
