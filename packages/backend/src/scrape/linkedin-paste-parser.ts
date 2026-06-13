// @ts-nocheck — VERBATIM PORT from ~/code/doubles/src/scrape (docs/PERSON-SCRAPE-PORT.md: copy, don't rewrite).
// doubles compiles without noUncheckedIndexedAccess; runtime behavior is proven there. Off the demo line (fallback utilities).
// LinkedIn-profile paste parser.
//
// LinkedIn forbids scraping in 2026; instead the onboarding flow asks the user
// to copy-paste their public profile. This module extracts {headline, about,
// experience[]} from that paste.
//
// Lifted from gtm-tool/photon-gtm/agents/2-contacts/fallback_scrape.py — the
// regex extraction patterns (section headings, name/title bold pattern, etc).
// HeyReach MCP wrapper from the original is intentionally skipped.
//
// Two-stage extraction:
//   1. Regex first — fast, deterministic. Pulls Headline / About / Experience sections.
//   2. If regex misses headline OR about OR experience entirely, escalate to OpenRouter
//      with a strict JSON-extraction prompt. One retry on parse failure, then throw.
//
// FAIL LOUD per CLAUDE.md Rule 6:
//   - Empty input → throw.
//   - LLM escalation: same retry-once-then-throw pattern as src/agents/thinker.ts.
//   - Never return a partial empty record silently — at least one field must populate.

import { generate, type ChatMessage } from "../llm/openrouter.js";
import { log } from "../logger.js";

const PARSER_MODEL = "anthropic/claude-haiku-4.5";
const PARSER_TEMP = 0.2;
const PARSER_MAX_TOKENS = 1200;

export interface LinkedinExperience {
  /** Role title, e.g. "Senior Engineer". */
  title: string;
  /** Company name. */
  company: string;
  /** Free-text date range, e.g. "Jan 2020 - Present". May be empty. */
  date_range: string;
  /** Optional description blurb (1-3 sentences). May be empty. */
  description: string;
}

export interface LinkedinParseResult {
  headline: string;
  about: string;
  experience: LinkedinExperience[];
  /** Which path succeeded — useful for callers debugging onboarding quality. */
  source: "regex" | "llm";
}

export async function parseLinkedinPaste(rawText: string): Promise<LinkedinParseResult> {
  if (!rawText || rawText.trim().length === 0) {
    throw new Error("[linkedin] parseLinkedinPaste() received empty input — caller bug.");
  }

  log.debug("linkedin_parse_start", { rawLen: rawText.length });

  const regexAttempt = extractViaRegex(rawText);
  const regexCompleteEnough =
    regexAttempt.headline.length > 0 &&
    regexAttempt.about.length > 0 &&
    regexAttempt.experience.length > 0;

  if (regexCompleteEnough) {
    log.info("linkedin_parse_ok", {
      source: "regex",
      headlineLen: regexAttempt.headline.length,
      aboutLen: regexAttempt.about.length,
      experienceCount: regexAttempt.experience.length,
    });
    return { ...regexAttempt, source: "regex" };
  }

  log.info("linkedin_regex_incomplete_escalating_to_llm", {
    headlineFound: regexAttempt.headline.length > 0,
    aboutFound: regexAttempt.about.length > 0,
    experienceFound: regexAttempt.experience.length,
  });

  const llmResult = await extractViaLLM(rawText);
  // After LLM extraction, at least one of the three fields MUST be non-empty.
  // Returning all-empty silently would be exactly the kind of fallback Rule 6 forbids.
  if (
    llmResult.headline.length === 0 &&
    llmResult.about.length === 0 &&
    llmResult.experience.length === 0
  ) {
    throw new Error(
      `[linkedin] both regex and LLM extracted nothing usable — input likely not a LinkedIn paste. ` +
        `rawLen=${rawText.length} rawHead="${rawText.slice(0, 200)}"`,
    );
  }

  log.info("linkedin_parse_ok", {
    source: "llm",
    headlineLen: llmResult.headline.length,
    aboutLen: llmResult.about.length,
    experienceCount: llmResult.experience.length,
  });
  return { ...llmResult, source: "llm" };
}

