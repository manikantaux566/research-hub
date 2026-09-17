import type {
  Claim,
  Evidence,
  Finding,
} from "../types";
import type { Graph } from "./graph";
import { graphCounts } from "./graph";
import {
  confidence,
  evidenceType,
  experimentStatus,
  gapStatus,
  hypothesisStatus,
  priority,
  projectStatus,
  questionStatus,
  sourceType,
  verificationStatus,
  writingNodeKindMeta,
  writingNodeStatus,
  writingProjectStatus,
  writingProjectType,
} from "./meta";

export type CheckStatus = "ok" | "warn" | "error";

export type IntegrityCheck = {
  key: string;
  label: string;
  status: CheckStatus;
  detail?: string;
};

export type IntegrityReport = {
  checks: IntegrityCheck[];
  errors: number;
  warnings: number;
  healthy: boolean;
  counts: ReturnType<typeof graphCounts>;
};

function hasDuplicateIds(graph: Graph): string[] {
  const seen = new Map<string, string>();
  const duplicates: string[] = [];
  const visit = (table: string, rows: Array<{ id: string }>) => {
    for (const row of rows) {
      const previous = seen.get(row.id);
      if (previous !== undefined) {
        duplicates.push(`${row.id} (in ${table}; also in ${previous})`);
      } else {
        seen.set(row.id, table);
      }
    }
  };
  visit("projects", graph.projects);
  visit("sources", graph.sources);
  visit("evidence", graph.evidence);
  visit("questions", graph.questions);
  visit("hypotheses", graph.hypotheses);
  visit("experiments", graph.experiments);
  visit("findings", graph.findings);
  visit("insights", graph.insights);
  visit("gaps", graph.gaps);
  visit("claims", graph.claims);
  visit("notes", graph.notes);
  visit("tags", graph.tags);
  visit("writingProjects", graph.writingProjects);
  visit("writingNodes", graph.writingNodes);
  return duplicates;
}

function orphanCount(graph: Graph): { type: string; count: number }[] {
  const projectIds = new Set(graph.projects.map((p) => p.id));
  const result: { type: string; count: number }[] = [];
  const collections: Array<[string, Array<{ projectId?: string }>]> = [
    ["sources", graph.sources],
    ["evidence", graph.evidence],
    ["questions", graph.questions],
    ["hypotheses", graph.hypotheses],
    ["experiments", graph.experiments],
    ["findings", graph.findings],
    ["insights", graph.insights],
    ["gaps", graph.gaps],
    ["claims", graph.claims],
    ["notes", graph.notes],
    ["writingProjects", graph.writingProjects],
    ["writingNodes", graph.writingNodes],
  ];
  for (const [type, rows] of collections) {
    const count = rows.filter((row) => !row.projectId || !projectIds.has(row.projectId)).length;
    if (count > 0) result.push({ type, count });
  }
  return result;
}

function brokenRefs<T extends { id: string }>(
  rows: T[],
  pick: (row: T) => string | undefined,
  exists: (id: string) => boolean,
  label: (row: T) => string,
) {
  const broken: string[] = [];
  for (const row of rows) {
    const value = pick(row);
    if (value && !exists(value)) broken.push(`${label(row)} (${row.id})`);
  }
  return broken;
}

function brokenArrayRefs<T extends { id: string }>(
  rows: T[],
  pick: (row: T) => string[],
  exists: (id: string) => boolean,
  label: (row: T) => string,
) {
  const broken: string[] = [];
  for (const row of rows) {
    for (const value of pick(row)) {
      if (!exists(value)) {
        broken.push(`${label(row)} (${row.id} → ${value})`);
        break;
      }
    }
  }
  return broken;
}

function validStatus(value: unknown, allowed: Record<string, unknown>): boolean {
  return typeof value === "string" && value in allowed;
}

function detectHierarchyIssues(graph: Graph): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const byId = new Map(graph.writingNodes.map((node) => [node.id, node]));
  for (const node of graph.writingNodes) {
    if (node.parentId) {
      const parent = byId.get(node.parentId);
      if (!parent) {
        errors.push(`Writing node "${node.title}" references a missing parent.`);
      } else if (parent.writingProjectId !== node.writingProjectId) {
        errors.push(`Writing node "${node.title}" has a parent in a different writing project.`);
      }
    }
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (node: typeof graph.writingNodes[number]): boolean => {
    if (visiting.has(node.id)) return true;
    if (visited.has(node.id)) return false;
    visiting.add(node.id);
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    const hasCycle = parent ? visit(parent) : false;
    visiting.delete(node.id);
    visited.add(node.id);
    return hasCycle;
  };
  for (const node of graph.writingNodes) {
    if (visit(node)) {
      errors.push(`Circular hierarchy detected around writing node "${node.title}".`);
      break;
    }
  }
  return { errors, warnings };
}

