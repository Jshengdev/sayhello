// recall/storyRecord.ts — the Airbyte recall ADD-ON normalizer (worktree feat/airbyte-recall).
//
// A grounded sayhello story lives in `data/leads/*.json` in two physical shapes:
//   1. "brief"  — a CompanyBrief fixture: { name, industry, pitch_angle, signals[], what_they_do,
//                  _planted (the one plausible-but-unsourced claim) }.
//   2. "tape"   — a replay tape: { run: StoryRun, ... } where run.score.fabricatedClaims is the
//                  held-out Critic's verdict (the money shot) and run.story is the drafted story.
//
// This module flattens EITHER shape into ONE flat StoryRecord — the unit of recall memory. That
// record is what we write to Notion (one page per story) and what the /recall route renders.
//
// NO silent stubs: a file we can't classify is SKIPPED with a logged reason, never coerced into a
// fake record. The caller sees the skip list.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { log } from "../logger.js";

// repo-root data/ (src/recall -> src -> backend -> packages -> sayhello-airbyte)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
export const LEADS_DIR = path.join(ROOT, "data", "leads");
export const RECALL_DIR = path.join(ROOT, "data", "recall");

/** The flat unit of GTM memory — one grounded story, recall-shaped. */
export interface StoryRecord {
  /** stable id: the leadId (tape) or the source filename stem (brief). */
  id: string;
  /** human lead name ("Lindy", "RE-1 — boutique off-market team"). */
  lead: string;
  /** person we'd reach, if the story carried one (else null). */
  person: string | null;
  industry: "gtm" | "realestate" | "marketing" | "unknown";
  category: string | null;
  /** the recurring PAINS — signal details (the corpus the Critic grounds against). */
  pains: string[];
  /** the chosen outreach angle. */
  angle: string | null;
  /** 0..1 held-out grounding score, or null if this story was never judged. */
  groundingScore: number | null;
  /** emit | regen | null (never judged). */
  verdict: string | null;
  /** the ONE-LINE key grounded fact (best signal / story opener) the panel surfaces. */
  keyFact: string;
  /** claims that survived grounding (story prose when judged; else what_they_do summary). */
  groundedClaims: string[];
  /** the money shot: claims the Critic flagged FABRICATED, or the planted unsourced claim. */
  fabricatedClaims: string[];
  /** "fixture-brief" | "replay-tape" — honest provenance, never hidden. */
  source: string;
  /** the source file (relative to repo root) for traceability. */
  sourceFile: string;
  /** filled in AFTER a Notion write — the page URL, else null. */
  notionUrl: string | null;
}

type Json = Record<string, unknown>;

function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function cleanName(raw: string | null): string | null {
  if (!raw) return null;
  // fixtures carry a "// JOHNNY-EDITABLE" trailing comment — strip it for the record.
  return (raw.split("//")[0] ?? raw).trim() || null;
}

/** A CompanyBrief fixture -> StoryRecord. */
function fromBrief(d: Json, file: string): StoryRecord | null {
  const name = cleanName(asString(d.name));
  const signals = Array.isArray(d.signals) ? (d.signals as Json[]) : [];
  if (!name || signals.length === 0) return null; // not enough to be a story

  const pains = signals
    .map((s) => asString(s.detail))
    .filter((x): x is string => !!x);

  const planted = asString(d._planted);
  const industry = (asString(d.industry) as StoryRecord["industry"]) ?? "unknown";
  const whatTheyDo = asString(d.what_they_do);
  const personBrief = d.person as Json | null | undefined;
  const personName = personBrief ? asString(personBrief.name) : null;

  const stem = path.basename(file).replace(/\.json$/, "");

  return {
    id: stem,
    lead: name,
    person: personName,
    industry,
    category: asString(d.category),
    pains,
    angle: asString(d.pitch_angle),
    groundingScore: null, // a brief fixture is pre-judge: no held-out score yet
    verdict: null,
    keyFact: pains[0] ?? whatTheyDo ?? name,
    groundedClaims: whatTheyDo ? [whatTheyDo] : [],
    // the planted claim IS the fabricated/rejected claim this fixture is designed to expose.
    fabricatedClaims: planted ? [planted] : [],
    source: "fixture-brief",
    sourceFile: path.relative(ROOT, file),
    notionUrl: null,
  };
}

