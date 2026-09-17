import { useEffect, useState } from "react";
import type { Experiment, ExperimentVariable } from "../../types";
import { experiments, findings, evidence, hypotheses, projects } from "../../lib/storage";
import type { CreateInput } from "../../lib/storage";
import { itemHref, projectHref } from "../../lib/hrefs";
import { experimentStatus } from "../../lib/meta";
import { useCollection, useEntityMap } from "../../hooks/useCollection";
import { useConfirmDelete } from "../../hooks/useConfirmDelete";
import { useFormSubmit } from "../../hooks/useFormSubmit";
import { Section } from "./Section";
import { ProjectSelect } from "./ProjectSelect";
import { QuestionSelect } from "./HypothesisEntity";
import { TagField } from "./TagField";
import { FormModal } from "../ui/FormModal";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { CheckboxGroup } from "../ui/CheckboxGroup";
import { Field, TextArea, TextInput, FieldsetLabel } from "../ui/Field";
import { Select } from "../ui/Select";
import { ItemList } from "../ui/ItemList";
import type { ItemRow } from "../ui/ItemList";

const STATUSES = [
  "planned",
  "in-progress",
  "completed",
  "paused",
  "cancelled",
] as const;

type ExperimentValues = CreateInput<Experiment>;

function HypothesisSelect({
  projectId,
  value,
  onChange,
  disabled,
}: {
  projectId: string | undefined;
  value: string;
  onChange: (hypothesisId: string) => void;
  disabled?: boolean;
}) {
  const { items: hypothesisOptions } = useCollection(hypotheses, projectId);
  return (
    <Select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
      <option value="">No linked hypothesis</option>
      {hypothesisOptions.map((h) => (
        <option key={h.id} value={h.id}>
          {h.title || h.statement}
        </option>
      ))}
    </Select>
  );
}

