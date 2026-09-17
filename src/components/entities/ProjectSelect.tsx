import { projects } from "../../lib/storage";
import { useCollection } from "../../hooks/useCollection";
import { Select } from "../ui/Select";

export function ProjectSelect({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (projectId: string) => void;
  disabled?: boolean;
}) {
  const { items: projectItems, loading } = useCollection(
    projects,
  );

  return (
    <Select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled || loading}
    >
      <option value="">{loading ? "Loading projects…" : "Select a project"}</option>
      {projectItems.map((project) => (
        <option key={project.id} value={project.id}>
          {project.name}
        </option>
      ))}
    </Select>
  );
}