/** A replay tape (run: StoryRun) -> StoryRecord. Prefers the judged verdict. */
function fromTape(d: Json, file: string): StoryRecord | null {
  const run = d.run as Json | undefined;
  if (!run || typeof run !== "object") return null;

  const brief = (run.brief as Json | null) ?? (d.brief as Json | null) ?? null;
  const name = cleanName(brief ? asString(brief.name) : null) ?? asString(run.url) ?? asString(d.url);
  if (!name) return null;

  const signals = brief && Array.isArray(brief.signals) ? (brief.signals as Json[]) : [];
  // A FAILED tape with nothing scraped (no story, no brief, no signals) is not a recallable story —
  // skip it so a fixture brief with the same lead carries the memory instead. No silent junk record.
  if (!asString(run.story) && signals.length === 0) return null;
  const pains = signals.map((s) => asString(s.detail)).filter((x): x is string => !!x);

  const score = run.score as Json | null;
  const grounding = score && typeof score.grounding === "number" ? (score.grounding as number) : null;
  const verdict = score ? asString(score.verdict) : null;
  const fabricated =
    score && Array.isArray(score.fabricatedClaims)
      ? (score.fabricatedClaims as unknown[]).map(String)
      : [];

  const story = asString(run.story);
  const storyOpener = story ? story.split("\n").map((l) => l.trim()).filter(Boolean)[0] ?? story.slice(0, 160) : null;
  const industry = (asString(d.industry) as StoryRecord["industry"]) ?? "unknown";
  const personBrief = brief ? (brief.person as Json | null | undefined) : null;

  return {
    id: asString(run.leadId) ?? path.basename(file).replace(/\.json$/, ""),
    lead: name,
    person: personBrief ? asString(personBrief.name) : null,
    industry,
    category: brief ? asString(brief.category) : null,
    pains,
    angle: asString(run.pitch_angle) ?? (brief ? asString(brief.pitch_angle) : null),
    groundingScore: grounding,
    verdict,
    keyFact: storyOpener ?? pains[0] ?? name,
    groundedClaims: story ? [story] : [],
    fabricatedClaims: fabricated,
    source: "replay-tape",
    sourceFile: path.relative(ROOT, file),
    notionUrl: null,
  };
}

/** Classify + normalize ONE file. Returns null (with a logged skip) if it isn't a story. */
export function recordFromFile(file: string): StoryRecord | null {
  let d: Json;
  try {
    d = JSON.parse(fs.readFileSync(file, "utf8")) as Json;
  } catch (err) {
    log.error("recall.normalize.parse_failed", err, { file });
    return null;
  }
  if (!d || typeof d !== "object") return null;

  // tape shape wins (it carries the judged verdict).
  if ("run" in d && "events" in d) {
    const rec = fromTape(d, file);
    if (!rec) log.warn("recall.normalize.skip", { file, reason: "tape has no usable run/brief" });
    return rec;
  }
  // brief fixture shape.
  if ("signals" in d && "pitch_angle" in d) {
    const rec = fromBrief(d, file);
    if (!rec) log.warn("recall.normalize.skip", { file, reason: "brief missing name/signals" });
    return rec;
  }
  // raw scrape markdown / person brief / other — not a story record.
  log.info("recall.normalize.skip", { file, reason: "not a story shape (scrape/person/other)" });
  return null;
}

/**
 * Load every grounded story from data/leads/*.json, normalized + de-duped.
 * De-dupe rule: a replay tape for a fixture (same lead name) supersedes the brief — the tape carries
 * the held-out judge verdict. Within tapes for the same lead, the highest grounding wins.
 */
export function loadAllRecords(): StoryRecord[] {
  if (!fs.existsSync(LEADS_DIR)) {
    log.error("recall.load.no_leads_dir", new Error(`missing ${LEADS_DIR}`), { dir: LEADS_DIR });
    return [];
  }
  const files = fs
    .readdirSync(LEADS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.join(LEADS_DIR, f));

  const records: StoryRecord[] = [];
  for (const f of files) {
    const rec = recordFromFile(f);
    if (rec) records.push(rec);
  }

  // de-dupe by lowercased lead name, keeping the RICHER record. Richness = a judged grounding score
  // + a chosen angle + named fabricated claims. A JUDGED tape supersedes a brief (it carries the
  // held-out verdict); but a FAILED tape (no story, no angle, no score) must NOT bury the brief
  // fixture that actually has the pains + angle + planted claim.
  const richness = (r: StoryRecord): number =>
    (r.groundingScore !== null ? 4 : 0) +
    (r.angle ? 2 : 0) +
    (r.fabricatedClaims.length > 0 ? 2 : 0) +
    (r.groundedClaims.length > 0 ? 1 : 0) +
    Math.min(1, r.pains.length);
  const byLead = new Map<string, StoryRecord>();
  for (const rec of records) {
    const key = rec.lead.toLowerCase();
    const prev = byLead.get(key);
    if (!prev || richness(rec) > richness(prev)) byLead.set(key, rec);
  }

  const out = [...byLead.values()].sort((a, b) => a.lead.localeCompare(b.lead));
  log.info("recall.load.ok", { files: files.length, records: out.length });
  return out;
}

/** Lowercase haystack of every searchable field — used by the Notion-fallback text filter. */
export function searchableText(rec: StoryRecord): string {
  return [
    rec.lead,
    rec.person ?? "",
    rec.industry,
    rec.category ?? "",
    rec.angle ?? "",
    rec.keyFact,
    ...rec.pains,
    ...rec.groundedClaims,
    ...rec.fabricatedClaims,
  ]
    .join(" • ")
    .toLowerCase();
}
