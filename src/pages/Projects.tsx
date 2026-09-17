import type { ResearchProject } from "../types";
import { useState } from "react";
import { projects } from "../lib/storage";
import { projectStatus } from "../lib/meta";
import { relativeTime } from "../lib/format";
import { useCollection } from "../hooks/useCollection";
import { useConfirmDelete } from "../hooks/useConfirmDelete";
import { Header } from "../components/layout/Header";
import { Section } from "../components/entities/Section";
import { ProjectFormModal } from "../components/entities/ProjectForm";
import { ConfirmDialog } from "../components/ui/Modal";
import { ItemList } from "../components/ui/ItemList";
import type { ItemRow } from "../components/ui/ItemList";
import { projectHref } from "../lib/hrefs";

export function Projects() {
  const collection = useCollection(projects);
  const [draft, setDraft] = useState<{
    mode: "create";
  } | {
    mode: "edit";
    record: ResearchProject;
  } | null>(null);
  const confirmDelete = useConfirmDelete<ResearchProject>(collection.remove);

  const rows: ItemRow[] = collection.items.map((project) => {
    const meta = projectStatus[project.status] ?? projectStatus.active;
    return {
      id: project.id,
      title: project.name,
      subtitle: [
        meta.label,
        project.topic ? `Topic: ${project.topic}` : "",
        `Updated ${relativeTime(project.updatedAt)}`,
      ]
        .filter(Boolean)
        .join(" · "),
      href: projectHref(project.id),
      badges: [
        { label: meta.label, tone: meta.tone, title: "Status" },
      ],
      actions: [
        { label: "Edit", onClick: () => setDraft({ mode: "edit", record: project }) },
        { label: "Delete", danger: true, onClick: () => confirmDelete.open(project) },
      ],
    };
  });

  return (
    <div>
      <Header
        title="Projects"
        subtitle="Every line of inquiry you're tracking, with its status and recency."
        icon="projects"
      />
      <div className="px-6 pb-10">
        <Section
          title="All projects"
          icon="projects"
          count={collection.items.length}
          addLabel="New project"
          onAdd={() => setDraft({ mode: "create" })}
          loading={collection.loading}
          error={collection.error}
          onRetry={collection.refresh}
          emptyTitle="No research projects yet."
          emptyDescription="Create a project to organize your sources, questions, findings, and writing."
          isEmpty={collection.items.length === 0}
        >
          <ItemList items={rows} />
        </Section>
      </div>

      {draft && (
        <ProjectFormModal
          open
          initial={draft.mode === "edit" ? draft.record : null}
          onClose={() => setDraft(null)}
          onSaved={() => setDraft(null)}
        />
      )}

      {confirmDelete.target && (
        <ConfirmDialog
          open
          title="Delete Project"
          message={`Delete project “${confirmDelete.target.name}”? All related sources, evidence, and other data will remain in storage and become orphaned.`}
          saving={confirmDelete.saving}
          error={confirmDelete.error}
          onCancel={confirmDelete.close}
          onConfirm={confirmDelete.confirm}
        />
      )}
    </div>
  );
}