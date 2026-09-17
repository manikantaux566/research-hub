import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { loadGraph } from "../lib/graph";
import type { Graph } from "../lib/graph";
import { runIntegrity } from "../lib/integrity";
import type { IntegrityReport } from "../lib/integrity";
import { claimSupportStatus } from "../lib/relations";
import { itemHref } from "../lib/hrefs";
import { Header } from "../components/layout/Header";
import { Spinner } from "../components/ui/Spinner";
import { Icon } from "../components/ui/Icon";
import type { IconName } from "../components/ui/Icon";

type Tone = "danger" | "warning" | "success";

export function ReviewPage() {
  const [graph, setGraph] = useState<Graph | null>(null);
  const [report, setReport] = useState<IntegrityReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadGraph()
      .then((g) => {
        setGraph(g);
        setReport(runIntegrity(g));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load data."));
  }, []);

  if (!graph || !report) {
    return (
      <div>
        <Header title="Review" subtitle="Surface items that need attention" icon="review" />
        <div className="px-6 pb-10 pt-6">
          {error ? (
            <div className="rounded-xl border border-danger/30 bg-danger/5 p-6 text-sm text-danger">
              {error}
            </div>
          ) : (
            <Spinner label="Analyzing research graph…" />
          )}
        </div>
      </div>
    );
  }

  const claims = graph.claims.map((claim) => ({ claim, support: claimSupportStatus(graph, claim) }));

  const unsupported = claims
    .filter((c) => c.support.state === "unsupported")
    .sort((a, b) => a.claim.claim.localeCompare(b.claim.claim));

  const partially = claims
    .filter((c) => c.support.state === "partiallySupported")
    .sort((a, b) => a.claim.claim.localeCompare(b.claim.claim));

  const unverified = graph.evidence
    .filter((e) => e.verificationStatus === "unverified")
    .sort((a, b) => a.title.localeCompare(b.title));

  const untestedQuestions = graph.questions
    .filter((q) => !graph.hypotheses.some((h) => h.questionId === q.id) && !graph.experiments.some((ex) => ex.questionId === q.id))
    .sort((a, b) => a.question.localeCompare(b.question));

  const undirectedGaps = graph.gaps
    .filter((g) => !g.suggestedDirection)
    .sort((a, b) => a.title.localeCompare(b.title));

  const errorChecks = report.checks.filter((c) => c.status === "error");
  const warningChecks = report.checks.filter((c) => c.status === "warn");

  return (
    <div>
      <Header title="Review" subtitle="Surface items that need attention" icon="review" />
      <div className="space-y-6 px-6 pb-10 pt-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat icon="document" label="Unverified evidence" value={unverified.length} tone="warning" />
          <Stat icon="scale" label="Unsupported claims" value={unsupported.length} tone="danger" />
          <Stat icon="flow" label="Partially supported" value={partially.length} tone="warning" />
          <Stat icon="shield" label="Integrity errors" value={report.errors} tone={report.errors > 0 ? "danger" : "success"} />
        </div>

        <Section
          title="Unsupported claims"
          description="Claims with no linked evidence or findings. Support is derived from links — a researcher must still verify them."
          empty="All claims have at least one supporting link."
          isEmpty={unsupported.length === 0}
        >
          <ul className="divide-y divide-border/70">
            {unsupported.map(({ claim, support }) => (
              <ReviewRow
                key={claim.id}
                href={itemHref("claim", claim.id, claim.projectId)}
                title={claim.claim}
                detail={graph.projects.find((p) => p.id === claim.projectId)?.name ?? "Unknown project"}
                badge={support.label}
                badgeTone="danger"
              />
            ))}
          </ul>
        </Section>

        <Section
          title="Partially supported claims"
          description="Claims that expect more supporting links than are currently linked."
          empty="No claims currently have partial support."
          isEmpty={partially.length === 0}
        >
          <ul className="divide-y divide-border/70">
            {partially.map(({ claim, support }) => (
              <ReviewRow
                key={claim.id}
                href={itemHref("claim", claim.id, claim.projectId)}
                title={claim.claim}
                detail={support.detail}
                badge={support.label}
                badgeTone="warning"
              />
            ))}
          </ul>
        </Section>

        <Section
          title="Unverified evidence"
          description="Evidence that has not been verified or disputed by the researcher yet."
          empty="All evidence has a verification status set."
          isEmpty={unverified.length === 0}
        >
          <ul className="divide-y divide-border/70">
            {unverified.map((e) => (
              <ReviewRow
                key={e.id}
                href={itemHref("evidence", e.id, e.projectId)}
                title={e.title}
                detail={graph.projects.find((p) => p.id === e.projectId)?.name ?? "Unknown project"}
                badge="Unverified"
                badgeTone="warning"
              />
            ))}
          </ul>
        </Section>

        <Section
          title="Untested questions"
          description="Research questions with no hypothesis or experiment on record."
          empty="Every question has a hypothesis or experiment attached."
          isEmpty={untestedQuestions.length === 0}
        >
          <ul className="divide-y divide-border/70">
            {untestedQuestions.map((q) => (
              <ReviewRow
                key={q.id}
                href={itemHref("question", q.id, q.projectId)}
                title={q.question}
              />
            ))}
          </ul>
        </Section>

        <Section
          title="Gaps without a suggested direction"
          description="Research gaps that have not been given pointers for where to look next."
          empty="All gaps include a suggested direction."
          isEmpty={undirectedGaps.length === 0}
        >
          <ul className="divide-y divide-border/70">
            {undirectedGaps.map((g) => (
              <ReviewRow
                key={g.id}
                href={itemHref("gap", g.id, g.projectId)}
                title={g.title}
              />
            ))}
          </ul>
        </Section>

        <Section
          title="Data integrity"
          description="Automated checks that can't ever decide scientific truth — they only catch broken references and malformed records."
          empty="No integrity problems detected."
          isEmpty={errorChecks.length === 0 && warningChecks.length === 0}
        >
          {errorChecks.length > 0 && (
            <div className="mb-3 rounded-lg border border-danger/25 bg-danger/10 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-danger">
                <Icon name="error" className="h-4 w-4" />
                {errorChecks.length} error{errorChecks.length === 1 ? "" : "s"} found
              </p>
              <ul className="mt-2 space-y-1 text-xs text-danger">
                {errorChecks.map((c) => (
                  <li key={c.key}>
                    <span className="font-medium">{c.label}</span>
                    {c.detail ? ` — ${c.detail}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {warningChecks.length > 0 && (
            <div className="rounded-lg border border-warning/25 bg-warning/10 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-warning">
                <Icon name="warning" className="h-4 w-4" />
                {warningChecks.length} warning{warningChecks.length === 1 ? "" : "s"}
              </p>
              <ul className="mt-2 space-y-1 text-xs text-warning">
                {warningChecks.map((c) => (
                  <li key={c.key}>
                    <span className="font-medium">{c.label}</span>
                    {c.detail ? ` — ${c.detail}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

const toneText: Record<Tone, string> = {
  danger: "text-danger",
  warning: "text-warning",
  success: "text-success",
};

const toneChip: Record<Tone, string> = {
  danger: "bg-danger/10 text-danger ring-1 ring-inset ring-danger/25",
  warning: "bg-warning/10 text-warning ring-1 ring-inset ring-warning/25",
  success: "bg-success/10 text-success ring-1 ring-inset ring-success/25",
};

const toneBadge: Record<"danger" | "warning", string> = {
  danger: "bg-danger/10 text-danger ring-1 ring-inset ring-danger/25",
  warning: "bg-warning/10 text-warning ring-1 ring-inset ring-warning/25",
};

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: IconName;
  label: string;
  value: number;
  tone: Tone;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-xs transition-colors hover:bg-surface-hover">
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${toneChip[tone]}`}>
          <Icon name={icon} className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className={`text-2xl font-semibold leading-none tracking-tight tnum ${toneText[tone]}`}>
            {value}
          </p>
          <p className="mt-1 truncate text-xs text-muted">{label}</p>
        </div>
      </div>
    </div>
  );
}

function ReviewRow({
  href,
  title,
  detail,
  badge,
  badgeTone,
}: {
  href: string;
  title: string;
  detail?: string;
  badge?: string;
  badgeTone?: "danger" | "warning";
}) {
  return (
    <li className="flex items-start justify-between gap-3 py-2.5">
      <Link
        to={href}
        className="group min-w-0 flex-1 text-sm font-medium text-foreground transition-colors hover:text-link"
      >
        <span className="line-clamp-2">{title}</span>
        {detail && <span className="mt-0.5 block text-xs font-normal text-faint">{detail}</span>}
      </Link>
      {badge && (
        <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${badgeTone === "danger" ? toneBadge.danger : toneBadge.warning}`}>
          {badge}
        </span>
      )}
    </li>
  );
}

function Section({
  title,
  description,
  empty,
  isEmpty,
  children,
}: {
  title: string;
  description: string;
  empty: string;
  isEmpty: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
      <div className="border-b border-border px-5 py-3.5">
        <h2 className="text-[13px] font-semibold text-foreground">{title}</h2>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">{description}</p>
      </div>
      <div className="px-4 py-1">
        {isEmpty ? (
          <p className="flex items-center justify-center gap-2 py-5 text-sm text-success">
            <Icon name="check" className="h-4 w-4" />
            {empty}
          </p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}