import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import type { WritingNode, WritingProject, ResearchRefs } from "../../types";
import { writingProjects, writingNodes, questions, sources, evidence, findings, insights, claims, gaps, hypotheses, experiments } from "../../lib/storage";
import type { Entity } from "../../lib/storage";
import { writingNodeStatus, writingNodeKindMeta } from "../../lib/meta";
import { projectHref } from "../../lib/hrefs";
import { Spinner } from "../ui/Spinner";
import { Select } from "../ui/Select";
import { Header } from "../layout/Header";

const KINDS = ["part", "chapter", "section", "subsection", "node"] as const;
const STATUS_LIST = ["draft", "in-progress", "review", "done"] as const;

function TreeSkeleton() {
  return <Spinner label="Loading writing project…" />;
}

export function WritingDetail() {
  const { id = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [wp, setWp] = useState<WritingProject | null>(null);
  const [allNodes, setAllNodes] = useState<WritingNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  const seq = useRef(0);

  const reload = useCallback(() => {
    const s = ++seq.current;
    setLoading(true);
    setError(null);
    void Promise.all([writingProjects.getById(id), writingNodes.list()])
      .then(([wpResult, nodeRows]) => {
        if (s !== seq.current) return;
        setWp(wpResult ?? null);
        setAllNodes(nodeRows.filter((n) => n.writingProjectId === id));
        setLoading(false);
        if (!wpResult) setError("Writing project not found.");
      })
      .catch((e) => {
        if (s !== seq.current) return;
        setError(e instanceof Error ? e.message : "Failed to load writing project.");
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    const currentSeq = ++seq.current;
    reload();
    return () => { seq.current = currentSeq + 1; };
  }, [reload]);

  const selectedNode = allNodes.find((n) => n.id === selectedId);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    const focusParam = searchParams.get("node");
    if (focusParam) {
      setSelectedId(focusParam);
      hasInitializedRef.current = true;
    } else if (allNodes.length > 0) {
      setSelectedId(allNodes[0].id);
      hasInitializedRef.current = true;
    }
  }, [allNodes, searchParams]);

  function children(parentId?: string) {
    return allNodes
      .filter((n) => n.parentId === parentId)
      .sort((a, b) => a.order - b.order);
  }

  async function addChild(parentId?: string, kind: (typeof KINDS)[number] = "section") {
    const order = allNodes.filter((n) => n.parentId === (parentId ?? null)).length;
    const created = await writingNodes.create({
      projectId: wp!.projectId,
      writingProjectId: wp!.id,
      parentId,
      kind,
      title: "Untitled",
      content: "",
      order,
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
    reload();
    setSelectedId(created.id);
  }

  async function removeNode(nodeId: string) {
    const node = allNodes.find((n) => n.id === nodeId);
    if (!node) return;
    await writingNodes.remove(nodeId);
    if (node.parentId) {
      const siblings = allNodes.filter((n) => n.parentId === node.parentId && n.id !== nodeId);
      setSelectedId(siblings[0]?.id ?? node.parentId);
    } else {
      const siblings = allNodes.filter((n) => n.parentId === undefined && n.id !== nodeId);
      setSelectedId(siblings[0]?.id);
    }
    reload();
  }

  if (loading) return <div><Header title="Writing" /><div className="p-6"><TreeSkeleton /></div></div>;
  if (error || !wp) return (
    <div>
      <Header title="Writing" />
      <div className="p-6">
        <div className="rounded-lg border border-border bg-surface p-6 text-center">
          <p className="text-sm text-red-600">{error ?? "Writing project not found."}</p>
          <Link to="/writing" className="mt-3 inline-block text-sm font-medium text-link hover:text-link">
            ← Back to writing
          </Link>
        </div>
      </div>
    </div>
  );

  const treeRoots = children();

  return (
    <div>
      <Header
        title={wp.title}
        subtitle={`${wp.type} · ${wp.status}`}
        actions={
          <div className="flex items-center gap-2">
            <a
              href={projectHref(wp.projectId)}
              className="inline-flex items-center justify-center rounded-md border border-strong bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-hover"
            >
              Open project
            </a>
          </div>
        }
      />
      <div className="grid min-h-0 flex-1 grid-cols-[220px_1fr_320px] border-t border-border">
        {/* Outline panel */}
        <div className="overflow-y-auto border-r border-border bg-surface-muted py-3">
          <div className="mb-2 flex items-center justify-between px-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted">Outline</h3>
            <button
              type="button"
              onClick={() => addChild()}
              className="rounded p-1 text-faint hover:bg-surface-hover hover:text-link"
              title="Add top-level section"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>
          <ul className="space-y-px">
            {renderTreeItems(treeRoots, 0, selectedId, (nodeId) => {
              setSelectedId(nodeId);
              setSearchParams({ node: nodeId });
            })}
          </ul>
        </div>

        {/* Editor panel */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-surface">
          {selectedNode ? (
            <NodeEditor
              node={selectedNode}
              onSaved={reload}
              onRemove={() => selectedNode && removeNode(selectedNode.id)}
              addChild={addChild}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted">
              Select a section from the outline to edit.
            </div>
          )}
        </div>

        {/* References panel */}
        <div className="overflow-y-auto border-l border-border bg-surface-muted p-4">
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
            References
          </h3>
          {selectedNode ? (
            <ReferencesPanel
              node={selectedNode}
              onUpdate={(refs) => writingNodes.update(selectedNode.id, { researchRefs: refs }).then(reload)}
            />
          ) : (
            <p className="text-xs text-muted">Select a section to view its references.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function renderTreeItems(
  nodes: WritingNode[],
  level: number,
  selectedId: string | undefined,
  onSelect: (id: string) => void,
): React.ReactNode[] {
  return nodes.map((node) => {
    const isSelected = node.id === selectedId;
    return (
      <li key={node.id}>
        <button
          type="button"
          onClick={() => onSelect(node.id)}
          className={`flex w-full items-center gap-1 rounded px-2 py-1 text-left text-xs transition-colors ${isSelected ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-surface-hover"}`}
          style={{ paddingLeft: `${12 + level * 12}px` }}
        >
          <span className="flex-1 truncate">{node.title}</span>
          <span className={`shrink-0 rounded-full px-1 py-px text-[10px] ${writingNodeStatus[node.status]?.tone === "green" ? "bg-emerald-50 text-emerald-700" : writingNodeStatus[node.status]?.tone === "amber" ? "bg-amber-50 text-amber-800" : "bg-surface-muted text-muted"}`}>
            {writingNodeStatus[node.status]?.label ?? node.status}
          </span>
        </button>
      </li>
    );
  });
}

function NodeEditor({
  node,
  onSaved,
  onRemove,
  addChild,
}: {
  node: WritingNode;
  onSaved: () => void;
  onRemove: () => void;
  addChild: (parentId?: string, kind?: (typeof KINDS)[number]) => Promise<void>;
}) {
  const [values, setValues] = useState(() => ({
    title: node.title,
    status: node.status as WritingNode["status"],
    kind: node.kind,
  }));
  const [saving, setSaving] = useState(false);
  const dirtyRef = useRef(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevNodeIdRef = useRef(node.id);

  useEffect(() => {
    if (prevNodeIdRef.current !== node.id) {
      prevNodeIdRef.current = node.id;
      setValues({ title: node.title, status: node.status, kind: node.kind });
      dirtyRef.current = false;
    }
  }, [node.id, node.title, node.status, node.kind]);

  const scheduleSave = useCallback(
    (patch: Partial<Pick<WritingNode, "title" | "content" | "status" | "kind">>) => {
      dirtyRef.current = true;
      setValues((prev) => ({ ...prev, ...patch, ...(patch.title !== undefined ? { title: patch.title || prev.title } : {}) }));
      if (debounce.current) clearTimeout(debounce.current);
      debounce.current = setTimeout(async () => {
        setSaving(true);
        try {
          await writingNodes.update(node.id, { ...patch });
          onSaved();
        } finally {
          setSaving(false);
        }
      }, 800);
    },
    [node.id, onSaved],
  );

  const contentRef = useRef<HTMLDivElement>(null);

  function onContentBlur() {
    const html = contentRef.current?.innerHTML ?? "";
    scheduleSave({ content: html });
  }

  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <input
          type="text"
          value={values.title}
          onChange={(event) => scheduleSave({ title: event.target.value })}
          className="flex-1 rounded-md border border-strong px-2 py-1.5 text-sm font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="Section title"
        />
        <div className="flex items-center gap-2">
          {saving && (
            <span className="flex items-center gap-1 text-[11px] text-muted">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-strong border-t-primary" />
              Saving…
            </span>
          )}
          <Select
            value={values.status}
            onChange={async (event) => {
              const val = event.target.value as WritingNode["status"];
              setValues((prev) => ({ ...prev, status: val }));
              dirtyRef.current = true;
              if (debounce.current) clearTimeout(debounce.current);
              await writingNodes.update(node.id, { status: val });
              onSaved();
            }}
          >
            {STATUS_LIST.map((status) => (
              <option key={status} value={status}>
                {writingNodeStatus[status]?.label ?? status}
              </option>
            ))}
          </Select>
          <Select
            value={values.kind}
            onChange={async (event) => {
              const val = event.target.value as WritingNode["kind"];
              setValues((prev) => ({ ...prev, kind: val }));
              dirtyRef.current = true;
              await writingNodes.update(node.id, { kind: val });
              onSaved();
            }}
          >
            {KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {writingNodeKindMeta[kind]?.label ?? kind}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div
        ref={contentRef}
        contentEditable
        suppressContentEditableWarning
        dangerouslySetInnerHTML={{ __html: node.content }}
        onBlur={onContentBlur}
        className="writing-content max-w-none rounded-md border border-border p-4 text-foreground outline-none focus:ring-2 focus:ring-primary/30"
        style={{ minHeight: 200 }}
      />
      <div className="flex items-center justify-between text-xs text-muted">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => addChild(node.id, "section")}
            className="rounded border border-dashed border-strong px-2 py-1 text-muted hover:border-primary hover:text-primary"
          >
            + Add child section
          </button>
          <button
            type="button"
            onClick={() => addChild(node.parentId, node.kind)}
            className="rounded border border-dashed border-strong px-2 py-1 text-muted hover:border-primary hover:text-primary"
          >
            + Add sibling section
          </button>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded px-2 py-1 text-red-600 hover:bg-red-50"
        >
          Delete section
        </button>
      </div>
    </div>
  );
}

function ReferencesPanel({
  node,
  onUpdate,
}: {
  node: WritingNode;
  onUpdate: (refs: ResearchRefs) => Promise<void>;
}) {
  const refs = node.researchRefs;

  function toggle(key: keyof ResearchRefs, id: string) {
    const current = refs[key] as string[];
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    onUpdate({ ...refs, [key]: next });
  }

  const totalRefs =
    Object.values(refs).reduce((sum, arr) => sum + (arr as string[]).length, 0);

  const sections: Array<{
    key: keyof ResearchRefs;
    label: string;
    repo: KeyedRepo;
    display: (r: Entity) => string;
  }> = [
    { key: "questionIds", label: "Questions", repo: questions, display: (r) => (r as { title?: string }).title ?? "" },
    { key: "sourceIds", label: "Sources", repo: sources, display: (r) => (r as { title?: string }).title ?? "" },
    { key: "evidenceIds", label: "Evidence", repo: evidence, display: (r) => (r as { title?: string }).title ?? "" },
    { key: "findingIds", label: "Findings", repo: findings, display: (r) => (r as { title?: string }).title ?? "" },
    { key: "insightIds", label: "Insights", repo: insights, display: (r) => (r as { title?: string }).title ?? "" },
    { key: "claimIds", label: "Claims", repo: claims, display: (r) => (r as { claim?: string }).claim ?? "" },
    { key: "gapIds", label: "Gaps", repo: gaps, display: (r) => (r as { title?: string }).title ?? "" },
    { key: "hypothesisIds", label: "Hypotheses", repo: hypotheses, display: (r) => (r as { statement?: string }).statement ?? "" },
    { key: "experimentIds", label: "Experiments", repo: experiments, display: (r) => (r as { title?: string }).title ?? "" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-muted">{totalRefs} total reference(s)</p>
      {sections.map(({ key, label, repo, display }) => (
        <KeyedReferenceList
          key={key}
          label={label}
          ids={refs[key]}
          repo={repo}
          renderTitle={display}
          onToggle={(id) => toggle(key, id)}
        />
      ))}
    </div>
  );
}

type KeyedRepo = {
  list: () => Promise<Entity[]>;
};

function KeyedReferenceList({
  label,
  ids,
  repo,
  renderTitle,
  onToggle,
}: {
  label: string;
  ids: string[];
  repo: KeyedRepo;
  renderTitle: (r: Entity) => string;
  onToggle: (id: string) => void;
}) {
  const [items, setItems] = useState<Entity[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    void repo.list().then((rows) => {
      if (alive) {
        setItems(rows);
        setLoaded(true);
      }
    });
    return () => {
      alive = false;
    };
  }, [repo]);

  if (!loaded) return null;

  return (
    <div className="rounded-md border border-border bg-surface">
      <div className="border-b border-border px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          {label} ({ids.length})
        </p>
      </div>
      <div className="max-h-40 overflow-y-auto px-3 py-1">
        {items.length === 0 ? (
          <p className="py-2 text-xs text-muted">No items available.</p>
        ) : (
          items.map((item) => {
            const selected = ids.includes(item.id);
            return (
              <label
                key={item.id}
                className="flex cursor-pointer items-center gap-2 py-1 text-xs text-foreground"
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => onToggle(item.id)}
                  className="h-3 w-3 rounded border-strong text-link focus:ring-primary"
                />
                <span className="truncate">{renderTitle(item) || item.id}</span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}