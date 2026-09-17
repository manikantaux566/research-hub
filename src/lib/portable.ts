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
import type { Graph } from "./graph";
import { emptyGraph } from "./graph";
import { sanitizeFileName, stripHtml, todayStamp } from "./format";
import { isValidId, newId } from "./id";
import { claimSupportStatus } from "./relations";
import {
  claimType,
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
import { clearAll, readTable, writeBatch } from "./storage/db";

export const EXPORT_FORMAT = "research-hub";
export const SCHEMA_VERSION = 1;
export const EXPORT_VERSION = 1;

export type ExportKind = "full" | "backup" | "project" | "writing";

export type ExportData = {
  projects: ResearchProject[];
  sources: Source[];
  evidence: Evidence[];
  questions: ResearchQuestion[];
  hypotheses: Hypothesis[];
  experiments: Experiment[];
  findings: Finding[];
  insights: Insight[];
  researchGaps: ResearchGap[];
  claims: Claim[];
  notes: Note[];
  tags: Tag[];
  writingProjects: WritingProject[];
  writingNodes: WritingNode[];
};

export type ExportBundle = {
  format: string;
  schemaVersion: number;
  exportVersion: number;
  kind: ExportKind;
  exportedAt: string;
  application: { name: string };
  data: ExportData;
};

export function emptyData(): ExportData {
  return {
    projects: [],
    sources: [],
    evidence: [],
    questions: [],
    hypotheses: [],
    experiments: [],
    findings: [],
    insights: [],
    researchGaps: [],
    claims: [],
    notes: [],
    tags: [],
    writingProjects: [],
    writingNodes: [],
  };
}

function tagsReferenced(data: ExportData): Set<string> {
  const ids = new Set<string>();
  const add = (tags: string[] | undefined) => tags?.forEach((id) => ids.add(id));
  for (const row of data.projects) add(row.tagIds);
  for (const row of data.sources) add(row.tagIds);
  for (const row of data.evidence) add(row.tagIds);
  for (const row of data.questions) add(row.tagIds);
  for (const row of data.hypotheses) add(row.tagIds);
  for (const row of data.experiments) add(row.tagIds);
  for (const row of data.findings) add(row.tagIds);
  for (const row of data.insights) add(row.tagIds);
  for (const row of data.researchGaps) add(row.tagIds);
  for (const row of data.claims) add(row.tagIds);
  for (const row of data.notes) add(row.tagIds);
  for (const row of data.writingNodes) add(row.tagIds);
  for (const row of data.writingProjects) add(row.tagIds);
  return ids;
}

function dataFromGraph(graph: Graph): ExportData {
  return emptyDataBase(graph.projects, graph.sources, graph.evidence, graph.questions, graph.hypotheses, graph.experiments, graph.findings, graph.insights, graph.gaps, graph.claims, graph.notes, graph.tags, graph.writingProjects, graph.writingNodes);
}

// prettier-ignore
function emptyDataBase(
  projects: ResearchProject[], sources: Source[], evidence: Evidence[],
  questions: ResearchQuestion[], hypotheses: Hypothesis[], experiments: Experiment[],
  findings: Finding[], insights: Insight[], gaps: ResearchGap[],
  claims: Claim[], notes: Note[], tags: Tag[],
  writingProjects: WritingProject[], writingNodes: WritingNode[],
): ExportData {
  return { projects, sources, evidence, questions, hypotheses, experiments, findings, insights, researchGaps: gaps, claims, notes, tags, writingProjects, writingNodes };
}

export function buildBundle(
  graph: Graph,
  kind: ExportKind,
  projectId?: string,
  writingProjectId?: string,
): ExportBundle {
  const data = buildData(graph, kind, projectId, writingProjectId);
  return {
    format: EXPORT_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    exportVersion: EXPORT_VERSION,
    kind,
    exportedAt: new Date().toISOString(),
    application: { name: "Research Hub" },
    data,
  };
}

export function buildData(
  graph: Graph,
  kind: ExportKind,
  projectId?: string,
  writingProjectId?: string,
): ExportData {
  if (kind === "project" && projectId) {
    const data = emptyData();
    const inProject = (id: string | undefined) => id === projectId;
    data.projects = graph.projects.filter((p) => p.id === projectId);
    data.sources = graph.sources.filter((s) => inProject(s.projectId));
    data.evidence = graph.evidence.filter((e) => inProject(e.projectId));
    data.questions = graph.questions.filter((q) => inProject(q.projectId));
    data.hypotheses = graph.hypotheses.filter((h) => inProject(h.projectId));
    data.experiments = graph.experiments.filter((ex) => inProject(ex.projectId));
    data.findings = graph.findings.filter((f) => inProject(f.projectId));
    data.insights = graph.insights.filter((i) => inProject(i.projectId));
    data.researchGaps = graph.gaps.filter((g) => inProject(g.projectId));
    data.claims = graph.claims.filter((c) => inProject(c.projectId));
    data.notes = graph.notes.filter((n) => inProject(n.projectId));
    const writingIds = new Set(
      graph.writingProjects.filter((wp) => inProject(wp.projectId)).map((wp) => wp.id),
    );
    data.writingProjects = graph.writingProjects.filter((wp) => inProject(wp.projectId));
    data.writingNodes = graph.writingNodes.filter(
      (node) => node.writingProjectId && writingIds.has(node.writingProjectId),
    );
    data.tags = graph.tags.filter((tag) => tagsReferenced(data).has(tag.id));
    return data;
  }
  if (kind === "writing" && writingProjectId) {
    const data = emptyData();
    const writing = graph.writingProjects.find((wp) => wp.id === writingProjectId);
    if (writing) {
      data.writingProjects = [writing];
      data.writingNodes = graph.writingNodes.filter(
        (node) => node.writingProjectId === writingProjectId,
      );
      const projectIdForWriting = writing.projectId;
      if (projectIdForWriting) {
        data.projects = graph.projects.filter((p) => p.id === projectIdForWriting);
        const inProject = (id: string | undefined) => id === projectIdForWriting;
        data.sources = graph.sources.filter((s) => inProject(s.projectId));
        data.evidence = graph.evidence.filter((e) => inProject(e.projectId));
        data.questions = graph.questions.filter((q) => inProject(q.projectId));
        data.hypotheses = graph.hypotheses.filter((h) => inProject(h.projectId));
        data.experiments = graph.experiments.filter((ex) => inProject(ex.projectId));
        data.findings = graph.findings.filter((f) => inProject(f.projectId));
        data.insights = graph.insights.filter((i) => inProject(i.projectId));
        data.researchGaps = graph.gaps.filter((g) => inProject(g.projectId));
        data.claims = graph.claims.filter((c) => inProject(c.projectId));
        data.notes = graph.notes.filter((n) => inProject(n.projectId));
      }
    }
    data.tags = graph.tags.filter((tag) => tagsReferenced(data).has(tag.id));
    return data;
  }
  return dataFromGraph(graph);
}

export function exportFilename(kind: ExportKind, projectName?: string, writingTitle?: string): string {
  const stamp = todayStamp();
  switch (kind) {
    case "backup":
      return `research-hub-backup-${stamp}.json`;
    case "project":
      return `research-hub-project-${sanitizeFileName(projectName ?? "export")}-${stamp}.json`;
    case "writing":
      return `research-hub-writing-${sanitizeFileName(writingTitle ?? "export")}-${stamp}.json`;
    default:
      return `research-hub-export-${stamp}.json`;
  }
}

export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadBundle(bundle: ExportBundle): string {
  const filename = exportFilename(bundle.kind);
  downloadFile(filename, JSON.stringify(bundle, null, 2), "application/json");
  return filename;
}

// ---------- Validation ----------

export type ImportMessage = { level: "error" | "warning"; message: string };
export type ImportReport = {
  valid: boolean;
  errors: ImportMessage[];
  warnings: ImportMessage[];
  stats: Record<string, number>;
  total: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseImport(text: string): { bundle?: ExportBundle; error?: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { error: "This file is not valid JSON." };
  }
  if (!isRecord(parsed) || !isRecord(parsed.data)) {
    return { error: "This file is not a Research Hub export." };
  }
  return { bundle: parsed as unknown as ExportBundle };
}

const REQUIRED: Record<string, string[]> = {
  projects: ["name", "description", "status"],
  sources: ["title", "author", "type", "projectId"],
  evidence: ["title", "content", "interpretation", "sourceId", "projectId"],
  questions: ["question", "status", "priority", "projectId"],
  hypotheses: ["statement", "rationale", "status", "projectId"],
  experiments: ["title", "methodology", "status", "projectId"],
  findings: ["title", "description", "confidence", "projectId"],
  insights: ["title", "description", "projectId"],
  researchGaps: ["title", "description", "importance", "status", "projectId"],
  claims: ["claim", "type", "verificationStatus", "projectId"],
  notes: ["title", "content", "projectId"],
  tags: ["name"],
  writingProjects: ["title", "type", "status", "projectId"],
  writingNodes: ["title", "content", "order", "kind", "status", "writingProjectId", "projectId"],
};

const ENUM_SETS: Record<string, Record<string, unknown>> = {
  "projects.status": projectStatus,
  "sources.type": sourceType,
  "evidence.type": evidenceType,
  "evidence.verificationStatus": verificationStatus,
  "questions.status": questionStatus,
  "questions.priority": priority,
  "hypotheses.status": hypothesisStatus,
  "experiments.status": experimentStatus,
  "findings.confidence": confidence,
  "researchGaps.importance": priority,
  "researchGaps.status": gapStatus,
  "claims.type": claimType,
  "claims.verificationStatus": verificationStatus,
  "writingProjects.type": writingProjectType,
  "writingProjects.status": writingProjectStatus,
  "writingNodes.kind": writingNodeKindMeta,
  "writingNodes.status": writingNodeStatus,
};

export function validateBundle(input: unknown): ImportReport {
  const errors: ImportMessage[] = [];
  const warnings: ImportMessage[] = [];

  if (!isRecord(input)) {
    return {
      valid: false,
      errors: [{ level: "error", message: "The import file is not a JSON object." }],
      warnings: [],
      stats: {},
      total: 0,
    };
  }
  if (input.format !== EXPORT_FORMAT) {
    errors.push({
      level: "error",
      message: `Not a Research Hub export (found format "${String(input.format)}").`,
    });
  }
  const schemaVersion = input.schemaVersion;
  if (typeof schemaVersion !== "number" || !Number.isInteger(schemaVersion) || schemaVersion < 1) {
    errors.push({ level: "error", message: "Missing or unsupported schema version." });
  } else if (schemaVersion > SCHEMA_VERSION) {
    errors.push({
      level: "error",
      message: `This file was created by a newer version of Research Hub (schema ${schemaVersion}, supported up to ${SCHEMA_VERSION}). Open it in a current version, or re-export from the older app.`,
    });
  }

  const data = isRecord(input.data) ? input.data : {};
  const keys = [
    "projects",
    "sources",
    "evidence",
    "questions",
    "hypotheses",
    "experiments",
    "findings",
    "insights",
    "researchGaps",
    "claims",
    "notes",
    "tags",
    "writingProjects",
    "writingNodes",
  ];
  const stats: Record<string, number> = {};
  for (const key of keys) {
    const value = data[key];
    if (value === undefined) {
      warnings.push({ level: "warning", message: `Collection "${key}" is missing; treated as empty.` });
      stats[key] = 0;
    } else if (!Array.isArray(value)) {
      errors.push({ level: "error", message: `Collection "${key}" is not an array.` });
      stats[key] = 0;
    } else {
      stats[key] = value.length;
    }
  }
  const total = Object.values(stats).reduce((sum, count) => sum + count, 0);

  if (!errors.length || input.format === EXPORT_FORMAT) {
    const allIds = new Map<string, string>();
    for (const key of keys) {
      const rows = (data[key] as unknown[]) ?? [];
      rows.forEach((row, index) => {
        if (!isRecord(row)) {
          errors.push({ level: "error", message: `${key}[${index}] is not an object.` });
          return;
        }
        const id = row.id;
        if (typeof id !== "string" || id.length === 0) {
          errors.push({ level: "error", message: `${key}[${index}] is missing an id.` });
          return;
        }
        if (!isValidId(id)) {
          warnings.push({ level: "warning", message: `${key} record "${String(row.title ?? row.name ?? row.claim ?? id)}" has a non-standard id.` });
        }
        const previous = allIds.get(id);
        if (previous) {
          errors.push({ level: "error", message: `Duplicate id "${id}" appears in both ${previous} and ${key}.` });
        } else {
          allIds.set(id, key);
        }
        for (const field of REQUIRED[key] ?? []) {
          if (field !== "content" && field !== "description" && field !== "rationale" && field !== "methodology" && (row[field] === undefined || row[field] === "")) {
            warnings.push({ level: "warning", message: `${key} record "${String(row.title ?? row.name ?? row.claim ?? id)}" is missing "${field}".` });
          }
        }
        for (const [table, field] of [
          ["evidence", "verificationStatus"],
          ["claims", "type"],
          ["claims", "verificationStatus"],
        ]) {
          void table;
          void field;
        }
        void row;
      });
    }

    for (const key of keys) {
      for (const [enumKey, allowed] of Object.entries(ENUM_SETS)) {
        const [table, field] = enumKey.split(".");
        if (table !== key) continue;
        for (const row of (data[key] as unknown[]) ?? []) {
          if (!isRecord(row)) continue;
          const value = row[field];
          if (typeof value === "string" && !(value in allowed)) {
            errors.push({
              level: "error",
              message: `${key} record "${String(row.title ?? row.name ?? row.claim ?? row.id)}" has invalid ${field} "${value}".`,
            });
          }
        }
      }
      const checkTimestamp = (field: "createdAt" | "updatedAt") => {
        for (const row of (data[key] as unknown[]) ?? []) {
          if (!isRecord(row) || row[field] === undefined) continue;
          if (typeof row[field] !== "string" || Number.isNaN(new Date(row[field] as string).getTime())) {
            warnings.push({
              level: "warning",
              message: `${key} record "${String(row.title ?? row.name ?? row.claim ?? row.id)}" has an invalid ${field}.`,
            });
          }
        }
      };
      checkTimestamp("createdAt");
      checkTimestamp("updatedAt");
    }

    const has = (id: unknown) => typeof id === "string" && allIds.has(id);
    const missingRef = (kind: string, label: string, id: unknown) => {
      if (id && !has(id)) {
        warnings.push({ level: "warning", message: `${kind} "${label}" references missing id "${String(id)}".` });
      }
    };
    for (const row of data.projects as unknown[] ?? []) {
      if (!isRecord(row)) continue;
      const rowTagIds: unknown = (row as { tagIds?: unknown }).tagIds;
      if (Array.isArray(rowTagIds)) {
        rowTagIds.forEach((id) => missingRef("Project", String(row.name ?? row.id), id));
      }
    }
    for (const row of data.sources as unknown[] ?? []) {
      if (!isRecord(row)) continue;
      missingRef("Source", String(row.title ?? row.id), row.projectId);
    }
    for (const row of data.evidence as unknown[] ?? []) {
      if (!isRecord(row)) continue;
      missingRef("Evidence", String(row.title ?? row.id), row.projectId);
      missingRef("Evidence", String(row.title ?? row.id), row.sourceId);
    }
    for (const row of data.questions as unknown[] ?? []) {
      if (!isRecord(row)) continue;
      missingRef("Question", String(row.question ?? row.id), row.projectId);
    }
    for (const row of data.hypotheses as unknown[] ?? []) {
      if (!isRecord(row)) continue;
      missingRef("Hypothesis", String(row.title ?? row.statement ?? row.id), row.projectId);
      missingRef("Hypothesis", String(row.title ?? row.statement ?? row.id), row.questionId);
    }
    for (const row of data.experiments as unknown[] ?? []) {
      if (!isRecord(row)) continue;
      missingRef("Experiment", String(row.title ?? row.id), row.projectId);
      missingRef("Experiment", String(row.title ?? row.id), row.hypothesisId);
      missingRef("Experiment", String(row.title ?? row.id), row.questionId);
      for (const id of (row.evidenceIds as unknown[] ?? [])) missingRef("Experiment", String(row.title ?? row.id), id);
      for (const id of (row.findingIds as unknown[] ?? [])) missingRef("Experiment", String(row.title ?? row.id), id);
    }
    for (const row of data.findings as unknown[] ?? []) {
      if (!isRecord(row)) continue;
      missingRef("Finding", String(row.title ?? row.id), row.projectId);
      missingRef("Finding", String(row.title ?? row.id), row.questionId);
      missingRef("Finding", String(row.title ?? row.id), row.experimentId);
      for (const id of (row.evidenceIds as unknown[] ?? [])) missingRef("Finding", String(row.title ?? row.id), id);
    }
    for (const row of data.insights as unknown[] ?? []) {
      if (!isRecord(row)) continue;
      missingRef("Insight", String(row.title ?? row.id), row.projectId);
      missingRef("Insight", String(row.title ?? row.id), row.questionId);
      for (const id of (row.findingIds as unknown[] ?? [])) missingRef("Insight", String(row.title ?? row.id), id);
    }
    for (const row of data.researchGaps as unknown[] ?? []) {
      if (!isRecord(row)) continue;
      missingRef("Gap", String(row.title ?? row.id), row.projectId);
      const questionIds = Array.isArray(row.questionIds) ? row.questionIds : row.questionId ? [row.questionId] : [];
      for (const id of questionIds) missingRef("Gap", String(row.title ?? row.id), id);
    }
    for (const row of data.claims as unknown[] ?? []) {
      if (!isRecord(row)) continue;
      missingRef("Claim", String(row.claim ?? row.id), row.projectId);
      for (const id of (row.evidenceIds as unknown[] ?? [])) missingRef("Claim", String(row.claim ?? row.id), id);
      for (const id of (row.findingIds as unknown[] ?? [])) missingRef("Claim", String(row.claim ?? row.id), id);
    }
    for (const row of data.notes as unknown[] ?? []) {
      if (!isRecord(row)) continue;
      missingRef("Note", String(row.title ?? row.id), row.projectId);
    }
    for (const row of data.writingProjects as unknown[] ?? []) {
      if (!isRecord(row)) continue;
      missingRef("Writing project", String(row.title ?? row.id), row.projectId);
    }
    for (const row of data.writingNodes as unknown[] ?? []) {
      if (!isRecord(row)) continue;
      missingRef("Writing node", String(row.title ?? row.id), row.projectId);
      missingRef("Writing node", String(row.title ?? row.id), row.writingProjectId);
      if (row.parentId) {
        missingRef("Writing node", String(row.title ?? row.id), row.parentId);
        const parent = allIds.get(String(row.parentId));
        if (parent && parent !== "writingNodes") {
          errors.push({
            level: "error",
            message: `Writing node "${String(row.title ?? row.id)}" has a parent that is not a writing node.`,
          });
        }
      }
      const refs = isRecord(row.researchRefs) ? row.researchRefs : {};
      for (const group of Object.values(refs as Record<string, unknown>)) {
        for (const id of (Array.isArray(group) ? group : [])) missingRef("Writing node", String(row.title ?? row.id), id);
      }
    }

    // Writing hierarchy cycles
    const nodes = (data.writingNodes as WritingNode[]) ?? [];
    const nodeMap = new Map(nodes.map((node) => [node.id, node]));
    const visiting = new Set<string>();
    const visited = new Set<string>();
    const hasCycle = (node: WritingNode): boolean => {
      if (visiting.has(node.id)) return true;
      if (visited.has(node.id)) return false;
      visiting.add(node.id);
      const parent = node.parentId ? nodeMap.get(node.parentId) : undefined;
      const cycle = parent ? hasCycle(parent) : false;
      visiting.delete(node.id);
      visited.add(node.id);
      return cycle;
    };
    for (const node of nodes) {
      if (hasCycle(node)) {
        errors.push({ level: "error", message: `Writing hierarchy contains a circular reference at node "${node.title}".` });
        break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats,
    total,
  };
}

// ---------- Schema migration pipeline (architecture for future versions) ----------

type SchemaMigration = (data: ExportData) => ExportData;

const MIGRATIONS: Record<number, SchemaMigration> = {
  // v1 is current. Future versions add entries here, e.g.:
  // 1: (data) => ({ ...data, notes: data.notes.map(...) }),
};

export function migrateBundle(bundle: ExportBundle): { bundle: ExportBundle; applied: string[] } {
  const applied: string[] = [];
  let data = bundle.data;
  for (let version = bundle.schemaVersion; version < SCHEMA_VERSION; version += 1) {
    const migration = MIGRATIONS[version];
    if (!migration) {
      throw new Error(`No migration path exists from schema version ${version}.`);
    }
    data = migration(data);
    applied.push(`v${version} → v${version + 1}`);
  }
  return { bundle: { ...bundle, data, schemaVersion: SCHEMA_VERSION }, applied };
}

// ---------- Duplicate-safe import ----------

export type ImportStrategy = "append" | "replace-all";

function remapReference(
  idMap: Map<string, string>,
  value: string | undefined,
): string | undefined {
  if (!value) return value;
  return idMap.get(value) ?? value;
}

function remapList(idMap: Map<string, string>, ids: string[] | undefined): string[] {
  return (ids ?? []).map((id) => remapReference(idMap, id) ?? id);
}

function remapRefs(idMap: Map<string, string>, refs: WritingNode["researchRefs"]): WritingNode["researchRefs"] {
  return {
    questionIds: remapList(idMap, refs.questionIds),
    sourceIds: remapList(idMap, refs.sourceIds),
    evidenceIds: remapList(idMap, refs.evidenceIds),
    findingIds: remapList(idMap, refs.findingIds),
    insightIds: remapList(idMap, refs.insightIds),
    claimIds: remapList(idMap, refs.claimIds),
    gapIds: remapList(idMap, refs.gapIds),
    hypothesisIds: remapList(idMap, refs.hypothesisIds),
    experimentIds: remapList(idMap, refs.experimentIds),
  };
}

/**
 * Rebuilds an imported dataset under fresh IDs so nothing collides with
 * existing data. Every internal reference is rewritten along the way.
 */
export function remapData(data: ExportData): ExportData {
  const idMap = new Map<string, string>();
  const assign = (row: { id: string }) => {
    idMap.set(row.id, newId());
  };
  data.projects.forEach(assign);
  data.sources.forEach(assign);
  data.evidence.forEach(assign);
  data.questions.forEach(assign);
  data.hypotheses.forEach(assign);
  data.experiments.forEach(assign);
  data.findings.forEach(assign);
  data.insights.forEach(assign);
  data.researchGaps.forEach(assign);
  data.claims.forEach(assign);
  data.notes.forEach(assign);
  data.tags.forEach(assign);
  data.writingProjects.forEach(assign);
  data.writingNodes.forEach(assign);

  const remapId = (row: { id: string }) => idMap.get(row.id) ?? row.id;

  return {
    projects: data.projects.map((row) => ({
      ...row,
      id: remapId(row),
      tagIds: remapList(idMap, row.tagIds),
    })),
    sources: data.sources.map((row) => ({
      ...row,
      id: remapId(row),
      projectId: remapReference(idMap, row.projectId) ?? row.projectId,
      tagIds: remapList(idMap, row.tagIds),
    })),
    evidence: data.evidence.map((row) => ({
      ...row,
      id: remapId(row),
      projectId: remapReference(idMap, row.projectId) ?? row.projectId,
      sourceId: remapReference(idMap, row.sourceId) ?? row.sourceId,
      tagIds: remapList(idMap, row.tagIds),
    })),
    questions: data.questions.map((row) => ({
      ...row,
      id: remapId(row),
      projectId: remapReference(idMap, row.projectId) ?? row.projectId,
      tagIds: remapList(idMap, row.tagIds),
    })),
    hypotheses: data.hypotheses.map((row) => ({
      ...row,
      id: remapId(row),
      projectId: remapReference(idMap, row.projectId) ?? row.projectId,
      questionId: remapReference(idMap, row.questionId),
      tagIds: remapList(idMap, row.tagIds),
    })),
    experiments: data.experiments.map((row) => ({
      ...row,
      id: remapId(row),
      projectId: remapReference(idMap, row.projectId) ?? row.projectId,
      hypothesisId: remapReference(idMap, row.hypothesisId),
      questionId: remapReference(idMap, row.questionId),
      evidenceIds: remapList(idMap, row.evidenceIds),
      findingIds: remapList(idMap, row.findingIds),
      tagIds: remapList(idMap, row.tagIds),
    })),
    findings: data.findings.map((row) => ({
      ...row,
      id: remapId(row),
      projectId: remapReference(idMap, row.projectId) ?? row.projectId,
      questionId: remapReference(idMap, row.questionId),
      experimentId: remapReference(idMap, row.experimentId),
      evidenceIds: remapList(idMap, row.evidenceIds),
      tagIds: remapList(idMap, row.tagIds),
    })),
    insights: data.insights.map((row) => ({
      ...row,
      id: remapId(row),
      projectId: remapReference(idMap, row.projectId) ?? row.projectId,
      questionId: remapReference(idMap, row.questionId),
      findingIds: remapList(idMap, row.findingIds),
      tagIds: remapList(idMap, row.tagIds),
    })),
    researchGaps: data.researchGaps.map((row) => ({
      ...row,
      id: remapId(row),
      projectId: remapReference(idMap, row.projectId) ?? row.projectId,
      questionId: remapReference(idMap, row.questionId),
      questionIds: remapList(idMap, row.questionIds),
      tagIds: remapList(idMap, row.tagIds),
    })),
    claims: data.claims.map((row) => ({
      ...row,
      id: remapId(row),
      projectId: remapReference(idMap, row.projectId) ?? row.projectId,
      evidenceIds: remapList(idMap, row.evidenceIds),
      findingIds: remapList(idMap, row.findingIds),
      tagIds: remapList(idMap, row.tagIds),
    })),
    notes: data.notes.map((row) => ({
      ...row,
      id: remapId(row),
      projectId: remapReference(idMap, row.projectId) ?? row.projectId,
      tagIds: remapList(idMap, row.tagIds),
    })),
    tags: data.tags.map((row) => ({
      ...row,
      id: remapId(row),
    })),
    writingProjects: data.writingProjects.map((row) => ({
      ...row,
      id: remapId(row),
      projectId: remapReference(idMap, row.projectId) ?? row.projectId,
      tagIds: remapList(idMap, row.tagIds),
    })),
    writingNodes: data.writingNodes.map((row) => ({
      ...row,
      id: remapId(row),
      projectId: remapReference(idMap, row.projectId) ?? row.projectId,
      writingProjectId: remapReference(idMap, row.writingProjectId) ?? row.writingProjectId,
      parentId: remapReference(idMap, row.parentId),
      researchRefs: remapRefs(idMap, row.researchRefs),
      tagIds: remapList(idMap, row.tagIds),
    })),
  };
}

function tablesFromData(data: ExportData): Record<string, unknown[]> {
  return {
    projects: data.projects as unknown as unknown[],
    sources: data.sources as unknown as unknown[],
    evidence: data.evidence as unknown as unknown[],
    questions: data.questions as unknown as unknown[],
    hypotheses: data.hypotheses as unknown as unknown[],
    experiments: data.experiments as unknown as unknown[],
    findings: data.findings as unknown as unknown[],
    insights: data.insights as unknown as unknown[],
    gaps: data.researchGaps as unknown as unknown[],
    claims: data.claims as unknown as unknown[],
    notes: data.notes as unknown as unknown[],
    tags: data.tags as unknown as unknown[],
    writingProjects: data.writingProjects as unknown as unknown[],
    writingNodes: data.writingNodes as unknown as unknown[],
  };
}

function snapshotTables(): Record<string, unknown[]> {
  const result: Record<string, unknown[]> = {};
  for (const name of [
    "projects",
    "sources",
    "evidence",
    "questions",
    "hypotheses",
    "experiments",
    "findings",
    "insights",
    "gaps",
    "claims",
    "notes",
    "tags",
    "writingProjects",
    "writingNodes",
  ]) {
    try {
      result[name] = readTable<unknown[]>(name);
    } catch {
      result[name] = [];
    }
  }
  return result;
}

export type ImportResult = {
  mode: ImportStrategy;
  added: Record<string, number>;
  total: number;
};

/** Applies an already-validated bundle. Never silently overwrites: "append" adds a new copy with fresh IDs; "replace-all" wipes first (previous state is snapshotted for rollback). */
export async function applyImport(
  bundle: ExportBundle,
  strategy: ImportStrategy,
): Promise<ImportResult> {
  if (strategy === "append") {
    const incoming = remapData(bundle.data);
    const existing = snapshotTables();
    const incomingTables = tablesFromData(incoming);
    const next: Record<string, unknown[]> = {};
    const added: Record<string, number> = {};
    for (const name of Object.keys(incomingTables)) {
      const existingRows = existing[name] ?? [];
      next[name] = [...existingRows, ...(incomingTables[name] ?? [])];
      added[name] = (incomingTables[name] ?? []).length;
    }
    writeBatch(next);
    const total = Object.values(added).reduce((sum, count) => sum + count, 0);
    return { mode: strategy, added, total };
  }

  const previous = snapshotTables();
  const incomingTables = tablesFromData(bundle.data);
  try {
    clearAll();
    writeBatch(incomingTables);
  } catch (e) {
    try {
      writeBatch(previous);
    } catch {
      // best effort rollback
    }
    throw e;
  }
  return {
    mode: strategy,
    added: Object.fromEntries(
      Object.entries(incomingTables).map(([name, rows]) => [name, rows.length]),
    ),
    total: bundle.data.projects.length + bundle.data.sources.length + bundle.data.evidence.length + bundle.data.questions.length + bundle.data.hypotheses.length + bundle.data.experiments.length + bundle.data.findings.length + bundle.data.insights.length + bundle.data.researchGaps.length + bundle.data.claims.length + bundle.data.notes.length + bundle.data.tags.length + bundle.data.writingProjects.length + bundle.data.writingNodes.length,
  };
}

// ---------- CSV ----------

export function csvEscape(value: unknown): string {
  const text =
    value === null || value === undefined
      ? ""
      : typeof value === "string"
        ? value
        : JSON.stringify(value);
  const needsQuotes = /[",\n\r]/.test(text);
  const escaped = text.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export function toCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return "";
  const headers = Array.from(
    rows.reduce((set: Set<string>, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>()),
  );
  const lines = [headers.map(csvEscape).join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header])).join(","));
  }
  return `\uFEFF${lines.join("\n")}\n`;
}

export function entityCsvRows(graph: Graph, kind: string): Array<Record<string, unknown>> {
  const arr = (value: string[] | undefined) => (value ?? []).join(" | ");
  switch (kind) {
    case "projects":
      return graph.projects.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        topic: p.topic ?? "",
        description: p.description,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        tags: arr(p.tagIds),
      }));
    case "sources":
      return graph.sources.map((s) => ({
        id: s.id,
        projectId: s.projectId,
        title: s.title,
        author: s.author,
        type: s.type,
        url: s.url ?? "",
        publicationDate: s.publicationDate ?? "",
        publisher: s.publisher ?? "",
        description: s.description ?? "",
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));
    case "evidence":
      return graph.evidence.map((e) => ({
        id: e.id,
        projectId: e.projectId,
        sourceId: e.sourceId,
        title: e.title,
        type: e.type,
        location: e.location ?? "",
        content: e.content,
        interpretation: e.interpretation,
        verificationStatus: e.verificationStatus,
        isAiGenerated: e.isAiGenerated,
        notes: e.notes ?? "",
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      }));
    case "questions":
      return graph.questions.map((q) => ({
        id: q.id,
        projectId: q.projectId,
        question: q.question,
        status: q.status,
        priority: q.priority,
        notes: q.notes ?? "",
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
      }));
    case "hypotheses":
      return graph.hypotheses.map((h) => ({
        id: h.id,
        projectId: h.projectId,
        questionId: h.questionId ?? "",
        title: h.title ?? "",
        statement: h.statement,
        rationale: h.rationale,
        status: h.status,
        createdAt: h.createdAt,
        updatedAt: h.updatedAt,
      }));
    case "experiments":
      return graph.experiments.map((ex) => ({
        id: ex.id,
        projectId: ex.projectId,
        hypothesisId: ex.hypothesisId ?? "",
        questionId: ex.questionId ?? "",
        title: ex.title,
        objective: ex.objective ?? "",
        methodology: ex.methodology,
        status: ex.status,
        expectedResult: ex.expectedResult ?? "",
        actualResult: ex.actualResult ?? "",
        conclusion: ex.conclusion ?? "",
        variables: ex.variables.map((v) => `${v.key}${v.unit ? ` (${v.unit})` : ""}=${v.value}`).join("; "),
        evidenceIds: arr(ex.evidenceIds),
        findingIds: arr(ex.findingIds),
        createdAt: ex.createdAt,
        updatedAt: ex.updatedAt,
      }));
    case "findings":
      return graph.findings.map((f) => ({
        id: f.id,
        projectId: f.projectId,
        questionId: f.questionId ?? "",
        experimentId: f.experimentId ?? "",
        title: f.title,
        description: f.description,
        confidence: f.confidence,
        evidenceIds: arr(f.evidenceIds),
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      }));
    case "insights":
      return graph.insights.map((i) => ({
        id: i.id,
        projectId: i.projectId,
        questionId: i.questionId ?? "",
        title: i.title,
        description: i.description,
        findingIds: arr(i.findingIds),
        createdAt: i.createdAt,
        updatedAt: i.updatedAt,
      }));
    case "gaps":
      return graph.gaps.map((g) => ({
        id: g.id,
        projectId: g.projectId,
        questionIds: arr(g.questionIds.length > 0 ? g.questionIds : g.questionId ? [g.questionId] : []),
        title: g.title,
        description: g.description,
        importance: g.importance,
        status: g.status,
        suggestedDirection: g.suggestedDirection ?? "",
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
      }));
    case "claims":
      return graph.claims.map((c) => ({
        id: c.id,
        projectId: c.projectId,
        claim: c.claim,
        type: c.type,
        verificationStatus: c.verificationStatus,
        evidenceIds: arr(c.evidenceIds),
        findingIds: arr(c.findingIds),
        expectedEvidenceCount: c.expectedEvidenceCount ?? "",
        expectedFindingCount: c.expectedFindingCount ?? "",
        notes: c.notes ?? "",
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));
    case "notes":
      return graph.notes.map((n) => ({
        id: n.id,
        projectId: n.projectId,
        title: n.title,
        content: n.content,
        tags: (n.tags ?? []).join(" | "),
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      }));
    case "tags":
      return graph.tags.map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }));
    case "writingProjects":
      return graph.writingProjects.map((wp) => ({
        id: wp.id,
        projectId: wp.projectId,
        title: wp.title,
        type: wp.type,
        status: wp.status,
        outline: wp.outline ?? "",
        summary: wp.summary ?? "",
        createdAt: wp.createdAt,
        updatedAt: wp.updatedAt,
      }));
    case "writingNodes":
      return graph.writingNodes.map((node) => ({
        id: node.id,
        projectId: node.projectId,
        writingProjectId: node.writingProjectId,
        parentId: node.parentId ?? "",
        kind: node.kind,
        order: node.order,
        title: node.title,
        status: node.status,
        wordCount: stripHtml(node.content).split(/\s+/).filter(Boolean).length,
        researchRefs: Object.entries(node.researchRefs)
          .map(([key, ids]) => `${key}:${(ids ?? []).join(",")}`)
          .join("; "),
        createdAt: node.createdAt,
        updatedAt: node.updatedAt,
      }));
    default:
      return [];
  }
}

