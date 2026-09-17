import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { ResearchProject } from "../types";
import {
  claims,
  evidence,
  experiments,
  findings,
  gaps,
  hypotheses,
  insights,
  notes,
  questions,
  sources,
} from "../lib/storage";
import { formatDate } from "../lib/format";
import { projectStatus } from "../lib/meta";
import type { TabKey } from "../lib/hrefs";
import { Badge } from "../components/ui/Badge";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Icon } from "../components/ui/Icon";
import type { IconName } from "../components/ui/Icon";
import { Spinner } from "../components/ui/Spinner";

type Counts = Partial<Record<Exclude<TabKey, "overview">, number>>;

type OverviewProps = {
  project: ResearchProject;
  onEdit: () => void;
  tabHref: (projectId: string, tab: TabKey) => string;
};

const SECTIONS: {
  key: Exclude<TabKey, "overview">;
  label: string;
  icon: IconName;
}[] = [
  { key: "sources", label: "Sources", icon: "sources" },
  { key: "evidence", label: "Evidence", icon: "document" },
  { key: "questions", label: "Questions", icon: "questions" },
  { key: "hypotheses", label: "Hypotheses", icon: "bulb" },
  { key: "experiments", label: "Experiments", icon: "beaker" },
  { key: "findings", label: "Findings", icon: "findings" },
  { key: "insights", label: "Insights", icon: "insights" },
  { key: "gaps", label: "Research gaps", icon: "flag" },
  { key: "claims", label: "Claims", icon: "scale" },
  { key: "notes", label: "Notes", icon: "pencil" },
];

const FLOWS: { label: string; steps: string[] }[] = [
  { label: "Evidence trail", steps: ["Source", "Evidence", "Claim", "Finding", "Insight"] },
  { label: "Inquiry loop", steps: ["Question", "Hypothesis", "Experiment", "Finding"] },
  { label: "Gap closure", steps: ["Gap", "Question", "Experiment"] },
];

export function Overview({ project, onEdit, tabHref }: OverviewProps) {
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      const [s, ev, q, h, ex, f, i, g, c, n] = await Promise.all([
        sources.listByProject(project.id),
        evidence.listByProject(project.id),
        questions.listByProject(project.id),
        hypotheses.listByProject(project.id),
        experiments.listByProject(project.id),
        findings.listByProject(project.id),
        insights.listByProject(project.id),
        gaps.listByProject(project.id),
        claims.listByProject(project.id),
        notes.listByProject(project.id),
      ]);
      if (!alive) return;
      setCounts({
        sources: s.length,
        evidence: ev.length,
        questions: q.length,
        hypotheses: h.length,
        experiments: ex.length,
        findings: f.length,
        insights: i.length,
        gaps: g.length,
        claims: c.length,
        notes: n.length,
      });
    }
    void load();
    return () => {
      alive = false;
    };
  }, [project.id]);

  const statusMeta = projectStatus[project.status] ?? projectStatus.active;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader
          icon="info"
          title="About this project"
          actions={
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-link transition-colors hover:bg-surface-hover"
            >
              <Icon name="pencil" className="h-3 w-3" />
              Edit
            </button>
          }
        />
        <CardBody className="space-y-4 p-5">
          <div className="flex items-center gap-2">
            <Badge label={statusMeta.label} tone={statusMeta.tone} dot />
            {project.topic && (
              <span className="truncate text-xs text-muted">{project.topic}</span>
            )}
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
              Description
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
              {project.description || "No description provided yet."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
                Created
              </p>
              <p className="mt-1 text-[13px] text-foreground">
                {formatDate(project.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
                Updated
              </p>
              <p className="mt-1 text-[13px] text-foreground">
                {formatDate(project.updatedAt)}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader
          icon="chart"
          title="At a glance"
          description="Every record type in this project, and how many you have."
        />
        <CardBody className="p-3">
          {counts === null ? (
            <Spinner label="Counting records…" />
          ) : (
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {SECTIONS.map(({ key, label, icon }) => (
                <Link
                  key={key}
                  to={tabHref(project.id, key)}
                  className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-surface-hover"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-muted text-muted ring-1 ring-inset ring-border">
                    <Icon name={icon} className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-muted group-hover:text-foreground">
                    {label}
                  </span>
                  <span className="shrink-0 text-[13px] font-semibold tnum text-foreground">
                    {counts[key] ?? 0}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader
          icon="flow"
          title="Traceability"
          description="Research Hub keeps every link so you can trace how conclusions were built."
        />
        <CardBody className="grid gap-5 p-5 md:grid-cols-3">
          {FLOWS.map((flow) => (
            <div key={flow.label}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
                {flow.label}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {flow.steps.map((step, index) => (
                  <span key={step} className="flex items-center gap-1.5">
                    {index > 0 && (
                      <Icon name="chevron-right" className="h-3 w-3 text-faint" />
                    )}
                    <span className="rounded-md bg-surface-muted px-2 py-1 text-[11.5px] font-medium text-foreground ring-1 ring-inset ring-border">
                      {step}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
