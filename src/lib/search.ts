import type { EntityKind } from "../types";
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
import { detailEntityHref, itemHref, projectHref, writingProjectHref } from "./hrefs";
import { snippet } from "./format";

export type SearchResult = {
  id: string;
  type: string;
  title: string;
  preview: string;
  href: string;
  projectId?: string;
};

type SearchOptions = {
  projectId?: string;
  writingProjectId?: string;
  types?: EntityKind[];
  limit?: number;
};

function matches(query: string, ...fields: (string | undefined)[]): boolean {
  return fields.some((field) => field?.toLowerCase().includes(query));
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export async function searchAll(
  queryRaw: string,
  options?: SearchOptions,
): Promise<SearchResult[]> {
  const query = queryRaw.trim().toLowerCase();
  if (!query) return [];

  const limit = options?.limit ?? 40;
  const types = options?.types;
  const projectIdFilter = options?.projectId;
  const writingProjectIdFilter = options?.writingProjectId;

  const typeSet = types ? new Set<EntityKind>(types) : null;

  const [
    projs,
    srcs,
    evs,
    qs,
    hyps,
    exps,
    fs,
    ins,
    gs,
    cs,
    ns,
    tagList,
    wpList,
    wnList,
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

  const projectName = (id: string | undefined): string =>
    projs.find((p) => p.id === id)?.name ?? "";

  const results: SearchResult[] = [];

  if (!typeSet || typeSet.has("project")) {
    for (const p of projs) {
      if (projectIdFilter && p.id !== projectIdFilter) continue;
      if (matches(query, p.name, p.description, p.topic)) {
        results.push({
          id: p.id,
          type: "Project",
          title: p.name,
          preview: snippet(p.description) || "No description",
          href: projectHref(p.id),
          projectId: p.id,
        });
      }
    }
  }

  if (!typeSet || typeSet.has("source")) {
    for (const s of srcs) {
      if (projectIdFilter && s.projectId !== projectIdFilter) continue;
      if (matches(query, s.title, s.author, s.description, s.publisher)) {
        results.push({
          id: s.id,
          type: "Source",
          title: s.title,
          preview: snippet(s.description) || s.author || "No description",
          href: itemHref("source", s.id, s.projectId),
          projectId: s.projectId,
        });
      }
    }
  }

  if (!typeSet || typeSet.has("evidence")) {
    for (const e of evs) {
      if (projectIdFilter && e.projectId !== projectIdFilter) continue;
      if (matches(query, e.title, e.content, e.interpretation)) {
        results.push({
          id: e.id,
          type: "Evidence",
          title: e.title,
          preview: snippet(e.content) || snippet(e.interpretation) || "No description",
          href: itemHref("evidence", e.id, e.projectId),
          projectId: e.projectId,
        });
      }
    }
  }

  if (!typeSet || typeSet.has("question")) {
    for (const q of qs) {
      if (projectIdFilter && q.projectId !== projectIdFilter) continue;
      if (matches(query, q.question, q.notes)) {
        results.push({
          id: q.id,
          type: "Research Question",
          title: q.question,
          preview: snippet(q.notes) || projectName(q.projectId),
          href: itemHref("question", q.id, q.projectId),
          projectId: q.projectId,
        });
      }
    }
  }

  if (!typeSet || typeSet.has("hypothesis")) {
    for (const h of hyps) {
      if (projectIdFilter && h.projectId !== projectIdFilter) continue;
      if (matches(query, h.title, h.statement, h.rationale)) {
        results.push({
          id: h.id,
          type: "Hypothesis",
          title: h.title || snippet(h.statement, 80),
          preview: snippet(h.statement) || snippet(h.rationale) || "No description",
          href: detailEntityHref("hypothesis", h.id, h.projectId),
          projectId: h.projectId,
        });
      }
    }
  }

  if (!typeSet || typeSet.has("experiment")) {
    for (const x of exps) {
      if (projectIdFilter && x.projectId !== projectIdFilter) continue;
      if (matches(query, x.title, x.objective, x.methodology, x.conclusion)) {
        results.push({
          id: x.id,
          type: "Experiment",
          title: x.title,
          preview: snippet(x.objective) || snippet(x.methodology) || "No description",
          href: detailEntityHref("experiment", x.id, x.projectId),
          projectId: x.projectId,
        });
      }
    }
  }

  if (!typeSet || typeSet.has("finding")) {
    for (const f of fs) {
      if (projectIdFilter && f.projectId !== projectIdFilter) continue;
      if (matches(query, f.title, f.description)) {
        results.push({
          id: f.id,
          type: "Finding",
          title: f.title,
          preview: snippet(f.description) || "No description",
          href: itemHref("finding", f.id, f.projectId),
          projectId: f.projectId,
        });
      }
    }
  }

  if (!typeSet || typeSet.has("insight")) {
    for (const i of ins) {
      if (projectIdFilter && i.projectId !== projectIdFilter) continue;
      if (matches(query, i.title, i.description)) {
        results.push({
          id: i.id,
          type: "Insight",
          title: i.title,
          preview: snippet(i.description) || "No description",
          href: itemHref("insight", i.id, i.projectId),
          projectId: i.projectId,
        });
      }
    }
  }

  if (!typeSet || typeSet.has("gap")) {
    for (const g of gs) {
      if (projectIdFilter && g.projectId !== projectIdFilter) continue;
      if (matches(query, g.title, g.description, g.suggestedDirection)) {
        results.push({
          id: g.id,
          type: "Research Gap",
          title: g.title,
          preview: snippet(g.description) || "No description",
          href: itemHref("gap", g.id, g.projectId),
          projectId: g.projectId,
        });
      }
    }
  }

  if (!typeSet || typeSet.has("claim")) {
    for (const c of cs) {
      if (projectIdFilter && c.projectId !== projectIdFilter) continue;
      if (matches(query, c.claim, c.notes)) {
        results.push({
          id: c.id,
          type: "Claim",
          title: c.claim,
          preview: snippet(c.notes) || "No description",
          href: itemHref("claim", c.id, c.projectId),
          projectId: c.projectId,
        });
      }
    }
  }

  if (!typeSet || typeSet.has("note")) {
    for (const n of ns) {
      if (projectIdFilter && n.projectId !== projectIdFilter) continue;
      if (matches(query, n.title, n.content)) {
        results.push({
          id: n.id,
          type: "Note",
          title: n.title,
          preview: snippet(n.content) || "No description",
          href: itemHref("note", n.id, n.projectId),
          projectId: n.projectId,
        });
      }
    }
  }

  if (!typeSet || typeSet.has("tag")) {
    for (const t of tagList) {
      if (matches(query, t.name)) {
        results.push({
          id: t.id,
          type: "Tag",
          title: t.name,
          preview: `Color: ${t.color}`,
          href: "/tags",
        });
      }
    }
  }

  if (!typeSet || typeSet.has("writingProject")) {
    for (const wp of wpList) {
      if (projectIdFilter && wp.projectId !== projectIdFilter) continue;
      if (writingProjectIdFilter && wp.id !== writingProjectIdFilter) continue;
      if (matches(query, wp.title, wp.summary, wp.outline)) {
        results.push({
          id: wp.id,
          type: "Writing Project",
          title: wp.title,
          preview: snippet(wp.summary) || "No summary",
          href: writingProjectHref(wp.id),
          projectId: wp.projectId,
        });
      }
    }
  }

  if (!typeSet || typeSet.has("writingNode")) {
    for (const wn of wnList) {
      if (projectIdFilter && wn.projectId !== projectIdFilter) continue;
      if (writingProjectIdFilter && wn.writingProjectId !== writingProjectIdFilter) continue;
      if (matches(query, wn.title, stripTags(wn.content))) {
        results.push({
          id: wn.id,
          type: "Writing",
          title: wn.title,
          preview: snippet(stripTags(wn.content)) || "No content",
          href: writingProjectHref(wn.writingProjectId),
          projectId: wn.projectId,
        });
      }
    }
  }

  results.sort((a, b) => a.type.localeCompare(b.type));
  return results.slice(0, limit);
}
