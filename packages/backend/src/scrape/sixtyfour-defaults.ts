import type { SixtyFourStruct } from "./sixtyfour.js";

// Canonical struct fields for Doubles impersonator-onboarding enrichment.
// These map cleanly to our shadow_entities + user_timeline_events extraction
// pipeline (Stage 1.2). Descriptions are written to elicit SixtyFour-style
// structured output. Use this for all standard enrichments.
export const DOUBLES_STRUCT_DEFAULTS: SixtyFourStruct = {
  github_username: "Their GitHub username if discoverable",
  instagram_handle: "Their Instagram handle if discoverable",
  x_handle: "Their X / Twitter handle if discoverable",
  portfolio_url: "Their personal portfolio or website URL",
  productHunt_handle: "Their ProductHunt handle if discoverable",
  current_roles:
    "List of current professional roles. For each: company, title, start_date",
  past_roles:
    "List of past professional roles. For each: company, title, start_date, end_date",
  education_history:
    "List of schools attended. For each: institution, degree_or_major, start_year, end_year",
  side_projects:
    "List of personal side projects. For each: name, description, url_if_any",
  timeline_milestones:
    "Chronological list of significant life/career events. For each: year, month (if known), description, source_url, confidence",
  self_identification:
    "How the person describes themselves (from bios, social posts)",
  stated_opinions_or_themes:
    "Notable opinions or recurring themes from their public posts",
  discovery_provenance:
    "How each major fact was found — chain of which source led to which next source",
};
