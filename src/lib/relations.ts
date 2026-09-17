import type {
  Claim,
  Evidence,
  Experiment,
  Finding,
  Hypothesis,
  Insight,
  ResearchGap,
  ResearchQuestion,
  Source,
  WritingNode,
} from "../types";
import type { Graph } from "./graph";
import { byId } from "./graph";
import { itemHref, writingNodeHref } from "./hrefs";
import { claimSupport, type ClaimSupportState } from "./meta";

export type LinkedItem = { id: string; title: string; href: string; projectId: string };

export type RelatedGroup = {
  kind: string;
  type: string;
  items: LinkedItem[];
};

const EMPTY_REFS = {
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

export function nodeRefs(node: WritingNode | undefined) {
  return node?.researchRefs ?? EMPTY_REFS;
}

function hrefFor(kind: string, id: string, projectId: string): string {
  return itemHref(kind as Parameters<typeof itemHref>[0], id, projectId);
}

export function relatedTo(graph: Graph, kind: string, id: string): RelatedGroup[] {
  const groups: RelatedGroup[] = [];

  const push = (groupKind: string, type: string, items: LinkedItem[]) => {
    if (items.length > 0) groups.push({ kind: groupKind, type, items });
  };

  const writingNodesUsing = (
    type: string,
    pick: (refs: ReturnType<typeof nodeRefs>) => string[],
  ) =>
    push(
      "writingNode",
      type,
      graph.writingNodes
        .filter((node) => pick(nodeRefs(node)).includes(id))
        .map((node) => ({
          id: node.id,
          title: node.title,
          href: writingNodeHref(node.writingProjectId, node.id),
          projectId: node.projectId,
        })),
    );

  switch (kind) {
    case "source": {
      push(
        "evidence",
        "Evidence extracted from this source",
        graph.evidence
          .filter((e) => e.sourceId === id)
          .map((e) => ({ id: e.id, title: e.title, href: hrefFor("evidence", e.id, e.projectId), projectId: e.projectId })),
      );
      writingNodesUsing("Used in writing", (refs) => refs.sourceIds);
      break;
    }
    case "evidence": {
      push(
        "claim",
        "Claims using this evidence",
        graph.claims
          .filter((c) => c.evidenceIds.includes(id))
          .map((c) => ({ id: c.id, title: c.claim, href: hrefFor("claim", c.id, c.projectId), projectId: c.projectId })),
      );
      push(
        "finding",
        "Findings using this evidence",
        graph.findings
          .filter((f) => f.evidenceIds.includes(id))
          .map((f) => ({ id: f.id, title: f.title, href: hrefFor("finding", f.id, f.projectId), projectId: f.projectId })),
      );
      push(
        "experiment",
        "Experiments using this evidence",
        graph.experiments
          .filter((ex) => ex.evidenceIds.includes(id))
          .map((ex) => ({ id: ex.id, title: ex.title, href: hrefFor("experiment", ex.id, ex.projectId), projectId: ex.projectId })),
      );
      writingNodesUsing("Used in writing", (refs) => refs.evidenceIds);
      break;
    }
    case "question": {
      push(
        "hypothesis",
        "Hypotheses answering this question",
        graph.hypotheses
          .filter((h) => h.questionId === id)
          .map((h) => ({ id: h.id, title: h.title ?? h.statement, href: hrefFor("hypothesis", h.id, h.projectId), projectId: h.projectId })),
      );
      push(
        "experiment",
        "Experiments about this question",
        graph.experiments
          .filter((ex) => ex.questionId === id)
          .map((ex) => ({ id: ex.id, title: ex.title, href: hrefFor("experiment", ex.id, ex.projectId), projectId: ex.projectId })),
      );
      push(
        "finding",
        "Findings related to this question",
        graph.findings
          .filter((f) => f.questionId === id)
          .map((f) => ({ id: f.id, title: f.title, href: hrefFor("finding", f.id, f.projectId), projectId: f.projectId })),
      );
      push(
        "insight",
        "Insights from this question",
        graph.insights
          .filter((ins) => ins.questionId === id)
          .map((ins) => ({ id: ins.id, title: ins.title, href: hrefFor("insight", ins.id, ins.projectId), projectId: ins.projectId })),
      );
      push(
        "gap",
        "Research gaps around this question",
        graph.gaps
          .filter((g) => g.questionIds.includes(id) || g.questionId === id)
          .map((g) => ({ id: g.id, title: g.title, href: hrefFor("gap", g.id, g.projectId), projectId: g.projectId })),
      );
      writingNodesUsing("Used in writing", (refs) => refs.questionIds);
      break;
    }
    case "hypothesis": {
      push(
        "experiment",
        "Experiments testing this hypothesis",
        graph.experiments
          .filter((ex) => ex.hypothesisId === id)
          .map((ex) => ({ id: ex.id, title: ex.title, href: hrefFor("experiment", ex.id, ex.projectId), projectId: ex.projectId })),
      );
      writingNodesUsing("Used in writing", (refs) => refs.hypothesisIds);
      break;
    }
    case "experiment": {
      push(
        "finding",
        "Findings from this experiment",
        graph.findings
          .filter((f) => f.experimentId === id)
          .map((f) => ({ id: f.id, title: f.title, href: hrefFor("finding", f.id, f.projectId), projectId: f.projectId })),
      );
      writingNodesUsing("Used in writing", (refs) => refs.experimentIds);
      break;
    }
    case "finding": {
      push(
        "claim",
        "Claims using this finding",
        graph.claims
          .filter((c) => c.findingIds.includes(id))
          .map((c) => ({ id: c.id, title: c.claim, href: hrefFor("claim", c.id, c.projectId), projectId: c.projectId })),
      );
      push(
        "insight",
        "Insights built on this finding",
        graph.insights
          .filter((ins) => ins.findingIds.includes(id))
          .map((ins) => ({ id: ins.id, title: ins.title, href: hrefFor("insight", ins.id, ins.projectId), projectId: ins.projectId })),
      );
      push(
        "experiment",
        "Experiments linked to this finding",
        graph.experiments
          .filter((ex) => ex.findingIds.includes(id))
          .map((ex) => ({ id: ex.id, title: ex.title, href: hrefFor("experiment", ex.id, ex.projectId), projectId: ex.projectId })),
      );
      writingNodesUsing("Used in writing", (refs) => refs.findingIds);
      break;
    }
    case "insight": {
      writingNodesUsing("Used in writing", (refs) => refs.insightIds);
      break;
    }
    case "gap": {
      writingNodesUsing("Used in writing", (refs) => refs.gapIds);
      break;
    }
    case "claim": {
      writingNodesUsing("Used in writing", (refs) => refs.claimIds);
      break;
    }
    default:
      break;
  }
  return groups;
}

export type ParentRef = { kind: string; title: string; href: string };

/** Direct upstream references (what this record is derived from or linked to). */
export function parentsOf(graph: Graph, kind: string, id: string): ParentRef[] {
  const out: ParentRef[] = [];
  const add = (targetKind: string, title: string, targetId: string, projectId: string) => {
    out.push({ kind: targetKind, title, href: hrefFor(targetKind, targetId, projectId) });
  };
  switch (kind) {
    case "evidence": {
      const ev = byId(graph.evidence, id);
      const source = ev ? byId(graph.sources, ev.sourceId) : undefined;
      if (ev && source) add("source", source.title, source.id, ev.projectId);
      break;
    }
    case "finding": {
      const f = byId(graph.findings, id);
      if (f) {
        const ex = f.experimentId ? byId(graph.experiments, f.experimentId) : undefined;
        if (ex) add("experiment", ex.title, ex.id, f.projectId);
        const q = f.questionId ? byId(graph.questions, f.questionId) : undefined;
        if (q) add("question", q.question, q.id, f.projectId);
      }
      break;
    }
    case "claim": {
      const c = byId(graph.claims, id);
      if (c) {
        for (const evidenceId of c.evidenceIds) {
          const ev = byId(graph.evidence, evidenceId);
          if (ev) add("evidence", ev.title, ev.id, c.projectId);
        }
        for (const findingId of c.findingIds) {
          const f = byId(graph.findings, findingId);
          if (f) add("finding", f.title, f.id, c.projectId);
        }
      }
      break;
    }
    case "insight": {
      const ins = byId(graph.insights, id);
      if (ins) {
        const q = ins.questionId ? byId(graph.questions, ins.questionId) : undefined;
        if (q) add("question", q.question, q.id, ins.projectId);
        for (const findingId of ins.findingIds) {
          const f = byId(graph.findings, findingId);
          if (f) add("finding", f.title, f.id, ins.projectId);
        }
      }
      break;
    }
    case "hypothesis": {
      const h = byId(graph.hypotheses, id);
      const q = h?.questionId ? byId(graph.questions, h.questionId) : undefined;
      if (h && q) add("question", q.question, q.id, h.projectId);
      break;
    }
    case "experiment": {
      const ex = byId(graph.experiments, id);
      if (ex) {
        const h = ex.hypothesisId ? byId(graph.hypotheses, ex.hypothesisId) : undefined;
        if (h) add("hypothesis", h.title ?? h.statement, h.id, ex.projectId);
        const q = ex.questionId ? byId(graph.questions, ex.questionId) : undefined;
        if (q) add("question", q.question, q.id, ex.projectId);
      }
      break;
    }
    case "gap": {
      const g = byId(graph.gaps, id);
      if (g) {
        const questionIds =
          g.questionIds.length > 0 ? g.questionIds : g.questionId ? [g.questionId] : [];
        for (const questionId of questionIds) {
          const q = byId(graph.questions, questionId);
          if (q) add("question", q.question, q.id, g.projectId);
        }
      }
      break;
    }
    default:
      break;
  }
  return out;
}

/** Direct downstream records derived from this one. */
export function childrenOf(graph: Graph, kind: string, id: string): LinkedItem[] {
  switch (kind) {
    case "source":
      return graph.evidence
        .filter((e) => e.sourceId === id)
        .map((e) => ({ id: e.id, title: e.title, href: hrefFor("evidence", e.id, e.projectId), projectId: e.projectId }));
    case "question":
      return [
        ...graph.hypotheses
          .filter((h) => h.questionId === id)
          .map((h) => ({ id: h.id, title: `Hypothesis: ${h.title ?? h.statement}`, href: hrefFor("hypothesis", h.id, h.projectId), projectId: h.projectId })),
        ...graph.findings
          .filter((f) => f.questionId === id)
          .map((f) => ({ id: f.id, title: `Finding: ${f.title}`, href: hrefFor("finding", f.id, f.projectId), projectId: f.projectId })),
      ];
    case "hypothesis":
      return graph.experiments
        .filter((ex) => ex.hypothesisId === id)
        .map((ex) => ({ id: ex.id, title: ex.title, href: hrefFor("experiment", ex.id, ex.projectId), projectId: ex.projectId }));
    case "experiment":
      return graph.findings
        .filter((f) => f.experimentId === id)
        .map((f) => ({ id: f.id, title: f.title, href: hrefFor("finding", f.id, f.projectId), projectId: f.projectId }));
    default:
      return [];
  }
}

export type ClaimSupportResult = {
  state: ClaimSupportState;
  label: string;
  tone: "green" | "amber" | "red";
  linked: number;
  expected: number;
  detail: string;
};

/**
 * Derived claim support state. The researcher still controls verification;
 * support only reflects links, never automatically implies truth.
 */
export function claimSupportStatus(graph: Graph, claim: Claim): ClaimSupportResult {
  const linkedEvidence = claim.evidenceIds.filter((id) => byId(graph.evidence, id)).length;
  const linkedFindings = claim.findingIds.filter((id) => byId(graph.findings, id)).length;
  const linked = linkedEvidence + linkedFindings;
  const expected =
    (claim.expectedEvidenceCount ?? 0) + (claim.expectedFindingCount ?? 0);

  const toneFor = (state: ClaimSupportState): "green" | "amber" | "red" => {
    const tone = claimSupport[state].tone;
    if (tone === "green" || tone === "blue") return "green";
    if (tone === "amber") return "amber";
    return "red";
  };

  if (claim.verificationStatus === "disputed") {
    return {
      state: "disputed",
      label: claimSupport.disputed.label,
      tone: toneFor("disputed"),
      linked,
      expected,
      detail: "Marked as disputed by the researcher.",
    };
  }
  if (linked === 0) {
    return {
      state: "unsupported",
      label: claimSupport.unsupported.label,
      tone: toneFor("unsupported"),
      linked,
      expected,
      detail: "No linked evidence or findings support this claim.",
    };
  }
  if (expected > 0 && linked < expected) {
    return {
      state: "partiallySupported",
      label: claimSupport.partiallySupported.label,
      tone: toneFor("partiallySupported"),
      linked,
      expected,
      detail: `${linked} of ${expected} expected supporting links present.`,
    };
  }
  return {
    state: "supported",
    label: claimSupport.supported.label,
    tone: toneFor("supported"),
    linked,
    expected,
    detail:
      expected > 0
        ? `All ${expected} expected supporting links present.`
        : "Has at least one supporting link.",
  };
}

/** Unique research entities referenced by a writing project's nodes. */
export function writingCoverage(graph: Graph, writingProjectId: string) {
  const nodes = graph.writingNodes.filter((node) => node.writingProjectId === writingProjectId);
  const refs = {
    sourceIds: new Set<string>(),
    evidenceIds: new Set<string>(),
    questionIds: new Set<string>(),
    hypothesisIds: new Set<string>(),
    experimentIds: new Set<string>(),
    findingIds: new Set<string>(),
    insightIds: new Set<string>(),
    claimIds: new Set<string>(),
    gapIds: new Set<string>(),
  };
  for (const node of nodes) {
    for (const key of Object.keys(refs) as Array<keyof typeof refs>) {
      for (const id of nodeRefs(node)[key]) refs[key].add(id);
    }
  }
  return {
    nodeCount: nodes.length,
    sourceIds: refs.sourceIds.size,
    evidenceIds: refs.evidenceIds.size,
    questionIds: refs.questionIds.size,
    hypothesisIds: refs.hypothesisIds.size,
    experimentIds: refs.experimentIds.size,
    findingIds: refs.findingIds.size,
    insightIds: refs.insightIds.size,
    claimIds: refs.claimIds.size,
    gapIds: refs.gapIds.size,
  };
}

/** Records that would be affected if `kind:id` were deleted. */
export function deleteImpact(graph: Graph, kind: string, id: string): { count: number; groups: RelatedGroup[] } {
  const groups = relatedTo(graph, kind, id);
  const count = groups.reduce((sum, group) => sum + group.items.length, 0);
  return { count, groups };
}

export function evidenceForSource(graph: Graph, source: Source): Evidence[] {
  return graph.evidence.filter((e) => e.sourceId === source.id);
}

export function hypothesesForQuestion(graph: Graph, question: ResearchQuestion): Hypothesis[] {
  return graph.hypotheses.filter((h) => h.questionId === question.id);
}

export function experimentsForHypothesis(graph: Graph, hypothesis: Hypothesis): Experiment[] {
  return graph.experiments.filter((ex) => ex.hypothesisId === hypothesis.id);
}

export function experimentsForQuestion(graph: Graph, question: ResearchQuestion): Experiment[] {
  return graph.experiments.filter((ex) => ex.questionId === question.id);
}

export function gapsForQuestion(graph: Graph, question: ResearchQuestion): ResearchGap[] {
  return graph.gaps.filter(
    (g) => g.questionIds.includes(question.id) || g.questionId === question.id,
  );
}

export function claimsForFinding(graph: Graph, finding: Finding): Claim[] {
  return graph.claims.filter((c) => c.findingIds.includes(finding.id));
}

export function claimsUsingEvidence(graph: Graph, evidenceRecord: Evidence): Claim[] {
  return graph.claims.filter((c) => c.evidenceIds.includes(evidenceRecord.id));
}

export function insightsForFinding(graph: Graph, finding: Finding): Insight[] {
  return graph.insights.filter((ins) => ins.findingIds.includes(finding.id));
}

export function findingsForInsight(graph: Graph, insight: { findingIds: string[] }): Finding[] {
  return insight.findingIds
    .map((id) => byId(graph.findings, id))
    .filter((f): f is Finding => Boolean(f));
}

export function questionsForGap(graph: Graph, gap: ResearchGap): ResearchQuestion[] {
  const ids = gap.questionIds.length > 0 ? gap.questionIds : gap.questionId ? [gap.questionId] : [];
  return ids
    .map((id) => byId(graph.questions, id))
    .filter((q): q is ResearchQuestion => Boolean(q));
}