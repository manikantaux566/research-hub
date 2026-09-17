import { useEffect, useState } from "react";
import type { Evidence } from "../../types";
import { evidence, projects, sources } from "../../lib/storage";
import type { CreateInput } from "../../lib/storage";
import { snippet } from "../../lib/format";
import { itemHref, projectHref } from "../../lib/hrefs";
import { evidenceType, verificationStatus } from "../../lib/meta";
import { useCollection, useEntityMap } from "../../hooks/useCollection";
import { useConfirmDelete } from "../../hooks/useConfirmDelete";
import { useFormSubmit } from "../../hooks/useFormSubmit";
import { Section } from "./Section";
import { ProjectSelect } from "./ProjectSelect";
import { TagField } from "./TagField";
import { FormModal } from "../ui/FormModal";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Field, TextArea, TextInput, Checkbox, FieldsetLabel } from "../ui/Field";
import { Select } from "../ui/Select";
import { ItemList } from "../ui/ItemList";
import type { ItemRow } from "../ui/ItemList";

const EVIDENCE_TYPES = [
  "directQuote",
  "paraphrase",
  "statistic",
  "researcherObservation",
  "data",
  "observation",
  "result",
  "other",
] as const;

type EvidenceValues = CreateInput<Evidence>;

function EvidenceFields({
  initial,
  projectId,
  onValues,
}: {
  initial?: Evidence | null;
  projectId?: string;
  onValues: (values: EvidenceValues) => void;
}) {
  const [values, setValues] = useState<EvidenceValues>(() => ({
    projectId: projectId ?? initial?.projectId ?? "",
    sourceId: initial?.sourceId ?? "",
    title: initial?.title ?? "",
    type: initial?.type ?? "directQuote",
    content: initial?.content ?? "",
    location: initial?.location ?? "",
    interpretation: initial?.interpretation ?? "",
    verificationStatus: initial?.verificationStatus ?? "unverified",
    isAiGenerated: initial?.isAiGenerated ?? false,
    notes: initial?.notes ?? "",
    tagIds: initial?.tagIds ?? [],
  }));
  const { items: sourceOptions } = useCollection(
    sources,
    values.projectId || undefined,
  );

  function patch(patchValues: Partial<EvidenceValues>) {
    const next = {
      ...values,
      ...patchValues,
      ...(patchValues.isAiGenerated === true
        ? { verificationStatus: "unverified" as const }
        : {}),
    };
    setValues(next);
    onValues(next);
  }

  useEffect(() => {
    onValues(values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aiBlocked = values.isAiGenerated;

  return (
    <>
      {!projectId && values.projectId && (
        <div className="rounded-md bg-surface-muted px-3 py-2 text-xs text-muted">
          Project scope changes the available sources for this evidence.
        </div>
      )}
      {!projectId && (
        <Field label="Project" htmlFor="evidence-project" required>
          <ProjectSelect
            value={values.projectId}
            onChange={(projectId) => patch({ projectId, sourceId: "" })}
          />
        </Field>
      )}

      <FieldsetLabel>Source</FieldsetLabel>
      <Field label="Source" htmlFor="evidence-source" required>
        <Select
          id="evidence-source"
          value={values.sourceId}
          onChange={(event) => patch({ sourceId: event.target.value })}
          disabled={!values.projectId}
        >
          <option value="">
            {values.projectId ? "Select a source" : "Select a project first"}
          </option>
          {sourceOptions.map((source) => (
            <option key={source.id} value={source.id}>
              {source.title}
            </option>
          ))}
        </Select>
      </Field>
      {values.sourceId && (
        <p className="-mt-2 text-xs text-muted">
          Evidence belongs to the source record. The source is not treated as
          verified evidence itself.
        </p>
      )}

      <FieldsetLabel>Evidence</FieldsetLabel>
      <Field label="Title" htmlFor="evidence-title" required>
        <TextInput
          id="evidence-title"
          value={values.title}
          onChange={(event) => patch({ title: event.target.value })}
          placeholder="Short label for this piece of evidence"
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Evidence type" htmlFor="evidence-type">
          <Select
            id="evidence-type"
            value={values.type}
            onChange={(event) => patch({ type: event.target.value as EvidenceValues["type"] })}
          >
            {EVIDENCE_TYPES.map((type) => (
              <option key={type} value={type}>
                {evidenceType[type].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Location / reference" htmlFor="evidence-location">
          <TextInput
            id="evidence-location"
            value={values.location ?? ""}
            onChange={(event) => patch({ location: event.target.value })}
            placeholder="e.g. p. 42, §3.2, 12:30"
          />
        </Field>
      </div>
      <Field
        label="Extracted content"
        htmlFor="evidence-content"
        required
        hint="What was actually observed or stated in the source."
      >
        <TextArea
          id="evidence-content"
          value={values.content}
          onChange={(event) => patch({ content: event.target.value })}
        />
      </Field>

      <FieldsetLabel>Interpretation</FieldsetLabel>
      <Field
        label="Your interpretation"
        htmlFor="evidence-interpretation"
        hint="Your own reading of the evidence. Kept separate from the evidence itself."
      >
        <TextArea
          id="evidence-interpretation"
          value={values.interpretation}
          onChange={(event) => patch({ interpretation: event.target.value })}
        />
      </Field>

      <FieldsetLabel>Verification</FieldsetLabel>
      <div className="grid grid-cols-1 gap-4">
        <Field label="Verification status" htmlFor="evidence-verification">
          <Select
            id="evidence-verification"
            value={values.verificationStatus}
            onChange={(event) =>
              patch({ verificationStatus: event.target.value as EvidenceValues["verificationStatus"] })
            }
            disabled={aiBlocked}
          >
            {(Object.keys(verificationStatus) as Array<EvidenceValues["verificationStatus"]>).map(
              (status) => (
                <option key={status} value={status}>
                  {verificationStatus[status].label}
                </option>
              ),
            )}
          </Select>
        </Field>
        <Checkbox
          checked={values.isAiGenerated}
          onChange={(checked) => patch({ isAiGenerated: checked })}
          label={
            <span>
              This content was generated by an AI tool.
              {aiBlocked && (
                <span className="block text-xs text-amber-700">
                  AI-generated content is never automatically marked as
                  verified. Its status is locked to “Unverified”. Verify it
                  manually if you can trace it to a reliable source.
                </span>
              )}
            </span>
          }
        />
      </div>

      <Field label="Notes" htmlFor="evidence-notes">
        <TextArea
          id="evidence-notes"
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

export function EvidenceSection({
  projectId,
  focusId,
}: {
  projectId?: string;
  focusId?: string;
}) {
  const collection = useCollection(evidence, projectId);
  const { map: sourceMap } = useEntityMap(sources, projectId);
  const { map: projectMap } = useEntityMap(projects);
  const form = useFormSubmit(
    collection.create,
    collection.update,
    (values) => {
      if (!values.title.trim()) return "Title is required.";
      if (!values.projectId) return "Select a project.";
      if (!values.sourceId) return "Select a source.";
      if (!values.content.trim()) return "Extracted content is required.";
      return null;
    },
  );
  const confirmDelete = useConfirmDelete<Evidence>(collection.remove);

  const rows: ItemRow[] = collection.items.map((record) => {
    const source = sourceMap.get(record.sourceId);
    const project = projectMap.get(record.projectId);
    const typeMeta = evidenceType[record.type] ?? evidenceType.other;
    const verifyMeta = verificationStatus[record.verificationStatus] ?? verificationStatus.unverified;
    return {
      id: record.id,
      title: record.title,
      subtitle: [
        source ? `Source: ${source.title}` : "Source: (unavailable)",
        record.location ? `Location: ${record.location}` : "",
        record.content ? `Evidence: “${snippet(record.content)}”` : "",
        record.interpretation
          ? `Interpretation: ${snippet(record.interpretation)}`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
      href: itemHref("evidence", record.id, record.projectId),
      badges: [
        { label: typeMeta.label, tone: typeMeta.tone, title: "Evidence type" },
        { label: verifyMeta.label, tone: verifyMeta.tone, title: "Verification status" },
        ...(record.isAiGenerated
          ? [{ label: "AI-generated", tone: "amber" as const, title: "Produced by an AI tool" }]
          : []),
        ...(source
          ? [
              {
                label: source.title,
                tone: "gray" as const,
                href: itemHref("source", source.id, record.projectId),
                title: "Go to source",
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
      title="Evidence"
      icon="document"
      count={collection.items.length}
      addLabel="Add evidence"
      onAdd={form.openCreate}
      loading={collection.loading}
      error={collection.error}
      onRetry={collection.refresh}
      emptyTitle="No evidence yet."
      emptyDescription="Evidence is something you extracted from a source — a quote, data point, or observation. Evidence is a record, not an interpretation."
      isEmpty={collection.items.length === 0}
    >
      <ItemList items={rows} focusId={focusId} />

      {form.draft && (
        <FormModal
          title={form.draft.mode === "edit" ? "Edit Evidence" : "Add Evidence"}
          onCancel={form.close}
          onSave={form.handleSave}
          saving={form.saving}
          error={form.error}
          wide
        >
          <EvidenceFields
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
          title="Delete Evidence"
          message={`Delete evidence “${confirmDelete.target.title}”?`}
          saving={confirmDelete.saving}
          error={confirmDelete.error}
          onCancel={confirmDelete.close}
          onConfirm={confirmDelete.confirm}
        />
      )}
    </Section>
  );
}