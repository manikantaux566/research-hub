import { Icon } from "./Icon";
import type { IconName } from "./Icon";

export type TabItem = {
  key: string;
  label: string;
  icon?: IconName;
  count?: number;
};

export function Tabs({
  items,
  value,
  onChange,
  className = "",
}: {
  items: TabItem[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label="Sections"
      className={`flex gap-0.5 overflow-x-auto ${className}`}
    >
      {items.map((item) => {
        const active = item.key === value;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.key)}
            className={`relative -mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus/55 ${
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {item.icon && (
              <Icon
                name={item.icon}
                className={`h-3.5 w-3.5 ${active ? "text-primary" : "text-faint"}`}
              />
            )}
            {item.label}
            {typeof item.count === "number" && (
              <span
                className={`rounded px-1 text-[10.5px] font-semibold tnum ${
                  active ? "bg-primary/12 text-primary" : "bg-surface-muted text-faint"
                }`}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
