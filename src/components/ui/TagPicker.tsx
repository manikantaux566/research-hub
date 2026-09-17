import { useState } from "react";
import type { Tag } from "../../types";
import { tagColor } from "../../lib/meta";

export function TagPicker({
  tags,
  selected,
  onChange,
  emptyText = "No tags available. Create one in Settings.",
}: {
  tags: Tag[];
  selected: string[];
  onChange: (tagIds: string[]) => void;
  emptyText?: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? tags.filter((tag) => tag.name.toLowerCase().includes(query.trim().toLowerCase()))
    : tags;

  function toggle(tagId: string) {
    if (selected.includes(tagId)) {
      onChange(selected.filter((id) => id !== tagId));
    } else {
      onChange([...selected, tagId]);
    }
  }

  return (
    <div>
      {tags.length === 0 ? (
        <p className="text-xs text-muted">{emptyText}</p>
      ) : (
        <>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter tags…"
            aria-label="Filter tags"
            className="mb-2 w-full rounded-md border border-border-strong bg-surface px-2 py-1 text-xs text-foreground placeholder:text-faint hover:border-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-focus/30"
          />
          <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
            {filtered.map((tag) => {
              const isSelected = selected.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggle(tag.id)}
                  aria-pressed={isSelected}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs transition-colors ${
                    isSelected
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                      : "border-strong bg-surface text-muted hover:bg-surface-hover"
                  }`}
                >
                  <span
                    aria-hidden
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: tagColor[tag.color] ?? tag.color }}
                  />
                  {tag.name}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-xs text-muted">No tags match “{query.trim()}”.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}