import type { EntityKind } from "../types";

export type TabKey =
  | "overview"
  | "sources"
  | "evidence"
  | "questions"
  | "hypotheses"
  | "experiments"
  | "findings"
  | "insights"
  | "gaps"
  | "claims"
  | "notes"
  | "index";

export const TAB_BY_ENTITY: Record<string, TabKey> = {
  project: "overview",
  source: "sources",
  evidence: "evidence",
  question: "questions",
  hypothesis: "hypotheses",
  experiment: "experiments",
  finding: "findings",
  insight: "insights",
  gap: "gaps",
  claim: "claims",
  note: "notes",
};

const ROUTABLE_ENTITIES: Set<string> = new Set([
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
]);

export function projectHref(id: string): string {
  return `/projects/${id}`;
}

export function itemHref(
  entity: Exclude<EntityKind, "project">,
  itemId: string,
  projectId: string | undefined,
): string {
  if (!projectId) return "/projects";
  if (!ROUTABLE_ENTITIES.has(entity)) {
    return `${projectHref(projectId)}?tab=${TAB_BY_ENTITY[entity] ?? "overview"}&focus=${encodeURIComponent(itemId)}`;
  }
  return `${projectHref(projectId)}/${entity}/${encodeURIComponent(itemId)}`;
}

export function tabHref(projectId: string, tab: TabKey): string {
  if (tab === "overview") return projectHref(projectId);
  if (tab === "index") return `${projectHref(projectId)}?tab=index`;
  return `${projectHref(projectId)}?tab=${tab}`;
}

export function writingProjectHref(id: string): string {
  return `/writing/${id}`;
}

export function writingNodeHref(projectId: string, nodeId: string): string {
  return `/writing/${projectId}?node=${encodeURIComponent(nodeId)}`;
}

export function writingHref(): string {
  return "/writing";
}

export function detailEntityHref(
  entity: string,
  id: string,
  projectId: string,
): string {
  return `/projects/${projectId}/${entity}/${encodeURIComponent(id)}`;
}