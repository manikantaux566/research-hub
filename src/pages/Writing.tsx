import { useEffect, useRef, useState } from "react";
import type { WritingProject, WritingNode } from "../types";
import { projects, writingProjects, writingNodes } from "../lib/storage";
import { useConfirmDelete } from "../hooks/useConfirmDelete";
import { writingProjectHref } from "../lib/hrefs";
import { writingProjectStatus, writingProjectType } from "../lib/meta";
import { snippet, wordCount, pluralize } from "../lib/format";
import { FormModal } from "../components/ui/FormModal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Field, TextArea, TextInput } from "../components/ui/Field";
import { Select } from "../components/ui/Select";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { Header } from "../components/layout/Header";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Icon } from "../components/ui/Icon";

const TYPES = ["paper", "thesis", "report", "book", "article", "other"] as const;
const STATUSES = ["drafting", "editing", "review", "completed"] as const;

export function Writing() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [writing, setWriting] = useState<WritingProject[]>([]);
  const [nodes, setNodes] = useState<WritingNode[]>([]);
  const [projectName, setProjectName] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const seq = useRef(0);

  const confirmDelete = useConfirmDelete<WritingProject>(writingProjects.remove);

  function reload() {
    const id = ++seq.current;
    setLoading(true);
    setError(null);
    void Promise.all([writingProjects.list(), writingNodes.list(), projects.list()])
      .then(([wpRows, nodeRows, projectRows]) => {
        if (id !== seq.current) return;
        setWriting(wpRows);
        setNodes(nodeRows);
        setProjectName(Object.fromEntries(projectRows.map((p) => [p.id, p.name])));
        setLoading(false);
      })
      .catch((e) => {
        if (id !== seq.current) return;
        setError(e instanceof Error ? e.message : "Failed to load writing projects.");
        setLoading(false);
      });
  }

  useEffect(() => {
    const currentSeq = ++seq.current;
    reload();
    return () => {
      seq.current = currentSeq + 1;
    };
  }, []);

  return (
    <div>
      <Header
        title="Writing"
        subtitle="Papers, theses, reports, and articles"
        icon="writing"
        actions={
          <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
            <Icon name="plus" className="h-3.5 w-3.5" />
            New Writing Project
          </Button>
        }
      />
      <div className="px-6 pb-10 pt-6">
        {loading ? (
          <Spinner label="Loading writing projects…" />
        ) : error ? (
          <div className="rounded-xl border border-danger/25 bg-danger/10 p-6 text-sm text-danger">
            {error}
            <Button variant="danger" size="sm" onClick={reload} className="ml-3">
              Try again
            </Button>
          </div>
        ) : writing.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface shadow-xs">
            <EmptyState
              icon="writing"
              title="No writing projects yet."
              description="Research should become writing. Create a writing project to draft papers, theses, reports, or articles that reference your research."
              action={
                <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
                  <Icon name="plus" className="h-3.5 w-3.5" />
                  Create a writing project
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {writing.map((wp) => {
              const typeMeta = writingProjectType[wp.type] ?? writingProjectType.other;
              const statusMeta = writingProjectStatus[wp.status] ?? writingProjectStatus.drafting;
              const projectNodes = nodes.filter((node) => node.writingProjectId === wp.id);
              const words = projectNodes.reduce((sum, node) => sum + wordCount(node.content), 0);
              const done = projectNodes.filter((node) => node.status === "done").length;
              return (
                <a
                  key={wp.id}
                  href={writingProjectHref(wp.id)}
                  className="group flex flex-col rounded-xl border border-border bg-surface p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-strong hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{wp.title}</h3>
                    <Badge label={statusMeta.label} tone={statusMeta.tone} />
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Badge label={typeMeta.label} tone={typeMeta.tone} />
                  </div>
                  <p className="mt-2 flex-1 text-xs leading-relaxed text-muted">
                    {snippet(wp.summary || wp.outline, 120) || "No summary yet."}
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-xs text-muted">
                    <span className="flex items-center gap-1.5">
                      <Icon name="document" className="h-3.5 w-3.5 text-faint" />
                      {pluralize(projectNodes.length, "section")} · {words} words
                    </span>
                    <span className="tnum">{done}/{projectNodes.length} done</span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>

      {creating && (
        <WritingProjectModal
          projectName={projectName}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            reload();
          }}
          onCreateNode={(wp) => {
            if (wp) reload();
          }}
        />
      )}

      {confirmDelete.target && (
        <ConfirmDialog
          open
          title="Delete writing project"
          message={`Delete writing project “${confirmDelete.target.title}”? This removes all of its sections.`}
          saving={confirmDelete.saving}
          error={confirmDelete.error}
          onCancel={confirmDelete.close}
          onConfirm={confirmDelete.confirm}
        />
      )}
    </div>
  );
}

type WritingProjectValues = {
  projectId: string;
  title: string;
  type: (typeof TYPES)[number];
  status: (typeof STATUSES)[number];
  outline?: string;
  summary?: string;
};

function WritingProjectModal({
  projectName,
  onClose,
  onSaved,
  onCreateNode,
}: {
  projectName: Record<string, string>;
  onClose: () => void;
  onSaved: () => void;
  onCreateNode: (wp: WritingProject | null) => void;
}) {
  const [values, setValues] = useState<WritingProjectValues>({
    projectId: "",
    title: "",
    type: "paper",
    status: "drafting",
    outline: "",
    summary: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!values.projectId) {
      setError("Choose a research project for this writing project.");
      return;
    }
    if (!values.title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const wp = await writingProjects.create({
        projectId: values.projectId,
        title: values.title.trim(),
        type: values.type,
        status: values.status,
        outline: values.outline?.trim() || undefined,
        summary: values.summary?.trim() || undefined,
      });
      await writingNodes.create({
        projectId: wp.projectId,
        writingProjectId: wp.id,
        kind: "chapter",
        title: "Introduction",
        content: "",
        order: 0,
        status: "draft",
        researchRefs: {
          questionIds: [],
          sourceIds: [],
          evidenceIds: [],
          findingIds: [],
          insightIds: [],
          claimIds: [],
          gapIds: [],
          hypothesisIds: [],
          experimentIds: [],
        },
      });
      onCreateNode(wp);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create writing project.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormModal
      title="New Writing Project"
      onCancel={onClose}
      onSave={handleSave}
      saving={saving}
      error={error}
    >
      <Field label="Research project" htmlFor="wp-project" required>
        <Select id="wp-project" value={values.projectId} onChange={(event) => setValues({ ...values, projectId: event.target.value })}>
          <option value="">Select a research project</option>
          {Object.entries(projectName).map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Title" htmlFor="wp-title" required>
        <TextInput id="wp-title" value={values.title} onChange={(event) => setValues({ ...values, title: event.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Type" htmlFor="wp-type">
          <Select id="wp-type" value={values.type} onChange={(event) => setValues({ ...values, type: event.target.value as (typeof TYPES)[number] })}>
            {TYPES.map((type) => (
              <option key={type} value={type}>
                {writingProjectType[type].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status" htmlFor="wp-status">
          <Select id="wp-status" value={values.status} onChange={(event) => setValues({ ...values, status: event.target.value as (typeof STATUSES)[number] })}>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {writingProjectStatus[status].label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Summary" htmlFor="wp-summary">
        <TextArea id="wp-summary" value={values.summary ?? ""} onChange={(event) => setValues({ ...values, summary: event.target.value })} />
      </Field>
      <Field label="Outline" htmlFor="wp-outline" hint="Optional working outline shown to the reader.">
        <TextArea id="wp-outline" value={values.outline ?? ""} onChange={(event) => setValues({ ...values, outline: event.target.value })} />
      </Field>
    </FormModal>
  );
}