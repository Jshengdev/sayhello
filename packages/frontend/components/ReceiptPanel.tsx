"use client";

/**
 * ReceiptPanel — the generated verification artifact (docs/reference/OPENUI-RENDER.md).
 * On gate/done it fetches GET /story/:leadId/receipt → { openuiLang, slides }. When
 * the render node has emitted openuiLang we parse it (lib/openui-lang.ts) and render
 * it through our paper-light component library — the prize move: generative UI
 * pointed at the RECEIPTS (claims ledger + FABRICATED stamp + evidence + trajectory
 * + the human gate), not a chat card. If the render node hasn't produced a receipt
 * yet (or the Lang fails to parse), we render the SAME components from the live
 * StoryRun — real run data, visibly labeled. No silent stub: a parse failure shows
 * a FAILED note before falling back.
 */

import { useEffect, useMemo, useState } from "react";
import type { ElementNode } from "@/lib/openui-lang";
import { parseOpenuiLang } from "@/lib/openui-lang";
import type { StoryRun, StoryScore } from "@/lib/types";
import { API_URL } from "@/lib/ws";
import { RenderNode, treeFromRun } from "@/components/receipt/ReceiptRenderer";

export default function ReceiptPanel({
  run,
  gate,
  approved,
  onApprove,
}: {
  run: StoryRun | null;
  gate: { story: string; score: StoryScore } | null;
  approved: boolean;
  onApprove: () => Promise<boolean> | void;
}) {
  const leadId = run?.leadId ?? null;
  const ready =
    !!run &&
    !!run.story &&
    !!run.score &&
    (!!gate || run.status === "done" || run.status === "blocked");

  const [lang, setLang] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  /* fetch the render-node receipt once the run reaches the gate */
  useEffect(() => {
    if (!leadId || !ready) return;
    let cancelled = false;
    const t0 = performance.now();
    fetch(`${API_URL}/story/${leadId}/receipt`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = (await res.json()) as { openuiLang?: string | null };
        if (cancelled) return;
        setLang(body.openuiLang ?? null);
        console.log(
          `[seam] GET /story/${leadId}/receipt -> openuiLang ${
            body.openuiLang ? `${body.openuiLang.length} chars` : "null"
          } -> ok (${(performance.now() - t0).toFixed(0)}ms)`,
        );
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn(
          `[seam] GET /story/${leadId}/receipt -> ${String(err)} -> falling back to StoryRun-derived receipt`,
        );
        setLang(null);
      });
    return () => {
      cancelled = true;
    };
  }, [leadId, ready]);

  /* parse the openuiLang (if any) → tree; on failure surface it, never silently */
  const parsedTree = useMemo<ElementNode | null>(() => {
    if (!lang) return null;
    try {
      const tree = parseOpenuiLang(lang);
      setParseError(null);
      console.log(`[seam] render -> openuiLang parsed -> ok (root=${tree._component})`);
      return tree;
    } catch (err) {
      setParseError(String(err));
      console.error(`[seam] render -> openuiLang parse -> FAIL (${String(err)})`);
      return null;
    }
  }, [lang]);

  if (!ready || !run) return null;

  const fromLang = !!parsedTree;
  const tree = parsedTree ?? treeFromRun(run);

  const handleAction = (action: string) => {
    if (action === "approve_story") void onApprove();
  };

  return (
    <section aria-label="Generated receipt" className="ring-panel rounded-2xl bg-raised p-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-mute">
          generated report · Thesys C1 / OpenUI
        </p>
        <span className="font-mono text-[9.5px] text-faint">
          {fromLang ? "rendered from OpenUI Lang (model-emitted)" : "derived from StoryRun · render node pending"}
        </span>
      </header>

      {parseError && (
        <p className="dash-pop mt-2 rounded-lg px-3 py-2 font-mono text-[10px] text-bad" style={{ boxShadow: "0 0 0 1px color-mix(in srgb, var(--bad) 35%, transparent)" }}>
          openui-lang parse FAILED — {parseError} · showing the StoryRun-derived receipt
        </p>
      )}

      <div className="mt-3">
        <RenderNode node={tree} onAction={handleAction} approved={approved} />
      </div>
    </section>
  );
}
