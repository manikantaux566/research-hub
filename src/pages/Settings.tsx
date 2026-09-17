import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ExportKind, ExportBundle } from "../lib/portable";
import {
  buildBundle,
  downloadBundle,
  downloadFile,
  entityCsvRows,
  toCsv,
  csvFileName,
  parseImport,
  validateBundle,
  applyImport,
  exportFilename,
  describeExportKind,
  researchAndWritingMarkdown,
  writingProjectMarkdown,
} from "../lib/portable";
import { loadGraph } from "../lib/graph";
import { runIntegrity } from "../lib/integrity";
import { useCollection } from "../hooks/useCollection";
import { projects, writingProjects } from "../lib/storage";
import { Header } from "../components/layout/Header";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/Modal";
import { Select } from "../components/ui/Select";
import { seedSampleData } from "../lib/seed";
import { clearAll } from "../lib/storage";
import { useAuth } from "../lib/auth/useAuth";
import { useTheme } from "../lib/theme/useTheme";
import type { ThemePreference } from "../lib/theme/theme";
import { formatDate } from "../lib/format";
import { Field, TextInput } from "../components/ui/Field";
import { PasswordInput } from "./auth/AuthShell";
import { Icon } from "../components/ui/Icon";
import type { IconName } from "../components/ui/Icon";

const isDev = import.meta.env.DEV;

type ParseOutcome = { bundle?: ExportBundle; error?: string };

