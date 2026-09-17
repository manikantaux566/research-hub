import { useEffect, useState } from "react";
import type { Note } from "../../types";
import { notes, projects } from "../../lib/storage";
import type { CreateInput } from "../../lib/storage";
import { snippet } from "../../lib/format";
import { itemHref, projectHref } from "../../lib/hrefs";
import { useCollection, useEntityMap } from "../../hooks/useCollection";
import { useConfirmDelete } from "../../hooks/useConfirmDelete";
import { useFormSubmit } from "../../hooks/useFormSubmit";
import { Section } from "./Section";
import { ProjectSelect } from "./ProjectSelect";
import { FormModal } from "../ui/FormModal";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Field, TextArea, TextInput } from "../ui/Field";
import { ItemList } from "../ui/ItemList";
import type { ItemRow } from "../ui/ItemList";
import { TagField } from "./TagField";

type NoteValues = CreateInput<Note>;

function splitTags(raw: string): string[] {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function NoteFields({
  initial,
  projectId,
  onValues,
}: {
  initial?: Note | null;
  projectId?: string;
  onValues: (values: NoteValues) => void;
}) {
  const [values, setValues] = useState<NoteValues>(() => ({
    projectId: projectId ?? initial?.projectId ?? "",
    title: initial?.title ?? "",
    content: initial?.content ?? "",
    tags: initial?.tags ?? [],
    tagIds: initial?.tagIds ?? [],
  }));
  const [tagsRaw, setTagsRaw] = useState(() => initial?.tags.join(", ") ?? "");

  function patch(patchValues: Partial<NoteValues>) {
    const next = { ...values, ...patchValues };
    setValues(next);
    onValues(next);
  }

  useEffect(() => {
    onValues(values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {!projectId && (
        <Field label="Project" htmlFor="note-project" required>
          <ProjectSelect
            value={values.projectId}
            onChange={(projectId) => patch({ projectId })}
          />
        </Field>
      )}
      <Field label="Title" htmlFor="note-title" required>
        <TextInput
          id="note-title"
          value={values.title}
          onChange={(event) => patch({ title: event.target.value })}
        />
      </Field>
      <Field label="Content" htmlFor="note-content">
        <TextArea
          id="note-content"
          className="min-h-40"
          value={values.content}
          onChange={(event) => patch({ content: event.target.value })}
        />
      </Field>
      <Field
        label="Tags"
        htmlFor="note-tags"
        hint="Comma-separated. Notes are your working material — not evidence."
      >
        <TextInput
          id="note-tags"
          value={tagsRaw}
          onChange={(event) => {
            setTagsRaw(event.target.value);
            const tags = splitTags(event.target.value);
            patch({ tags });
          }}
          placeholder="e.g. to-read, follow-up"
        />
      </Field>
      <TagField
        value={values.tagIds ?? []}
        onChange={(tagIds) => patch({ tagIds })}
      />
    </>
  );
}

export function NoteSection({
  projectId,
  focusId,
}: {
  projectId?: string;
  focusId?: string;
}) {
  const collection = useCollection(notes, projectId);
  const { map: projectMap } = useEntityMap(projects);
  const form = useFormSubmit(
    collection.create,
    collection.update,
    (values) => {
      if (!values.title.trim()) return "Title is required.";
      if (!values.projectId) return "Select a project.";
      return null;
    },
  );
  const confirmDelete = useConfirmDelete<Note>(collection.remove);

  const rows: ItemRow[] = collection.items.map((record) => {
    const project = projectMap.get(record.projectId);
    return {
      id: record.id,
      title: record.title,
      subtitle: snippet(record.content, 160),
      href: itemHref("note", record.id, record.projectId),
      badges: [
        ...record.tags.map((tag) => ({
          label: tag,
          tone: "gray" as const,
          title: "Tag",
        })),
        ...(project
          ? [
              {
                label: project.name,
                tone: "gray" as const,
                href: projectHref(project.id),
                title: "Open project",
              },
            ]
          : []),
      ],
      actions: [
        { label: "Edit", onClick: () => form.openEdit(record) },
        { label: "Delete", danger: true, onClick: () => confirmDelete.open(record) },
      ],
    };
  });

  return (
    <Section
      title="Notes"
      icon="pencil"
      count={collection.items.length}
      addLabel="New note"
      onAdd={form.openCreate}
      loading={collection.loading}
      error={collection.error}
      onRetry={collection.refresh}
      emptyTitle="No notes yet."
      emptyDescription="Notes are your own working material — reflections, reading queues, and scratch thoughts. They are not evidence."
      isEmpty={collection.items.length === 0}
    >
      <ItemList items={rows} focusId={focusId} />

      {form.draft && (
        <FormModal
          title={form.draft.mode === "edit" ? "Edit Note" : "New Note"}
          onCancel={form.close}
          onSave={form.handleSave}
          saving={form.saving}
          error={form.error}
        >
          <NoteFields
            key={form.draft.mode === "edit" ? form.draft.record.id : "new"}
            initial={form.draft.mode === "edit" ? form.draft.record : null}
            projectId={projectId}
            onValues={form.setValues}
          />
        </FormModal>
      )}

      {confirmDelete.target && (
        <ConfirmDialog
          open
          title="Delete Note"
          message={`Delete note “${confirmDelete.target.title}”?`}
          saving={confirmDelete.saving}
          error={confirmDelete.error}
          onCancel={confirmDelete.close}
          onConfirm={confirmDelete.confirm}
        />
      )}
    </Section>
  );
}