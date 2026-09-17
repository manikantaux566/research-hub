import type { ReactNode } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";

export function FormModal({
  title,
  onCancel,
  onSave,
  saving,
  error,
  saveLabel = "Save",
  children,
  wide,
}: {
  title: string;
  onCancel: () => void;
  onSave: () => void;
  saving?: boolean;
  error?: string | null;
  saveLabel?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <Modal
      open
      title={title}
      onClose={onCancel}
      wide={wide}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={onSave} disabled={saving}>
            {saving ? "Saving…" : saveLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {children}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}