export function csvFileName(kind: string): string {
  const label: Record<string, string> = {
    projects: "projects",
    sources: "sources",
    evidence: "evidence",
    questions: "research-questions",
    hypotheses: "hypotheses",
    experiments: "experiments",
    findings: "findings",
    insights: "insights",
    gaps: "research-gaps",
    claims: "claims",
    notes: "notes",
    tags: "tags",
    writingProjects: "writing-projects",
    writingNodes: "writing-nodes",
  };
  return `research-hub-${label[kind] ?? kind}-${todayStamp()}.csv`;
}

// ---------- Markdown ----------

function statusLabel(map: Record<string, { label: string }>, value: string | undefined): string {
  if (!value) return "";
  return map[value]?.label ?? value;
}

export function projectMarkdown(graph: Graph, projectId: string): string {
  const project = graph.projects.find((p) => p.id === projectId);
  if (!project) return `# Missing project\n\nThis project could not be found.\n`;
  const lines: string[] = [];
  lines.push(`# ${project.name}`);
  lines.push("");
  if (project.topic) lines.push(`**Topic:** ${project.topic}  \n`);
  lines.push(`**Status:** ${statusLabel(projectStatus, project.status)}  `);
  lines.push(`**Updated:** ${project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : ""}`);

  lines.push("");
  lines.push("## Description");
  lines.push("");
  lines.push(project.description || "*No description provided.*");

  const questions = graph.questions.filter((q) => q.projectId === projectId);
  lines.push("", "## Research Questions");
  if (questions.length === 0) lines.push("", "*None recorded.*");
  for (const q of questions) {
    lines.push("", `### ${q.question}`);
    lines.push(`- Status: ${statusLabel(questionStatus, q.status)}`);
    lines.push(`- Priority: ${statusLabel(priority, q.priority)}`);
    if (q.notes) lines.push(`- Notes: ${q.notes}`);
  }

  const hypotheses = graph.hypotheses.filter((h) => h.projectId === projectId);
  lines.push("", "## Hypotheses");
  if (hypotheses.length === 0) lines.push("", "*None recorded.*");
  for (const h of hypotheses) {
    lines.push("", `### ${h.title ?? h.statement}`);
    lines.push(`- Status: ${statusLabel(hypothesisStatus, h.status)}`);
    if (h.title && h.statement !== h.title) lines.push(`- Statement: ${h.statement}`);
    if (h.rationale) lines.push(`- Rationale: ${h.rationale}`);
    const question = h.questionId ? graph.questions.find((q) => q.id === h.questionId) : undefined;
    if (question) lines.push(`- Related question: ${question.question}`);
  }

  const sources = graph.sources.filter((s) => s.projectId === projectId);
  lines.push("", "## Sources");
  if (sources.length === 0) lines.push("", "*None recorded.*");
  for (const s of sources) {
    lines.push("", `### ${s.title}`);
    if (s.author) lines.push(`- Author: ${s.author}`);
    lines.push(`- Type: ${statusLabel(sourceType, s.type)}`);
    if (s.publisher) lines.push(`- Publisher: ${s.publisher}`);
    if (s.publicationDate) lines.push(`- Published: ${s.publicationDate}`);
    if (s.url) lines.push(`- URL: ${s.url}`);
    if (s.description) lines.push(`- Description: ${s.description}`);
  }

  lines.push("", "## Evidence");
  const evidenceList = graph.evidence.filter((e) => e.projectId === projectId);
  if (evidenceList.length === 0) lines.push("", "*None recorded.*");
  for (const e of evidenceList) {
    const source = graph.sources.find((s) => s.id === e.sourceId);
    lines.push("");
    lines.push(`> ${e.content.replace(/\n/g, "\n> ")}`);
    lines.push("");
    lines.push(
      `— ${e.title}${source ? `, from "${source.title}"` : ""}${e.location ? ` (${e.location})` : ""}. ` +
        `Type: ${statusLabel(evidenceType, e.type)} · ` +
        `Verification: ${statusLabel(verificationStatus, e.verificationStatus)}` +
        (e.isAiGenerated ? " · AI-generated" : ""),
    );
    if (e.interpretation) lines.push(`\n*Interpretation:* ${e.interpretation}`);
  }

  const experiments = graph.experiments.filter((ex) => ex.projectId === projectId);
  lines.push("", "## Experiments");
  if (experiments.length === 0) lines.push("", "*None recorded.*");
  for (const ex of experiments) {
    lines.push("", `### ${ex.title}`);
    lines.push(`- Status: ${statusLabel(experimentStatus, ex.status)}`);
    const hypothesis = ex.hypothesisId ? graph.hypotheses.find((h) => h.id === ex.hypothesisId) : undefined;
    if (hypothesis) lines.push(`- Hypothesis: ${hypothesis.title ?? hypothesis.statement}`);
    if (ex.objective) lines.push(`- Objective: ${ex.objective}`);
    if (ex.methodology) lines.push(`- Methodology: ${ex.methodology}`);
    if (ex.variables.length > 0) {
      lines.push("- Variables: " + ex.variables.map((v) => `${v.key}${v.unit ? ` (${v.unit})` : ""} = ${v.value}`).join("; "));
    }
    if (ex.expectedResult) lines.push(`- Expected result: ${ex.expectedResult}`);
    if (ex.actualResult ?? ex.results) lines.push(`- Actual result: ${ex.actualResult ?? ex.results}`);
    if (ex.conclusion) lines.push(`- Conclusion: ${ex.conclusion}`);
    if (ex.limitations) lines.push(`- Limitations: ${ex.limitations}`);
  }

  const findings = graph.findings.filter((f) => f.projectId === projectId);
  lines.push("", "## Findings");
  if (findings.length === 0) lines.push("", "*None recorded.*");
  for (const f of findings) {
    lines.push("", `### ${f.title}`);
    lines.push(`- Confidence: ${statusLabel(confidence, f.confidence)}`);
    if (f.description) lines.push(`- ${f.description}`);
    if (f.evidenceIds.length > 0) {
      const titles = f.evidenceIds
        .map((id) => graph.evidence.find((e) => e.id === id))
        .filter((e): e is Evidence => Boolean(e))
        .map((e) => e.title);
      if (titles.length > 0) lines.push(`- Based on evidence: ${titles.join("; ")}`);
    }
  }

  const insights = graph.insights.filter((i) => i.projectId === projectId);
  lines.push("", "## Insights");
  if (insights.length === 0) lines.push("", "*None recorded.*");
  for (const i of insights) {
    lines.push("", `### ${i.title}`);
    if (i.description) lines.push(i.description);
    if (i.findingIds.length > 0) {
      const titles = i.findingIds
        .map((id) => graph.findings.find((f) => f.id === id))
        .filter((f): f is Finding => Boolean(f))
        .map((f) => f.title);
      if (titles.length > 0) lines.push(`\n*Built on findings:* ${titles.join("; ")}`);
    }
  }

  const gaps = graph.gaps.filter((g) => g.projectId === projectId);
  lines.push("", "## Research Gaps");
  if (gaps.length === 0) lines.push("", "*None recorded.*");
  for (const g of gaps) {
    lines.push("", `### ${g.title}`);
    lines.push(`- Importance: ${statusLabel(priority, g.importance)}`);
    lines.push(`- Status: ${statusLabel(gapStatus, g.status)}`);
    if (g.description) lines.push(`- ${g.description}`);
    if (g.suggestedDirection) lines.push(`- Suggested direction: ${g.suggestedDirection}`);
    const questionIds = g.questionIds.length > 0 ? g.questionIds : g.questionId ? [g.questionId] : [];
    const qTitles = questionIds
      .map((id) => graph.questions.find((q) => q.id === id))
      .filter((q): q is ResearchQuestion => Boolean(q))
      .map((q) => q.question);
    if (qTitles.length > 0) lines.push(`- Related questions: ${qTitles.join("; ")}`);
  }

  const claims = graph.claims.filter((c) => c.projectId === projectId);
  lines.push("", "## Claims");
  if (claims.length === 0) lines.push("", "*None recorded.*");
  for (const c of claims) {
    const support = claimSupportStatus(graph, c);
    lines.push("", `### ${c.claim}`);
    lines.push(`- Type: ${statusLabel(claimType, c.type)}`);
    lines.push(`- Verification: ${statusLabel(verificationStatus, c.verificationStatus)}`);
    lines.push(`- Support: ${support.label} (${support.detail})`);
    if (c.notes) lines.push(`- Notes: ${c.notes}`);
  }

  const notes = graph.notes.filter((n) => n.projectId === projectId);
  lines.push("", "## Notes");
  if (notes.length === 0) lines.push("", "*None recorded.*");
  for (const n of notes) {
    lines.push("", `### ${n.title}`);
    if (n.tags && n.tags.length > 0) lines.push(`- Tags: ${n.tags.join(", ")}`);
    if (n.content) lines.push("", n.content);
  }

  lines.push("", "---", "", `_Exported from Research Hub on ${new Date().toISOString()}. JSON export is the authoritative lossless format._`, "");
  return lines.join("\n");
}

