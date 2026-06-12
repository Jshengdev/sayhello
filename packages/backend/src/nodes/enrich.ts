// nodes/enrich.ts — two nodes (V2: LIVE by DEFAULT; stub only when STUB_MODE=1):
//   [enrich]   rawMarkdown -> CompanyBrief. LIVE = LLM extraction (MODELS.EXTRACT, the gtm-tool
//              26-field schema) + Composio news signals (COMPOSIO_SEARCH_NEWS_SEARCH — the
//              _SEARCH-suffixed slug; the bare one 404s, docs/VALIDATION.md). Composio failure
//              degrades LOUDLY (news signals skipped, visible log) — extraction failure FAILS the run.
//   [reenrich] brief + fabricatedClaims -> corrected brief. LIVE = a Composio evidence hunt per
//              fabricated claim; zero hits = an honest "no source — CUT it" corrective Signal.
import { z } from "zod";
import { composioSearchNews } from "../enrich/composio.js";
import { getLens, type Industry } from "../lenses/index.js";
import { MODELS } from "../llm/models.js";
import { generate, parseJsonLoose } from "../llm/openrouter.js";
import { zCompanyBrief, zIndustry, zPitchAngle } from "../schemas.js";
import type { CompanyBrief, PitchAngle, Signal } from "../types.js";
import { defineNode, stubExplicit, type NodeCtx } from "./defineNode.js";
import { displayNameFromHandle } from "./scrape.js";

// ─────────────────────────────────────────────────────────────────────────────
// EDITABLE — the canned CompanyBrief (STUB_MODE=1 floor). Johnny tunes narrative after the pipe runs.
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
      source: "composio:COMPOSIO_SEARCH_NEWS_SEARCH",
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

