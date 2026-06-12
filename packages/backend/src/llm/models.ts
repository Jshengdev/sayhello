// llm/models.ts — model registry (ported pattern from doubles src/llm/models.ts).
// Single source of truth for which model each task uses. Swap a tier here → every caller re-routes.
//
// HELD-OUT CONSTRAINT (docs/CONSTRAINTS.md #2, the theme): the JUDGE model is a DIFFERENT
// model FAMILY than the DRAFTER — the agent never grades its own homework. Asserted at
// boot (server.ts) AND inside the judge node. Family = the OpenRouter slug prefix before "/"
// (per docs/OPEN-QUESTIONS.md: aliases resolve to canonical ids, so compare FAMILY, never id).
//
// All ids live-verified against https://openrouter.ai/api/v1/models on 2026-06-12.

export interface ModelChoice {
  /** OpenRouter model slug. */
  model: string;
  /** Optional OpenRouter provider preference (e.g. pin to Cerebras for speed). */
  provider?: { order: string[]; allow_fallbacks?: boolean };
}

export const MODELS = {
  // The STRONG drafter — writes the confident lead-story. Quality is the product.
  DRAFTER: { model: "anthropic/claude-sonnet-4.6" },

  // The held-out critic — DIFFERENT family than DRAFTER (openai vs anthropic).
  JUDGE: { model: "openai/gpt-5.4-mini" },

  // Cheap fast extraction — the 26-field CompanyBrief from scraped markdown
  // (the Pioneer parser FOLDED into one LLM call per docs/SCOPE-LOCK.md).
  EXTRACT: { model: "anthropic/claude-haiku-4.5" },
} satisfies Record<string, ModelChoice>;

export type ModelTier = keyof typeof MODELS;

/** Model family = slug prefix before "/" (anthropic, openai, google, qwen…). */
export function modelFamily(slug: string): string {
  return slug.split("/")[0] ?? slug;
}

/**
 * Throws if the drafter and judge share a model family (held-out judging violated).
 * Called at server boot AND inside the judge node executor — fail CLOSED.
 */
export function assertHeldOutCritic(): void {
  const drafterFam = modelFamily(MODELS.DRAFTER.model);
  const judgeFam = modelFamily(MODELS.JUDGE.model);
  if (drafterFam === judgeFam) {
    throw new Error(
      `[models] FATAL held-out violation: drafter (${MODELS.DRAFTER.model}) and judge ` +
        `(${MODELS.JUDGE.model}) are the same family "${drafterFam}" — the agent must never grade its own homework`,
    );
  }
  console.log(
    `[seam] held-out assert -> drafter=${MODELS.DRAFTER.model} (${drafterFam}) != judge=${MODELS.JUDGE.model} (${judgeFam}) -> ok`,
  );
}