export function runIntegrity(graph: Graph): IntegrityReport {
  const checks: IntegrityCheck[] = [];
  const add = (key: string, label: string, status: CheckStatus, detail?: string) => {
    checks.push({ key, label, status, ...(detail ? { detail } : {}) });
  };

  const ids = new Set<string>();
  for (const rows of [
    graph.projects,
    graph.sources,
    graph.evidence,
    graph.questions,
    graph.hypotheses,
    graph.experiments,
    graph.findings,
    graph.insights,
    graph.gaps,
    graph.claims,
    graph.notes,
    graph.tags,
    graph.writingProjects,
    graph.writingNodes,
  ]) {
    for (const row of rows) ids.add(row.id);
  }
  const exists = (id: string) => ids.has(id);

  const duplicates = hasDuplicateIds(graph);
  add(
    "duplicateIds",
    "No duplicate IDs",
    duplicates.length === 0 ? "ok" : "error",
    duplicates.length > 0 ? `${duplicates.length} duplicate ID(s) found.` : undefined,
  );

  const projectsSet = new Set(graph.projects.map((p) => p.id));
  const inProject = (id: string | undefined) => Boolean(id && projectsSet.has(id));

  const orphaned = orphanCount(graph);
  add(
    "orphaned",
    "All records belong to a project",
    orphaned.length === 0 ? "ok" : "warn",
    orphaned.length > 0
      ? orphaned.map((o) => `${o.count} orphaned ${o.type}`).join(", ")
      : undefined,
  );

  const brokenSource = brokenRefs(
    graph.evidence,
    (e: Evidence) => e.sourceId,
    exists,
    (e) => `Evidence "${e.title}"`,
  );
  add(
    "evidenceSource",
    "Evidence → source references valid",
    brokenSource.length === 0 ? "ok" : "warn",
    brokenSource.length > 0 ? `${brokenSource.length} broken evidence↔source link(s).` : undefined,
  );

  const brokenFindingEvidence = brokenArrayRefs(
    graph.findings,
    (f: Finding) => f.evidenceIds,
    exists,
    (f) => `Finding "${f.title}"`,
  );
  add(
    "findingEvidence",
    "Finding → evidence references valid",
    brokenFindingEvidence.length === 0 ? "ok" : "warn",
    brokenFindingEvidence.length > 0 ? `${brokenFindingEvidence.length} broken finding↔evidence link(s).` : undefined,
  );

  const brokenClaimEvidence = brokenArrayRefs(
    graph.claims,
    (c: Claim) => c.evidenceIds,
    exists,
    (c) => `Claim "${c.claim.slice(0, 40)}"`,
  );
  const brokenClaimFinding = brokenArrayRefs(
    graph.claims,
    (c: Claim) => c.findingIds,
    exists,
    (c) => `Claim "${c.claim.slice(0, 40)}"`,
  );
  add(
    "claimRefs",
    "Claim → evidence/finding references valid",
    brokenClaimEvidence.length + brokenClaimFinding.length === 0 ? "ok" : "warn",
    brokenClaimEvidence.length + brokenClaimFinding.length > 0
      ? `${brokenClaimEvidence.length + brokenClaimFinding.length} broken claim link(s).`
      : undefined,
  );

  const brokenInsight = brokenArrayRefs(
    graph.insights,
    (i) => i.findingIds,
    exists,
    (i) => `Insight "${i.title}"`,
  );
  add(
    "insightRefs",
    "Insight → finding references valid",
    brokenInsight.length === 0 ? "ok" : "warn",
    brokenInsight.length > 0 ? `${brokenInsight.length} broken insight↔finding link(s).` : undefined,
  );

  const noTags = graph.tags.length === 0;
  add(
    "tags",
    "Tags present",
    noTags ? "ok" : "ok",
    noTags ? "No tags defined yet." : `${graph.tags.length} tag(s) defined.`,
  );
  const tagIds = new Set(graph.tags.map((t) => t.id));
  const brokenTagRefs =
    brokenArrayRefs(graph.projects, (p) => p.tagIds ?? [], (id) => tagIds.has(id), (p) => `Project "${p.name}"`).length +
    brokenArrayRefs(graph.sources, (s) => s.tagIds ?? [], (id) => tagIds.has(id), (s) => `Source "${s.title}"`).length +
    brokenArrayRefs(graph.evidence, (e) => e.tagIds ?? [], (id) => tagIds.has(id), (e) => `Evidence "${e.title}"`).length;
  add(
    "tagRefs",
    "All tag references valid",
    brokenTagRefs === 0 ? "ok" : "warn",
    brokenTagRefs > 0 ? `${brokenTagRefs} entity(ies) reference missing tags.` : undefined,
  );

  const badStatuses: string[] = [];
  for (const p of graph.projects) if (!validStatus(p.status, projectStatus)) badStatuses.push(`Project "${p.name}"`);
  for (const s of graph.sources) if (!validStatus(s.type, sourceType)) badStatuses.push(`Source "${s.title}"`);
  for (const e of graph.evidence) if (!validStatus(e.type, evidenceType) || !validStatus(e.verificationStatus, verificationStatus)) badStatuses.push(`Evidence "${e.title}"`);
  for (const q of graph.questions) if (!validStatus(q.status, questionStatus) || !validStatus(q.priority, priority)) badStatuses.push(`Question "${q.question.slice(0, 40)}"`);
  for (const h of graph.hypotheses) if (!validStatus(h.status, hypothesisStatus)) badStatuses.push(`Hypothesis "${h.title ?? h.statement.slice(0, 40)}"`);
  for (const ex of graph.experiments) if (!validStatus(ex.status, experimentStatus)) badStatuses.push(`Experiment "${ex.title}"`);
  for (const f of graph.findings) if (!validStatus(f.confidence, confidence)) badStatuses.push(`Finding "${f.title}"`);
  for (const g of graph.gaps) if (!validStatus(g.importance, priority) || !validStatus(g.status, gapStatus)) badStatuses.push(`Gap "${g.title}"`);
  for (const c of graph.claims) if (!validStatus(c.verificationStatus, verificationStatus)) badStatuses.push(`Claim "${c.claim.slice(0, 40)}"`);
  for (const wp of graph.writingProjects) if (!validStatus(wp.type, writingProjectType) || !validStatus(wp.status, writingProjectStatus)) badStatuses.push(`Writing "${wp.title}"`);
  for (const wn of graph.writingNodes) if (!validStatus(wn.kind, writingNodeKindMeta) || !validStatus(wn.status, writingNodeStatus)) badStatuses.push(`Writing node "${wn.title}"`);
  add(
    "statuses",
    "All status/type values are valid",
    badStatuses.length === 0 ? "ok" : "error",
    badStatuses.length > 0 ? `${badStatuses.length} record(s) have invalid values.` : undefined,
  );

  const badTimestamps: string[] = [];
  const validDate = (value: unknown) => typeof value === "string" && !Number.isNaN(new Date(value).getTime());
  for (const rows of [graph.projects, graph.sources, graph.evidence, graph.questions, graph.hypotheses, graph.experiments, graph.findings, graph.insights, graph.gaps, graph.claims, graph.notes, graph.writingNodes]) {
    for (const row of rows) {
      if (!validDate(row.createdAt) || !validDate(row.updatedAt)) {
        badTimestamps.push((row as { id: string }).id);
      }
    }
  }
  add(
    "timestamps",
    "All timestamps are valid ISO dates",
    badTimestamps.length === 0 ? "ok" : "warn",
    badTimestamps.length > 0 ? `${badTimestamps.length} record(s) have invalid timestamps.` : undefined,
  );

  const hierarchy = detectHierarchyIssues(graph);
  add(
    "writingHierarchy",
    "Writing hierarchy references valid",
    hierarchy.errors.length === 0 ? "ok" : "error",
    hierarchy.errors.length > 0 ? hierarchy.errors.join(" ") : undefined,
  );

  const missingParents = graph.writingNodes.filter(
    (node) => !inProject(node.projectId) || !graph.writingProjects.some((wp) => wp.id === node.writingProjectId),
  );
  add(
    "writingParents",
    "Writing nodes point to a valid project",
    missingParents.length === 0 ? "ok" : "error",
    missingParents.length > 0 ? `${missingParents.length} writing node(s) have broken links.` : undefined,
  );

  const missingQuestionLink: Array<{ label: string }> = [];
  for (const h of graph.hypotheses) if (h.questionId && !exists(h.questionId)) missingQuestionLink.push({ label: `Hypothesis "${h.title ?? h.statement.slice(0, 40)}"` });
  for (const f of graph.findings) if (f.questionId && !exists(f.questionId)) missingQuestionLink.push({ label: `Finding "${f.title}"` });
  for (const i of graph.insights) if (i.questionId && !exists(i.questionId)) missingQuestionLink.push({ label: `Insight "${i.title}"` });
  for (const g of graph.gaps) {
    const ids = g.questionIds.length > 0 ? g.questionIds : g.questionId ? [g.questionId] : [];
    for (const questionId of ids) if (!exists(questionId)) missingQuestionLink.push({ label: `Gap "${g.title}"` });
  }
  for (const ex of graph.experiments) {
    if (ex.hypothesisId && !exists(ex.hypothesisId)) missingQuestionLink.push({ label: `Experiment "${ex.title}"` });
    if (ex.questionId && !exists(ex.questionId)) missingQuestionLink.push({ label: `Experiment "${ex.title}"` });
  }
  add(
    "traceability",
    "Traceability links (question/hypothesis/experiment) valid",
    missingQuestionLink.length === 0 ? "ok" : "warn",
    missingQuestionLink.length > 0 ? `${missingQuestionLink.length} broken traceability link(s).` : undefined,
  );

  const errors = checks.filter((c) => c.status === "error").length;
  const warnings = checks.filter((c) => c.status === "warn").length;
  return {
    checks,
    errors,
    warnings,
    healthy: errors === 0,
    counts: graphCounts(graph),
  };
}