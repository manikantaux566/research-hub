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
} from "../types";
import {
  claims,
  evidence,
  experiments,
  findings,
  gaps,
  hypotheses,
  insights,
  notes,
  projects,
  questions,
  sources,
  tags,
  writingNodes,
  writingProjects,
} from "./storage";

export type Graph = {
  projects: ResearchProject[];
  sources: Source[];
  evidence: Evidence[];
  questions: ResearchQuestion[];
  hypotheses: Hypothesis[];
  experiments: Experiment[];
  findings: Finding[];
  insights: Insight[];
  gaps: ResearchGap[];
  claims: Claim[];
  notes: Note[];
  tags: Tag[];
  writingProjects: WritingProject[];
  writingNodes: WritingNode[];
};

export function emptyGraph(): Graph {
  return {
    projects: [],
    sources: [],
    evidence: [],
    questions: [],
    hypotheses: [],
    experiments: [],
    findings: [],
    insights: [],
    gaps: [],
    claims: [],
    notes: [],
    tags: [],
    writingProjects: [],
    writingNodes: [],
  };
}

export async function loadGraph(): Promise<Graph> {
  const [
    projectRows,
    sourceRows,
    evidenceRows,
    questionRows,
    hypothesisRows,
    experimentRows,
    findingRows,
    insightRows,
    gapRows,
    claimRows,
    noteRows,
    tagRows,
    writingProjectRows,
    writingNodeRows,
  ] = await Promise.all([
    projects.list(),
    sources.list(),
    evidence.list(),
    questions.list(),
    hypotheses.list(),
    experiments.list(),
    findings.list(),
    insights.list(),
    gaps.list(),
    claims.list(),
    notes.list(),
    tags.list(),
    writingProjects.list(),
    writingNodes.list(),
  ]);
  return {
    projects: projectRows,
    sources: sourceRows,
    evidence: evidenceRows,
    questions: questionRows,
    hypotheses: hypothesisRows,
    experiments: experimentRows,
    findings: findingRows,
    insights: insightRows,
    gaps: gapRows,
    claims: claimRows,
    notes: noteRows,
    tags: tagRows,
    writingProjects: writingProjectRows,
    writingNodes: writingNodeRows,
  };
}

export type GraphCounts = Record<
  "projects" | "sources" | "evidence" | "questions" | "hypotheses" | "experiments"
| "findings" | "insights" | "gaps" | "claims" | "notes" | "tags"
| "writingProjects" | "writingNodes",
  number
>;

export function graphCounts(graph: Graph): GraphCounts {
  return {
    projects: graph.projects.length,
    sources: graph.sources.length,
    evidence: graph.evidence.length,
    questions: graph.questions.length,
    hypotheses: graph.hypotheses.length,
    experiments: graph.experiments.length,
    findings: graph.findings.length,
    insights: graph.insights.length,
    gaps: graph.gaps.length,
    claims: graph.claims.length,
    notes: graph.notes.length,
    tags: graph.tags.length,
    writingProjects: graph.writingProjects.length,
    writingNodes: graph.writingNodes.length,
  };
}

export function projectOf(graph: Graph, id: string | undefined): ResearchProject | undefined {
  if (!id) return undefined;
  return graph.projects.find((p) => p.id === id);
}

export function byId<T>(rows: T[], id: string | undefined): T | undefined {
  if (!id) return undefined;
  return rows.find((row) => (row as { id: string }).id === id);
}