import { useEffect, useState } from "react";
import type { Hypothesis } from "../../types";
import { hypotheses, projects, questions } from "../../lib/storage";
import type { CreateInput } from "../../lib/storage";
import { itemHref, projectHref } from "../../lib/hrefs";
import { hypothesisStatus } from "../../lib/meta";
import { useCollection, useEntityMap } from "../../hooks/useCollection";
import { useConfirmDelete } from "../../hooks/useConfirmDelete";
import { useFormSubmit } from "../../hooks/useFormSubmit";
import { Section } from "./Section";
import { ProjectSelect } from "./ProjectSelect";
import { TagField } from "./TagField";
import { FormModal } from "../ui/FormModal";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Field, TextArea, TextInput } from "../ui/Field";
import { Select } from "../ui/Select";
import { ItemList } from "../ui/ItemList";
import type { ItemRow } from "../ui/ItemList";

const STATUSES = [
  "proposed",
  "testing",
  "supported",
  "partiallySupported",
  "notSupported",
  "rejected",
  "inconclusive",
] as const;

type HypothesisValues = CreateInput<Hypothesis>;

export function QuestionSelect({
  projectId,
  value,
  onChange,
  disabled,
  emptyLabel = "No related question",
}: {
  projectId: string | undefined;
  value: string;
  onChange: (questionId: string) => void;
  disabled?: boolean;
  emptyLabel?: string;
}) {
  const { items: questionOptions } = useCollection(questions, projectId);
  return (
    <Select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
      <option value="">{emptyLabel}</option>
      {questionOptions.map((q) => (
        <option key={q.id} value={q.id}>
          {q.question}
        </option>
      ))}
    </Select>
  );
}

function HypothesisFields({
  initial,
  projectId,
  onValues,
}: {
  initial?: Hypothesis | null;
  projectId?: string;
  onValues: (values: HypothesisValues) => void;
}) {
  const [values, setValues] = useState<HypothesisValues>(() => ({
    projectId: projectId ?? initial?.projectId ?? "",
    questionId: initial?.questionId ?? "",
    title: initial?.title ?? "",
    statement: initial?.statement ?? "",
    rationale: initial?.rationale ?? "",
    status: initial?.status ?? "proposed",
    tagIds: initial?.tagIds ?? [],
  }));

  function patch(patchValues: Partial<HypothesisValues>) {
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
        <Field label="Project" htmlFor="hypothesis-project" required>
          <ProjectSelect
            value={values.projectId}
            onChange={(projectId) => patch({ projectId, questionId: "" })}
          />
        </Field>
      )}
      <Field label="Short title" htmlFor="hypothesis-title">
        <TextInput
          id="hypothesis-title"
          value={values.title ?? ""}
          onChange={(event) => patch({ title: event.target.value || undefined })}
          placeholder="Optional short label; defaults to the statement"
        />
      </Field>
      <Field label="Statement" htmlFor="hypothesis-statement" required>
        <TextArea
          id="hypothesis-statement"
          value={values.statement}
          onChange={(event) => patch({ statement: event.target.value })}
        />
      </Field>
      <Field
        label="Rationale"
        htmlFor="hypothesis-rationale"
        hint="Why do you propose this hypothesis?"
      >
        <TextArea
          id="hypothesis-rationale"
          value={values.rationale}
          onChange={(event) => patch({ rationale: event.target.value })}
        />
      </Field>
      <Field label="Related question" htmlFor="hypothesis-question">
        <QuestionSelect
          projectId={values.projectId || undefined}
          value={values.questionId ?? ""}
          onChange={(questionId) => patch({ questionId: questionId || undefined })}
        />
      </Field>
      <Field label="Status" htmlFor="hypothesis-status">
        <Select
          id="hypothesis-status"
          value={values.status}
          onChange={(event) => patch({ status: event.target.value as HypothesisValues["status"] })}
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {hypothesisStatus[status].label}
            </option>
          ))}
        </Select>
      </Field>
      <TagField
        value={values.tagIds ?? []}
        onChange={(tagIds) => patch({ tagIds })}
      />
    </>
  );
}

export function HypothesisSection({
  projectId,
  focusId,
}: {
  projectId?: string;
  focusId?: string;
}) {
  const collection = useCollection(hypotheses, projectId);
  const { map: projectMap } = useEntityMap(projects);
  const { map: questionMap } = useEntityMap(
    questions,
    projectId,
  );
  const form = useFormSubmit(
    collection.create,
    collection.update,
    (values) => {
      if (!values.statement.trim()) return "Statement is required.";
      if (!values.projectId) return "Select a project.";
      return null;
    },
  );
  const confirmDelete = useConfirmDelete<Hypothesis>(collection.remove);

  const rows: ItemRow[] = collection.items.map((record) => {
    const status = hypothesisStatus[record.status] ?? hypothesisStatus.proposed;
    const question = record.questionId ? questionMap.get(record.questionId) : null;
    const project = projectMap.get(record.projectId);
    return {
      id: record.id,
      title: record.title || record.statement,
      subtitle: record.rationale ? `Rationale: ${record.rationale}` : undefined,
      href: itemHref("hypothesis", record.id, record.projectId),
      badges: [
        { label: status.label, tone: status.tone, title: "Status" },
        ...(question
          ? [
              {
                label: `Question: ${question.question}`,
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
      title="Hypotheses"
      icon="bulb"
      count={collection.items.length}
      addLabel="New hypothesis"
      onAdd={form.openCreate}
      loading={collection.loading}
      error={collection.error}
      onRetry={collection.refresh}
      emptyTitle="No hypotheses yet."
      emptyDescription="A hypothesis is a proposed explanation that can be tested by experiment."
      isEmpty={collection.items.length === 0}
    >
      <ItemList items={rows} focusId={focusId} />

      {form.draft && (
        <FormModal
          title={form.draft.mode === "edit" ? "Edit Hypothesis" : "New Hypothesis"}
          onCancel={form.close}
          onSave={form.handleSave}
          saving={form.saving}
          error={form.error}
        >
          <HypothesisFields
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
          title="Delete Hypothesis"
          message={`Delete hypothesis “${confirmDelete.target.statement}”?`}
          saving={confirmDelete.saving}
          error={confirmDelete.error}
          onCancel={confirmDelete.close}
          onConfirm={confirmDelete.confirm}
        />
      )}
    </Section>
  );
}