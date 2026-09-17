import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import type { ResearchProject } from "../types";
import { projects } from "../lib/storage";
import { projectStatus } from "../lib/meta";
import { formatDate } from "../lib/format";
import { tabHref } from "../lib/hrefs";
import type { TabKey } from "../lib/hrefs";
import { Header } from "../components/layout/Header";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { Badge } from "../components/ui/Badge";
import { Icon } from "../components/ui/Icon";
import { Tabs } from "../components/ui/Tabs";
import { ProjectFormModal } from "../components/entities/ProjectForm";
import { SourceSection } from "../components/entities/SourceEntity";
import { EvidenceSection } from "../components/entities/EvidenceEntity";
import { QuestionSection } from "../components/entities/QuestionEntity";
import { HypothesisSection } from "../components/entities/HypothesisEntity";
import { ExperimentSection } from "../components/entities/ExperimentEntity";
import { FindingSection } from "../components/entities/FindingEntity";
import { InsightSection } from "../components/entities/InsightEntity";
import { GapSection } from "../components/entities/GapEntity";
import { ClaimSection } from "../components/entities/ClaimEntity";
import { NoteSection } from "../components/entities/NoteEntity";
import { Overview } from "./ProjectOverview";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "sources", label: "Sources" },
  { key: "evidence", label: "Evidence" },
  { key: "questions", label: "Questions" },
  { key: "hypotheses", label: "Hypotheses" },
  { key: "experiments", label: "Experiments" },
  { key: "findings", label: "Findings" },
  { key: "insights", label: "Insights" },
  { key: "gaps", label: "Gaps" },
  { key: "claims", label: "Claims" },
  { key: "notes", label: "Notes" },
];

const DEFAULT_TAB: TabKey = "overview";

export function ProjectDetail() {
  const { projectId = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [project, setProject] = useState<ResearchProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const requestedTab = searchParams.get("tab");
  const tab: TabKey = TABS.some((t) => t.key === requestedTab)
    ? (requestedTab as TabKey)
    : DEFAULT_TAB;
  const focusId = searchParams.get("focus") ?? undefined;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    projects
      .getById(projectId)
      .then((record) => {
        if (!alive) return;
        setProject(record ?? null);
        setLoading(false);
        if (!record) setError("This project could not be found.");
      })
      .catch((e) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Failed to load project.");
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [projectId]);

  function selectTab(nextTab: TabKey) {
    if (nextTab === DEFAULT_TAB) {
      setSearchParams({});
    } else {
      setSearchParams({ tab: nextTab });
    }
  }

  if (loading) {
    return (
      <div className="pb-10">
        <Header title="Project" icon="projects" />
        <div className="px-6">
          <Spinner label="Loading project…" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="pb-10">
        <Header
          title="Project not found"
          icon="projects"
          breadcrumb={[{ label: "Projects", to: "/projects" }, { label: "Not found" }]}
        />
        <div className="px-6">
          <div className="flex flex-col items-center rounded-xl border border-border bg-surface px-6 py-14 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/15">
              <Icon name="error" className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-medium text-foreground">
              {error ?? "Project not found."}
            </p>
            <Link
              to="/projects"
              className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg border border-border-strong bg-surface px-3.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
            >
              <Icon name="arrow-left" className="h-4 w-4 text-muted" />
              Back to projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusMeta = projectStatus[project.status] ?? projectStatus.active;

  return (
    <div className="pb-10">
      <Header
        title={project.name}
        subtitle={project.topic ? `Topic: ${project.topic}` : undefined}
        icon="projects"
        breadcrumb={[{ label: "Projects", to: "/projects" }, { label: project.name }]}
        actions={
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            <Icon name="pencil" className="h-3.5 w-3.5" />
            Edit project
          </Button>
        }
        meta={
          <>
            <Badge label={statusMeta.label} tone={statusMeta.tone} dot />
            <span className="inline-flex items-center gap-1.5 text-xs text-muted">
              <Icon name="clock" className="h-3.5 w-3.5 text-faint" />
              Created {formatDate(project.createdAt)}
            </span>
            <span className="text-xs text-faint">·</span>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted">
              Updated {formatDate(project.updatedAt)}
            </span>
          </>
        }
      />

      <div className="sticky top-0 z-10 mt-5 border-b border-border bg-background/85 px-6 backdrop-blur">
        <Tabs
          items={TABS}
          value={tab}
          onChange={(key) => selectTab(key as TabKey)}
        />
      </div>

      <div className="px-6 pt-6">
        {tab === "overview" && (
          <Overview
            project={project}
            onEdit={() => setEditing(true)}
            tabHref={tabHref}
          />
        )}
        {tab === "sources" && <SourceSection projectId={project.id} focusId={focusId} />}
        {tab === "evidence" && <EvidenceSection projectId={project.id} focusId={focusId} />}
        {tab === "questions" && <QuestionSection projectId={project.id} focusId={focusId} />}
        {tab === "hypotheses" && (
          <HypothesisSection projectId={project.id} focusId={focusId} />
        )}
        {tab === "experiments" && (
          <ExperimentSection projectId={project.id} focusId={focusId} />
        )}
        {tab === "findings" && <FindingSection projectId={project.id} focusId={focusId} />}
        {tab === "insights" && <InsightSection projectId={project.id} focusId={focusId} />}
        {tab === "gaps" && <GapSection projectId={project.id} focusId={focusId} />}
        {tab === "claims" && <ClaimSection projectId={project.id} focusId={focusId} />}
        {tab === "notes" && <NoteSection projectId={project.id} focusId={focusId} />}
      </div>

      {editing && (
        <ProjectFormModal
          open
          initial={project}
          onClose={() => setEditing(false)}
          onSaved={() => setEditing(false)}
        />
      )}
    </div>
  );
}