function VariablesField({
  variables,
  onChange,
}: {
  variables: ExperimentVariable[];
  onChange: (variables: ExperimentVariable[]) => void;
}) {
  function update(index: number, patch: Partial<ExperimentVariable>) {
    const next = variables.map((variable, i) =>
      i === index ? { ...variable, ...patch } : variable,
    );
    onChange(next);
  }
  return (
    <div className="space-y-2">
      {variables.map((variable, index) => (
        <div key={index} className="flex items-end gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-muted" htmlFor={`variable-key-${index}`}>
              Variable
            </label>
            <TextInput
              id={`variable-key-${index}`}
              value={variable.key}
              onChange={(event) => update(index, { key: event.target.value })}
              placeholder="e.g. grid_investment"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-muted" htmlFor={`variable-value-${index}`}>
              Value / unit
            </label>
            <TextInput
              id={`variable-value-${index}`}
              value={variable.value}
              onChange={(event) => update(index, { value: event.target.value })}
              placeholder="e.g. USD / capita"
            />
          </div>
          <button
            type="button"
            onClick={() => onChange(variables.filter((_, i) => i !== index))}
            aria-label="Remove variable"
            className="rounded p-1.5 text-faint hover:bg-red-50 hover:text-red-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...variables, { key: "", value: "" }])}
        className="inline-flex items-center gap-1 rounded-md border border-dashed border-strong px-3 py-1.5 text-xs font-medium text-muted hover:border-indigo-400 hover:text-link"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add variable
      </button>
    </div>
  );
}

function ExperimentFields({
  initial,
  projectId,
  onValues,
}: {
  initial?: Experiment | null;
  projectId?: string;
  onValues: (values: ExperimentValues) => void;
}) {
  const [values, setValues] = useState<ExperimentValues>(() => ({
    projectId: projectId ?? initial?.projectId ?? "",
    hypothesisId: initial?.hypothesisId ?? "",
    questionId: initial?.questionId ?? "",
    title: initial?.title ?? "",
    objective: initial?.objective ?? "",
    methodology: initial?.methodology ?? "",
    procedure: initial?.procedure ?? "",
    variables: initial?.variables ?? [],
    status: initial?.status ?? "planned",
    expectedResult: initial?.expectedResult ?? "",
    actualResult: initial?.actualResult ?? "",
    results: initial?.results ?? "",
    conclusion: initial?.conclusion ?? "",
    limitations: initial?.limitations ?? "",
    evidenceIds: initial?.evidenceIds ?? [],
    findingIds: initial?.findingIds ?? [],
    notes: initial?.notes ?? "",
    tagIds: initial?.tagIds ?? [],
  }));
  const { items: evidenceOptions } = useCollection(evidence, values.projectId || undefined);
  const { items: findingOptions } = useCollection(findings, values.projectId || undefined);

  function patch(patchValues: Partial<ExperimentValues>) {
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
        <Field label="Project" htmlFor="experiment-project" required>
          <ProjectSelect
            value={values.projectId}
            onChange={(projectId) =>
              patch({ projectId, hypothesisId: "", questionId: "", evidenceIds: [], findingIds: [] })
            }
          />
        </Field>
      )}
      <Field label="Title" htmlFor="experiment-title" required>
        <TextInput
          id="experiment-title"
          value={values.title}
          onChange={(event) => patch({ title: event.target.value })}
          placeholder="Short label for the experiment"
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Linked hypothesis" htmlFor="experiment-hypothesis">
          <HypothesisSelect
            projectId={values.projectId || undefined}
            value={values.hypothesisId ?? ""}
            onChange={(hypothesisId) => patch({ hypothesisId: hypothesisId || undefined })}
          />
        </Field>
        <Field label="Related question" htmlFor="experiment-question">
          <QuestionSelect
            projectId={values.projectId || undefined}
            value={values.questionId ?? ""}
            onChange={(questionId) => patch({ questionId: questionId || undefined })}
          />
        </Field>
      </div>
      <Field
        label="Objective"
        htmlFor="experiment-objective"
        hint="What do you want to determine by running this experiment?"
      >
        <TextArea
          id="experiment-objective"
          value={values.objective ?? ""}
          onChange={(event) => patch({ objective: event.target.value })}
        />
      </Field>

      <FieldsetLabel>Design</FieldsetLabel>
      <Field
        label="Methodology"
        htmlFor="experiment-methodology"
        hint="Describe the method at a high level."
      >
        <TextArea
          id="experiment-methodology"
          value={values.methodology}
          onChange={(event) => patch({ methodology: event.target.value })}
        />
      </Field>
      <Field
        label="Procedure"
        htmlFor="experiment-procedure"
        hint="Step-by-step steps to run the experiment."
      >
        <TextArea
          id="experiment-procedure"
          value={values.procedure ?? ""}
          onChange={(event) => patch({ procedure: event.target.value })}
        />
      </Field>
      <Field label="Variables" hint="Define the variables you are tracking.">
        <VariablesField
          variables={values.variables}
          onChange={(variables) => patch({ variables })}
        />
      </Field>
      <Field
        label="Expected result"
        htmlFor="experiment-expected"
        hint="What would you predict to observe?"
      >
        <TextArea
          id="experiment-expected"
          value={values.expectedResult ?? ""}
          onChange={(event) => patch({ expectedResult: event.target.value })}
        />
      </Field>

      <FieldsetLabel>Status</FieldsetLabel>
      <Field label="Status" htmlFor="experiment-status">
        <Select
          id="experiment-status"
          value={values.status}
          onChange={(event) => patch({ status: event.target.value as ExperimentValues["status"] })}
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {experimentStatus[status].label}
            </option>
          ))}
        </Select>
      </Field>

      <FieldsetLabel>Outcomes</FieldsetLabel>
      <Field
        label="Actual result"
        htmlFor="experiment-actual"
        hint="What actually happened. Kept separate from your interpretation."
      >
        <TextArea
          id="experiment-actual"
          value={values.actualResult ?? ""}
          onChange={(event) => patch({ actualResult: event.target.value })}
        />
      </Field>
      <Field
        label="Conclusion"
        htmlFor="experiment-conclusion"
        hint="Your interpretation of the results and whether the hypothesis was supported."
      >
        <TextArea
          id="experiment-conclusion"
          value={values.conclusion ?? ""}
          onChange={(event) => patch({ conclusion: event.target.value })}
        />
      </Field>
      <Field
        label="Limitations"
        htmlFor="experiment-limitations"
        hint="Confounders, sample issues, and scope limits."
      >
        <TextArea
          id="experiment-limitations"
          value={values.limitations ?? ""}
          onChange={(event) => patch({ limitations: event.target.value })}
        />
      </Field>

      <FieldsetLabel>Links</FieldsetLabel>
      <CheckboxGroup
        label="Evidence used"
        options={evidenceOptions.map((e) => ({ value: e.id, label: e.title }))}
        selected={values.evidenceIds}
        onChange={(evidenceIds) => patch({ evidenceIds })}
        emptyText={
          values.projectId
            ? "No evidence recorded in this project yet."
            : "Select a project to see its evidence."
        }
      />
      <CheckboxGroup
        label="Findings produced"
        options={findingOptions.map((f) => ({ value: f.id, label: f.title }))}
        selected={values.findingIds}
        onChange={(findingIds) => patch({ findingIds })}
        emptyText={
          values.projectId
            ? "No findings recorded in this project yet."
            : "Select a project to see its findings."
        }
      />
      <Field label="Notes" htmlFor="experiment-notes">
        <TextArea
          id="experiment-notes"
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

