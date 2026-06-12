// nodes/enrich.ts — two nodes:
//   [enrich]   rawMarkdown -> CompanyBrief (+news signals). Sponsor: Composio. Lights "enrich" on the
//              wire (node_enter union widened per S1 validator finding; CONTRACTS.md in lockstep).
//   [reenrich] brief + fabricatedClaims -> corrected brief. Sponsor: Composio. Lights "reenrich".
// S1: STUB_MODE canned brief/signals. Live (Composio NO_AUTH search) lands at S2.
import { z } from "zod";
import { getLens } from "../lenses/index.js";
import { zCompanyBrief, zIndustry } from "../schemas.js";
import type { CompanyBrief, Signal } from "../types.js";
import { defineNode, stubMode } from "./defineNode.js";
import { displayNameFromHandle } from "./scrape.js";

// ─────────────────────────────────────────────────────────────────────────────
// EDITABLE — the canned CompanyBrief (S1). Johnny tunes narrative after the pipe runs.
// NOTE: funding_stage/funding_amount are DELIBERATELY null so the gen-0 drafter's
// "$40M Series B" has no matching Signal -> the critic catches it (the demo heart).
// ─────────────────────────────────────────────────────────────────────────────
function cannedBrief(url: string): CompanyBrief {
  const { domain, name } = displayNameFromHandle(url);
  const scrapeSignals: Signal[] = [
    {
      signal_type: "pricing_tier_gap",
      source: "firecrawl:scrape",
      source_url: `${url.replace(/\/$/, "")}/pricing`,
      detail: "Pricing page lists Free/Standard/Plus but no enterprise notification tier — the missing tier is the channel gap.",
      strength: 0.7,
    },
    {
      signal_type: "hiring_roadmap",
      source: "firecrawl:scrape",
      source_url: `${url.replace(/\/$/, "")}/careers`,
      detail: "Careers page lists Platform + Infrastructure + DevRel roles — the roles they hire are the gaps they admit.",
      strength: 0.6,
    },
  ];
  const newsSignals: Signal[] = [
    {
      signal_type: "news_mention",
      source: "composio:COMPOSIO_SEARCH_NEWS",
      source_url: "https://techcrunch.example.com/api-beta-coverage",
      detail: `${name} shipped a public API beta last quarter; coverage centered on integration demand from larger teams.`,
      strength: 0.55,
    },
  ];
  return {
    domain,
    name,
    url,
    what_they_do: `${name} builds a product-velocity tool for modern software teams (canned S1 brief).`,
    founded_year: 2019,
    key_features: ["keyboard-first workflows", "realtime sync", "cycle analytics", "public API (beta)"],
    competitors: ["Jira", "Asana", "Shortcut"],
    tech_stack: ["TypeScript", "React", "GraphQL"],
    funding_stage: null, // deliberately ungrounded — see note above
    funding_amount: null,
    employee_count: 120,
    category: "devtools",
    current_messaging_channels: ["email", "changelog"],
    github_url: `https://github.com/${name.toLowerCase()}`,
    partnership_potential: true,
    pitch_angle: "multi_channel",
    features: { realtime: true, public_api: true, sms: false, enterprise_notifications: false },
    signals: [...scrapeSignals, ...newsSignals],
    brief: `${name} is a ~120-person devtools company shipping weekly; their pricing and hiring both point at an admitted platform/notifications gap (canned L1 brief).`,
  };
}

// EDITABLE — the corrective Signal the regen loop finds (S1 canned).
function correctiveFundingSignal(name: string): Signal {
  return {
    signal_type: "funding_check",
    source: "composio:COMPOSIO_SEARCH_NEWS+SEC_FILINGS",
    source_url: "https://www.sec.gov/cgi-srch-edgar?text=form-d",
    detail: `No Series B on record for ${name}; latest disclosed round is a $4.2M seed (2024). The "$40M Series B" claim is unsupported — cut it.`,
    strength: 0.9,
  };
}

export const enrichNode = defineNode({
  name: "enrich",
  sponsor: "Composio",
  wireNode: "enrich", // lights its own chip (Composio named on screen during the live pass)
  stubLatencyMs: 650,
  inputSchema: z.object({ url: z.string().min(1), rawMarkdown: z.string().min(1), industry: zIndustry }),
  outputSchema: z.object({ brief: zCompanyBrief }),
  async executor({ url, industry }) {
    const lens = getLens(industry);
    if (stubMode()) {
      console.log(`[stub] node:enrich canned output (lens: ${lens.industry}, ${lens.signalRecipes.length} recipes)`);
      return { brief: cannedBrief(url) };
    }
    // S2: Composio NO_AUTH COMPOSIO_SEARCH_NEWS/_SEC_FILINGS/_FINANCE per lens.groundingSources
    throw new Error("enrich live mode lands at S2 — run with STUB_MODE unset/1 (no silent stubs)");
  },
});

export const reenrichNode = defineNode({
  name: "reenrich",
  sponsor: "Composio",
  wireNode: "reenrich",
  stubLatencyMs: 750,
  inputSchema: z.object({
    brief: zCompanyBrief,
    fabricatedClaims: z.array(z.string()).min(1),
    industry: zIndustry,
  }),
  outputSchema: z.object({ brief: zCompanyBrief, note: z.string() }),
  async executor({ brief, fabricatedClaims }) {
    if (stubMode()) {
      console.log(`[stub] node:reenrich canned output (targeting: ${JSON.stringify(fabricatedClaims)})`);
      const corrective = correctiveFundingSignal(brief.name);
      const corrected: CompanyBrief = {
        ...brief,
        funding_stage: "seed",
        funding_amount: "$4.2M",
        signals: [...brief.signals, corrective],
      };
      return {
        brief: corrected,
        note: `Re-enriched targeting fabricated claims ${JSON.stringify(fabricatedClaims)}: ${corrective.detail}`,
      };
    }
    // S2: targeted re-scrape / Composio search per fabricated claim
    throw new Error("reenrich live mode lands at S2 — run with STUB_MODE unset/1 (no silent stubs)");
  },
});
