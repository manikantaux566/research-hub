import { useEffect, useState } from "react";
import type { Insight } from "../../types";
import { findings, insights, projects, questions } from "../../lib/storage";
import type { CreateInput } from "../../lib/storage";
import { pluralize, snippet } from "../../lib/format";
import { itemHref, projectHref } from "../../lib/hrefs";
import { useCollection, useEntityMap } from "../../hooks/useCollection";
import { useConfirmDelete } from "../../hooks/useConfirmDelete";
import { useFormSubmit } from "../../hooks/useFormSubmit";
import { Section } from "./Section";
import { ProjectSelect } from "./ProjectSelect";
import { QuestionSelect } from "./HypothesisEntity";
import { FormModal } from "../ui/FormModal";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { CheckboxGroup } from "../ui/CheckboxGroup";
import { Field, TextArea, TextInput } from "../ui/Field";
import { ItemList } from "../ui/ItemList";
import type { ItemRow } from "../ui/ItemList";
import { TagField } from "./TagField";

type InsightValues = CreateInput<Insight>;

function InsightFields({
  initial,
  projectId,
  onValues,
}: {
  initial?: Insight | null;
  projectId?: string;
  onValues: (values: InsightValues) => void;
}) {
  const [values, setValues] = useState<InsightValues>(() => ({
    projectId: projectId ?? initial?.projectId ?? "",
    questionId: initial?.questionId ?? "",
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    findingIds: initial?.findingIds ?? [],
    tagIds: initial?.tagIds ?? [],
  }));
  const { items: findingOptions } = useCollection(findings, values.projectId || undefined);

  function patch(patchValues: Partial<InsightValues>) {
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
        <Field label="Project" htmlFor="insight-project" required>
          <ProjectSelect
            value={values.projectId}
            onChange={(projectId) => patch({ projectId, questionId: "", findingIds: [] })}
          />
        </Field>
      )}
      <Field label="Title" htmlFor="insight-title" required>
        <TextInput
          id="insight-title"
          value={values.title}
          onChange={(event) => patch({ title: event.target.value })}
        />
      </Field>
      <Field
        label="Description"
        htmlFor="insight-description"
        hint="What you understand or realize from the findings. An insight is interpretation, not raw evidence."
      >
        <TextArea
          id="insight-description"
          value={values.description}
          onChange={(event) => patch({ description: event.target.value })}
        />
      </Field>
      <Field label="Related question" htmlFor="insight-question">
        <QuestionSelect
          projectId={values.projectId || undefined}
          value={values.questionId ?? ""}
          onChange={(questionId) => patch({ questionId: questionId || undefined })}
        />
      </Field>
      <CheckboxGroup
        label="Supporting findings"
        options={findingOptions.map((f) => ({ value: f.id, label: f.title }))}
        selected={values.findingIds}
        onChange={(findingIds) => patch({ findingIds })}
        emptyText={
          values.projectId
            ? "No findings recorded in this project yet."
            : "Select a project to see its findings."
        }
      />
      <TagField
        value={values.tagIds ?? []}
        onChange={(tagIds) => patch({ tagIds })}
      />
    </>
  );
}

export function InsightSection({
  projectId,
  focusId,
}: {
  projectId?: string;
  focusId?: string;
}) {
  const collection = useCollection(insights, projectId);
  const { map: projectMap } = useEntityMap(projects);
  const { map: questionMap } = useEntityMap(questions, projectId);
  const { map: findingMap } = useEntityMap(findings, projectId);
  const form = useFormSubmit(
    collection.create,
    collection.update,
    (values) => {
      if (!values.title.trim()) return "Title is required.";
      if (!values.projectId) return "Select a project.";
      return null;
    },
  );
  const confirmDelete = useConfirmDelete<Insight>(collection.remove);

  const rows: ItemRow[] = collection.items.map((record) => {
    const question = record.questionId ? questionMap.get(record.questionId) : null;
    const project = projectMap.get(record.projectId);
    const findingItems = record.findingIds
      .map((id) => findingMap.get(id))
      .filter((f) => f !== undefined);
    return {
      id: record.id,
      title: record.title,
      subtitle: record.description ? snippet(record.description, 160) : undefined,
      href: itemHref("insight", record.id, record.projectId),
      badges: [
        {
          label: pluralize(findingItems.length, "supporting finding"),
          tone: "indigo" as const,
          title: "Count of supporting findings",
        },
        ...(question
          ? [
              {
                label: `Question: ${question.question.slice(0, 60)}`,
                tone: "gray" as const,
                href: itemHref("question", question.id, record.projectId),
                title: "Go to related question",
              },
            ]
          : []),
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
      title="Insights"
      icon="insights"
      count={collection.items.length}
      addLabel="New insight"
      onAdd={form.openCreate}
      loading={collection.loading}
      error={collection.error}
      onRetry={collection.refresh}
      emptyTitle="No insights yet."
      emptyDescription="An insight is what you understand or realize from your findings. Insights are not generated automatically."
      isEmpty={collection.items.length === 0}
    >
      <ItemList items={rows} focusId={focusId} />

      {form.draft && (
        <FormModal
          title={form.draft.mode === "edit" ? "Edit Insight" : "New Insight"}
          onCancel={form.close}
          onSave={form.handleSave}
          saving={form.saving}
          error={form.error}
          wide
        >
          <InsightFields
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
          title="Delete Insight"
          message={`Delete insight “${confirmDelete.target.title}”?`}
          saving={confirmDelete.saving}
          error={confirmDelete.error}
          onCancel={confirmDelete.close}
          onConfirm={confirmDelete.confirm}
        />
      )}
    </Section>
  );
}