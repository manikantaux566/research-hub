import type {
  Claim,
  Experiment,
  Hypothesis,
  Note,
  ResearchGap,
  ResearchProject,
  Source,
  Tag,
  WritingNode,
} from "../../types";
import { readTable, tableNames, writeTable } from "./db";

/**
 * Keeps stored data compatible with the current schema. This is the ONLY
 * place migration logic for persisted data lives. It is safe to re-run:
 * each normalizer only writes a table back when something actually changed.
 */

const HYPOTHESIS_STATUS_LEGACY = {
  refuted: "notSupported",
} as const;

const EXPERIMENT_STATUS_LEGACY = {
  abandoned: "cancelled",
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function normalizeHypothesis(row: Hypothesis): boolean {
  let changed = false;
  if (
    typeof row.status === "string" &&
    row.status in HYPOTHESIS_STATUS_LEGACY
  ) {
    row.status = HYPOTHESIS_STATUS_LEGACY[
      row.status as keyof typeof HYPOTHESIS_STATUS_LEGACY
    ];
    changed = true;
  }
  return changed;
}

function normalizeExperiment(row: Experiment): boolean {
  let changed = false;
  if (
    typeof row.status === "string" &&
    row.status in EXPERIMENT_STATUS_LEGACY
  ) {
    row.status =
      EXPERIMENT_STATUS_LEGACY[row.status as keyof typeof EXPERIMENT_STATUS_LEGACY];
    changed = true;
  }
  if (!Array.isArray(row.variables)) {
    (row as { variables: unknown[] }).variables = [];
    changed = true;
  }
  if (!Array.isArray(row.evidenceIds)) {
    (row as { evidenceIds: unknown[] }).evidenceIds = [];
    changed = true;
  }
  if (!Array.isArray(row.findingIds)) {
    (row as { findingIds: unknown[] }).findingIds = [];
    changed = true;
  }
  if (
    typeof row.results === "string" &&
    (typeof row.actualResult !== "string" || row.actualResult.length === 0)
  ) {
    row.actualResult = row.results;
    changed = true;
  }
  return changed;
}

function normalizeGap(row: ResearchGap): boolean {
  let changed = false;
  if (!Array.isArray(row.questionIds)) {
    const ids = row.questionId ? [row.questionId] : [];
    (row as { questionIds: unknown[] }).questionIds = ids;
    changed = true;
  }
  return changed;
}

function normalizeNote(row: Note): boolean {
  if (!Array.isArray(row.tags)) {
    (row as { tags: unknown[] }).tags = [];
    return true;
  }
  return false;
}

function normalizeTag(row: Tag): boolean {
  if (typeof row.updatedAt !== "string") {
    (row as { updatedAt: string }).updatedAt = row.createdAt;
    return true;
  }
  return false;
}

function normalizeWritingNode(row: WritingNode): boolean {
  let changed = false;
  if (!isRecord(row.researchRefs)) {
    (row as { researchRefs: unknown }).researchRefs = {
      questionIds: [],
      sourceIds: [],
      evidenceIds: [],
      findingIds: [],
      insightIds: [],
      claimIds: [],
      gapIds: [],
      hypothesisIds: [],
      experimentIds: [],
    };
    changed = true;
  } else {
    const refs = row.researchRefs as Record<string, unknown>;
    for (const key of Object.keys(refs)) {
      if (!Array.isArray(refs[key])) {
        refs[key] = [];
        changed = true;
      }
    }
  }
  return changed;
}

function normalizeClaim(row: Claim): boolean {
  const expected = (value: unknown) =>
    typeof value === "number" && Number.isFinite(value) && value >= 0;
  let changed = false;
  if (row.expectedEvidenceCount !== undefined && !expected(row.expectedEvidenceCount)) {
    delete (row as { expectedEvidenceCount?: number }).expectedEvidenceCount;
    changed = true;
  }
  if (row.expectedFindingCount !== undefined && !expected(row.expectedFindingCount)) {
    delete (row as { expectedFindingCount?: number }).expectedFindingCount;
    changed = true;
  }
  return changed;
}

function normalizeProject(_row: ResearchProject): boolean {
  return false;
}

function normalizeSource(_row: Source): boolean {
  return false;
}

const NORMALIZERS: Record<string, (row: unknown) => boolean> = {
  projects: (row) => normalizeProject(row as ResearchProject),
  sources: (row) => normalizeSource(row as Source),
  hypotheses: (row) => normalizeHypothesis(row as Hypothesis),
  experiments: (row) => normalizeExperiment(row as Experiment),
  gaps: (row) => normalizeGap(row as ResearchGap),
  notes: (row) => normalizeNote(row as Note),
  claims: (row) => normalizeClaim(row as Claim),
  tags: (row) => normalizeTag(row as Tag),
  writingNodes: (row) => normalizeWritingNode(row as WritingNode),
};

/**
 * Verifies every table currently stored can be parsed. Throws with a
 * user-readable message listing corrupted tables.
 */
export function assertStorageReadable(): void {
  const corrupted: string[] = [];
  for (const name of tableNames()) {
    try {
      readTable<unknown>(name);
    } catch {
      corrupted.push(name);
    }
  }
  if (corrupted.length > 0) {
    throw new Error(
      `Research Hub could not read its saved data (tables: ${corrupted.join(", ")}).`,
    );
  }
}

/**
 * Applies schema migrations to every stored table. Returns which tables
 * were changed. Never runs automatically for real users in a way that
 * blocks the app; called once at boot.
 */
export function migrateStorage(): { migrated: string[] } {
  const migrated: string[] = [];
  for (const name of tableNames()) {
    const normalize = NORMALIZERS[name];
    if (!normalize) continue;
    const rows = readTable<Record<string, unknown>>(name);
    let changed = false;
    for (const row of rows) {
      if (isRecord(row) && normalize(row)) changed = true;
    }
    if (changed) {
      writeTable(name, rows);
      migrated.push(name);
    }
  }
  return { migrated };
}

/** Ensures optional array fields have sane defaults for data written by older versions. */
export function defaultArray<T>(value: T[] | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

export function defaultStringArray(rows: unknown, fallback: string[] = []): string[] {
  const parsed = stringArray(rows);
  return parsed.length > 0 ? parsed : fallback;
}