// scrape/person.ts — the V2 parallel person stage (docs/PERSON-SCRAPE-PORT.md + docs/FINAL-PROMPT.md).
// Runs IN PARALLEL with the company scrape (kicked off by the orchestrator before [scrape]):
//   Promise.all-shaped fan-out: getLead(linkedinUrl) [HeyReach] · fetchUserTweets(xHandle, 30) [X]
//   · enrichPerson(...) [SixtyFour, tier=low].
// EVERY person fact becomes a Signal { source: "heyreach"|"x"|"sixtyfour", source_url, detail } that
// rides scrape_done's brief — no new node, no new WsEvent (docs/SCENARIOS.md §person-scrape).
//
// Reality rules (docs/SCENARIOS.md): person scrape is slow/flaky ->
//   - missing person inputs  -> SKIP the stage with a LOUD log + visible degraded provenance, never crash
//   - live success           -> write-through cache data/leads/person-<slug>.json
//   - cache present on rerun -> PREFER the cache, log [cache] LOUDLY (PERSON_REFRESH=1 forces live)
//   - per-source failure     -> loud degraded log; the other sources still merge (allSettled, not crash)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { PersonBrief, RunInput, Signal } from "../types.js";
import { getLead, type HeyReachLead } from "./heyreach.js";
import { enrichPerson, type SixtyFourResponse } from "./sixtyfour.js";
import { fetchUserTweets, type XUserTweet } from "./x.js";

// repo-root data/leads (src/scrape -> src -> backend -> packages -> sayhello)
const LEADS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../data/leads");
const SIXTYFOUR_BUDGET_MS = 60_000; // SixtyFour low tier is sync but slow; cap so the demo never stalls

export interface PersonStageResult {
  person: PersonBrief | null;
  signals: Signal[];
  /** Visible degraded notice ("" when fully live/cached-clean). */
  degraded: string[];
}

interface PersonCacheFile {
  fetchedAt: string;
  inputs: { name?: string; linkedinUrl?: string; xHandle?: string };
  person: PersonBrief;
  signals: Signal[];
  degraded: string[];
}

function personSlug(p: NonNullable<RunInput["person"]>): string {
  const basis = p.linkedinUrl ?? p.xHandle ?? p.name ?? "unknown";
  return basis
    .replace(/^https?:\/\//, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 60);
}

function heyreachSignals(lead: HeyReachLead): Signal[] {
  const url = lead.profileUrl;
  const sig = (signal_type: string, detail: string, strength = 0.8): Signal => ({
    signal_type,
    source: "heyreach",
    source_url: url,
    detail,
    strength,
  });
  const out: Signal[] = [];
  const name = [lead.firstName, lead.lastName].filter(Boolean).join(" ");
  if (name) out.push(sig("person_identity", `LinkedIn profile: ${name}${lead.headline ? ` — ${lead.headline}` : ""}`));
  if (lead.currentTitle || lead.currentCompany) {
    out.push(sig("person_role", `Current role: ${lead.currentTitle ?? "?"} at ${lead.currentCompany ?? "?"}`));
  }
  if (lead.location) out.push(sig("person_location", `Based in ${lead.location}`, 0.7));
  if (lead.about) out.push(sig("person_about", `LinkedIn About (verbatim): ${lead.about.slice(0, 500)}`, 0.75));
  for (const e of (lead.experience ?? []).slice(0, 5)) {
    if (e.company || e.title) {
      out.push(
        sig(
          "person_experience",
          `Experience: ${e.title || "?"} at ${e.company || "?"}${e.startDate ? ` (${e.startDate}${e.endDate ? `–${e.endDate}` : "–present"})` : ""}`,
          0.65,
        ),
      );
    }
  }
  return out;
}

function xSignals(handle: string, tweets: XUserTweet[]): Signal[] {
  const clean = handle.trim().replace(/^@/, "");
  return tweets.slice(0, 10).map((t) => ({
    signal_type: "x_post",
    source: "x",
    source_url: `https://x.com/${clean}/status/${t.id}`,
    detail: `X post (verbatim, ${t.createdAt || "recent"}): ${t.text.slice(0, 400)}`,
    strength: 0.6,
  }));
}

function sixtyfourSignals(resp: SixtyFourResponse, fallbackUrl: string): Signal[] {
  const out: Signal[] = [];
  const refs = resp.references ?? {};
  const firstRef = Object.values(refs)[0] ?? fallbackUrl;
  for (const [key, value] of Object.entries(resp.structured_data)) {
    if (value === null || value === undefined || value === "") continue;
    const detail = typeof value === "string" ? value : JSON.stringify(value);
    if (detail.length < 3) continue;
    out.push({
      signal_type: `person_${key}`,
      source: "sixtyfour",
      source_url: refs[key] ?? firstRef,
      detail: `${key}: ${detail.slice(0, 400)}`,
      strength: Math.min(0.9, 0.5 + (resp.confidence_score ?? 5) / 20),
    });
  }
  return out.slice(0, 12);
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)),
  ]);
}

