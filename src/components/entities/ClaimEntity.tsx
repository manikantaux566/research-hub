import { useEffect, useState } from "react";
import type { Claim } from "../../types";
import { claims, evidence, findings, projects } from "../../lib/storage";
import type { CreateInput } from "../../lib/storage";
import { pluralize, snippet } from "../../lib/format";
import { itemHref, projectHref } from "../../lib/hrefs";
import { claimType, verificationStatus } from "../../lib/meta";
import { useCollection, useEntityMap } from "../../hooks/useCollection";
import { useConfirmDelete } from "../../hooks/useConfirmDelete";
import { useFormSubmit } from "../../hooks/useFormSubmit";
import { Section } from "./Section";
import { ProjectSelect } from "./ProjectSelect";
import { FormModal } from "../ui/FormModal";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { CheckboxGroup } from "../ui/CheckboxGroup";
import { Field, TextArea, TextInput, FieldsetLabel } from "../ui/Field";
import { Select } from "../ui/Select";
import { ItemList } from "../ui/ItemList";
import type { ItemRow } from "../ui/ItemList";
import { TagField } from "./TagField";

const TYPES = ["fact", "interpretation", "hypothesis", "prediction", "opinion"] as const;

type ClaimValues = CreateInput<Claim>;

function isSupported(values: Pick<Claim, "evidenceIds" | "findingIds">): boolean {
  return values.evidenceIds.length > 0 || values.findingIds.length > 0;
}

