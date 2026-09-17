import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { EntityKind } from "../types";
import { loadGraph, projectOf, byId } from "../lib/graph";
import type { Graph } from "../lib/graph";
import {
  claimSupportStatus,
  relatedTo,
  parentsOf,
  childrenOf,
} from "../lib/relations";
import {
  claimType,
  confidence,
  evidenceType,
  experimentStatus,
  gapStatus,
  hypothesisStatus,
  priority,
  questionStatus,
  sourceType,
  verificationStatus,
} from "../lib/meta";
import { formatDate } from "../lib/format";
import { itemHref, tabHref } from "../lib/hrefs";
import { DetailShell, RelatedPanel, DetailCard, FieldRow } from "../components/entities/DetailShell";
import { Badge } from "../components/ui/Badge";
import { Spinner } from "../components/ui/Spinner";
import { Icon } from "../components/ui/Icon";
import { Header } from "../components/layout/Header";

const ROUTABLE_CHILDREN: Record<string, string> = {
  source: "evidence",
  question: "hypothesis",
  hypothesis: "experiment",
  experiment: "finding",
};

const KIND_LABEL: Record<string, string> = {
  source: "Source",
  evidence: "Evidence",
  question: "Research Question",
  hypothesis: "Hypothesis",
  experiment: "Experiment",
  finding: "Finding",
  insight: "Insight",
  gap: "Research Gap",
  claim: "Claim",
  note: "Note",
};

