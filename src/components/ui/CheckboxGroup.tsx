export type CheckboxOption = { value: string; label: string };

export function CheckboxGroup({
  label,
  options,
  selected,
  onChange,
  emptyText = "No items available yet.",
}: {
  label: string;
  options: CheckboxOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  emptyText?: string;
}) {
  return (
    <div>
      <p className="mb-1 block text-sm font-medium text-foreground">{label}</p>
      {options.length === 0 ? (
        <p className="rounded-md border border-border bg-surface-muted px-3 py-2 text-xs text-muted">
          {emptyText}
        </p>
      ) : (
        <div className="max-h-44 overflow-y-auto rounded-md border border-strong">
          {options.map((option) => {
            const checked = selected.includes(option.value);
            return (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 border-b border-border px-3 py-1.5 text-sm text-foreground last:border-b-0 hover:bg-surface-hover"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) =>
                    onChange(
                      event.target.checked
                        ? [...selected, option.value]
                        : selected.filter((v) => v !== option.value),
                    )
                  }
                  className="h-4 w-4 rounded border-strong text-primary focus:ring-focus/40"
                />
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}