import { useRef, useState } from "react";
import type { CreateInput, Entity, UpdateInput } from "../lib/storage";

export function useFormSubmit<T extends Entity>(
  create: (input: CreateInput<T>) => Promise<T>,
  update: (id: string, input: UpdateInput<T>) => Promise<T>,
  validate?: (values: CreateInput<T>) => string | null,
) {
  const [draft, setDraft] = useState<
    { mode: "create" } | { mode: "edit"; record: T } | null
  >(null);
  const valuesRef = useRef<CreateInput<T> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    valuesRef.current = null;
    setError(null);
    setDraft({ mode: "create" });
  }

  function openEdit(record: T) {
    valuesRef.current = null;
    setError(null);
    setDraft({ mode: "edit", record });
  }

  function close() {
    setDraft(null);
  }

  async function handleSave() {
    const values = valuesRef.current;
    if (!values) return;
    const validationError = validate ? validate(values) : null;
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (draft?.mode === "edit") {
        await update(draft.record.id, values);
      } else {
        await create(values);
      }
      setDraft(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return {
    draft,
    openCreate,
    openEdit,
    close,
    setValues: (values: CreateInput<T>) => {
      valuesRef.current = values;
    },
    saving,
    error,
    handleSave,
  };
}