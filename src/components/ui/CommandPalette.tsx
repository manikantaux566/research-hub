import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { SearchResult } from "../../lib/search";
import { addRecentSearch, getRecentSearches } from "../../lib/ux";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

type Props = {
  open: boolean;
  onClose: () => void;
  search: (query: string) => Promise<SearchResult[]>;
};

const COMMANDS: { label: string; href: string; icon: IconName; keys?: string }[] = [
  { label: "Go to Dashboard", href: "/", icon: "dashboard", keys: "d" },
  { label: "Browse projects", href: "/projects", icon: "projects" },
  { label: "Browse sources", href: "/sources", icon: "sources" },
  { label: "Browse questions", href: "/questions", icon: "questions" },
  { label: "Browse findings", href: "/findings", icon: "findings" },
  { label: "Browse insights", href: "/insights", icon: "insights" },
  { label: "Open writing", href: "/writing", icon: "writing" },
  { label: "Search all data", href: "/search", icon: "search", keys: "s" },
  { label: "Manage tags", href: "/tags", icon: "tags" },
  { label: "Review claims & evidence", href: "/review", icon: "review" },
  { label: "Settings", href: "/settings", icon: "settings" },
];

type PaletteItem =
  | { kind: "command"; command: (typeof COMMANDS)[number] }
  | { kind: "recent"; query: string }
  | { kind: "result"; result: SearchResult };

export function CommandPalette({ open, onClose, search }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const searchSeq = useRef(0);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setResults([]);
    setActiveIndex(0);
    inputRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    const seq = ++searchSeq.current;
    search(q).then((all) => {
      if (seq === searchSeq.current) setResults(all);
    });
    return () => {};
  }, [open, query, search]);

  const filteredCommands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter((c) => c.label.toLowerCase().includes(q));
  }, [query]);

  const recentSearches = useMemo(() => {
    if (query.trim()) return [];
    return getRecentSearches().slice(0, 4);
  }, [query]);

  const paletteItems: PaletteItem[] = useMemo(() => {
    const items: PaletteItem[] = [];
    if (recentSearches.length > 0) {
      for (const r of recentSearches) items.push({ kind: "recent", query: r });
    }
    for (const c of filteredCommands) items.push({ kind: "command", command: c });
    if (query.trim()) {
      for (const r of results.slice(0, 10)) items.push({ kind: "result", result: r });
    }
    return items;
  }, [query, filteredCommands, recentSearches, results]);

  function execute(item: PaletteItem) {
    if (item.kind === "command") {
      if (query.trim()) addRecentSearch(query.trim());
      onClose();
      navigate(item.command.href);
    } else if (item.kind === "recent") {
      setQuery(item.query);
      inputRef.current?.focus();
    } else if (item.kind === "result") {
      if (query.trim()) addRecentSearch(query.trim());
      onClose();
      navigate(item.result.href);
    }
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      onClose();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, paletteItems.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && paletteItems[activeIndex]) {
      event.preventDefault();
      execute(paletteItems[activeIndex]);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[15vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-[3px] animate-fade-in"
        onMouseDown={onClose}
        aria-hidden
      />
      <div className="relative flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-overlay animate-zoom-in">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
          <Icon name="search" className="h-4 w-4 shrink-0 text-faint" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Type a command or search…"
            aria-label="Command palette search"
            className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-faint focus:outline-none"
          />
          <kbd className="hidden shrink-0 rounded-md border border-border bg-surface-muted px-1.5 py-0.5 font-mono text-[11px] text-faint sm:inline-flex">
            ESC
          </kbd>
        </div>

        <div className="flex-1 overflow-y-auto p-1.5">
          {paletteItems.length === 0 && query.trim() && (
            <div className="flex flex-col items-center gap-1 px-4 py-10 text-center">
              <Icon name="search" className="h-5 w-5 text-faint" />
              <p className="text-sm text-muted">No matches for “{query.trim()}”.</p>
            </div>
          )}

          {!query.trim() && recentSearches.length > 0 && (
            <p className="px-2.5 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-faint">
              Recent searches
            </p>
          )}

          {paletteItems.map((item, index) => {
            const active = index === activeIndex;
            const rowClass = `flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
              active ? "bg-surface-hover" : ""
            }`;
            const showCommandsHeader =
              item.kind === "command" &&
              (index === 0 || paletteItems[index - 1].kind !== "command");
            const showResultsHeader =
              item.kind === "result" &&
              (index === 0 || paletteItems[index - 1].kind !== "result");

            return (
              <div key={`${item.kind}-${index}`}>
                {showCommandsHeader && (
                  <p className="px-2.5 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-faint">
                    Commands
                  </p>
                )}
                {showResultsHeader && (
                  <p className="px-2.5 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-faint">
                    Results
                  </p>
                )}

                {item.kind === "recent" && (
                  <button
                    type="button"
                    onClick={() => execute(item)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={rowClass}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface-muted text-faint ring-1 ring-inset ring-border">
                      <Icon name="clock" className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">
                      {item.query}
                    </span>
                  </button>
                )}

                {item.kind === "command" && (
                  <button
                    type="button"
                    onClick={() => execute(item)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={rowClass}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface-muted text-muted ring-1 ring-inset ring-border">
                      <Icon name={item.command.icon} className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">
                      {item.command.label}
                    </span>
                    {item.command.keys && (
                      <kbd className="shrink-0 rounded border border-border bg-surface-muted px-1.5 py-0.5 font-mono text-[10.5px] text-faint">
                        {item.command.keys}
                      </kbd>
                    )}
                  </button>
                )}

                {item.kind === "result" && (
                  <button
                    type="button"
                    onClick={() => execute(item)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`${rowClass} items-start`}
                  >
                    <span className="mt-0.5 shrink-0 rounded-md bg-surface-muted px-1.5 py-0.5 text-[10.5px] font-medium text-muted ring-1 ring-inset ring-border">
                      {item.result.type}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-foreground">
                        {item.result.title}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted">
                        {item.result.preview}
                      </span>
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4 border-t border-border bg-surface-muted/40 px-4 py-2.5 text-[11px] text-faint">
          <span className="inline-flex items-center gap-1.5">
            <kbd className="rounded border border-border bg-surface px-1 py-0.5 font-mono">↑↓</kbd>
            Navigate
          </span>
          <span className="inline-flex items-center gap-1.5">
            <kbd className="rounded border border-border bg-surface px-1 py-0.5 font-mono">↵</kbd>
            Open
          </span>
          <span className="inline-flex items-center gap-1.5">
            <kbd className="rounded border border-border bg-surface px-1 py-0.5 font-mono">esc</kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  );
}