function writingTree(
  graph: Graph,
  writingProjectId: string,
  parentId: string | undefined,
): WritingNode[] {
  return graph.writingNodes
    .filter((node) => node.writingProjectId === writingProjectId && (node.parentId ?? undefined) === parentId)
    .sort((a, b) => a.order - b.order);
}

const KIND_HEADING: Record<WritingNode["kind"], string> = {
  part: "#",
  chapter: "##",
  section: "###",
  subsection: "####",
  node: "####",
};

function renderNode(graph: Graph, node: WritingNode, lines: string[]): void {
  lines.push("");
  lines.push(`${KIND_HEADING[node.kind] ?? "####"} ${node.title}`);
  const content = stripHtml(node.content);
  if (content) {
    content.split(/\n+/).forEach((paragraph) => {
      const trimmed = paragraph.trim();
      if (trimmed) lines.push("", trimmed);
    });
  }
  if (node.notes) lines.push("", `> ${node.notes}`);
  const children = writingTree(graph, node.writingProjectId, node.id);
  for (const child of children) renderNode(graph, child, lines);
}

export function writingProjectMarkdown(graph: Graph, writingProjectId: string): string {
  const writing = graph.writingProjects.find((wp) => wp.id === writingProjectId);
  if (!writing) return `# Missing writing project\n\nThis writing project could not be found.\n`;
  const lines: string[] = [];
  lines.push(`# ${writing.title}`);
  lines.push("");
  if (writing.summary) lines.push("", writing.summary);
  if (writing.outline && !writing.summary) lines.push("", writing.outline);
  lines.push("");
  const roots = writingTree(graph, writingProjectId, undefined);
  if (roots.length === 0) lines.push("*No content yet.*");
  for (const root of roots) renderNode(graph, root, lines);
  lines.push("", "---", "", `_Exported from Research Hub on ${new Date().toISOString()}. JSON export is the authoritative lossless format._`, "");
  return lines.join("\n");
}

