import { useEffect, useState } from "react";
import type { ResearchGap } from "../../types";
import { gaps, projects, questions } from "../../lib/storage";
import type { CreateInput } from "../../lib/storage";
import { itemHref, projectHref } from "../../lib/hrefs";
import { gapStatus, priority } from "../../lib/meta";
import { useCollection, useEntityMap } from "../../hooks/useCollection";
import { useConfirmDelete } from "../../hooks/useConfirmDelete";
import { useFormSubmit } from "../../hooks/useFormSubmit";
import { Section } from "./Section";
import { ProjectSelect } from "./ProjectSelect";
import { TagField } from "./TagField";
import { FormModal } from "../ui/FormModal";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { CheckboxGroup } from "../ui/CheckboxGroup";
import { Field, TextArea, TextInput } from "../ui/Field";
import { Select } from "../ui/Select";
import { ItemList } from "../ui/ItemList";
import type { ItemRow } from "../ui/ItemList";

const STATUSES = ["identified", "investigating", "addressed", "open"] as const;
const IMPORTANCE = ["low", "medium", "high", "critical"] as const;

type GapValues = CreateInput<ResearchGap>;

function GapFields({
  initial,
  projectId,
  onValues,
}: {
  initial?: ResearchGap | null;
  projectId?: string;
  onValues: (values: GapValues) => void;
}) {
  const [values, setValues] = useState<GapValues>(() => ({
    projectId: projectId ?? initial?.projectId ?? "",
    questionId: initial?.questionId ?? "",
    questionIds: initial?.questionIds ?? [],
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    importance: initial?.importance ?? "medium",
    status: initial?.status ?? "identified",
    suggestedDirection: initial?.suggestedDirection ?? "",
    tagIds: initial?.tagIds ?? [],
  }));

  const { items: questionOptions } = useCollection(questions, values.projectId || undefined);

  function patch(patchValues: Partial<GapValues>) {
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
        <Field label="Project" htmlFor="gap-project" required>
          <ProjectSelect
            value={values.projectId}
            onChange={(projectId) => patch({ projectId, questionIds: [], questionId: "" })}
          />
        </Field>
      )}
      <Field label="Title" htmlFor="gap-title" required>
        <TextInput
          id="gap-title"
          value={values.title}
          onChange={(event) => patch({ title: event.target.value })}
        />
      </Field>
      <Field
        label="Description"
        htmlFor="gap-description"
        hint="What is unknown or not yet well understood in this area?"
      >
        <TextArea
          id="gap-description"
          value={values.description}
          onChange={(event) => patch({ description: event.target.value })}
        />
      </Field>
      <Field label="Related questions" hint="You can link a gap to one or more research questions.">
        <CheckboxGroup
          label=""
          options={questionOptions.map((q) => ({ value: q.id, label: q.question }))}
          selected={values.questionIds}
          onChange={(questionIds) =>
            patch({ questionIds, questionId: questionIds[0] ?? undefined })
          }
          emptyText={
            values.projectId
              ? "No research questions in this project yet."
              : "Select a project to see its questions."
          }
        />
      </Field>
      <Field
        label="Suggested direction"
        htmlFor="gap-direction"
        hint="Optional idea for how to address this gap."
      >
        <TextArea
          id="gap-direction"
          value={values.suggestedDirection ?? ""}
          onChange={(event) => patch({ suggestedDirection: event.target.value })}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Importance" htmlFor="gap-importance">
          <Select
            id="gap-importance"
            value={values.importance}
            onChange={(event) => patch({ importance: event.target.value as GapValues["importance"] })}
          >
            {IMPORTANCE.map((importance) => (
              <option key={importance} value={importance}>
                {priority[importance].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status" htmlFor="gap-status">
          <Select
            id="gap-status"
            value={values.status}
            onChange={(event) => patch({ status: event.target.value as GapValues["status"] })}
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {gapStatus[status].label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <TagField
        value={values.tagIds ?? []}
        onChange={(tagIds) => patch({ tagIds })}
      />
    </>
  );
}

export function GapSection({
  projectId,
  focusId,
}: {
  projectId?: string;
  focusId?: string;
}) {
  const collection = useCollection(gaps, projectId);
  const { map: projectMap } = useEntityMap(projects);
  const { map: questionMap } = useEntityMap(questions, projectId);
  const form = useFormSubmit(
    collection.create,
    collection.update,
    (values) => {
      if (!values.title.trim()) return "Title is required.";
      if (!values.projectId) return "Select a project.";
      return null;
    },
  );
  const confirmDelete = useConfirmDelete<ResearchGap>(collection.remove);

  const rows: ItemRow[] = collection.items.map((record) => {
    const status = gapStatus[record.status] ?? gapStatus.identified;
    const importance = priority[record.importance] ?? priority.medium;
    const questionIds =
      record.questionIds.length > 0
        ? record.questionIds
        : record.questionId
          ? [record.questionId]
          : [];
    const question = questionIds[0] ? questionMap.get(questionIds[0]) : null;
    const project = projectMap.get(record.projectId);
    return {
      id: record.id,
      title: record.title,
      subtitle: record.description,
      href: itemHref("gap", record.id, record.projectId),
      badges: [
        { label: status.label, tone: status.tone, title: "Status" },
        { label: `Importance: ${importance.label}`, tone: importance.tone, title: "Importance" },
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
      title="Research gaps"
      icon="flag"
      count={collection.items.length}
      addLabel="New gap"
      onAdd={form.openCreate}
      loading={collection.loading}
      error={collection.error}
      onRetry={collection.refresh}
      emptyTitle="No research gaps yet."
      emptyDescription="A research gap is something unknown that could motivate a question — and later an experiment."
      isEmpty={collection.items.length === 0}
    >
      <ItemList items={rows} focusId={focusId} />

      {form.draft && (
        <FormModal
          title={form.draft.mode === "edit" ? "Edit Research Gap" : "New Research Gap"}
          onCancel={form.close}
          onSave={form.handleSave}
          saving={form.saving}
          error={form.error}
        >
          <GapFields
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
          title="Delete Research Gap"
          message={`Delete gap “${confirmDelete.target.title}”?`}
          saving={confirmDelete.saving}
          error={confirmDelete.error}
          onCancel={confirmDelete.close}
          onConfirm={confirmDelete.confirm}
        />
      )}
    </Section>
  );
}