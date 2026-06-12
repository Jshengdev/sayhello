// nodes/scrape.ts — [scrape]: handle/url -> rawMarkdown. Sponsor: Firecrawl (live at S2).
// S1: STUB_MODE (default ON) returns canned-but-realistic markdown. Live path fails LOUD until S2.
import { z } from "zod";
import { defineNode, stubMode } from "./defineNode.js";

export function displayNameFromHandle(handle: string): { domain: string; name: string } {
  let domain = handle;
  try {
    domain = new URL(handle.startsWith("http") ? handle : `https://${handle}`).hostname;
  } catch {
    /* realestate handles (addresses/owners) are not URLs — keep as-is */
  }
  const label = domain.replace(/^www\./, "").split(".")[0] ?? domain;
  const name = label.charAt(0).toUpperCase() + label.slice(1);
  return { domain, name };
}

// ─────────────────────────────────────────────────────────────────────────────
// EDITABLE — canned scrape copy (S1 skeleton). Johnny tunes after the pipe runs.
// ─────────────────────────────────────────────────────────────────────────────
function cannedMarkdown(name: string, url: string): string {
  return [
    `# ${name}`,
    ``,
    `${name} builds purpose-built software for modern product teams. Fast, opinionated, keyboard-first.`,
    ``,
    `## Product`,
    `- Realtime sync across every client`,
    `- Cycle analytics and roadmapping`,
    `- Public API (beta)`,
    ``,
    `## Pricing`,
    `Free / Standard / Plus. No enterprise notification tier listed. (${url}/pricing)`,
    ``,
    `## Careers`,
    `Hiring: Platform Engineer, Infrastructure Engineer, Developer Relations. (${url}/careers)`,
    ``,
    `## Changelog`,
    `Weekly releases for the last 90 days.`,
  ].join("\n");
}

export const scrapeNode = defineNode({
  name: "scrape",
  sponsor: "Firecrawl",
  wireNode: "scrape",
  stubLatencyMs: 700,
  inputSchema: z.object({ url: z.string().min(1) }),
  outputSchema: z.object({ rawMarkdown: z.string().min(1) }),
  async executor({ url }) {
    if (stubMode()) {
      console.log("[stub] node:scrape canned output");
      const { name } = displayNameFromHandle(url);
      return { rawMarkdown: cannedMarkdown(name, url) };
    }
    // S2: Firecrawl POST https://api.firecrawl.dev/v2/scrape {url, formats:["markdown"]}
    throw new Error("scrape live mode lands at S2 — run with STUB_MODE unset/1 (no silent stubs)");
  },
});
