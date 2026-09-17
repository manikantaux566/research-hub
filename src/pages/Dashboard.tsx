import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { ResearchProject } from "../types";
import {
  projects,
  sources,
  evidence,
  questions,
  findings,
  insights,
  gaps,
  claims,
} from "../lib/storage";
import { relativeTime } from "../lib/format";
import { projectStatus } from "../lib/meta";
import { projectHref } from "../lib/hrefs";
import { Badge } from "../components/ui/Badge";
import { Card, CardHeader } from "../components/ui/Card";
import { Icon } from "../components/ui/Icon";
import type { IconName } from "../components/ui/Icon";
import { Header } from "../components/layout/Header";

type Counts = {
  projects: number;
  activeProjects: number;
  sources: number;
  evidence: number;
  openQuestions: number;
  findings: number;
  insights: number;
  gaps: number;
  unsupportedClaims: number;
};

type ActivityItem = {
  label: string;
  detail: string;
  href: string;
  at: string;
};

type AttentionItem = {
  label: string;
  detail: string;
  href: string;
};

const primaryLink =
  "inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-fg shadow-xs transition-colors hover:bg-primary-hover";
const secondaryLink =
  "inline-flex h-9 items-center gap-1.5 rounded-lg border border-border-strong bg-surface px-3.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function today(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function Metric({
  icon,
  label,
  value,
  to,
  tone = "neutral",
}: {
  icon: IconName;
  label: string;
  value: number;
  to?: string;
  tone?: "neutral" | "positive" | "warning" | "danger";
}) {
  const chipTone = {
    neutral: "bg-surface-muted text-muted ring-border",
    positive: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
    warning: "bg-amber-50 text-amber-800 ring-amber-600/20",
    danger: "bg-red-50 text-red-700 ring-red-600/15",
  }[tone];

  const valueTone =
    tone === "danger"
      ? "text-danger"
      : tone === "warning"
        ? "text-warning"
        : "text-foreground";

  const inner = (
    <>
      <div className="flex items-center justify-between">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-lg ring-1 ring-inset ${chipTone}`}
        >
          <Icon name={icon} className="h-3.5 w-3.5" />
        </span>
        {to && (
          <Icon
            name="arrow-right"
            className="h-3.5 w-3.5 text-faint opacity-0 transition-opacity group-hover:opacity-100"
          />
        )}
      </div>
      <p className={`mt-3 text-[22px] font-semibold leading-none tnum ${valueTone}`}>
        {value}
      </p>
      <p className="mt-1.5 text-[11.5px] font-medium text-muted">{label}</p>
    </>
  );

  const base = "group flex flex-col rounded-xl border border-border bg-surface p-4";
  if (to) {
    return (
      <Link
        to={to}
        className={`${base} transition-colors hover:border-border-strong hover:bg-surface-hover`}
      >
        {inner}
      </Link>
    );
  }
  return <div className={base}>{inner}</div>;
}

function AttentionRow({ item }: { item: AttentionItem }) {
  return (
    <Link
      to={item.href}
      className="group flex items-start justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-surface-hover"
    >
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-foreground">{item.label}</p>
        <p className="mt-0.5 text-xs text-muted">{item.detail}</p>
      </div>
      <Icon
        name="arrow-right"
        className="mt-1 h-3.5 w-3.5 shrink-0 text-faint transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}

const emptySteps: { icon: IconName; title: string; copy: string }[] = [
  {
    icon: "projects",
    title: "Create a project",
    copy: "Group a line of inquiry and give it a clear goal.",
  },
  {
    icon: "sources",
    title: "Collect sources & evidence",
    copy: "Capture quotes, data and observations you can trace back.",
  },
  {
    icon: "insights",
    title: "Build findings & insights",
    copy: "Turn verified evidence into conclusions you can defend.",
  },
];

export function Dashboard() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [recentProjects, setRecentProjects] = useState<ResearchProject[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [attention, setAttention] = useState<AttentionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      const [
        projectList,
        sourceList,
        evidenceList,
        questionList,
        findingList,
        insightList,
        gapList,
        claimList,
      ] = await Promise.all([
        projects.list(),
        sources.list(),
        evidence.list(),
        questions.list(),
        findings.list(),
        insights.list(),
        gaps.list(),
        claims.list(),
      ]);
      if (!alive) return;

      const openQuestions = questionList.filter(
        (q) => q.status === "open" || q.status === "investigating",
      );
      const unsupported = claimList.filter(
        (c) => c.evidenceIds.length === 0 && c.findingIds.length === 0,
      );
      const unresolvedGaps = gapList.filter((g) => !g.suggestedDirection);

      setCounts({
        projects: projectList.length,
        activeProjects: projectList.filter(
          (p) => p.status === "active" || p.status === "planning",
        ).length,
        sources: sourceList.length,
        evidence: evidenceList.length,
        openQuestions: openQuestions.length,
        findings: findingList.length,
        insights: insightList.length,
        gaps: gapList.length,
        unsupportedClaims: unsupported.length,
      });

      setRecentProjects(
        projectList
          .filter((p) => p.status === "active" || p.status === "planning")
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
          .slice(0, 5),
      );

      const activity: ActivityItem[] = [
        ...projectList.map((p) => ({
          label: p.name,
          detail: "Project",
          href: projectHref(p.id),
          at: p.updatedAt,
        })),
        ...findingList.map((f) => ({
          label: f.title,
          detail: "Finding",
          href: `${projectHref(f.projectId)}?tab=findings&focus=${encodeURIComponent(f.id)}`,
          at: f.updatedAt,
        })),
        ...insightList.map((i) => ({
          label: i.title,
          detail: "Insight",
          href: `${projectHref(i.projectId)}?tab=insights&focus=${encodeURIComponent(i.id)}`,
          at: i.updatedAt,
        })),
      ]
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, 5);

      setRecentActivity(activity);

      const needsAttention: AttentionItem[] = [
        ...unsupported.slice(0, 3).map((c) => ({
          label: c.claim,
          detail: "Unsupported claim — add evidence or findings",
          href: `${projectHref(c.projectId)}?tab=claims&focus=${encodeURIComponent(c.id)}`,
        })),
        ...unresolvedGaps.slice(0, 2).map((g) => ({
          label: g.title,
          detail: "Research gap — suggest a direction",
          href: `${projectHref(g.projectId)}?tab=gaps&focus=${encodeURIComponent(g.id)}`,
        })),
        ...openQuestions.slice(0, 2).map((q) => ({
          label: q.question,
          detail: "Open question — update status or add findings",
          href: `${projectHref(q.projectId)}?tab=questions&focus=${encodeURIComponent(q.id)}`,
        })),
      ].slice(0, 5);

      setAttention(needsAttention);
      setLoading(false);
    }
    void load();
    return () => {
      alive = false;
    };
  }, []);

  const isEmpty = counts
    ? counts.projects === 0 &&
      counts.sources === 0 &&
      counts.evidence === 0 &&
      counts.openQuestions === 0 &&
      counts.findings === 0 &&
      counts.insights === 0
    : false;

  return (
    <div className="pb-10">
      <Header
        title="Dashboard"
        subtitle="A live overview of your research workspace."
        icon="dashboard"
        actions={
          !loading && !isEmpty ? (
            <>
              <Link to="/search" className={secondaryLink}>
                <Icon name="search" className="h-4 w-4 text-muted" />
                Search
              </Link>
              <Link to="/projects" className={primaryLink}>
                <Icon name="plus" className="h-4 w-4" />
                New project
              </Link>
            </>
          ) : undefined
        }
      />

      <div className="px-6">
        {!loading && isEmpty ? (
          <Card>
            <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
                <Icon name="sparkles" className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  Your research workspace is ready
                </h2>
                <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-muted">
                  Everything you capture stays entirely in your browser. Start with
                  a project, then build the evidence trail outward.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <Link to="/projects" className={primaryLink}>
                  <Icon name="plus" className="h-4 w-4" />
                  Create your first project
                </Link>
                <Link to="/settings" className={secondaryLink}>
                  <Icon name="database" className="h-4 w-4 text-muted" />
                  Import existing data
                </Link>
              </div>
            </div>
            <div className="grid gap-5 border-t border-border bg-surface-muted/40 p-6 sm:grid-cols-3">
              {emptySteps.map((step, index) => (
                <div key={step.title} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface text-muted ring-1 ring-inset ring-border">
                    <Icon name={step.icon} className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">
                      <span className="mr-1.5 text-faint tnum">{index + 1}.</span>
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">
                      {step.copy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <>
            {/* Greeting */}
            <Card className="relative mb-5">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
              />
              <div className="relative flex flex-wrap items-end justify-between gap-4 px-6 py-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
                    {today()}
                  </p>
                  <h2 className="mt-1.5 text-[22px] font-semibold tracking-tight text-foreground">
                    {greeting()}
                  </h2>
                  <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
                    {loading
                      ? "Loading your workspace…"
                      : "Your research at a glance. Pick up a project or clear what needs attention."}
                  </p>
                </div>
                {!loading && counts && (
                  <div className="flex items-center gap-5">
                    <div>
                      <p className="text-lg font-semibold tnum text-foreground">
                        {counts.activeProjects}
                      </p>
                      <p className="text-[11px] text-faint">Active projects</p>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div>
                      <p className="text-lg font-semibold tnum text-foreground">
                        {counts.evidence}
                      </p>
                      <p className="text-[11px] text-faint">Evidence items</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Metrics */}
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
              {loading || !counts
                ? Array.from({ length: 8 }, (_, i) => (
                    <div
                      key={i}
                      className="h-[104px] animate-pulse rounded-xl border border-border bg-surface-muted"
                    />
                  ))
                : (
                    <>
                      <Metric icon="projects" label="Projects" value={counts.projects} to="/projects" />
                      <Metric icon="sources" label="Sources" value={counts.sources} to="/sources" />
                      <Metric icon="document" label="Evidence" value={counts.evidence} to="/sources" />
                      <Metric icon="findings" label="Findings" value={counts.findings} to="/findings" />
                      <Metric icon="insights" label="Insights" value={counts.insights} to="/insights" />
                      <Metric icon="questions" label="Open questions" value={counts.openQuestions} to="/questions" />
                      <Metric icon="flag" label="Research gaps" value={counts.gaps} />
                      <Metric
                        icon="warning"
                        label="Unsupported claims"
                        value={counts.unsupportedClaims}
                        to="/review"
                        tone={counts.unsupportedClaims > 0 ? "danger" : "neutral"}
                      />
                    </>
                  )}
            </div>

            {/* Panels */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader
                    icon="warning"
                    title={
                      <>
                        Needs attention
                        {attention.length > 0 && (
                          <span className="ml-1.5 font-normal text-muted tnum">
                            {attention.length}
                          </span>
                        )}
                      </>
                    }
                    description="Claims, gaps and questions that are missing support."
                  />
                  {loading ? (
                    <div className="space-y-4 px-5 py-6">
                      {Array.from({ length: 3 }, (_, i) => (
                        <div key={i} className="space-y-2">
                          <div className="h-3.5 w-3/4 animate-pulse rounded bg-surface-muted" />
                          <div className="h-3 w-1/2 animate-pulse rounded bg-surface-muted" />
                        </div>
                      ))}
                    </div>
                  ) : attention.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15">
                        <Icon name="check" className="h-4.5 w-4.5" />
                      </span>
                      <p className="text-sm font-medium text-foreground">
                        Everything is supported
                      </p>
                      <p className="text-xs text-muted">
                        No unsupported claims, open gaps or stalled questions.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {attention.map((item, i) => (
                        <AttentionRow key={`${item.detail}-${i}`} item={item} />
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              <Card>
                <CardHeader
                  icon="clock"
                  title="Recent activity"
                  description="Latest updates across your work."
                />
                {loading ? (
                  <div className="space-y-4 px-5 py-6">
                    {Array.from({ length: 4 }, (_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-4 w-14 animate-pulse rounded bg-surface-muted" />
                        <div className="h-3.5 w-3/4 animate-pulse rounded bg-surface-muted" />
                      </div>
                    ))}
                  </div>
                ) : recentActivity.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <p className="text-sm text-muted">No activity yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {recentActivity.map((item) => (
                      <Link
                        key={`${item.detail}-${item.href}-${item.at}`}
                        to={item.href}
                        className="flex items-start justify-between gap-3 px-5 py-3 transition-colors hover:bg-surface-hover"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="shrink-0 rounded-md bg-surface-muted px-1.5 py-0.5 text-[10.5px] font-medium text-muted ring-1 ring-inset ring-border">
                              {item.detail}
                            </span>
                            <span className="truncate text-[13px] font-medium text-foreground">
                              {item.label}
                            </span>
                          </div>
                        </div>
                        <span className="ml-2 shrink-0 text-[11px] text-faint">
                          {relativeTime(item.at)}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>

              <div className="lg:col-span-3">
                <Card>
                  <CardHeader
                    icon="projects"
                    title="Current projects"
                    description="Active and planning work, most recently updated first."
                    actions={
                      <Link
                        to="/projects"
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-link transition-colors hover:bg-surface-hover"
                      >
                        All projects
                        <Icon name="arrow-right" className="h-3 w-3" />
                      </Link>
                    }
                  />
                  {loading ? (
                    <div className="space-y-4 px-5 py-6">
                      {Array.from({ length: 3 }, (_, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="h-3.5 w-40 animate-pulse rounded bg-surface-muted" />
                            <div className="h-3 w-56 animate-pulse rounded bg-surface-muted" />
                          </div>
                          <div className="h-5 w-16 animate-pulse rounded bg-surface-muted" />
                        </div>
                      ))}
                    </div>
                  ) : recentProjects.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
                      <p className="text-sm font-medium text-foreground">
                        No active or planning projects
                      </p>
                      <p className="text-xs text-muted">
                        Create a project to begin collecting sources and evidence.
                      </p>
                      <Link to="/projects" className={`${primaryLink} mt-2`}>
                        <Icon name="plus" className="h-4 w-4" />
                        New project
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {recentProjects.map((project) => {
                        const meta = projectStatus[project.status] ?? projectStatus.active;
                        return (
                          <Link
                            key={project.id}
                            to={projectHref(project.id)}
                            className="group flex items-start justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-surface-hover"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-medium text-foreground">
                                {project.name}
                              </p>
                              {project.description && (
                                <p className="mt-0.5 max-w-[520px] truncate text-xs text-muted">
                                  {project.description}
                                </p>
                              )}
                            </div>
                            <div className="flex shrink-0 items-center gap-3">
                              <span className="hidden text-[11px] text-faint sm:inline">
                                {relativeTime(project.updatedAt)}
                              </span>
                              <Badge label={meta.label} tone={meta.tone} dot />
                              <Icon
                                name="arrow-right"
                                className="h-3.5 w-3.5 text-faint transition-transform group-hover:translate-x-0.5"
                              />
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