// EDITABLE — the corrective Signal the regen loop finds (STUB floor).
function correctiveFundingSignal(name: string): Signal {
  return {
    signal_type: "funding_check",
    source: "composio:COMPOSIO_SEARCH_NEWS_SEARCH+SEC_FILINGS",
    source_url: "https://www.sec.gov/cgi-srch-edgar?text=form-d",
    detail: `No Series B on record for ${name}; latest disclosed round is a $4.2M seed (2024). The "$40M Series B" claim is unsupported — cut it.`,
    strength: 0.9,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LIVE extraction — the 26-field brief from scraped markdown (one EXTRACT-tier LLM call,
// the Pioneer parser folded per docs/SCOPE-LOCK.md). EDITABLE prompt.
// ─────────────────────────────────────────────────────────────────────────────
function extractionPrompt(industry: Industry): string {
  const lens = getLens(industry);
  return `You extract a structured research brief about a company from its scraped website markdown.

Respond with ONLY one JSON object (no fences, no commentary):
{
  "name": "company name",
  "what_they_do": "1-2 sentences, plain",
  "founded_year": number | null,
  "key_features": ["..."],
  "competitors": ["..."],
  "tech_stack": ["..."],
  "funding_stage": "seed|series-a|..." | null,
  "funding_amount": "$X" | null,
  "employee_count": number | null,
  "category": "one word/phrase",
  "current_messaging_channels": ["email", ...],
  "github_url": "https://github.com/org/repo" | null,
  "partnership_potential": boolean,
  "pitch_angle": one of ${JSON.stringify(lens.angles.map((a) => a.angle))},
  "features": { "feature_name": boolean, ... },
  "signals": [
    { "signal_type": "snake_case_type", "source_url": "the page URL the fact came from",
      "detail": "the fact, quoting the page as closely as possible", "strength": 0.0-1.0 }
  ],
  "brief": "3-sentence synthesis"
}

HARD RULES — this feeds a grounding critic that flags unsourced claims as FABRICATED:
- ONLY state what the markdown actually contains. null/[] when absent. NEVER guess or invent.
- Every signal.detail must be traceable to the markdown text (quote or near-quote).
- funding_stage/funding_amount: null unless the page literally states them.
Lens (${lens.industry}) signal recipes to look for: ${lens.signalRecipes.slice(0, 4).join(" · ")}`;
}

function toStrArr(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => String(x)).filter((s) => s.length > 0).slice(0, 12) : [];
}

function coerceSignal(v: unknown, fallbackUrl: string): Signal | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const detail = String(o.detail ?? "").trim();
  if (!detail) return null;
  return {
    signal_type: String(o.signal_type ?? "scraped_fact"),
    source: "firecrawl:scrape",
    source_url: String(o.source_url ?? "") || fallbackUrl,
    detail: detail.slice(0, 500),
    strength: typeof o.strength === "number" ? Math.max(0, Math.min(1, o.strength)) : 0.6,
  };
}

function normalizeBrief(raw: unknown, url: string, industry: Industry): CompanyBrief {
  const o = (raw ?? {}) as Record<string, unknown>;
  const { domain, name: fallbackName } = displayNameFromHandle(url);
  const lens = getLens(industry);
  let pitch = String(o.pitch_angle ?? "");
  if (!(zPitchAngle.options as readonly string[]).includes(pitch)) {
    const fallback: string = lens.angles[0]?.angle ?? "multi_channel";
    console.warn(`[seam] node:enrich -> extractor pitch_angle "${pitch}" not in union -> defaulting to "${fallback}" (LOUD)`);
    pitch = fallback;
  }
  const signals = Array.isArray(o.signals)
    ? o.signals.map((s) => coerceSignal(s, url)).filter((s): s is Signal => s !== null).slice(0, 12)
    : [];
  const features: Record<string, boolean> = {};
  if (o.features && typeof o.features === "object") {
    for (const [k, v] of Object.entries(o.features as Record<string, unknown>)) features[k] = Boolean(v);
  }
  return {
    domain,
    name: String(o.name ?? "").trim() || fallbackName,
    url,
    what_they_do: String(o.what_they_do ?? "").trim() || "(extraction returned no description)",
    founded_year: typeof o.founded_year === "number" ? o.founded_year : null,
    key_features: toStrArr(o.key_features),
    competitors: toStrArr(o.competitors),
    tech_stack: toStrArr(o.tech_stack),
    funding_stage: typeof o.funding_stage === "string" && o.funding_stage ? o.funding_stage : null,
    funding_amount: typeof o.funding_amount === "string" && o.funding_amount ? o.funding_amount : null,
    employee_count: typeof o.employee_count === "number" ? o.employee_count : null,
    category: String(o.category ?? "unknown"),
    current_messaging_channels: toStrArr(o.current_messaging_channels),
    github_url: typeof o.github_url === "string" && o.github_url.includes("github.com") ? o.github_url : null,
    partnership_potential: Boolean(o.partnership_potential),
    pitch_angle: pitch as PitchAngle,
    features,
    signals,
    brief: String(o.brief ?? "").trim() || `${fallbackName} — extracted live from ${url}.`,
    industry,
  };
}

async function extractBriefLive(rawMarkdown: string, url: string, industry: Industry, ctx: NodeCtx): Promise<CompanyBrief> {
  const result = await generate(
    [
      { role: "system", content: extractionPrompt(industry) },
      { role: "user", content: `URL: ${url}\n\nScraped markdown:\n\n${rawMarkdown.slice(0, 14_000)}` },
    ],
    { model: MODELS.EXTRACT.model, temperature: 0.2, maxTokens: 1800, agentName: "extractor", runId: ctx.leadId },
  );
  const brief = normalizeBrief(parseJsonLoose(result.text, "enrich-extractor"), url, industry);
  console.log(
    `[seam] node:enrich -> extractor ${MODELS.EXTRACT.model} -> brief{name=${brief.name}, signals=${brief.signals.length}} -> ok`,
  );
  return brief;
}

export const enrichNode = defineNode({
  name: "enrich",
  sponsor: "Composio",
  wireNode: "enrich", // lights its own chip (Composio named on screen during the live pass)
  stubLatencyMs: 650,
  stubWhen: stubExplicit, // V2: LIVE default; stub only when STUB_MODE=1
  inputSchema: z.object({ url: z.string().min(1), rawMarkdown: z.string().min(1), industry: zIndustry }),
  outputSchema: z.object({ brief: zCompanyBrief }),
  async executor({ url, rawMarkdown, industry }, ctx) {
    const lens = getLens(industry);
    if (stubExplicit()) {
      console.log(`[stub] node:enrich canned output (lens: ${lens.industry}, ${lens.signalRecipes.length} recipes)`);
      return { brief: cannedBrief(url) };
    }
    // LIVE 1/2: extraction (failure here FAILS the run — no brief, no story).
    const brief = await extractBriefLive(rawMarkdown, url, industry, ctx);
    // LIVE 2/2: Composio news signals — degraded LOUDLY on failure, never fatal.
    try {
      const hits = await composioSearchNews(`${brief.name} ${lens.industry === "gtm" ? "startup" : lens.industry} news`);
      const newsSignals: Signal[] = hits.slice(0, 3).map((h) => ({
        signal_type: "news_mention",
        source: "composio:COMPOSIO_SEARCH_NEWS_SEARCH",
        source_url: h.url,
        detail: `${h.title}${h.snippet ? ` — ${h.snippet}` : ""}`.slice(0, 400),
        strength: 0.55,
      }));
      brief.signals.push(...newsSignals);
    } catch (err) {
      console.error(
        `[seam] node:enrich -> composio news -> ${(err as Error).message.slice(0, 120)} -> DEGRADED (no news signals this run; extraction signals stand)`,
      );
    }
    return { brief };
  },
});

export const reenrichNode = defineNode({
  name: "reenrich",
  sponsor: "Composio",
  wireNode: "reenrich",
  stubLatencyMs: 750,
  stubWhen: stubExplicit, // V2: LIVE default; stub only when STUB_MODE=1
  inputSchema: z.object({
    brief: zCompanyBrief,
    fabricatedClaims: z.array(z.string()).min(1),
    industry: zIndustry,
  }),
  outputSchema: z.object({ brief: zCompanyBrief, note: z.string() }),
  async executor({ brief, fabricatedClaims }) {
    if (stubExplicit()) {
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
    // LIVE: targeted Composio evidence hunt per fabricated claim (max 2 — the retry budget).
    const corrective: Signal[] = [];
    const noteParts: string[] = [];
    for (const claim of fabricatedClaims.slice(0, 2)) {
      const q = `${brief.name} ${claim}`.slice(0, 200);
      try {
        const hits = await composioSearchNews(q);
        if (hits.length === 0) {
          corrective.push({
            signal_type: "claim_check",
            source: "composio:COMPOSIO_SEARCH_NEWS_SEARCH",
            source_url: `https://news.google.com/search?q=${encodeURIComponent(q)}`,
            detail: `News search for "${claim}" returned ZERO results — no public source supports it. The claim must be CUT.`,
            strength: 0.85,
          });
          noteParts.push(`"${claim}": no source found — CUT it.`);
        } else {
          corrective.push(
            ...hits.slice(0, 3).map((h) => ({
              signal_type: "claim_check",
              source: "composio:COMPOSIO_SEARCH_NEWS_SEARCH",
              source_url: h.url,
              detail: `Re "${claim}" — ${h.title}${h.snippet ? `: ${h.snippet}` : ""}`.slice(0, 400),
              strength: 0.7,
            })),
          );
          noteParts.push(`"${claim}": ${hits.length} sources found — keep ONLY what these literally support.`);
        }
      } catch (err) {
        const msg = (err as Error).message.slice(0, 120);
        console.error(`[seam] node:reenrich -> composio search FAILED for "${claim}" -> ${msg} -> DEGRADED (claim stays unsupported)`);
        corrective.push({
          signal_type: "claim_check_failed",
          source: "composio:COMPOSIO_SEARCH_NEWS_SEARCH",
          source_url: "https://composio.dev",
          detail: `Evidence search FAILED for "${claim}" (${msg}) — the claim remains unsupported and must be CUT.`,
          strength: 0.5,
        });
        noteParts.push(`"${claim}": evidence search failed — CUT it.`);
      }
    }
    return {
      brief: { ...brief, signals: [...brief.signals, ...corrective] },
      note: `MUST-FIX (reenrich evidence hunt): ${noteParts.join(" ")}`,
    };
  },
});
