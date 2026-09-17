import { useEffect, useState } from "react";
import type { ResearchProject } from "../../types";
import { projects } from "../../lib/storage";
import { projectStatus } from "../../lib/meta";
import { FormModal } from "../ui/FormModal";
import { Field, TextArea, TextInput } from "../ui/Field";
import { Select } from "../ui/Select";
import { TagField } from "./TagField";

const STATUSES = ["active", "planning", "paused", "completed", "archived"] as const;

export function ProjectFormModal({
  open,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean;
  initial?: ResearchProject | null;
  onClose: () => void;
  onSaved: (project: ResearchProject) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string>("active");
  const [topic, setTopic] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setDescription(initial?.description ?? "");
    setStatus(initial?.status ?? "active");
    setTopic(initial?.topic ?? "");
    setTagIds(initial?.tagIds ?? []);
    setError(null);
  }, [open, initial]);

  async function handleSave() {
    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        status: status as ResearchProject["status"],
        topic: topic.trim() || undefined,
        tagIds,
      };
      const saved = initial
        ? await projects.update(initial.id, payload)
        : await projects.create(payload);
      onSaved(saved);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save project.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormModal
      title={initial ? "Edit Project" : "Create Project"}
      onCancel={onClose}
      onSave={handleSave}
      saving={saving}
      error={error}
      saveLabel={initial ? "Save Changes" : "Create Project"}
    >
      <Field label="Project name" htmlFor="project-name" required>
        <TextInput
          id="project-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Renewable energy adoption"
          autoFocus
        />
      </Field>
      <Field label="Topic" htmlFor="project-topic">
        <TextInput
          id="project-topic"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          placeholder="e.g. Energy, Economics"
        />
      </Field>
      <Field label="Status" htmlFor="project-status">
        <Select
          id="project-status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {projectStatus[s].label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Description" htmlFor="project-description">
        <TextArea
          id="project-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What is this research about?"
        />
      </Field>
      <TagField value={tagIds} onChange={setTagIds} />
    </FormModal>
  );
}