import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchAll } from "../../lib/search";
import type { SearchResult } from "../../lib/search";
import { useDebounced } from "../../hooks/useDebounced";
import { Spinner } from "./Spinner";

export function SearchBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const debouncedQuery = useDebounced(query, 180);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const searchSeq = useRef(0);

  useEffect(() => {
    const seq = ++searchSeq.current;
    if (!debouncedQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    searchAll(debouncedQuery)
      .then((all) => {
        if (seq === searchSeq.current) {
          setResults(all);
          setActiveIndex(0);
          setLoading(false);
        }
      })
      .catch(() => {
        if (seq === searchSeq.current) {
          setResults([]);
          setLoading(false);
        }
      });
  }, [debouncedQuery]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function goTo(result: SearchResult) {
    setQuery("");
    setOpen(false);
    navigate(result.href);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      goTo(results[activeIndex]);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      <label htmlFor="global-search" className="sr-only">
        Search research data
      </label>
      <div className="relative">
        <svg
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <input
          id="global-search"
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search projects, sources, evidence, questions…"
          className="w-full rounded-xl border border-strong bg-surface py-1.5 pl-9 pr-8 text-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-strong border-t-primary" />
          </span>
        )}
      </div>

      {open && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1.5 overflow-hidden rounded-xl border border-border bg-surface shadow-overlay animate-slide-in">
          <div className="max-h-80 overflow-y-auto">
            {loading && <Spinner label="Searching…" />}
            {!loading && results.length === 0 && (
              <p className="px-4 py-3 text-sm text-muted">
                No results for "{query.trim()}".
              </p>
            )}
            {!loading &&
              results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    goTo(result);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex w-full flex-col gap-0.5 border-b border-border px-4 py-2.5 text-left last:border-b-0 transition-colors ${
                    index === activeIndex ? "bg-surface-hover" : ""
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-link">
                      {result.type}
                    </span>
                    <span className="truncate text-sm font-medium text-foreground">
                      {result.title}
                    </span>
                  </span>
                  <span className="truncate text-xs text-muted">{result.preview}</span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}