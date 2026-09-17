import type {
  Claim,
  Evidence,
  Experiment,
  Finding,
  Hypothesis,
  Insight,
  Note,
  ResearchGap,
  ResearchProject,
  ResearchQuestion,
  Source,
  Tag,
  WritingNode,
  WritingProject,
} from "../../types";
import { createRepository } from "./repository";

export const projects = createRepository<ResearchProject>(
  "projects",
  (row) => row.id,
);

export const sources = createRepository<Source>("sources", (row) => row.projectId);

export const evidence = createRepository<Evidence>(
  "evidence",
  (row) => row.projectId,
);

export const questions = createRepository<ResearchQuestion>(
  "questions",
  (row) => row.projectId,
);

export const hypotheses = createRepository<Hypothesis>(
  "hypotheses",
  (row) => row.projectId,
);

export const experiments = createRepository<Experiment>(
  "experiments",
  (row) => row.projectId,
);

export const findings = createRepository<Finding>(
  "findings",
  (row) => row.projectId,
);

export const insights = createRepository<Insight>(
  "insights",
  (row) => row.projectId,
);

export const gaps = createRepository<ResearchGap>("gaps", (row) => row.projectId);

export const claims = createRepository<Claim>("claims", (row) => row.projectId);

export const notes = createRepository<Note>("notes", (row) => row.projectId);

export const tags = createRepository<Tag>("tags", () => undefined);

export const writingProjects = createRepository<WritingProject>(
  "writingProjects",
  (row) => row.projectId,
);

export const writingNodes = createRepository<WritingNode>(
  "writingNodes",
  (row) => row.projectId,
);

export const ALL_REPOSITORIES = {
  projects,
  sources,
  evidence,
  questions,
  hypotheses,
  experiments,
  findings,
  insights,
  gaps,
  claims,
  notes,
  tags,
  writingProjects,
  writingNodes,
} as const;

export type RepositoryMap = typeof ALL_REPOSITORIES;
export type TableKey = keyof RepositoryMap;