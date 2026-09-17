import { useTheme } from "../../lib/theme/useTheme";
import type { ThemePreference } from "../../lib/theme/theme";
import { Icon } from "../ui/Icon";
import type { IconName } from "../ui/Icon";

const OPTIONS: { value: ThemePreference; label: string; icon: IconName }[] = [
  { value: "light", label: "Light", icon: "sun" },
  { value: "dark", label: "Dark", icon: "moon" },
  { value: "system", label: "System", icon: "monitor" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div
      role="group"
      aria-label="Theme"
      data-theme-toggle
      className="flex items-center gap-0.5 rounded-lg border border-border bg-surface-muted p-0.5"
    >
      {OPTIONS.map((option) => {
        const active = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            data-theme-toggle={option.value}
            aria-pressed={active}
            title={`${option.label} theme`}
            onClick={() => setTheme(option.value)}
            className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
              active
                ? "bg-surface text-foreground shadow-xs ring-1 ring-inset ring-border"
                : "text-faint hover:text-foreground"
            }`}
          >
            <Icon name={option.icon} className="h-3.5 w-3.5" />
            <span className="sr-only">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
