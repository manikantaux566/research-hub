import { useEffect, useState } from "react";
import type { ResearchQuestion } from "../../types";
import { projects, questions } from "../../lib/storage";
import type { CreateInput } from "../../lib/storage";
import { itemHref, projectHref } from "../../lib/hrefs";
import { priority, questionStatus } from "../../lib/meta";
import { useCollection, useEntityMap } from "../../hooks/useCollection";
import { useConfirmDelete } from "../../hooks/useConfirmDelete";
import { useFormSubmit } from "../../hooks/useFormSubmit";
import { Section } from "./Section";
import { ProjectSelect } from "./ProjectSelect";
import { FormModal } from "../ui/FormModal";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Field, TextArea } from "../ui/Field";
import { Select } from "../ui/Select";
import { ItemList } from "../ui/ItemList";
import type { ItemRow } from "../ui/ItemList";
import { TagField } from "./TagField";

const STATUSES = ["open", "investigating", "answered", "parked"] as const;
const PRIORITIES = ["low", "medium", "high", "critical"] as const;

type QuestionValues = CreateInput<ResearchQuestion>;

function QuestionFields({
  initial,
  projectId,
  onValues,
}: {
  initial?: ResearchQuestion | null;
  projectId?: string;
  onValues: (values: QuestionValues) => void;
}) {
  const [values, setValues] = useState<QuestionValues>(() => ({
    projectId: projectId ?? initial?.projectId ?? "",
    question: initial?.question ?? "",
    status: initial?.status ?? "open",
    priority: initial?.priority ?? "medium",
    notes: initial?.notes ?? "",
    tagIds: initial?.tagIds ?? [],
  }));

  function patch(patchValues: Partial<QuestionValues>) {
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
        <Field label="Project" htmlFor="question-project" required>
          <ProjectSelect
            value={values.projectId}
            onChange={(projectId) => patch({ projectId })}
          />
        </Field>
      )}
      <Field
        label="Research question"
        htmlFor="question-text"
        required
        hint="A focused question you are trying to answer with research."
      >
        <TextArea
          id="question-text"
          value={values.question}
          onChange={(event) => patch({ question: event.target.value })}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Status" htmlFor="question-status">
          <Select
            id="question-status"
            value={values.status}
            onChange={(event) => patch({ status: event.target.value as QuestionValues["status"] })}
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {questionStatus[status].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Priority" htmlFor="question-priority">
          <Select
            id="question-priority"
            value={values.priority}
            onChange={(event) =>
              patch({ priority: event.target.value as QuestionValues["priority"] })
            }
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {priority[p].label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Notes" htmlFor="question-notes">
        <TextArea
          id="question-notes"
          value={values.notes ?? ""}
          onChange={(event) => patch({ notes: event.target.value })}
        />
      </Field>
      <TagField
        value={values.tagIds ?? []}
        onChange={(tagIds) => patch({ tagIds })}
      />
    </>
  );
}

export function QuestionSection({
  projectId,
  focusId,
}: {
  projectId?: string;
  focusId?: string;
}) {
  const collection = useCollection(questions, projectId);
  const { map: projectMap } = useEntityMap(projects);
  const form = useFormSubmit(
    collection.create,
    collection.update,
    (values) => {
      if (!values.question.trim()) return "Research question is required.";
      if (!values.projectId) return "Select a project.";
      return null;
    },
  );
  const confirmDelete = useConfirmDelete<ResearchQuestion>(collection.remove);

  const rows: ItemRow[] = collection.items.map((record) => {
    const status = questionStatus[record.status] ?? questionStatus.open;
    const prio = priority[record.priority] ?? priority.medium;
    const project = projectMap.get(record.projectId);
    return {
      id: record.id,
      title: record.question,
      href: itemHref("question", record.id, record.projectId),
      badges: [
        { label: status.label, tone: status.tone, title: "Status" },
        { label: `Priority: ${prio.label}`, tone: prio.tone, title: "Priority" },
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
      title="Research questions"
      icon="questions"
      count={collection.items.length}
      addLabel="New question"
      onAdd={form.openCreate}
      loading={collection.loading}
      error={collection.error}
      onRetry={collection.refresh}
      emptyTitle="No research questions yet."
      emptyDescription="Questions guide your research. Track the questions you are trying to answer."
      isEmpty={collection.items.length === 0}
    >
      <ItemList items={rows} focusId={focusId} />

      {form.draft && (
        <FormModal
          title={form.draft.mode === "edit" ? "Edit Question" : "New Research Question"}
          onCancel={form.close}
          onSave={form.handleSave}
          saving={form.saving}
          error={form.error}
        >
          <QuestionFields
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
          title="Delete Question"
          message={`Delete question “${confirmDelete.target.question}”?`}
          saving={confirmDelete.saving}
          error={confirmDelete.error}
          onCancel={confirmDelete.close}
          onConfirm={confirmDelete.confirm}
        />
      )}
    </Section>
  );
}