export function researchAndWritingMarkdown(graph: Graph, projectId: string): string {
  const parts: string[] = [projectMarkdown(graph, projectId)];
  const writings = graph.writingProjects.filter((wp) => wp.projectId === projectId);
  for (const writing of writings) {
    parts.push("", "", `# — Writing: ${writing.title} —`, "", writingProjectMarkdown(graph, writing.id));
  }
  return parts.join("\n");
}

export function evidenceSnippet(evidenceRecord: Evidence): string {
  return stripHtml(evidenceRecord.content).slice(0, 200);
}

export function describeExportKind(kind: ExportKind): string {
  switch (kind) {
    case "backup":
      return "Full backup contains all Research Hub data.";
    case "project":
      return "The selected project with all of its research, writing, and tags.";
    case "writing":
      return "A writing project with its hierarchy and linked research.";
    default:
      return "All Research Hub data.";
  }
}

export function isCurrentSchema(bundle: ExportBundle): boolean {
  return bundle.schemaVersion === SCHEMA_VERSION;
}

export function dataFromGraphForTest(graph: Graph): ExportData {
  void emptyGraph;
  return dataFromGraph(graph);
}

export function rawRecoveryExport(): { filename: string; download: () => void } {
  const tables = Object.fromEntries(
    Object.entries(snapshotTables()).map(([name, rows]) => {
      void rows;
      return [name, [] as unknown[]];
    }),
  );
  void tables;
  const payload = { recoveredFrom: "research-hub" };
  return {
    filename: `research-hub-raw-recovery-${todayStamp()}.json`,
    download: () =>
      downloadFile(
        `research-hub-raw-recovery-${todayStamp()}.json`,
        JSON.stringify(payload),
        "application/json",
      ),
  };
}