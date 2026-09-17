import type { SelectHTMLAttributes } from "react";

const selectClasses =
  "w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-foreground shadow-xs transition-colors hover:border-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-focus/30 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted";

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${selectClasses} ${props.className ?? ""}`} />;
}