export function Settings() {
  return (
    <div>
      <Header title="Settings" subtitle="Own your data: account, appearance, export, backup, import, and integrity" icon="settings" />
      <div className="mx-auto max-w-3xl space-y-6 px-6 pb-10 pt-6">
        <AccountSection />
        <AppearanceSection />
        <ExportSection />
        <ImportSection />
        <IntegritySection />
        {isDev && <DeveloperSection />}
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
      <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
          <Icon name={icon} className="h-3.5 w-3.5" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs leading-relaxed text-muted">{subtitle}</p>}
        </div>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function AccountSection() {
  const { status, signOut, changePassword, updateDisplayName } = useAuth();
  const navigate = useNavigate();
  const user = status.status === "authenticated" ? status.user : null;

  const [name, setName] = useState(user?.displayName ?? "");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMessage, setNameMessage] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const [pwOpen, setPwOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  if (!user) return null;

  async function handleSaveName() {
    setNameSaving(true);
    setNameMessage(null);
    setNameError(null);
    try {
      await updateDisplayName(name.trim() || null);
      setNameMessage("Display name updated.");
    } catch (e) {
      setNameError(e instanceof Error ? e.message : "Failed to update display name.");
    } finally {
      setNameSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!current) {
      setPwError("Please enter your current password.");
      return;
    }
    if (next.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setPwError("Passwords do not match.");
      return;
    }
    setPwSaving(true);
    setPwMessage(null);
    setPwError(null);
    try {
      await changePassword(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      setPwOpen(false);
      setPwMessage("Password changed.");
    } catch (e) {
      setPwError(e instanceof Error ? e.message : "Failed to change password.");
    } finally {
      setPwSaving(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <Section icon="user" title="Account" subtitle="Your session and sign-in details. Accounts live on the local authentication server; research data stays in this browser.">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Field label="Display name">
              <div className="flex gap-2">
                <TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
                <Button size="sm" onClick={handleSaveName} disabled={nameSaving}>
                  {nameSaving ? "Saving…" : "Save"}
                </Button>
              </div>
            </Field>
            {nameMessage && <p className="mt-1 text-xs text-success">{nameMessage}</p>}
            {nameError && <p className="mt-1 text-xs text-danger">{nameError}</p>}
          </div>
          <div>
            <p className="mb-1 block text-sm font-medium text-foreground">Email</p>
            <p className="rounded-md border border-strong bg-surface-muted px-3 py-2 text-sm text-foreground">
              {user.email}
            </p>
          </div>
        </div>

        <p className="text-xs text-muted">Member since {formatDate(user.createdAt)}.</p>

        <div className="space-y-3 border-t border-border pt-4">
          {!pwOpen ? (
            <Button variant="secondary" size="sm" onClick={() => setPwOpen(true)}>
              Change password
            </Button>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Current password">
                <PasswordInput value={current} onChange={(event) => setCurrent(event.target.value)} autoComplete="current-password" />
              </Field>
              <Field label="New password">
                <PasswordInput value={next} onChange={(event) => setNext(event.target.value)} autoComplete="new-password" />
              </Field>
              <Field label="Confirm new password">
                <PasswordInput value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="new-password" />
              </Field>
              <div className="flex items-end gap-2">
                <Button size="sm" onClick={handleChangePassword} disabled={pwSaving}>
                  {pwSaving ? "Changing…" : "Update password"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setPwOpen(false); setPwError(null); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
          {pwMessage && <p className="text-xs text-success">{pwMessage}</p>}
          {pwError && <p className="text-xs text-danger">{pwError}</p>}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <div>
            <p className="text-sm text-foreground">Sign out</p>
            <p className="text-xs text-muted">
              Your local research remains on this device.
            </p>
          </div>
          <Button variant="danger" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </div>
    </Section>
  );
}

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const options: { value: ThemePreference; label: string; description: string }[] = [
    { value: "light", label: "Light", description: "Always use light surfaces." },
    { value: "dark", label: "Dark", description: "Always use dark surfaces." },
    { value: "system", label: "System", description: "Follow your operating system preference." },
  ];

  return (
    <Section icon="monitor" title="Appearance" subtitle="Theme choice is saved on this device and never affects your research data.">
      <div role="radiogroup" aria-label="Theme" className="grid gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const active = theme === option.value;
          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                active
                  ? "border-primary/50 bg-primary/5 text-foreground ring-1 ring-inset ring-primary/30"
                  : "border-border bg-surface text-foreground hover:bg-surface-hover"
              }`}
            >
              <input
                type="radio"
                name="theme"
                value={option.value}
                checked={active}
                onChange={() => setTheme(option.value)}
                className={`mt-0.5 h-4 w-4 accent-[var(--color-primary)]`}
              />
              <span>
                <span className="block text-sm font-medium">{option.label}</span>
                <span className="block text-xs text-muted">{option.description}</span>
              </span>
            </label>
          );
        })}
      </div>
    </Section>
  );
}

function ExportSection() {
  const projectsColl = useCollection(projects);
  const writingColl = useCollection(writingProjects);
  const [kind, setKind] = useState<ExportKind>("full");
  const [projectId, setProjectId] = useState("");
  const [writingId, setWritingId] = useState("");
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const projectOptions = projectsColl.items;
  const writingOptions = writingColl.items.filter((wp) => !projectId || wp.projectId === projectId);

  async function handleExport() {
    setWorking(true);
    setMessage(null);
    try {
      const graph = await loadGraph();
      if (kind === "full" || kind === "backup") {
        const bundle = buildBundle(graph, kind);
        downloadBundle(bundle);
        setMessage(`Exported ${describeExportKind(kind)}`);
      } else if (kind === "project") {
        const bundle = buildBundle(graph, "project", projectId);
        const name = graph.projects.find((p) => p.id === projectId)?.name;
        downloadFile(exportFilename("project", name), JSON.stringify(bundle, null, 2), "application/json");
        setMessage(`Exported project “${name ?? projectId}”.`);
      } else {
        const bundle = buildBundle(graph, "writing", writingId);
        const title = graph.writingProjects.find((wp) => wp.id === writingId)?.title;
        downloadFile(exportFilename("writing", title), JSON.stringify(bundle, null, 2), "application/json");
        setMessage(`Exported writing project “${title ?? writingId}”.`);
      }
    } catch (e) {
      setMessage(`Export failed: ${e instanceof Error ? e.message : "unknown error"}`);
    } finally {
      setWorking(false);
    }
  }

  async function handleMarkdown() {
    setWorking(true);
    setMessage(null);
    try {
      const graph = await loadGraph();
      const project = graph.projects.find((p) => p.id === projectId);
      if (!project) {
        setMessage("Select a project first.");
        return;
      }
      const content =
        kind === "writing" && writingId
          ? writingProjectMarkdown(graph, writingId)
          : researchAndWritingMarkdown(graph, project.id);
      const slug = project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const filename = kind === "writing" && writingId
        ? graph.writingProjects.find((wp) => wp.id === writingId)?.title ?? "writing"
        : slug;
      downloadFile(`research-hub-${filename.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-markdown.md`, content, "text/markdown");
      setMessage("Markdown exported.");
    } catch (e) {
      setMessage(`Export failed: ${e instanceof Error ? e.message : "unknown error"}`);
    } finally {
      setWorking(false);
    }
  }

  async function handleCsv() {
    setWorking(true);
    setMessage(null);
    try {
      const graph = await loadGraph();
      const table = kind === "project" ? "projects" : kind === "writing" ? "writingNodes" : "projects";
      void table;
      const rows = entityCsvRows(graph, selectedCsvKind());
      downloadFile(csvFileName(selectedCsvKind()), toCsv(rows), "text/csv");
      setMessage(`CSV export for ${selectedCsvKind()} created.`);
    } catch (e) {
      setMessage(`Export failed: ${e instanceof Error ? e.message : "unknown error"}`);
    } finally {
      setWorking(false);
    }
  }

  function selectedCsvKind(): string {
    const preferred: Record<ExportKind, string> = {
      full: "projects",
      backup: "projects",
      project: "projects",
      writing: "writingNodes",
    };
    return preferred[kind];
  }

  return (
    <Section icon="download" title="Export & Backup" subtitle="JSON is the authoritative, lossless format. Markdown and CSV are convenient views.">
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-40 flex-1">
            <label className="mb-1 block text-xs font-medium text-muted">What to export</label>
            <Select value={kind} onChange={(event) => setKind(event.target.value as ExportKind)}>
              <option value="full">Full export (everything)</option>
              <option value="backup">Full backup</option>
              <option value="project">Single project</option>
              <option value="writing">Writing project</option>
            </Select>
          </div>
          {kind === "project" && (
            <div className="min-w-40 flex-1">
              <label className="mb-1 block text-xs font-medium text-muted">Project</label>
              <Select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
                <option value="">Select a project</option>
                {projectOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
          {kind === "writing" && (
            <div className="min-w-40 flex-1">
              <label className="mb-1 block text-xs font-medium text-muted">Writing project</label>
              <Select value={writingId} onChange={(event) => setWritingId(event.target.value)}>
                <option value="">Select a writing project</option>
                {writingOptions.map((wp) => (
                  <option key={wp.id} value={wp.id}>
                    {wp.title}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>
        <p className="text-xs text-muted">{describeExportKind(kind)}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" onClick={handleExport} disabled={working || needsSelection()}>
            {working ? "Exporting…" : "Export JSON"}
          </Button>
          <Button variant="secondary" size="sm" onClick={handleMarkdown} disabled={working || kind === "full" || kind === "backup"}>
            Export Markdown
          </Button>
          <Button variant="secondary" size="sm" onClick={handleCsv} disabled={working}>
            Export CSV
          </Button>
        </div>
        {message && <p className="text-sm text-muted">{message}</p>}
      </div>
    </Section>
  );

  function needsSelection() {
    if (kind === "project") return !projectId;
    if (kind === "writing") return !writingId;
    return false;
  }
}

function ImportSection() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParseOutcome | null>(null);
  const [report, setReport] = useState<ReturnType<typeof validateBundle> | null>(null);
  const [strategy, setStrategy] = useState<"append" | "replace-all">("append");
  const [working, setWorking] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setError(null);
    const text = await file.text();
    const result = parseImport(text);
    setParsed(result);
    if (result.error) {
      setReport(null);
      setError(result.error);
      return;
    }
    const validation = validateBundle(result.bundle);
    setReport(validation);
    if (!validation.valid) {
      setError(validation.errors[0]?.message ?? "Import file failed validation.");
    } else {
      setError(null);
    }
  }

  async function handleImport() {
    if (!parsed?.bundle) return;
    if (strategy === "replace-all") {
      setConfirmReplace(true);
      return;
    }
    await doImport();
  }

  async function doImport() {
    if (!parsed?.bundle) return;
    setWorking(true);
    setError(null);
    try {
      const outcome = await applyImport(parsed.bundle, strategy);
      setResult(
        `Imported ${outcome.total} records (${
          strategy === "append" ? "added as a new copy with fresh IDs" : "replaced all data"
        }).`,
      );
      setParsed(null);
      setReport(null);
      setFileName(null);
      if (fileInput.current) fileInput.current.value = "";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setWorking(false);
    }
  }

  const stats = report?.stats ?? {};
  const warnings = report?.warnings ?? [];

  return (
    <Section icon="upload" title="Import" subtitle="Bring data back in. A backup from this or another browser is validated before anything is written.">
      <div className="space-y-4">
        <div>
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-border-strong bg-surface-muted/50 px-4 py-4">
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              onChange={handleFile}
              className="block w-full text-sm text-muted file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-fg hover:file:bg-primary-hover"
            />
            {fileName && <p className="text-xs text-muted">Selected: {fileName}</p>}
          </div>
        </div>

        {report && (
          <div className="rounded-lg border border-border bg-surface-muted p-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <p>
                <span className="font-medium text-foreground">{report.total}</span>{" "}
                <span className="text-muted">records</span>
              </p>
              <p>
                <span className={`font-medium ${report.valid ? "text-success" : "text-danger"}`}>
                  {report.valid ? "Valid" : "Invalid"}
                </span>
              </p>
              <p className="text-muted">
                {report.errors.length} error(s) · {warnings.length} warning(s)
              </p>
            </div>
            {Object.keys(stats).length > 0 && (
              <ul className="mt-2 grid grid-cols-3 gap-1 text-xs text-muted sm:grid-cols-4">
                {Object.entries(stats).map(([key, count]) => (
                  <li key={key}>
                    <span className="font-medium">{count}</span> {key.replace(/s$/, "")}
                  </li>
                ))}
              </ul>
            )}
            {report.errors.length > 0 && (
              <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-xs text-danger">
                {report.errors.map((err, index) => (
                  <li key={index}>• {err.message}</li>
                ))}
              </ul>
            )}
            {warnings.length > 0 && (
              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-warning">
                {warnings.map((warn, index) => (
                  <li key={index}>• {warn.message}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {report?.valid && (
          <div className="space-y-3">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-medium text-muted">Import strategy</p>
              <div className="mt-2 space-y-2">
                <label className="flex items-start gap-2 text-sm text-foreground">
                  <input
                    type="radio"
                    name="strategy"
                    checked={strategy === "append"}
                    onChange={() => setStrategy("append")}
                    className="mt-0.5 h-3.5 w-3.5 accent-[var(--color-primary)]"
                  />
                  <span>
                    <span className="font-medium">Import as new copy (recommended)</span>
                    <span className="block text-xs text-muted">
                      Regenerates every ID and rewrites all references, so nothing in your current data is
                      touched or overwritten.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-2 text-sm text-foreground">
                  <input
                    type="radio"
                    name="strategy"
                    checked={strategy === "replace-all"}
                    onChange={() => setStrategy("replace-all")}
                    className="mt-0.5 h-3.5 w-3.5 accent-[var(--color-primary)]"
                  />
                  <span>
                    <span className="font-medium">Replace all data</span>
                    <span className="block text-xs text-muted">
                      Wipes current data first (a snapshot is kept for rollback if the write fails), then
                      loads this file.
                    </span>
                  </span>
                </label>
              </div>
            </div>
            <Button variant="primary" size="sm" onClick={handleImport} disabled={working}>
              {working ? "Importing…" : strategy === "replace-all" ? "Review replace…" : "Import"}
            </Button>
          </div>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}
        {result && <p className="text-sm text-success">{result}</p>}
      </div>

      {confirmReplace && (
        <ConfirmDialog
          open
          title="Replace all data?"
          message="This replaces everything currently in Research Hub with the contents of the imported file. A snapshot is kept only for rollback if the write itself fails. Consider a full backup first."
          confirmLabel="Replace everything"
          saving={working}
          error={error}
          onCancel={() => {
            setConfirmReplace(false);
          }}
          onConfirm={async () => {
            setConfirmReplace(false);
            await doImport();
          }}
        />
      )}
    </Section>
  );
}

function IntegritySection() {
  const [report, setReport] = useState<ReturnType<typeof runIntegrity> | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    setRunning(true);
    setError(null);
    try {
      const graph = await loadGraph();
      setReport(runIntegrity(graph));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run integrity check.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <Section icon="shield" title="Data integrity" subtitle="Automated checks only detect broken references and malformed records — they never decide scientific truth.">
      <div className="space-y-3">
        <Button variant="secondary" size="sm" onClick={handleRun} disabled={running}>
          {running ? "Checking…" : report ? "Re-run integrity check" : "Run integrity check"}
        </Button>
        {error && <p className="text-sm text-danger">{error}</p>}
        {report && (
          <div className="rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className={`flex items-center gap-1.5 font-medium ${report.healthy ? "text-success" : "text-danger"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${report.healthy ? "bg-success" : "bg-danger"}`} />
                {report.healthy ? "Healthy" : "Problems found"}
              </span>
              <span className="text-muted">{report.checks.length} checks</span>
              <span className="text-success">{report.checks.filter((c) => c.status === "ok").length} ok</span>
              <span className="text-warning">{report.warnings} warnings</span>
              <span className="text-danger">{report.errors} errors</span>
            </div>
            {!report.healthy && (
              <ul className="mt-3 space-y-1 text-xs text-muted">
                {report.checks
                  .filter((c) => c.status !== "ok")
                  .map((c) => (
                    <li key={c.key} className="flex items-start gap-1.5">
                      <span className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${c.status === "error" ? "bg-danger" : "bg-warning"}`} />
                      <span>
                        <span className="font-medium text-foreground">{c.label}</span>
                        {c.detail ? ` — ${c.detail}` : ""}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Section>
  );
}

function DeveloperSection() {
  const [seedState, setSeedState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [seedError, setSeedError] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  async function handleSeed() {
    setSeedState("working");
    setSeedError(null);
    try {
      await seedSampleData();
      setSeedState("done");
    } catch (e) {
      setSeedState("error");
      setSeedError(e instanceof Error ? e.message : "Failed to load sample data.");
    }
  }

  async function handleReset() {
    setResetting(true);
    setResetError(null);
    try {
      clearAll();
      setResetOpen(false);
    } catch (e) {
      setResetError(e instanceof Error ? e.message : "Failed to clear data.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <Section icon="flask" title="Developer tools" subtitle="Development build only. Never runs automatically.">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-foreground">Load sample data</p>
            <p className="text-xs text-muted">Creates one clearly-labeled demo project so every section can be exercised.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleSeed} disabled={seedState === "working"}>
            {seedState === "working" ? "Loading…" : "Load sample data"}
          </Button>
        </div>
        {seedState === "done" && <p className="text-sm text-success">Sample data loaded.</p>}
        {seedState === "error" && <p className="text-sm text-danger">{seedError}</p>}

        <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
          <div>
            <p className="text-sm text-foreground">Remove all data</p>
            <p className="text-xs text-muted">Deletes every record stored by Research Hub in this browser.</p>
          </div>
          <Button variant="danger" size="sm" onClick={() => setResetOpen(true)} disabled={resetting}>
            Remove all data
          </Button>
        </div>
        {resetError && <p className="text-sm text-danger">{resetError}</p>}
      </div>

      {resetOpen && (
        <ConfirmDialog
          open
          title="Remove all data"
          message="This permanently deletes all projects, sources, evidence, questions, findings, insights, gaps, claims, notes, tags, and writing stored in this browser. This cannot be undone."
          confirmLabel="Remove everything"
          saving={resetting}
          error={resetError}
          onCancel={() => setResetOpen(false)}
          onConfirm={handleReset}
        />
      )}
    </Section>
  );
}