import { useEffect, useState } from "react";
import type { Finding } from "../../types";
import { evidence, experiments, findings, projects, questions } from "../../lib/storage";
import type { CreateInput } from "../../lib/storage";
import { pluralize, snippet } from "../../lib/format";
import { itemHref, projectHref } from "../../lib/hrefs";
import { confidence as confidenceMeta } from "../../lib/meta";
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
import { Field, TextArea, TextInput } from "../ui/Field";
import { Select } from "../ui/Select";
import { ItemList } from "../ui/ItemList";
import type { ItemRow } from "../ui/ItemList";

const CONFIDENCE = ["low", "medium", "high"] as const;

type FindingValues = CreateInput<Finding>;

function FindingFields({
  initial,
  projectId,
  onValues,
}: {
  initial?: Finding | null;
  projectId?: string;
  onValues: (values: FindingValues) => void;
}) {
  const [values, setValues] = useState<FindingValues>(() => ({
    projectId: projectId ?? initial?.projectId ?? "",
    questionId: initial?.questionId ?? "",
    experimentId: initial?.experimentId ?? "",
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    confidence: initial?.confidence ?? "medium",
    evidenceIds: initial?.evidenceIds ?? [],
    tagIds: initial?.tagIds ?? [],
  }));
  const { items: evidenceOptions } = useCollection(evidence, values.projectId || undefined);
  const { items: experimentOptions } = useCollection(experiments, values.projectId || undefined);

  function patch(patchValues: Partial<FindingValues>) {
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
        <Field label="Project" htmlFor="finding-project" required>
          <ProjectSelect
            value={values.projectId}
            onChange={(projectId) => patch({ projectId, questionId: "", evidenceIds: [] })}
          />
        </Field>
      )}
      <Field label="Title" htmlFor="finding-title" required>
        <TextInput
          id="finding-title"
          value={values.title}
          onChange={(event) => patch({ title: event.target.value })}
        />
      </Field>
      <Field
        label="Description"
        htmlFor="finding-description"
        hint="What the research currently establishes — based on evidence, not the same as the evidence itself."
      >
        <TextArea
          id="finding-description"
          value={values.description}
          onChange={(event) => patch({ description: event.target.value })}
        />
      </Field>
      <Field label="Related question" htmlFor="finding-question">
        <QuestionSelect
          projectId={values.projectId || undefined}
          value={values.questionId ?? ""}
          onChange={(questionId) => patch({ questionId: questionId || undefined })}
        />
      </Field>
      <Field label="Produced by experiment" htmlFor="finding-experiment">
        <Select
          id="finding-experiment"
          value={values.experimentId ?? ""}
          onChange={(event) =>
            patch({ experimentId: event.target.value || undefined })
          }
          disabled={!values.projectId}
        >
          <option value="">
            {values.projectId ? "No linked experiment" : "Select a project first"}
          </option>
          {experimentOptions.map((exp) => (
            <option key={exp.id} value={exp.id}>
              {exp.title}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Confidence" htmlFor="finding-confidence">
        <Select
          id="finding-confidence"
          value={values.confidence}
          onChange={(event) => patch({ confidence: event.target.value as FindingValues["confidence"] })}
        >
          {CONFIDENCE.map((c) => (
            <option key={c} value={c}>
              {confidenceMeta[c].label}
            </option>
          ))}
        </Select>
      </Field>
      <CheckboxGroup
        label="Supporting evidence"
        options={evidenceOptions.map((e) => ({ value: e.id, label: e.title }))}
        selected={values.evidenceIds}
        onChange={(evidenceIds) => patch({ evidenceIds })}
        emptyText={
          values.projectId
            ? "No evidence recorded in this project yet. Add evidence first."
            : "Select a project to see its evidence."
        }
      />
      <TagField
        value={values.tagIds ?? []}
        onChange={(tagIds) => patch({ tagIds })}
      />
    </>
  );
}

export function FindingSection({
  projectId,
  focusId,
}: {
  projectId?: string;
  focusId?: string;
}) {
  const collection = useCollection(findings, projectId);
  const { map: projectMap } = useEntityMap(projects);
  const { map: questionMap } = useEntityMap(questions, projectId);
  const { map: evidenceMap } = useEntityMap(evidence, projectId);
  const form = useFormSubmit(
    collection.create,
    collection.update,
    (values) => {
      if (!values.title.trim()) return "Title is required.";
      if (!values.projectId) return "Select a project.";
      return null;
    },
  );
  const confirmDelete = useConfirmDelete<Finding>(collection.remove);

  const rows: ItemRow[] = collection.items.map((record) => {
    const conf = confidenceMeta[record.confidence] ?? confidenceMeta.medium;
    const question = record.questionId ? questionMap.get(record.questionId) : null;
    const project = projectMap.get(record.projectId);
    const evidenceItems = record.evidenceIds
      .map((id) => evidenceMap.get(id))
      .filter((e) => e !== undefined);
    return {
      id: record.id,
      title: record.title,
      subtitle: record.description
        ? snippet(record.description, 160)
        : undefined,
      href: itemHref("finding", record.id, record.projectId),
      badges: [
        { label: conf.label, tone: conf.tone, title: "Confidence" },
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
        {
          label: pluralize(evidenceItems.length, "evidence"),
          tone: "gray" as const,
          title: "Count of supporting evidence",
        },
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
      title="Findings"
      icon="findings"
      count={collection.items.length}
      addLabel="New finding"
      onAdd={form.openCreate}
      loading={collection.loading}
      error={collection.error}
      onRetry={collection.refresh}
      emptyTitle="No findings yet."
      emptyDescription="A finding is what the research currently establishes, supported by evidence. It is distinct from raw evidence."
      isEmpty={collection.items.length === 0}
    >
      <ItemList items={rows} focusId={focusId} />

      {form.draft && (
        <FormModal
          title={form.draft.mode === "edit" ? "Edit Finding" : "New Finding"}
          onCancel={form.close}
          onSave={form.handleSave}
          saving={form.saving}
          error={form.error}
          wide
        >
          <FindingFields
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
          title="Delete Finding"
          message={`Delete finding “${confirmDelete.target.title}”?`}
          saving={confirmDelete.saving}
          error={confirmDelete.error}
          onCancel={confirmDelete.close}
          onConfirm={confirmDelete.confirm}
        />
      )}
    </Section>
  );
}