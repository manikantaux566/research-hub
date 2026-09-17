import { useState } from "react";

export function useConfirmDelete<T extends { id: string }>(
  remove: (id: string) => Promise<void>,
) {
  const [target, setTarget] = useState<T | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function open(item: T) {
    setError(null);
    setTarget(item);
  }

  function close() {
    setTarget(null);
  }

  async function confirm() {
    if (!target) return;
    setSaving(true);
    setError(null);
    try {
      await remove(target.id);
      setTarget(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete.");
    } finally {
      setSaving(false);
    }
  }

  return { target, open, close, confirm, saving, error };
}