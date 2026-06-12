// API contract per https://api.sixtyfour.ai/people-intelligence:
// POST { lead_info: {...}, struct: {...}, tier?: "low"|"medium"|"high" }
// Auth: x-api-key header
// Response: { structured_data, notes, references, confidence_score, charge_amount? }
//
// `charge_amount` is in CENTS not credits (founder note: 100 credits = $24 = 1 credit = 24 cents).
// We log charge_amount per call so the founder can reconcile spend against their balance.

import { log } from "../logger.js";

const SIXTYFOUR_API_URL = "https://api.sixtyfour.ai/people-intelligence";
// SixtyFour's deeper tiers (medium/high) run multi-source research synchronously
// and can take 60-180s. Cap generously to avoid burning credits on timeout aborts
// where the API completes server-side but our client gives up.
const REQUEST_TIMEOUT_MS = 300_000;

const SIXTYFOUR_API_KEY = process.env.SIXTYFOUR_API_KEY;

export type SixtyFourTier = "low" | "medium" | "high";

export interface SixtyFourLeadInfo {
  name: string;
  linkedin?: string;
  title?: string;
  company?: string;
  location?: string;
}

export type SixtyFourStruct = Record<string, string | { description: string; type?: string }>;

export interface SixtyFourResponse {
  structured_data: Record<string, unknown>;
  notes?: string;
  references?: Record<string, string>;
  confidence_score?: number; // 0-10
  charge_amount?: number; // cents
  // Other fields may appear; we don't enumerate everything — preserve unknown fields in `raw`.
  raw: unknown; // full original response for cache replay
}

export async function enrichPerson(
  leadInfo: SixtyFourLeadInfo,
  struct: SixtyFourStruct,
  tier: SixtyFourTier = "low",
): Promise<SixtyFourResponse> {
  if (!SIXTYFOUR_API_KEY) {
    throw new Error(
      "[sixtyfour] SIXTYFOUR_API_KEY is not set — add it to .env before calling enrichPerson()",
    );
  }
  // Hard guard against accidental expensive-tier burns. Per 2026-05-22 reality
  // check (founder dashboard): tier=medium charged 20 credits per call EVEN
  // when our client aborted client-side — SixtyFour charges on receipt + does
  // server-side completion regardless. 2 medium aborts = 40 credits = $9.60
  // gone. To use tier=medium / tier=high intentionally, set
  // SIXTYFOUR_EXPENSIVE_TIER_OK=1 in the environment. Also: tier=medium/high
  // need the async endpoint (poll task_id) — sync at those tiers exceeds
  // every reasonable timeout. See docs/planning/api-credit-ledger.md.
  if (tier !== "low" && process.env.SIXTYFOUR_EXPENSIVE_TIER_OK !== "1") {
    throw new Error(
      `[sixtyfour] refusing to call tier="${tier}" without SIXTYFOUR_EXPENSIVE_TIER_OK=1. ` +
        `tier=medium charged 20 credits ($4.80) per call in past attempts and the sync endpoint ` +
        `times out anyway — use the async variant or stick to tier=low. ` +
        `Override by setting SIXTYFOUR_EXPENSIVE_TIER_OK=1 if you know what you're doing.`,
    );
  }

  log.info("sixtyfour_call_start", {
    name: leadInfo.name,
    tier,
    structFieldCount: Object.keys(struct).length,
    apiKeyPresent: Boolean(SIXTYFOUR_API_KEY),
  });

  const startMs = Date.now();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    try {
      response = await fetch(SIXTYFOUR_API_URL, {
        method: "POST",
        headers: {
          "x-api-key": SIXTYFOUR_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lead_info: leadInfo, struct, tier }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const bodySnippet = (await response.text()).slice(0, 500);
      throw new Error(
        `[sixtyfour] non-200 response: POST ${SIXTYFOUR_API_URL} → ${response.status} ${response.statusText}. body=${bodySnippet}`,
      );
    }

    let raw: unknown;
    try {
      raw = await response.json();
    } catch (parseErr) {
      throw new Error(
        `[sixtyfour] failed to parse JSON response: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`,
      );
    }

    const parsed = raw as Record<string, unknown>;

    if (!parsed.structured_data || typeof parsed.structured_data !== "object") {
      throw new Error(
        `[sixtyfour] response missing required field 'structured_data'. response keys: ${Object.keys(parsed).join(", ")}`,
      );
    }

    const result: SixtyFourResponse = {
      structured_data: parsed.structured_data as Record<string, unknown>,
      notes: typeof parsed.notes === "string" ? parsed.notes : undefined,
      references:
        parsed.references && typeof parsed.references === "object"
          ? (parsed.references as Record<string, string>)
          : undefined,
      confidence_score:
        typeof parsed.confidence_score === "number" ? parsed.confidence_score : undefined,
      charge_amount:
        typeof parsed.charge_amount === "number" ? parsed.charge_amount : undefined,
      raw,
    };

    const latencyMs = Date.now() - startMs;

    log.info("sixtyfour_call_complete", {
      name: leadInfo.name,
      tier,
      chargeCents: result.charge_amount ?? null,
      confidenceScore: result.confidence_score ?? null,
      structuredDataKeyCount: Object.keys(result.structured_data).length,
      referenceCount: Object.keys(result.references ?? {}).length,
      latencyMs,
    });

    return result;
  } catch (err) {
    const latencyMs = Date.now() - startMs;
    log.error("sixtyfour_call_failed", err, { name: leadInfo.name, tier, latencyMs });
    throw err;
  }
}
