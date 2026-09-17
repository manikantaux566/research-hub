import { useEffect, useRef, useState } from "react";
import type { Tag } from "../types";
import { tags, ALL_REPOSITORIES } from "../lib/storage";
import { tagColor, TAG_COLOR_KEYS } from "../lib/meta";
import { useConfirmDelete } from "../hooks/useConfirmDelete";
import { Header } from "../components/layout/Header";
import { FormModal } from "../components/ui/FormModal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Field, TextInput } from "../components/ui/Field";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { Button, IconButton } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";

type TagRow = { id: string; tagIds?: string[] };

export function TagsPage() {
  const [items, setItems] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [creating, setCreating] = useState(false);
  const [usage, setUsage] = useState<Record<string, Record<string, number>>>({});
  const seq = useRef(0);

  const confirmDelete = useConfirmDelete<Tag>(tags.remove);

  function reload() {
    const id = ++seq.current;
    setLoading(true);
    setError(null);
    void tags
      .list()
      .then((tagRows) => {
        if (id !== seq.current) return;
        setItems(tagRows);
        setLoading(false);
      })
      .catch((e) => {
        if (id !== seq.current) return;
        setError(e instanceof Error ? e.message : "Failed to load tags.");
        setLoading(false);
      });
  }

  useEffect(() => {
    const currentSeq = ++seq.current;
    reload();
    return () => {
      seq.current = currentSeq + 1;
    };
  }, []);

  function updateUsage() {
    void Promise.all(Object.entries(ALL_REPOSITORIES).map(([kind, repo]) => repo.list().then((rows) => [kind, rows] as const))).then(
      (all) => {
        const counts: Record<string, Record<string, number>> = {};
        for (const [kind, rows] of all) {
          for (const row of rows as unknown as TagRow[]) {
            const tagIds = row.tagIds;
            if (!Array.isArray(tagIds)) continue;
            for (const tagId of tagIds) {
              counts[tagId] = counts[tagId] ?? {};
              counts[tagId][kind] = (counts[tagId][kind] ?? 0) + 1;
            }
          }
        }
        setUsage(counts);
      },
    );
  }

  useEffect(() => {
    if (!loading) updateUsage();
  }, [loading]);

  if (loading) return <div><Header title="Tags" icon="tags" /><div className="p-6"><Spinner label="Loading tags…" /></div></div>;

  return (
    <div>
      <Header
        title="Tags"
        subtitle="Cross-cutting labels for organizing your research"
        icon="tags"
        actions={
          <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
            <Icon name="plus" className="h-3.5 w-3.5" />
            New Tag
          </Button>
        }
      />
      <div className="px-6 pb-10 pt-6">
        {error ? (
          <div className="rounded-xl border border-danger/25 bg-danger/10 p-6 text-sm text-danger">
            {error}
            <Button variant="danger" size="sm" onClick={reload} className="ml-3">
              Try again
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface shadow-xs">
            <EmptyState
              icon="tags"
              title="No tags yet."
              description="Tags let you group evidence, claims, and sources across projects — for example “methodology” or “needs-followup”."
              action={
                <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
                  <Icon name="plus" className="h-3.5 w-3.5" />
                  Create a tag
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((tag) => {
              const hex = tagColor[tag.color] ?? "#64748b";
              const tagUsage = usage[tag.id] ?? {};
              const total = Object.values(tagUsage).reduce((sum, n) => sum + n, 0);
              return (
                <div key={tag.id} className="rounded-xl border border-border bg-surface p-4 shadow-xs transition-colors hover:bg-surface-hover">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-foreground ring-1 ring-inset ring-border">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: hex }} />
                      {tag.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <IconButton label="Edit tag" size="icon-sm" onClick={() => setEditing(tag)}>
                        <Icon name="pencil" className="h-3.5 w-3.5" />
                      </IconButton>
                      <IconButton label="Delete tag" size="icon-sm" variant="ghost" className="text-faint hover:text-danger hover:bg-danger/10" onClick={() => confirmDelete.open(tag)}>
                        <Icon name="trash" className="h-3.5 w-3.5" />
                      </IconButton>
                    </div>
                  </div>
                  <div className="mt-3 border-t border-border pt-2">
                    <p className="text-xs text-muted">
                      Used {total} time{total === 1 ? "" : "s"} across {Object.keys(tagUsage).length} kind{Object.keys(tagUsage).length === 1 ? "" : "s"}
                    </p>
                    {Object.keys(tagUsage).length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {Object.entries(tagUsage)
                          .sort((a, b) => b[1] - a[1])
                          .map(([kind, count]) => (
                            <span key={kind} className="rounded bg-surface-muted px-1.5 py-0.5 text-[10px] text-muted">
                              {kind} · {count}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {(creating || editing) && (
        <TagModal
          tag={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            reload();
          }}
        />
      )}

      {confirmDelete.target && (
        <ConfirmDialog
          open
          title="Delete tag"
          message={`Delete tag “${confirmDelete.target.name}”? Items keep their content; the tag is removed from them.`}
          saving={confirmDelete.saving}
          error={confirmDelete.error}
          onCancel={confirmDelete.close}
          onConfirm={confirmDelete.confirm}
        />
      )}
    </div>
  );
}

function TagModal({ tag, onClose, onSaved }: { tag: Tag | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(tag?.name ?? "");
  const [color, setColor] = useState(tag?.color ?? "indigo");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) {
      setError("Tag name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const normalized = name.trim().replace(/\s+/g, "-").toLowerCase();
      if (tag) {
        await tags.update(tag.id, { name: normalized, color });
      } else {
        await tags.create({ name: normalized, color });
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save tag.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormModal title={tag ? "Edit tag" : "New Tag"} onCancel={onClose} onSave={handleSave} saving={saving} error={error}>
      <Field label="Name" htmlFor="tag-name" required hint="Lowercased, spaces become dashes.">
        <TextInput id="tag-name" value={name} onChange={(event) => setName(event.target.value)} />
      </Field>
      <Field label="Color" htmlFor="tag-color">
        <div className="flex flex-wrap gap-2">
          {TAG_COLOR_KEYS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              title={c}
              className={`h-6 w-6 rounded-full transition-transform hover:scale-110 ${color === c ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : "ring-1 ring-inset ring-border"}`}
              style={{ backgroundColor: tagColor[c] }}
            />
          ))}
        </div>
      </Field>
    </FormModal>
  );
}