export function ExperimentSection({
  projectId,
  focusId,
}: {
  projectId?: string;
  focusId?: string;
}) {
  const collection = useCollection(experiments, projectId);
  const { map: projectMap } = useEntityMap(projects);
  const { map: hypothesisMap } = useEntityMap(hypotheses, projectId);
  const form = useFormSubmit(
    collection.create,
    collection.update,
    (values) => {
      if (!values.title.trim()) return "Title is required.";
      if (!values.projectId) return "Select a project.";
      return null;
    },
  );
  const confirmDelete = useConfirmDelete<Experiment>(collection.remove);

  const rows: ItemRow[] = collection.items.map((record) => {
    const status = experimentStatus[record.status] ?? experimentStatus.planned;
    const hypothesis = record.hypothesisId
      ? hypothesisMap.get(record.hypothesisId)
      : null;
    const project = projectMap.get(record.projectId);
    return {
      id: record.id,
      title: record.title,
      subtitle: [
        hypothesis?.title
          ? `Hypothesis: ${hypothesis.title}`
          : hypothesis?.statement
            ? `Hypothesis: ${hypothesis.statement}`
            : "",
        record.conclusion ? `Conclusion: ${record.conclusion}` : "",
      ].filter(Boolean).join("\n"),
      href: itemHref("experiment", record.id, record.projectId),
      badges: [
        { label: status.label, tone: status.tone, title: "Status" },
        ...(hypothesis
          ? [
              {
                label: (hypothesis.title || hypothesis.statement).slice(0, 50),
                tone: "gray" as const,
                href: itemHref("hypothesis", hypothesis.id, record.projectId),
                title: "Go to hypothesis",
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
      title="Experiments"
      icon="beaker"
      count={collection.items.length}
      addLabel="New experiment"
      onAdd={form.openCreate}
      loading={collection.loading}
      error={collection.error}
      onRetry={collection.refresh}
      emptyTitle="No experiments yet."
      emptyDescription="An experiment tests a hypothesis under controlled methodology."
      isEmpty={collection.items.length === 0}
    >
      <ItemList items={rows} focusId={focusId} />

      {form.draft && (
        <FormModal
          title={form.draft.mode === "edit" ? "Edit Experiment" : "New Experiment"}
          onCancel={form.close}
          onSave={form.handleSave}
          saving={form.saving}
          error={form.error}
          wide
        >
          <ExperimentFields
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
          title="Delete Experiment"
          message={`Delete experiment “${confirmDelete.target.title}”?`}
          saving={confirmDelete.saving}
          error={confirmDelete.error}
          onCancel={confirmDelete.close}
          onConfirm={confirmDelete.confirm}
        />
      )}
    </Section>
  );
}