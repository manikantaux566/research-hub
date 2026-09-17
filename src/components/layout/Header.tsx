import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../ui/Icon";
import type { IconName } from "../ui/Icon";

type Crumb = { label: string; to?: string };

type HeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: IconName;
  breadcrumb?: Crumb[];
  meta?: ReactNode;
};

export function Header({
  title,
  subtitle,
  actions,
  icon,
  breadcrumb,
  meta,
}: HeaderProps) {
  return (
    <header className="px-6 pt-7">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          className="mb-2 flex flex-wrap items-center gap-1 text-xs text-faint"
        >
          {breadcrumb.map((crumb, index) => (
            <span key={`${crumb.label}-${index}`} className="flex items-center gap-1">
              {index > 0 && <Icon name="chevron-right" className="h-3 w-3 opacity-60" />}
              {crumb.to ? (
                <Link
                  to={crumb.to}
                  className="rounded-sm transition-colors hover:text-foreground"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-muted">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {icon && (
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
              <Icon name={icon} className="h-4.5 w-4.5" />
            </span>
          )}
          <div className="min-w-0">
            <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>

      {meta && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">{meta}</div>
      )}
    </header>
  );
}
