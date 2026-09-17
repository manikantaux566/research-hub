export type UUID = string;

export type Timestamp = string;

export type Tag = {
  id: UUID;
  name: string;
  color: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type ResearchProject = {
  id: UUID;
  name: string;
  description: string;
  status: "active" | "planning" | "paused" | "completed" | "archived";
  topic?: string;
  tagIds?: UUID[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type Source = {
  id: UUID;
  projectId: UUID;
  title: string;
  author: string;
  type: "web" | "paper" | "book" | "report" | "video" | "interview" | "dataset" | "other";
  url?: string;
  publicationDate?: string;
  publisher?: string;
  description?: string;
  tagIds?: UUID[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type EvidenceType =
  | "directQuote"
  | "paraphrase"
  | "statistic"
  | "researcherObservation"
  | "data"
  | "observation"
  | "result"
  | "other";

export type VerificationStatus =
  | "unverified"
  | "partiallyVerified"
  | "verified"
  | "disputed";

export type Evidence = {
  id: UUID;
  projectId: UUID;
  sourceId: UUID;
  title: string;
  type: EvidenceType;
  content: string;
  location?: string;
  interpretation: string;
  verificationStatus: VerificationStatus;
  isAiGenerated: boolean;
  notes?: string;
  tagIds?: UUID[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type ResearchQuestion = {
  id: UUID;
  projectId: UUID;
  question: string;
  status: "open" | "investigating" | "answered" | "parked";
  priority: "low" | "medium" | "high" | "critical";
  notes?: string;
  tagIds?: UUID[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type HypothesisStatus =
  | "proposed"
  | "testing"
  | "supported"
  | "partiallySupported"
  | "notSupported"
  | "rejected"
  | "inconclusive";

export type Hypothesis = {
  id: UUID;
  projectId: UUID;
  questionId?: UUID;
  title?: string;
  statement: string;
  rationale: string;
  status: HypothesisStatus;
  tagIds?: UUID[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type ExperimentVariable = {
  key: string;
  value: string;
  unit?: string;
};

export type ExperimentStatus =
  | "planned"
  | "in-progress"
  | "completed"
  | "paused"
  | "cancelled";

export type Experiment = {
  id: UUID;
  projectId: UUID;
  hypothesisId?: UUID;
  questionId?: UUID;
  title: string;
  objective?: string;
  methodology: string;
  procedure?: string;
  variables: ExperimentVariable[];
  status: ExperimentStatus;
  expectedResult?: string;
  actualResult?: string;
  results?: string;
  conclusion?: string;
  limitations?: string;
  evidenceIds: UUID[];
  findingIds: UUID[];
  notes?: string;
  tagIds?: UUID[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type Confidence = "low" | "medium" | "high";

export type Finding = {
  id: UUID;
  projectId: UUID;
  questionId?: UUID;
  experimentId?: UUID;
  title: string;
  description: string;
  confidence: Confidence;
  evidenceIds: UUID[];
  tagIds?: UUID[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type Insight = {
  id: UUID;
  projectId: UUID;
  questionId?: UUID;
  title: string;
  description: string;
  findingIds: UUID[];
  tagIds?: UUID[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type ResearchGap = {
  id: UUID;
  projectId: UUID;
  questionId?: UUID;
  questionIds: UUID[];
  title: string;
  description: string;
  importance: "low" | "medium" | "high" | "critical";
  status: "identified" | "investigating" | "addressed" | "open";
  suggestedDirection?: string;
  tagIds?: UUID[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type ClaimType =
  | "fact"
  | "interpretation"
  | "hypothesis"
  | "prediction"
  | "opinion";

export type Claim = {
  id: UUID;
  projectId: UUID;
  claim: string;
  type: ClaimType;
  verificationStatus: VerificationStatus;
  evidenceIds: UUID[];
  findingIds: UUID[];
  expectedEvidenceCount?: number;
  expectedFindingCount?: number;
  notes?: string;
  tagIds?: UUID[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type Note = {
  id: UUID;
  projectId: UUID;
  title: string;
  content: string;
  tags: string[];
  tagIds?: UUID[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type WritingProjectType =
  | "paper"
  | "thesis"
  | "report"
  | "book"
  | "article"
  | "other";

export type WritingProjectStatus = "drafting" | "editing" | "review" | "completed";

export type WritingProject = {
  id: UUID;
  projectId: UUID;
  title: string;
  type: WritingProjectType;
  status: WritingProjectStatus;
  outline?: string;
  summary?: string;
  tagIds?: UUID[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type WritingNodeKind =
  | "part"
  | "chapter"
  | "section"
  | "subsection"
  | "node";

export type ResearchRefs = {
  questionIds: UUID[];
  sourceIds: UUID[];
  evidenceIds: UUID[];
  findingIds: UUID[];
  insightIds: UUID[];
  claimIds: UUID[];
  gapIds: UUID[];
  hypothesisIds: UUID[];
  experimentIds: UUID[];
};

export type WritingNode = {
  id: UUID;
  projectId: UUID;
  writingProjectId: UUID;
  parentId?: UUID;
  kind: WritingNodeKind;
  title: string;
  content: string;
  order: number;
  status: "draft" | "in-progress" | "review" | "done";
  researchRefs: ResearchRefs;
  notes?: string;
  tagIds?: UUID[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type EntityKind =
  | "project"
  | "source"
  | "evidence"
  | "question"
  | "hypothesis"
  | "experiment"
  | "finding"
  | "insight"
  | "gap"
  | "claim"
  | "note"
  | "tag"
  | "writingProject"
  | "writingNode";

export const RESEARCH_ENTITY_KINDS: EntityKind[] = [
  "project",
  "source",
  "evidence",
  "question",
  "hypothesis",
  "experiment",
  "finding",
  "insight",
  "gap",
  "claim",
  "note",
];