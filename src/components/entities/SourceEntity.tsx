import { useEffect, useState } from "react";
import type { Source } from "../../types";
import { projects, sources } from "../../lib/storage";
import type { CreateInput } from "../../lib/storage";
import { formatDate } from "../../lib/format";
import { itemHref, projectHref } from "../../lib/hrefs";
import { sourceType } from "../../lib/meta";
import { useCollection, useEntityMap } from "../../hooks/useCollection";
import { useConfirmDelete } from "../../hooks/useConfirmDelete";
import { useFormSubmit } from "../../hooks/useFormSubmit";
import { Section } from "./Section";
import { ProjectSelect } from "./ProjectSelect";
import { FormModal } from "../ui/FormModal";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Field, TextArea, TextInput } from "../ui/Field";
import { Select } from "../ui/Select";
import { ItemList } from "../ui/ItemList";
import type { ItemRow } from "../ui/ItemList";
import { TagField } from "./TagField";

const SOURCE_TYPES = [
  "web",
  "paper",
  "book",
  "report",
  "video",
  "interview",
  "dataset",
  "other",
] as const;

type SourceValues = CreateInput<Source>;

function SourceFields({
  initial,
  projectId,
  onValues,
}: {
  initial?: Source | null;
  projectId?: string;
  onValues: (values: SourceValues) => void;
}) {
  const [values, setValues] = useState<SourceValues>(() => ({
    projectId: projectId ?? initial?.projectId ?? "",
    title: initial?.title ?? "",
    author: initial?.author ?? "",
    type: initial?.type ?? "web",
    url: initial?.url ?? "",
    publicationDate: initial?.publicationDate ?? "",
    publisher: initial?.publisher ?? "",
    description: initial?.description ?? "",
    tagIds: initial?.tagIds ?? [],
  }));

  function patch(patchValues: Partial<SourceValues>) {
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
        <Field label="Project" htmlFor="source-project" required>
          <ProjectSelect
            value={values.projectId}
            onChange={(projectId) => patch({ projectId })}
          />
        </Field>
      )}
      <Field label="Title" htmlFor="source-title" required>
        <TextInput
          id="source-title"
          value={values.title}
          onChange={(event) => patch({ title: event.target.value })}
          placeholder="Title of the source"
        />
      </Field>
      <Field label="Author" htmlFor="source-author">
        <TextInput
          id="source-author"
          value={values.author}
          onChange={(event) => patch({ author: event.target.value })}
          placeholder="Author or organization"
        />
      </Field>
      <Field label="Source type" htmlFor="source-type">
        <Select
          id="source-type"
          value={values.type}
          onChange={(event) => patch({ type: event.target.value as SourceValues["type"] })}
        >
          {SOURCE_TYPES.map((type) => (
            <option key={type} value={type}>
              {sourceType[type].label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="URL" htmlFor="source-url">
        <TextInput
          id="source-url"
          value={values.url ?? ""}
          onChange={(event) => patch({ url: event.target.value })}
          placeholder="https://…"
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Publication date" htmlFor="source-date">
          <TextInput
            id="source-date"
            type="date"
            value={values.publicationDate ?? ""}
            onChange={(event) => patch({ publicationDate: event.target.value })}
          />
        </Field>
        <Field label="Publisher" htmlFor="source-publisher">
          <TextInput
            id="source-publisher"
            value={values.publisher ?? ""}
            onChange={(event) => patch({ publisher: event.target.value })}
          />
        </Field>
      </div>
      <Field
        label="Description"
        htmlFor="source-description"
        hint="A source is a record you consulted. It is not automatically evidence."
      >
        <TextArea
          id="source-description"
          value={values.description ?? ""}
          onChange={(event) => patch({ description: event.target.value })}
        />
      </Field>
      <TagField
        value={values.tagIds ?? []}
        onChange={(tagIds) => patch({ tagIds })}
      />
    </>
  );
}

export function SourceSection({
  projectId,
  focusId,
}: {
  projectId?: string;
  focusId?: string;
}) {
  const collection = useCollection(sources, projectId);
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
  const confirmDelete = useConfirmDelete<Source>(collection.remove);

  const rows: ItemRow[] = collection.items.map((source) => {
    const project = projectMap.get(source.projectId);
    const meta = sourceType[source.type] ?? sourceType.other;
    return {
      id: source.id,
      title: source.title,
      subtitle: [source.author, source.publisher].filter(Boolean).join(" · "),
      href: itemHref("source", source.id, source.projectId),
      badges: [
        { label: meta.label, tone: meta.tone, title: "Source type" },
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
        ...(source.publicationDate
          ? [{ label: formatDate(source.publicationDate), tone: "gray" as const }]
          : []),
      ],
      actions: [
        { label: "Edit", onClick: () => form.openEdit(source) },
        { label: "Delete", danger: true, onClick: () => confirmDelete.open(source) },
      ],
    };
  });

  return (
    <Section
      title="Sources"
      icon="sources"
      count={collection.items.length}
      addLabel="Add source"
      onAdd={form.openCreate}
      loading={collection.loading}
      error={collection.error}
      onRetry={collection.refresh}
      emptyTitle="No sources yet."
      emptyDescription="A source is a record you consulted — a paper, book, web page, dataset, or interview. It is not the same as evidence."
      isEmpty={collection.items.length === 0}
    >
      <ItemList items={rows} focusId={focusId} />

      {form.draft && (
        <FormModal
          title={form.draft.mode === "edit" ? "Edit Source" : "Add Source"}
          onCancel={form.close}
          onSave={form.handleSave}
          saving={form.saving}
          error={form.error}
        >
          <SourceFields
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
          title="Delete Source"
          message={`Delete “${confirmDelete.target.title}”? This will not delete any evidence attached to it.`}
          saving={confirmDelete.saving}
          error={confirmDelete.error}
          onCancel={confirmDelete.close}
          onConfirm={confirmDelete.confirm}
        />
      )}
    </Section>
  );
}