function extractViaRegex(rawText: string): { headline: string; about: string; experience: LinkedinExperience[] } {
  const text = rawText.replace(/\r\n/g, "\n");

  // -- Headline -----------------------------------------------------------
  // Common paste patterns:
  //   "Headline: <text>"            (user-formatted)
  //   "<Name>\n<Headline line>"     (first non-empty line after a name line)
  let headline = "";
  const headlineLabel = text.match(/^\s*(?:Headline|Title|Tagline)\s*:\s*(.+)$/im);
  if (headlineLabel) {
    headline = headlineLabel[1].trim();
  } else {
    // Heuristic: a paste that starts with "Name\nHeadline" — take line 2 if
    // line 1 looks like a personal name (1-4 capitalized words).
    const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length >= 2 && /^[A-Z][a-z]+(?: [A-Z][a-zA-Z\-']+){0,3}$/.test(lines[0])) {
      const candidate = lines[1];
      if (candidate.length > 5 && candidate.length < 200 && !/^(About|Experience|Education)\b/i.test(candidate)) {
        headline = candidate;
      }
    }
  }

  // -- About --------------------------------------------------------------
  // Match "About\n<paragraph>" OR "About: <paragraph>" OR "Summary: <para>"
  // Capture everything up to the next section header (Experience / Education /
  // Skills / Recommendations / Contact / Licenses / Volunteer / Certifications).
  let about = "";
  const aboutMatch = text.match(
    /(?:^|\n)\s*(?:About|Summary|Bio)\s*:?\s*\n+([\s\S]*?)(?=\n\s*(?:Experience|Education|Skills|Recommendations|Licenses|Certifications|Volunteer|Contact|Languages|Projects|Publications)\b|\n{3,}|$)/i,
  );
  if (aboutMatch) {
    about = aboutMatch[1].trim();
  }

  // -- Experience ---------------------------------------------------------
  // Capture the Experience section blob first, then split into entries.
  let experience: LinkedinExperience[] = [];
  const expMatch = text.match(
    /(?:^|\n)\s*Experience\s*:?\s*\n+([\s\S]*?)(?=\n\s*(?:Education|Skills|Recommendations|Licenses|Certifications|Volunteer|Contact|Languages|Projects|Publications)\b|$)/i,
  );
  if (expMatch) {
    experience = splitExperienceBlock(expMatch[1]);
  }

  return { headline, about, experience };
}

function splitExperienceBlock(block: string): LinkedinExperience[] {
  const entries: LinkedinExperience[] = [];

  // Pattern A: bullet-style entries — "- Title at Company (Date)" or "- Title at Company\nDescription"
  const bulletPattern = /^\s*[-*•]\s*(.+?)(?:\n|$)([\s\S]*?)(?=^\s*[-*•]\s|$)/gm;

  let matched = false;
  let bm: RegExpExecArray | null;
  while ((bm = bulletPattern.exec(block)) !== null) {
    matched = true;
    const headerLine = bm[1].trim();
    const bodyBlock = bm[2].trim();
    const entry = parseExperienceHeader(headerLine);
    entry.description = bodyBlock.replace(/\s+/g, " ").trim().slice(0, 800);
    entries.push(entry);
  }

  if (matched && entries.length > 0) return entries;

  // Pattern B: paragraph-style — blank-line-separated entries.
  // Each entry's first line is the title/company/dates header.
  const paragraphs = block.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 0);
  for (const p of paragraphs) {
    const lines = p.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) continue;
    const entry = parseExperienceHeader(lines[0]);
    if (lines.length > 1) {
      // Could be "Company\nDates\nDescription" — try to peel dates if line 2 looks like a date.
      if (!entry.company && /^[A-Z]/.test(lines[1]) && lines[1].length < 80) {
        entry.company = lines[1];
      } else if (!entry.date_range && /\d{4}/.test(lines[1])) {
        entry.date_range = lines[1];
      }
      const rest = lines.slice(entry.company || entry.date_range ? 2 : 1).join(" ");
      entry.description = rest.replace(/\s+/g, " ").trim().slice(0, 800);
    }
    if (entry.title || entry.company) entries.push(entry);
  }

  return entries;
}

