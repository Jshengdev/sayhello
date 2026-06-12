// llm/cost-ledger.ts — per-run LLM cost ledger (ported pattern from doubles src/llm/cost-ledger.ts,
// retargeted: turnId -> leadId, Rule-7 ceilings -> a per-run soft ceiling that logs LOUD, never blocks).
// Deterministic arithmetic over real OpenRouter usage.cost — observability, not a control-flow gate.

const RUN_CEILING_CENTS = 50; // a story run costing > $0.50 logs loud — hackathon sanity rail
const MAX_TRACKED_RUNS = 200;

interface RunCost {
  cents: number;
  breached: boolean;
}

const ledger = new Map<string, RunCost>();

/** Record one paid LLM call's cost against its run. Logs `[seam] cost` per call; breach logs LOUD once. */
export function recordRunCost(leadId: string, costCents: number, agentName: string): void {
  let entry = ledger.get(leadId);
  if (!entry) {
    if (ledger.size >= MAX_TRACKED_RUNS) {
      const oldest = ledger.keys().next().value;
      if (oldest !== undefined) ledger.delete(oldest);
    }
    entry = { cents: 0, breached: false };
    ledger.set(leadId, entry);
  }
  entry.cents += costCents;
  console.log(`[seam] cost -> leadId=${leadId} agent=${agentName} +${costCents}c (run total ${entry.cents}c) -> ok`);
  if (entry.cents > RUN_CEILING_CENTS && !entry.breached) {
    entry.breached = true;
    console.warn(
      `[seam] cost BREACH -> leadId=${leadId} cumulative=${entry.cents}c > ceiling=${RUN_CEILING_CENTS}c (observability only, never blocks)`,
    );
  }
}

/** Cumulative cents for a run (0 if untracked). The orchestrator snapshots this per generation. */
export function runCostCents(leadId: string): number {
  return ledger.get(leadId)?.cents ?? 0;
}
