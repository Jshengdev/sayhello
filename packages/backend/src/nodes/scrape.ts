// nodes/scrape.ts — [scrape]: handle/url -> rawMarkdown. Sponsor: Firecrawl.
// V2: LIVE by DEFAULT (Firecrawl /v2/scrape with the data/leads/<domain>.json failover built into
// enrich/firecrawl.ts). Stub ONLY when STUB_MODE=1 (the floor). No silent stubs — the cached-fallback
// path logs LOUDLY and surfaces a provenance note.
import { z } from "zod";
import { scrapeUrl } from "../enrich/firecrawl.js";
import { defineNode, stubExplicit } from "./defineNode.js";

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
  stubWhen: stubExplicit, // V2: LIVE default; stub only when STUB_MODE=1
  inputSchema: z.object({ url: z.string().min(1) }),
  outputSchema: z.object({ rawMarkdown: z.string().min(1), provenance: z.string() }),
  async executor({ url }) {
    if (stubExplicit()) {
      console.log("[stub] node:scrape canned output (STUB_MODE=1 floor)");
      const { name } = displayNameFromHandle(url);
      return { rawMarkdown: cannedMarkdown(name, url), provenance: "stub (STUB_MODE=1)" };
    }
    // LIVE: Firecrawl POST /v2/scrape — scrapeUrl logs the seam (status + markdown length),
    // refreshes data/leads/<domain>.json on success, and falls back to that cache LOUDLY on failure.
    const target = url.startsWith("http") ? url : `https://${url}`;
    const result = await scrapeUrl(target);
    console.log(
      `[seam] node:scrape -> POST api.firecrawl.dev/v2/scrape -> ${result.cached ? "CACHE FALLBACK" : "HTTP 200"} markdown.length=${result.markdown.length} -> ok (${result.note})`,
    );
    return { rawMarkdown: result.markdown, provenance: result.note };
  },
});