function parseExperienceHeader(line: string): LinkedinExperience {
  // Common shapes:
  //   "Senior Engineer at Acme (Jan 2020 - Present)"
  //   "Senior Engineer @ Acme, 2020-2024"
  //   "Senior Engineer, Acme — 2020-2024"
  const entry: LinkedinExperience = { title: "", company: "", date_range: "", description: "" };

  // Date range — anything that looks like "Year - Year" or "Year - Present"
  const dateMatch = line.match(/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\s*\d{4}\s*[-–—]\s*(?:Present|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\s*\d{4}))/i);
  let remaining = line;
  if (dateMatch) {
    entry.date_range = dateMatch[1].trim();
    remaining = remaining.replace(dateMatch[0], "").replace(/[()]/g, "").trim();
  }
  remaining = remaining.replace(/[,—–-]\s*$/, "").trim();

  // Title + Company split: " at " or " @ " or ", " or " — "
  const atSplit = remaining.split(/\s+(?:at|@)\s+/i);
  if (atSplit.length >= 2) {
    entry.title = atSplit[0].trim();
    entry.company = atSplit[1].replace(/,\s*$/, "").trim();
    return entry;
  }
  const commaSplit = remaining.split(/,\s+/);
  if (commaSplit.length >= 2) {
    entry.title = commaSplit[0].trim();
    entry.company = commaSplit.slice(1).join(", ").trim();
    return entry;
  }
  const dashSplit = remaining.split(/\s+[—–-]\s+/);
  if (dashSplit.length >= 2) {
    entry.title = dashSplit[0].trim();
    entry.company = dashSplit[1].trim();
    return entry;
  }

  // Couldn't split — treat the whole line as the title.
  entry.title = remaining.trim();
  return entry;
}

async function extractViaLLM(rawText: string): Promise<{ headline: string; about: string; experience: LinkedinExperience[] }> {
  const systemPrompt = buildLLMPrompt();
  const userPrompt = `Paste below — extract structured fields per the schema:\n\n${rawText.slice(0, 8000)}`;

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  let raw = await generate(messages, {
    model: PARSER_MODEL,
    temperature: PARSER_TEMP,
    maxTokens: PARSER_MAX_TOKENS,
    agentName: "linkedin-paste-parser",
  });

  let parsed = tryParse(raw.text);

  if (!parsed) {
    log.warn("linkedin_llm_parse_failed_attempt_1", { rawText: raw.text.slice(0, 200) });
    const strictMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content:
          "STRICT: respond with ONLY a single JSON object matching the schema. No markdown fences. No commentary. The paste was:\n\n" +
          rawText.slice(0, 8000),
      },
    ];
    raw = await generate(strictMessages, {
      model: PARSER_MODEL,
      temperature: PARSER_TEMP,
      maxTokens: PARSER_MAX_TOKENS,
      agentName: "linkedin-paste-parser-retry",
    });
    parsed = tryParse(raw.text);
  }

  if (!parsed) {
    throw new Error(
      `[linkedin] FATAL: LLM failed to return parseable JSON after retry. rawText=${raw.text.slice(0, 200)}`,
    );
  }

  return normalizeLLMOutput(parsed);
}

function tryParse(raw: string): unknown | null {
  if (!raw) return null;
  const text = raw.trim();
  try {
    return JSON.parse(text);
  } catch {
    /* fall through */
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      return null;
    }
  }
  return null;
}

function normalizeLLMOutput(obj: unknown): { headline: string; about: string; experience: LinkedinExperience[] } {
  const o = (obj ?? {}) as Record<string, unknown>;
  const headline = String(o.headline ?? "").trim();
  const about = String(o.about ?? "").trim();
  if (o.experience !== undefined && o.experience !== null && !Array.isArray(o.experience)) {
    log.warn("linkedin_llm_schema_violation", {
      field: "experience",
      got: typeof o.experience,
      value: JSON.stringify(o.experience).slice(0, 100),
    });
  }
  const expRaw = Array.isArray(o.experience) ? o.experience : [];
  const experience: LinkedinExperience[] = expRaw.map((e) => {
    const x = (e ?? {}) as Record<string, unknown>;
    return {
      title: String(x.title ?? "").trim(),
      company: String(x.company ?? "").trim(),
      date_range: String(x.date_range ?? "").trim(),
      description: String(x.description ?? "").trim(),
    };
  });
  return { headline, about, experience };
}

function buildLLMPrompt(): string {
  return `You extract structured profile data from a LinkedIn profile paste.

The user pastes their public LinkedIn profile as freeform text. Extract:
- headline: the one-line tagline below their name (e.g. "Software Engineer at Acme")
- about: the longer "About" / "Summary" paragraph
- experience: list of past roles

Respond with ONLY a single JSON object. No markdown fences, no commentary.

Schema:
{
  "headline": "string — empty if not present",
  "about": "string — empty if not present",
  "experience": [
    {
      "title": "role title",
      "company": "company name",
      "date_range": "e.g. Jan 2020 - Present, or empty",
      "description": "1-3 sentence blurb if present, else empty"
    }
  ]
}

Rules:
- If a field is genuinely absent in the paste, return an empty string (NOT null, NOT 'unknown').
- If experience section is absent, return an empty array.
- Do NOT invent or guess. Empty is correct when info is missing.`;
}