export function EntityDetailPage() {
  const { projectId = "", entity = "", entityId = "" } = useParams();
  const [graph, setGraph] = useState<Graph | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadGraph()
      .then((g) => {
        if (alive) setGraph(g);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load data.");
      });
    return () => {
      alive = false;
    };
  }, [projectId, entity, entityId]);

  if (error) {
    return (
      <div className="pb-10">
        <Header title="Record" icon="document" />
        <div className="px-6">
          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-5 py-4 text-sm text-foreground">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/15">
              <Icon name="error" className="h-4 w-4" />
            </span>
            {error}
          </div>
        </div>
      </div>
    );
  }
  if (!graph) {
    return (
      <div className="pb-10">
        <Header title="Record" icon="document" />
        <div className="px-6">
          <Spinner label="Loading record…" />
        </div>
      </div>
    );
  }

  const project = projectOf(graph, projectId);
  const projectName = project?.name ?? "Project";

  const kind = entity as EntityKind;
  const title = entityTitle(kind, entityId, graph) ?? "Record not found";
  const missing = title === "Record not found";

  const groups = relatedTo(graph, kind === "note" ? "note" : kind, entityId);

  const backTab = { source: "sources", evidence: "evidence", question: "questions", hypothesis: "hypotheses", experiment: "experiments", finding: "findings", insight: "insights", gap: "gaps", claim: "claims", note: "notes" }[entity] ?? "overview";

  const labels: Record<string, { label: string; tone: string } | undefined> = {
    source: sourceType[sourceMeta(graph, entityId)],
    evidence: evidenceType[evidenceMeta(graph, entityId)],
    question: questionStatus[questionRecord(graph, entityId)?.status ?? ""],
    hypothesis: hypothesisStatus[hypothesisRecord(graph, entityId)?.status ?? ""],
    experiment: experimentStatus[experimentRecord(graph, entityId)?.status ?? ""],
    finding: confidence[findingRecord(graph, entityId)?.confidence ?? ""],
    gap: gapStatus[gapRecord(graph, entityId)?.status ?? ""],
    claim: (() => {
      const c = claimRecord(graph, entityId);
      return c ? claimType[c.type] : undefined;
    })(),
  };

  const badges = [
    labels[entity] ? { label: labels[entity]!.label, tone: labels[entity]!.tone } : null,
    ...(entity === "evidence"
      ? [evidenceEntry(graph, entityId)?.isAiGenerated
          ? { label: "AI-generated", tone: "amber" }
          : null]
      : []),
    ...(entity === "evidence" && evidenceEntry(graph, entityId)
      ? [
          {
            label:
              verificationStatus[evidenceEntry(graph, entityId)!.verificationStatus]?.label ??
              "Unverified",
            tone:
              verificationStatus[evidenceEntry(graph, entityId)!.verificationStatus]?.tone ??
              "amber",
          },
        ]
      : []),
  ].filter((b): b is { label: string; tone: string } => b !== null);

  const children = childrenOf(graph, kind, entityId);
  const parents = parentsOf(graph, kind, entityId);

  const asideGroups = [
    ...(parents.length > 0
      ? [{ kind: "parents", type: "Derived from", items: parents.map((p) => ({ id: p.href, title: p.title, href: p.href, projectId })) }]
      : []),
    ...(children.length > 0
      ? [{ kind: "children", type: "Leads to", items: children }]
      : []),
    ...groups,
  ];
  const childKind = ROUTABLE_CHILDREN[entity];

  return (
    <div>
      <DetailShell
        projectId={projectId}
        projectName={projectName}
        backTab={backTab}
        backLabel={KIND_LABEL[entity] ?? "Record"}
        title={title}
        badges={badges}
        actions={
          <Link
            to={tabHref(projectId, backTab as "overview")}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border-strong bg-surface px-3 text-xs font-medium text-foreground transition-colors hover:bg-surface-hover"
          >
            <Icon name="arrow-left" className="h-3.5 w-3.5 text-muted" />
            <span className="sm:hidden">Project</span>
            <span className="hidden sm:inline">Open in project tab</span>
          </Link>
        }
        aside={<RelatedPanel groups={asideGroups} />}
      >
        <div className="space-y-4">
          {entity === "claim" && claimRecord(graph, entityId) && (
            <ClaimSupportCard claimId={entityId} graph={graph} />
          )}
          {entity === "experiment" && experimentRecord(graph, entityId) && (
            <ExperimentCard id={entityId} graph={graph} />
          )}
          {entity === "hypothesis" && hypothesisRecord(graph, entityId) && (
            <HypothesisCard id={entityId} graph={graph} />
          )}
          <DetailCard title="Details" icon="info">
            <dl>
              {renderFields(kind, entityId, graph)}
            </dl>
          </DetailCard>
          {childKind && children.length > 0 && (
            <DetailCard title={`${children.length} related ${childKind}(s)`} icon="link">
              <ul className="-my-1">
                {children.map((child) => (
                  <li key={child.id}>
                    <Link
                      to={child.href}
                      className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-foreground transition-colors hover:bg-surface-hover"
                    >
                      <Icon
                        name="arrow-right"
                        className="h-3.5 w-3.5 shrink-0 text-faint"
                      />
                      <span className="min-w-0 flex-1 truncate">{child.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </DetailCard>
          )}
        </div>
      </DetailShell>
      {missing && (
        <div className="px-6 pb-6">
          <Link to={tabHref(projectId, "overview")} className="text-sm text-link hover:text-link">
            ← Back to {projectName}
          </Link>
        </div>
      )}
    </div>
  );
}

function renderFields(kind: string, id: string, graph: Graph) {
  switch (kind) {
    case "source": {
      const r = sourceRecord(graph, id);
      if (!r) return <p className="text-sm text-muted">Record not found.</p>;
      return (
        <>
          <FieldRow label="Author">{r.author}</FieldRow>
          <FieldRow label="Publisher">{r.publisher}</FieldRow>
          <FieldRow label="Published">{formatDate(r.publicationDate)}</FieldRow>
          <FieldRow label="URL">
            {r.url ? (
              <a className="text-link hover:underline" href={r.url} target="_blank" rel="noreferrer">
                {r.url}
              </a>
            ) : undefined}
          </FieldRow>
          <FieldRow label="Description">{r.description}</FieldRow>
          <FieldRow label="Created">{formatDate(r.createdAt)}</FieldRow>
        </>
      );
    }
    case "evidence": {
      const r = evidenceEntry(graph, id);
      if (!r) return <p className="text-sm text-muted">Record not found.</p>;
      const source = byId(graph.sources, r.sourceId);
      return (
        <>
          <FieldRow label="Source">
            {source ? (
              <Link to={itemHref("source", source.id, r.projectId)} className="text-link hover:underline">
                {source.title}
              </Link>
            ) : undefined}
          </FieldRow>
          <FieldRow label="Location">{r.location}</FieldRow>
          <FieldRow label="Content">{r.content}</FieldRow>
          <FieldRow label="Interpretation">{r.interpretation}</FieldRow>
          <FieldRow label="Notes">{r.notes}</FieldRow>
          <FieldRow label="Created">{formatDate(r.createdAt)}</FieldRow>
        </>
      );
    }
    case "question": {
      const r = questionRecord(graph, id);
      if (!r) return <p className="text-sm text-muted">Record not found.</p>;
      return (
        <>
          <FieldRow label="Question">{r.question}</FieldRow>
          <FieldRow label="Priority">{priority[r.priority]?.label}</FieldRow>
          <FieldRow label="Notes">{r.notes}</FieldRow>
          <FieldRow label="Created">{formatDate(r.createdAt)}</FieldRow>
        </>
      );
    }
    case "claim": {
      const r = claimRecord(graph, id);
      if (!r) return <p className="text-sm text-muted">Record not found.</p>;
      return (
        <>
          <FieldRow label="Claim">{r.claim}</FieldRow>
          <FieldRow label="Verification">{verificationStatus[r.verificationStatus]?.label}</FieldRow>
          <FieldRow label="Notes">{r.notes}</FieldRow>
          <FieldRow label="Created">{formatDate(r.createdAt)}</FieldRow>
        </>
      );
    }
    case "finding": {
      const r = findingRecord(graph, id);
      if (!r) return <p className="text-sm text-muted">Record not found.</p>;
      const experiment = r.experimentId ? byId(graph.experiments, r.experimentId) : undefined;
      return (
        <>
          <FieldRow label="Description">{r.description}</FieldRow>
          <FieldRow label="Experiment">
            {experiment ? (
              <Link to={itemHref("experiment", experiment.id, r.projectId)} className="text-link hover:underline">
                {experiment.title}
              </Link>
            ) : undefined}
          </FieldRow>
          <FieldRow label="Confidence">{confidence[r.confidence]?.label}</FieldRow>
          <FieldRow label="Created">{formatDate(r.createdAt)}</FieldRow>
        </>
      );
    }
    case "insight": {
      const r = insightRecord(graph, id);
      if (!r) return <p className="text-sm text-muted">Record not found.</p>;
      return (
        <>
          <FieldRow label="Description">{r.description}</FieldRow>
          <FieldRow label="Created">{formatDate(r.createdAt)}</FieldRow>
        </>
      );
    }
    case "gap": {
      const r = gapRecord(graph, id);
      if (!r) return <p className="text-sm text-muted">Record not found.</p>;
      return (
        <>
          <FieldRow label="Description">{r.description}</FieldRow>
          <FieldRow label="Importance">{priority[r.importance]?.label}</FieldRow>
          <FieldRow label="Suggested direction">{r.suggestedDirection}</FieldRow>
          <FieldRow label="Created">{formatDate(r.createdAt)}</FieldRow>
        </>
      );
    }
    case "note": {
      const r = noteRecord(graph, id);
      if (!r) return <p className="text-sm text-muted">Record not found.</p>;
      return (
        <>
          <FieldRow label="Content">{r.content}</FieldRow>
          <FieldRow label="Created">{formatDate(r.createdAt)}</FieldRow>
        </>
      );
    }
    case "hypothesis":
    case "experiment":
      return null;
    default:
      return <p className="text-sm text-muted">No details available.</p>;
  }
}

function entityTitle(kind: string, id: string, graph: Graph): string | undefined {
  switch (kind) {
    case "source": return sourceRecord(graph, id)?.title;
    case "evidence": return evidenceEntry(graph, id)?.title;
    case "question": return questionRecord(graph, id)?.question;
    case "hypothesis": {
      const r = hypothesisRecord(graph, id);
      return r ? (r.title ?? r.statement) : undefined;
    }
    case "experiment": return experimentRecord(graph, id)?.title;
    case "finding": return findingRecord(graph, id)?.title;
    case "insight": return insightRecord(graph, id)?.title;
    case "gap": return gapRecord(graph, id)?.title;
    case "claim": return claimRecord(graph, id)?.claim;
    case "note": return noteRecord(graph, id)?.title;
    default: return undefined;
  }
}

function sourceRecord(graph: Graph, id: string) {
  return byId(graph.sources, id);
}
function evidenceEntry(graph: Graph, id: string) {
  return byId(graph.evidence, id);
}
function questionRecord(graph: Graph, id: string) {
  return byId(graph.questions, id);
}
function hypothesisRecord(graph: Graph, id: string) {
  return byId(graph.hypotheses, id);
}
function experimentRecord(graph: Graph, id: string) {
  return byId(graph.experiments, id);
}
function findingRecord(graph: Graph, id: string) {
  return byId(graph.findings, id);
}
function insightRecord(graph: Graph, id: string) {
  return byId(graph.insights, id);
}
function gapRecord(graph: Graph, id: string) {
  return byId(graph.gaps, id);
}
function claimRecord(graph: Graph, id: string) {
  return byId(graph.claims, id);
}
function noteRecord(graph: Graph, id: string) {
  return byId(graph.notes, id);
}
function sourceMeta(graph: Graph, id: string) {
  return sourceRecord(graph, id)?.type ?? "other";
}
function evidenceMeta(graph: Graph, id: string) {
  return evidenceEntry(graph, id)?.type ?? "other";
}

function ClaimSupportCard({ claimId, graph }: { claimId: string; graph: Graph }) {
  const claim = claimRecord(graph, claimId);
  if (!claim) return null;
  const support = claimSupportStatus(graph, claim);
  return (
    <DetailCard title="Claim support">
      <div className="flex items-center gap-3">
        <Badge label={support.label} tone={support.tone} />
        <span className="text-sm text-muted">{support.detail}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
        <span>{support.linked} linked source(s) of support</span>
        {support.expected > 0 && <span>· {support.expected} expected</span>}
        {claim.verificationStatus === "disputed" && (
          <span className="font-medium text-danger">Marked disputed by researcher</span>
        )}
      </div>
    </DetailCard>
  );
}

function ExperimentCard({ id, graph }: { id: string; graph: Graph }) {
  const ex = experimentRecord(graph, id);
  if (!ex) return null;
  const hypothesis = ex.hypothesisId ? byId(graph.hypotheses, ex.hypothesisId) : undefined;
  return (
    <DetailCard title="Experiment">
      <dl>
        <FieldRow label="Objective">{ex.objective}</FieldRow>
        {hypothesis && (
          <FieldRow label="Hypothesis">
            <Link to={itemHref("hypothesis", hypothesis.id, ex.projectId)} className="text-link hover:underline">
              {hypothesis.title ?? hypothesis.statement}
            </Link>
          </FieldRow>
        )}
        <FieldRow label="Methodology">{ex.methodology}</FieldRow>
        <FieldRow label="Procedure">{ex.procedure}</FieldRow>
        <FieldRow label="Variables">
          {ex.variables.length > 0
            ? ex.variables.map((v, i) => (
                <div key={i}>
                  {v.key}: {v.value}
                  {v.unit ? ` (${v.unit})` : ""}
                </div>
              ))
            : undefined}
        </FieldRow>
        <FieldRow label="Expected result">{ex.expectedResult}</FieldRow>
        <FieldRow label="Actual result">{ex.actualResult ?? ex.results}</FieldRow>
        <FieldRow label="Conclusion">{ex.conclusion}</FieldRow>
        <FieldRow label="Limitations">{ex.limitations}</FieldRow>
      </dl>
    </DetailCard>
  );
}

function HypothesisCard({ id, graph }: { id: string; graph: Graph }) {
  const h = hypothesisRecord(graph, id);
  if (!h) return null;
  return (
    <DetailCard title="Hypothesis">
      <dl>
        <FieldRow label="Statement">{h.statement}</FieldRow>
        <FieldRow label="Rationale">{h.rationale}</FieldRow>
        <FieldRow label="Status">{hypothesisStatus[h.status]?.label}</FieldRow>
      </dl>
    </DetailCard>
  );
}