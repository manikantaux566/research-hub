import type { ReactNode } from "react";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { Spinner } from "../ui/Spinner";
import { Icon } from "../ui/Icon";
import type { IconName } from "../ui/Icon";

type SectionProps = {
  title: string;
  count: number;
  addLabel: string;
  onAdd: () => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  emptyTitle: string;
  emptyDescription: string;
  isEmpty: boolean;
  children: ReactNode;
  icon?: IconName;
  addIcon?: IconName;
};

export function Section({
  title,
  count,
  addLabel,
  onAdd,
  loading,
  error,
  onRetry,
  emptyTitle,
  emptyDescription,
  isEmpty,
  children,
  icon,
  addIcon = "plus",
}: SectionProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {icon && (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface-muted text-muted ring-1 ring-inset ring-border">
              <Icon name={icon} className="h-3.5 w-3.5" />
            </span>
          )}
          <h3 className="truncate text-[13.5px] font-semibold tracking-tight text-foreground">
            {title}
          </h3>
          <span className="rounded-md bg-surface-muted px-1.5 py-0.5 text-[11px] font-medium text-muted ring-1 ring-inset ring-border tnum">
            {count}
          </span>
        </div>
        <Button variant="primary" size="sm" onClick={onAdd}>
          <Icon name={addIcon} className="h-3.5 w-3.5" />
          {addLabel}
        </Button>
      </div>
      <div>
        {loading ? (
          <Spinner />
        ) : error ? (
          <div className="flex flex-col items-center px-5 py-12 text-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/15">
              <Icon name="error" className="h-4.5 w-4.5" />
            </span>
            <p className="mt-2.5 text-sm font-medium text-foreground">
              Could not load {title.toLowerCase()}
            </p>
            <p className="mt-1 max-w-sm text-xs text-muted">{error}</p>
            <Button variant="secondary" size="sm" onClick={onRetry} className="mt-3.5">
              <Icon name="refresh" className="h-3.5 w-3.5" />
              Try again
            </Button>
          </div>
        ) : isEmpty ? (
          <EmptyState
            icon={icon}
            title={emptyTitle}
            description={emptyDescription}
            action={
              <Button variant="primary" size="sm" onClick={onAdd}>
                <Icon name={addIcon} className="h-3.5 w-3.5" />
                {addLabel}
              </Button>
            }
          />
        ) : (
          children
        )}
      </div>
    </div>
  );
}
