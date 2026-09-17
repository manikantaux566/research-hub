import type { ReactNode } from "react";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: IconName;
  compact?: boolean;
};

export function EmptyState({
  title,
  description,
  action,
  icon,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "px-6 py-8" : "px-6 py-14"
      }`}
    >
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-surface-muted text-faint ring-1 ring-inset ring-border">
        <Icon name={icon ?? "document"} className="h-5.5 w-5.5" />
      </div>
      <h3 className="text-[14px] font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
