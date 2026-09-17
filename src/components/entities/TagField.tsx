import { useCollection } from "../../hooks/useCollection";
import { tags } from "../../lib/storage";
import { Field } from "../ui/Field";
import { TagPicker } from "../ui/TagPicker";

export function TagField({
  value,
  onChange,
  label = "Tags",
}: {
  value: string[];
  onChange: (tagIds: string[]) => void;
  label?: string;
}) {
  const { items: availableTags } = useCollection(tags);
  return (
    <Field label={label} hint="Optional. Manage tags in Settings → Tags.">
      <TagPicker
        tags={availableTags}
        selected={value ?? []}
        onChange={onChange}
        emptyText="No tags exist yet. Create them in Settings → Tags."
      />
    </Field>
  );
}