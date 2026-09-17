export type ThemePreference = "light" | "dark" | "system";

const PREFIX = "research-hub:ux:";
const KEY = `${PREFIX}theme`;

export function readThemePreference(): ThemePreference {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
  } catch {
    // Ignore; storage may be unavailable.
  }
  return "system";
}

export function writeThemePreference(preference: ThemePreference): void {
  try {
    window.localStorage.setItem(KEY, preference);
  } catch {
    // UX-only preference; never fatal.
  }
}

export function systemPrefersDark(): boolean {
  return typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
    : false;
}

export function resolveDark(preference: ThemePreference): boolean {
  if (preference === "dark") return true;
  if (preference === "light") return false;
  return systemPrefersDark();
}

export function applyTheme(preference: ThemePreference): void {
  const dark = resolveDark(preference);
  document.documentElement.classList.toggle("dark", dark);
}