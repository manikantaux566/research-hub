import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Badge } from "./Badge";
import type { BadgeTone } from "./Badge";
import { Icon } from "./Icon";

export type ItemBadge = {
  label: string;
  tone: BadgeTone;
  href?: string;
  title?: string;
};

export type ItemAction = {
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
};

export type ItemRow = {
  id: string;
  title: string;
  subtitle?: string;
  badges?: ItemBadge[];
  actions?: ItemAction[];
  href?: string;
};

function RowBadges({ badges }: { badges: ItemBadge[] }) {
  if (badges.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {badges.map((badge, index) =>
        badge.href ? (
          <Link
            key={index}
            to={badge.href}
            title={badge.title ?? badge.label}
            className="transition-opacity hover:opacity-80"
          >
            <Badge label={badge.label} tone={badge.tone} />
          </Link>
        ) : (
          <Badge key={index} label={badge.label} tone={badge.tone} title={badge.title} />
        ),
      )}
    </div>
  );
}

export function ItemList({ items, focusId }: { items: ItemRow[]; focusId?: string }) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focusId) return;
    const el = listRef.current?.querySelector(`[data-item-id="${focusId}"]`);
    el?.scrollIntoView({ block: "center", behavior: "instant" as ScrollBehavior });
  }, [focusId, items.length]);

  return (
    <div ref={listRef} className="divide-y divide-border">
      {items.map((item) => {
        const focused = focusId === item.id;
        return (
          <div
            key={item.id}
            data-item-id={item.id}
            className={`group relative flex items-start justify-between gap-4 px-4 py-3.5 transition-colors ${
              focused
                ? "bg-primary/5 ring-1 ring-inset ring-primary/25"
                : "hover:bg-surface-hover"
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {item.href ? (
                  <Link
                    to={item.href}
                    className="truncate text-[13.5px] font-medium text-foreground transition-colors hover:text-link"
                  >
                    {item.title}
                  </Link>
                ) : (
                  <p className="truncate text-[13.5px] font-medium text-foreground">
                    {item.title}
                  </p>
                )}
                {item.href && (
                  <Icon
                    name="arrow-right"
                    className="h-3.5 w-3.5 shrink-0 text-faint opacity-0 transition-opacity group-hover:opacity-100"
                  />
                )}
              </div>
              {item.subtitle && (
                <p className="mt-0.5 truncate text-xs text-muted">{item.subtitle}</p>
              )}
              <RowBadges badges={item.badges ?? []} />
            </div>
            {item.actions && item.actions.length > 0 && (
              <div className="flex shrink-0 items-center gap-1">
                {item.actions.map((action, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/55 disabled:opacity-40 ${
                      action.danger
                        ? "text-danger hover:bg-danger/10"
                        : "text-muted hover:bg-surface hover:text-foreground"
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