/**
 * The person stage. NEVER throws — every failure path returns a loud degraded result so the
 * company run survives. The orchestrator merges person fields + signals onto the brief.
 */
export async function runPersonStage(personInput: RunInput["person"]): Promise<PersonStageResult> {
  if (!personInput || (!personInput.linkedinUrl && !personInput.xHandle && !personInput.name)) {
    const why = "no person inputs on the run (linkedinUrl/xHandle/name all absent)";
    console.warn(`[seam] person -> SKIPPED -> ${why} -> degraded (company-only run, visible notice)`);
    return { person: null, signals: [], degraded: [`person stage skipped: ${why}`] };
  }

  const slug = personSlug(personInput);
  const cacheFile = path.join(LEADS_DIR, `person-${slug}.json`);

  // Prefer the cache on rerun — person scrape is slow/flaky (LOUD, per docs/PERSON-SCRAPE-PORT.md).
  if (process.env.PERSON_REFRESH !== "1" && fs.existsSync(cacheFile)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cacheFile, "utf8")) as PersonCacheFile;
      console.log(
        `[cache] person -> PREFERRING data/leads/person-${slug}.json from ${cached.fetchedAt} (${cached.signals.length} signals; PERSON_REFRESH=1 forces live) -> ok`,
      );
      return {
        person: { ...cached.person, provenance: `cache:data/leads/person-${slug}.json (${cached.fetchedAt})` },
        signals: cached.signals,
        degraded: cached.degraded,
      };
    } catch (err) {
      console.error(`[cache] person -> data/leads/person-${slug}.json unreadable (${(err as Error).message}) -> going live`);
    }
  }

  const t0 = Date.now();
  console.log(
    `[seam] person enter -> {linkedin:${Boolean(personInput.linkedinUrl)}, x:${Boolean(personInput.xHandle)}, sixtyfour:${Boolean(
      personInput.name && process.env.SIXTYFOUR_API_KEY,
    )}} (sponsors: HeyReach + X + SixtyFour, parallel with company scrape)`,
  );

  const degraded: string[] = [];
  const signals: Signal[] = [];

  // The FINAL-PROMPT Promise.all fan-out — allSettled so one flaky source degrades LOUDLY, not fatally.
  const [leadRes, tweetsRes, sixtyRes] = await Promise.allSettled([
    personInput.linkedinUrl
      ? getLead(personInput.linkedinUrl)
      : Promise.reject(new Error("no linkedinUrl on run input")),
    personInput.xHandle
      ? fetchUserTweets(personInput.xHandle, 30)
      : Promise.reject(new Error("no xHandle on run input")),
    personInput.name && process.env.SIXTYFOUR_API_KEY
      ? withTimeout(
          enrichPerson(
            {
              name: personInput.name,
              ...(personInput.linkedinUrl ? { linkedin: personInput.linkedinUrl } : {}),
            },
            {
              current_roles: "Current professional roles: company, title",
              self_identification: "How the person describes themselves (bios, posts)",
              stated_opinions_or_themes: "Notable opinions or recurring themes from their public posts",
            },
            "low",
          ),
          SIXTYFOUR_BUDGET_MS,
          "[sixtyfour]",
        )
      : Promise.reject(new Error(personInput.name ? "SIXTYFOUR_API_KEY missing" : "no person name on run input")),
  ]);

  let person: PersonBrief = {
    name: personInput.name ?? null,
    linkedinUrl: personInput.linkedinUrl ?? null,
    xHandle: personInput.xHandle ?? null,
    headline: null,
    company: null,
    title: null,
    location: null,
    summary: null,
    provenance: "live",
  };

  if (leadRes.status === "fulfilled") {
    const lead = leadRes.value;
    person = {
      ...person,
      name: [lead.firstName, lead.lastName].filter(Boolean).join(" ") || person.name,
      headline: lead.headline ?? null,
      company: lead.currentCompany ?? null,
      title: lead.currentTitle ?? null,
      location: lead.location ?? null,
      summary: lead.about ?? null,
    };
    const sigs = heyreachSignals(lead);
    signals.push(...sigs);
    console.log(`[seam] person -> heyreach getLead -> ${sigs.length} signals -> ok`);
  } else {
    const why = leadRes.reason instanceof Error ? leadRes.reason.message : String(leadRes.reason);
    console.warn(`[seam] person -> heyreach getLead -> ${why.slice(0, 160)} -> DEGRADED (visible notice)`);
    degraded.push(`heyreach: ${why.slice(0, 120)}`);
  }

  if (tweetsRes.status === "fulfilled") {
    const sigs = xSignals(personInput.xHandle ?? "", tweetsRes.value);
    signals.push(...sigs);
    console.log(`[seam] person -> x fetchUserTweets -> ${tweetsRes.value.length} tweets, ${sigs.length} signals -> ok`);
  } else {
    const why = tweetsRes.reason instanceof Error ? tweetsRes.reason.message : String(tweetsRes.reason);
    console.warn(`[seam] person -> x fetchUserTweets -> ${why.slice(0, 160)} -> DEGRADED (visible notice)`);
    degraded.push(`x: ${why.slice(0, 120)}`);
  }

  if (sixtyRes.status === "fulfilled") {
    const sigs = sixtyfourSignals(sixtyRes.value, personInput.linkedinUrl ?? "https://sixtyfour.ai");
    signals.push(...sigs);
    console.log(`[seam] person -> sixtyfour enrichPerson -> ${sigs.length} signals (charge=${sixtyRes.value.charge_amount ?? "?"}c) -> ok`);
  } else {
    const why = sixtyRes.reason instanceof Error ? sixtyRes.reason.message : String(sixtyRes.reason);
    console.warn(`[seam] person -> sixtyfour enrichPerson -> ${why.slice(0, 160)} -> DEGRADED (visible notice)`);
    degraded.push(`sixtyfour: ${why.slice(0, 120)}`);
  }

  console.log(
    `[seam] person exit -> ${signals.length} signals, ${degraded.length} degraded sources -> ${signals.length > 0 ? "ok" : "DEGRADED"} (${Date.now() - t0}ms)`,
  );

  if (signals.length === 0) {
    return { person: { ...person, provenance: `skipped:all person sources failed (${degraded.join("; ")})` }, signals, degraded };
  }

  // Write-through cache: run live ONCE, replay from cache after (demo-safe).
  try {
    fs.mkdirSync(LEADS_DIR, { recursive: true });
    const file: PersonCacheFile = {
      fetchedAt: new Date().toISOString(),
      inputs: personInput,
      person,
      signals,
      degraded,
    };
    fs.writeFileSync(cacheFile, JSON.stringify(file, null, 2));
    console.log(`[cache] person -> wrote data/leads/person-${slug}.json (${signals.length} signals) -> ok`);
  } catch (err) {
    console.error(`[cache] person -> write data/leads/person-${slug}.json -> FAIL (${(err as Error).message})`);
  }

  return { person, signals, degraded };
}
