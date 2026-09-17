import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { RelatedGroup } from "../../lib/relations";
import { projectHref } from "../../lib/hrefs";
import { Badge } from "../ui/Badge";
import type { BadgeTone } from "../ui/Badge";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { Icon } from "../ui/Icon";
import type { IconName } from "../ui/Icon";

export function DetailShell({
  projectId,
  projectName,
  backTab,
  backLabel,
  title,
  subtitle,
  badges,
  actions,
  children,
  aside,
}: {
  projectId: string | undefined;
  projectName: string | undefined;
  backTab?: string;
  backLabel: string;
  title: string;
  subtitle?: ReactNode;
  badges?: { label: string; tone: string; title?: string }[];
  actions?: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="pb-10">
      <div className="px-6 pt-7">
        <nav
          aria-label="Breadcrumb"
          className="mb-2 flex flex-wrap items-center gap-1 text-xs text-faint"
        >
          {projectId && (
            <>
              <Link
                to={
                  backTab
                    ? `${projectHref(projectId)}?tab=${backTab}`
                    : projectHref(projectId)
                }
                className="rounded-sm transition-colors hover:text-foreground"
              >
                {projectName ?? "Project"}
              </Link>
              <Icon name="chevron-right" className="h-3 w-3 opacity-60" />
            </>
          )}
          <span className="text-muted">{backLabel}</span>
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-foreground">
              {title}
            </h1>
            {subtitle && (
              <div className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted">
                {subtitle}
              </div>
            )}
            {badges && badges.length > 0 && (
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {badges.map((badge, index) => (
                  <Badge
                    key={index}
                    label={badge.label}
                    tone={(badge.tone as BadgeTone) ?? "gray"}
                    title={badge.title}
                  />
                ))}
              </div>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      </div>

      <div className="grid gap-5 px-6 pt-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-5 lg:col-span-2">{children}</div>
        {aside && <div className="min-w-0 space-y-5">{aside}</div>}
      </div>
    </div>
  );
}

export function RelatedPanel({ groups }: { groups: RelatedGroup[] }) {
  if (groups.length === 0) {
    return (
      <Card>
        <CardHeader icon="link" title="Related" />
        <CardBody className="p-5">
          <p className="text-[13px] text-muted">
            Nothing is linked to this record yet. Connect records to build the
            traceability trail.
          </p>
        </CardBody>
      </Card>
    );
  }
  return (
    <>
      {groups.map((group) => (
        <Card key={group.kind}>
          <CardHeader
            icon="link"
            title={group.type}
            description={`${group.items.length} linked`}
          />
          <CardBody className="p-2">
            <ul>
              {group.items.map((item) => (
                <li key={item.id}>
                  <Link
                    to={item.href}
                    className="group flex items-center gap-2 rounded-lg px-2.5 py-2 transition-colors hover:bg-surface-hover"
                  >
                    <Icon
                      name="arrow-right"
                      className="h-3.5 w-3.5 shrink-0 text-faint"
                    />
                    <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">
                      {item.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ))}
    </>
  );
}

export function DetailCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: IconName;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader icon={icon} title={title} />
      <CardBody className="p-5">{children}</CardBody>
    </Card>
  );
}

export function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 border-b border-border py-2.5 last:border-b-0 sm:grid-cols-4">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-faint sm:col-span-1">
        {label}
      </dt>
      <dd className="text-[13px] leading-relaxed text-foreground sm:col-span-3">
        {children || "—"}
      </dd>
    </div>
  );
}
