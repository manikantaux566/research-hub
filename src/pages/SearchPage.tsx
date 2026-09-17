import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { searchAll } from "../lib/search";
import type { SearchResult } from "../lib/search";
import { useDebounced } from "../hooks/useDebounced";
import { addRecentSearch, getRecentSearches } from "../lib/ux";
import { Header } from "../components/layout/Header";
import { Select } from "../components/ui/Select";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { Icon } from "../components/ui/Icon";
import { projects } from "../lib/storage";

const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "project", label: "Projects" },
  { value: "source", label: "Sources" },
  { value: "evidence", label: "Evidence" },
  { value: "question", label: "Research questions" },
  { value: "hypothesis", label: "Hypotheses" },
  { value: "experiment", label: "Experiments" },
  { value: "finding", label: "Findings" },
  { value: "insight", label: "Insights" },
  { value: "gap", label: "Research gaps" },
  { value: "claim", label: "Claims" },
  { value: "note", label: "Notes" },
  { value: "tag", label: "Tags" },
  { value: "writingProject", label: "Writing projects" },
  { value: "writingNode", label: "Writing sections" },
];

const TYPE_COLORS: Record<string, string> = {
  Project: "bg-indigo-50 text-indigo-700 ring-indigo-600/15",
  Source: "bg-sky-50 text-sky-700 ring-sky-600/15",
  Evidence: "bg-violet-50 text-violet-700 ring-violet-600/15",
  "Research Question": "bg-amber-50 text-amber-700 ring-amber-600/15",
  Hypothesis: "bg-pink-50 text-pink-700 ring-pink-600/15",
  Experiment: "bg-cyan-50 text-cyan-700 ring-cyan-600/15",
  Finding: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  Insight: "bg-teal-50 text-teal-700 ring-teal-600/15",
  "Research Gap": "bg-orange-50 text-orange-700 ring-orange-600/15",
  Claim: "bg-rose-50 text-rose-700 ring-rose-600/15",
  Note: "bg-lime-50 text-lime-700 ring-lime-600/15",
  Tag: "bg-surface-muted text-foreground ring-border",
  "Writing Project": "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/15",
  Writing: "bg-indigo-50 text-indigo-700 ring-indigo-600/15",
};

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [limit, setLimit] = useState(40);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [projectNames, setProjectNames] = useState<Record<string, string>>({});
  const [recent, setRecent] = useState<string[]>([]);
  const debounced = useDebounced(query, 300);
  const seq = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void projects.list().then((rows) =>
      setProjectNames(Object.fromEntries(rows.map((p) => [p.id, p.name]))),
    );
    setRecent(getRecentSearches().slice(0, 6));
  }, []);

  useEffect(() => {
    const id = ++seq.current;
    if (!debounced.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    void searchAll(debounced, { ...(type ? { types: [type as "project"] } : {}), limit })
      .then((rows) => {
        if (seq.current === id) setResults(rows);
      })
      .finally(() => {
        if (seq.current === id) setLoading(false);
      });
  }, [debounced, type, limit]);

  function commitRecent(value: string) {
    if (!value.trim()) return;
    addRecentSearch(value.trim());
    setRecent(getRecentSearches().slice(0, 6));
  }

  return (
    <div className="pb-10">
      <Header
        title="Search"
        subtitle="Full-text search across every project, record and writing section."
        icon="search"
      />
      <div className="space-y-5 px-6">
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
          <div className="flex items-center gap-3 px-4 py-3">
            <Icon name="search" className="h-4.5 w-4.5 shrink-0 text-faint" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search questions, claims, sources, notes…"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground placeholder:text-faint focus:outline-none"
              autoFocus
            />
            {loading && (
              <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-border-strong border-t-primary" />
            )}
            {!loading && query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-faint transition-colors hover:bg-surface-hover hover:text-foreground"
                aria-label="Clear search"
              >
                <Icon name="close" className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-border bg-surface-muted/40 px-4 py-2.5">
            <span className="inline-flex items-center gap-1.5 text-xs text-faint">
              <Icon name="filter" className="h-3.5 w-3.5" />
              Filters
            </span>
            <Select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="w-48"
              aria-label="Filter by type"
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Select
              value={String(limit)}
              onChange={(event) => setLimit(Number(event.target.value))}
              className="w-32"
              aria-label="Result limit"
            >
              <option value="25">25 results</option>
              <option value="40">40 results</option>
              <option value="100">100 results</option>
            </Select>
            {results && (
              <span className="ml-auto text-xs text-faint tnum">
                {results.length} result{results.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
        </div>

        {!query.trim() && recent.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-faint">Recent</span>
            {recent.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setQuery(value);
                  inputRef.current?.focus();
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-muted transition-colors hover:border-border-strong hover:text-foreground"
              >
                <Icon name="clock" className="h-3 w-3 text-faint" />
                {value}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="py-10">
            <Spinner label="Searching…" />
          </div>
        )}

        {!loading && results && results.length === 0 && (
          <div className="rounded-xl border border-border bg-surface">
            <EmptyState
              icon="search"
              title={`No results for “${query.trim()}”`}
              description="Try different keywords, or broaden the type filter."
            />
          </div>
        )}

        {!loading && results && results.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
            {results.map((result, index) => (
              <ResultRow
                key={`${result.type}-${result.id}`}
                result={result}
                projectName={result.projectId ? projectNames[result.projectId] ?? "" : ""}
                last={index === results.length - 1}
                onOpen={() => commitRecent(query)}
              />
            ))}
          </div>
        )}

        {!results && !loading && query.trim() === "" && recent.length === 0 && (
          <div className="rounded-xl border border-border bg-surface">
            <EmptyState
              icon="search"
              title="Search your research"
              description="Find a claim, question, source, note or writing section by keyword. Use ⌘K anywhere for the command palette."
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ResultRow({
  result,
  projectName,
  last,
  onOpen,
}: {
  result: SearchResult;
  projectName: string;
  last: boolean;
  onOpen: () => void;
}) {
  return (
    <Link
      to={result.href}
      onClick={onOpen}
      className={`group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-hover ${
        last ? "" : "border-b border-border"
      }`}
    >
      <span
        className={`mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10.5px] font-medium ring-1 ring-inset ${
          TYPE_COLORS[result.type] ?? "bg-surface-muted text-foreground ring-border"
        }`}
      >
        {result.type}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-medium text-foreground">
          {result.title}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted">{result.preview}</span>
      </span>
      {projectName && (
        <span className="mt-0.5 hidden shrink-0 text-[11px] text-faint sm:block">
          {projectName}
        </span>
      )}
      <Icon
        name="arrow-right"
        className="mt-1 h-3.5 w-3.5 shrink-0 text-faint opacity-0 transition-opacity group-hover:opacity-100"
      />
    </Link>
  );
}
