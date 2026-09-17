import type {
  ClaimType,
  EvidenceType,
  VerificationStatus,
} from "../types";
import type { BadgeTone } from "../components/ui/Badge";

export type Meta = { label: string; tone: BadgeTone };

export const projectStatus: Record<string, Meta> = {
  active: { label: "Active", tone: "indigo" },
  planning: { label: "Planning", tone: "blue" },
  paused: { label: "Paused", tone: "amber" },
  completed: { label: "Completed", tone: "green" },
  archived: { label: "Archived", tone: "gray" },
};

export const sourceType: Record<string, Meta> = {
  web: { label: "Web", tone: "gray" },
  paper: { label: "Paper", tone: "indigo" },
  book: { label: "Book", tone: "blue" },
  report: { label: "Report", tone: "green" },
  video: { label: "Video", tone: "amber" },
  interview: { label: "Interview", tone: "purple" },
  dataset: { label: "Dataset", tone: "cyan" },
  other: { label: "Other", tone: "gray" },
};

export const evidenceType: Record<EvidenceType, Meta> = {
  directQuote: { label: "Direct quote", tone: "indigo" },
  paraphrase: { label: "Paraphrase", tone: "blue" },
  statistic: { label: "Statistic", tone: "green" },
  researcherObservation: { label: "Researcher observation", tone: "amber" },
  data: { label: "Data point", tone: "green" },
  observation: { label: "Observation", tone: "amber" },
  result: { label: "Result", tone: "gray" },
  other: { label: "Other", tone: "gray" },
};

export const verificationStatus: Record<VerificationStatus, Meta> = {
  unverified: { label: "Unverified", tone: "amber" },
  partiallyVerified: { label: "Partially verified", tone: "blue" },
  verified: { label: "Verified", tone: "green" },
  disputed: { label: "Disputed", tone: "red" },
};

export const questionStatus: Record<string, Meta> = {
  open: { label: "Open", tone: "blue" },
  investigating: { label: "Investigating", tone: "amber" },
  answered: { label: "Answered", tone: "green" },
  parked: { label: "Parked", tone: "gray" },
};

export const priority: Record<string, Meta> = {
  low: { label: "Low", tone: "gray" },
  medium: { label: "Medium", tone: "blue" },
  high: { label: "High", tone: "amber" },
  critical: { label: "Critical", tone: "red" },
};

export const hypothesisStatus: Record<string, Meta> = {
  proposed: { label: "Proposed", tone: "gray" },
  testing: { label: "Testing", tone: "amber" },
  supported: { label: "Supported", tone: "green" },
  partiallySupported: { label: "Partially supported", tone: "blue" },
  notSupported: { label: "Not supported", tone: "red" },
  rejected: { label: "Rejected", tone: "red" },
  inconclusive: { label: "Inconclusive", tone: "blue" },
  refuted: { label: "Not supported", tone: "red" },
};

export const experimentStatus: Record<string, Meta> = {
  planned: { label: "Planned", tone: "gray" },
  "in-progress": { label: "In progress", tone: "amber" },
  completed: { label: "Completed", tone: "green" },
  paused: { label: "Paused", tone: "amber" },
  cancelled: { label: "Cancelled", tone: "red" },
  abandoned: { label: "Cancelled", tone: "red" },
};

export const confidence: Record<string, Meta> = {
  low: { label: "Low confidence", tone: "amber" },
  medium: { label: "Medium confidence", tone: "blue" },
  high: { label: "High confidence", tone: "green" },
};

export const gapStatus: Record<string, Meta> = {
  identified: { label: "Identified", tone: "amber" },
  investigating: { label: "Investigating", tone: "blue" },
  addressed: { label: "Addressed", tone: "green" },
  open: { label: "Open", tone: "gray" },
};

export const claimType: Record<ClaimType, Meta> = {
  fact: { label: "Fact", tone: "blue" },
  interpretation: { label: "Interpretation", tone: "indigo" },
  hypothesis: { label: "Hypothesis", tone: "green" },
  prediction: { label: "Prediction", tone: "amber" },
  opinion: { label: "Opinion", tone: "gray" },
};

export type ClaimSupportState =
  | "supported"
  | "partiallySupported"
  | "unsupported"
  | "disputed";

export const claimSupport: Record<ClaimSupportState, Meta> = {
  supported: { label: "Supported", tone: "green" },
  partiallySupported: { label: "Partially supported", tone: "amber" },
  unsupported: { label: "Unsupported", tone: "red" },
  disputed: { label: "Disputed", tone: "red" },
};

export const writingProjectType: Record<string, Meta> = {
  paper: { label: "Paper", tone: "indigo" },
  thesis: { label: "Thesis", tone: "blue" },
  report: { label: "Report", tone: "green" },
  book: { label: "Book", tone: "purple" },
  article: { label: "Article", tone: "cyan" },
  other: { label: "Other", tone: "gray" },
};

export const writingProjectStatus: Record<string, Meta> = {
  drafting: { label: "Drafting", tone: "gray" },
  editing: { label: "Editing", tone: "blue" },
  review: { label: "In review", tone: "amber" },
  completed: { label: "Completed", tone: "green" },
};

export const writingNodeKindMeta: Record<string, Meta> = {
  part: { label: "Part", tone: "indigo" },
  chapter: { label: "Chapter", tone: "blue" },
  section: { label: "Section", tone: "green" },
  subsection: { label: "Subsection", tone: "amber" },
  node: { label: "Node", tone: "gray" },
};

export const writingNodeStatus: Record<string, Meta> = {
  draft: { label: "Draft", tone: "gray" },
  "in-progress": { label: "In progress", tone: "amber" },
  review: { label: "In review", tone: "blue" },
  done: { label: "Done", tone: "green" },
};

export const noteStatus: Record<string, Meta> = {
  draft: { label: "Draft", tone: "gray" },
};

export const tagColor: Record<string, string> = {
  indigo: "#4f46e5",
  blue: "#0284c7",
  green: "#059669",
  amber: "#d97706",
  red: "#dc2626",
  purple: "#7c3aed",
  cyan: "#0891b2",
  gray: "#64748b",
};

export const TAG_COLOR_KEYS = Object.keys(tagColor);