function ClaimFields({
  initial,
  projectId,
  onValues,
}: {
  initial?: Claim | null;
  projectId?: string;
  onValues: (values: ClaimValues) => void;
}) {
  const [values, setValues] = useState<ClaimValues>(() => ({
    projectId: projectId ?? initial?.projectId ?? "",
    claim: initial?.claim ?? "",
    type: initial?.type ?? "fact",
    verificationStatus: initial?.verificationStatus ?? "unverified",
    evidenceIds: initial?.evidenceIds ?? [],
    findingIds: initial?.findingIds ?? [],
    expectedEvidenceCount: initial?.expectedEvidenceCount ?? undefined,
    expectedFindingCount: initial?.expectedFindingCount ?? undefined,
    notes: initial?.notes ?? "",
    tagIds: initial?.tagIds ?? [],
  }));
  const { items: evidenceOptions } = useCollection(evidence, values.projectId || undefined);
  const { items: findingOptions } = useCollection(findings, values.projectId || undefined);

  function patch(patchValues: Partial<ClaimValues>) {
    const next = { ...values, ...patchValues };
    setValues(next);
    onValues(next);
  }

  useEffect(() => {
    onValues(values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const supported = isSupported(values);

  return (
    <>
      {!projectId && (
        <Field label="Project" htmlFor="claim-project" required>
          <ProjectSelect
            value={values.projectId}
            onChange={(projectId) => patch({ projectId, evidenceIds: [], findingIds: [] })}
          />
        </Field>
      )}
      <Field label="Claim" htmlFor="claim-text" required>
        <TextArea
          id="claim-text"
          value={values.claim}
          onChange={(event) => patch({ claim: event.target.value })}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Claim type" htmlFor="claim-type">
          <Select
            id="claim-type"
            value={values.type}
            onChange={(event) => patch({ type: event.target.value as ClaimValues["type"] })}
          >
            {TYPES.map((type) => (
              <option key={type} value={type}>
                {claimType[type].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Verification status" htmlFor="claim-verification">
          <Select
            id="claim-verification"
            value={values.verificationStatus}
            onChange={(event) =>
              patch({ verificationStatus: event.target.value as ClaimValues["verificationStatus"] })
            }
          >
            {(Object.keys(verificationStatus) as Array<ClaimValues["verificationStatus"]>).map(
              (status) => (
                <option key={status} value={status}>
                  {verificationStatus[status].label}
                </option>
              ),
            )}
          </Select>
        </Field>
      </div>
      <div className={`rounded-md px-3 py-2 ${supported ? "bg-emerald-50" : "bg-amber-50"}`}>
        <p className="text-xs font-medium text-foreground">
          {supported
            ? "This claim is backed by at least one piece of evidence or finding."
            : "This claim has no supporting evidence or findings and appears as unsupported."}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          Claims are never automatically marked as verified.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Expected pieces of evidence"
          htmlFor="claim-expected-evidence"
          hint="How many sources of evidence would make you consider this claim fully supported?"
        >
          <TextInput
            id="claim-expected-evidence"
            type="number"
            min={0}
            value={values.expectedEvidenceCount ?? ""}
            onChange={(event) =>
              patch({
                expectedEvidenceCount: event.target.value === "" ? undefined : Math.max(0, Number(event.target.value)),
              })
            }
            placeholder="Any"
          />
        </Field>
        <Field
          label="Expected findings"
          htmlFor="claim-expected-findings"
          hint="How many findings would fully support this claim?"
        >
          <TextInput
            id="claim-expected-findings"
            type="number"
            min={0}
            value={values.expectedFindingCount ?? ""}
            onChange={(event) =>
              patch({
                expectedFindingCount: event.target.value === "" ? undefined : Math.max(0, Number(event.target.value)),
              })
            }
            placeholder="Any"
          />
        </Field>
      </div>

      <FieldsetLabel>Support</FieldsetLabel>
      <CheckboxGroup
        label="Supporting evidence"
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
      <Field label="Notes" htmlFor="claim-notes">
        <TextArea
          id="claim-notes"
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

export function ClaimSection({
  projectId,
  focusId,
}: {
  projectId?: string;
  focusId?: string;
}) {
  const collection = useCollection(claims, projectId);
  const { map: projectMap } = useEntityMap(projects);
  const form = useFormSubmit(
    collection.create,
    collection.update,
    (values) => {
      if (!values.claim.trim()) return "Claim text is required.";
      if (!values.projectId) return "Select a project.";
      return null;
    },
  );
  const confirmDelete = useConfirmDelete<Claim>(collection.remove);

  const rows: ItemRow[] = collection.items.map((record) => {
    const typeMeta = claimType[record.type] ?? claimType.fact;
    const verifyMeta = verificationStatus[record.verificationStatus] ?? verificationStatus.unverified;
    const project = projectMap.get(record.projectId);
    const supported = isSupported(record);
    return {
      id: record.id,
      title: record.claim,
      subtitle: record.notes ? snippet(record.notes, 140) : undefined,
      href: itemHref("claim", record.id, record.projectId),
      badges: [
        { label: typeMeta.label, tone: typeMeta.tone, title: "Claim type" },
        { label: verifyMeta.label, tone: verifyMeta.tone, title: "Verification status" },
        {
          label: supported ? "Supported" : "Unsupported",
          tone: supported ? "green" : "red",
          title: supported
            ? "Has supporting evidence or findings"
            : "No supporting evidence or findings",
        },
        {
          label: pluralize(record.evidenceIds.length, "evidence"),
          tone: "gray" as const,
          title: "Count of supporting evidence",
        },
        {
          label: pluralize(record.findingIds.length, "finding"),
          tone: "gray" as const,
          title: "Count of supporting findings",
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
      title="Claims"
      icon="scale"
      count={collection.items.length}
      addLabel="New claim"
      onAdd={form.openCreate}
      loading={collection.loading}
      error={collection.error}
      onRetry={collection.refresh}
      emptyTitle="No claims yet."
      emptyDescription="A claim makes a statement you can assess. Unsupported claims are shown clearly."
      isEmpty={collection.items.length === 0}
    >
      <ItemList items={rows} focusId={focusId} />

      {form.draft && (
        <FormModal
          title={form.draft.mode === "edit" ? "Edit Claim" : "New Claim"}
          onCancel={form.close}
          onSave={form.handleSave}
          saving={form.saving}
          error={form.error}
          wide
        >
          <ClaimFields
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
          title="Delete Claim"
          message={`Delete claim “${confirmDelete.target.claim}”?`}
          saving={confirmDelete.saving}
          error={confirmDelete.error}
          onCancel={confirmDelete.close}
          onConfirm={confirmDelete.confirm}
        />
      )}
    </Section>
  );
}