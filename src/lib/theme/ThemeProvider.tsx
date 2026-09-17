import { useCallback, useEffect, useState } from "react";
import { ThemeContext } from "./theme-context";
import type { ThemeContextValue, ThemeProviderProps } from "./theme-context";
import {
  applyTheme,
  readThemePreference,
  resolveDark,
  writeThemePreference,
} from "./theme";
import type { ThemePreference } from "./theme";

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemePreference>(() => readThemePreference());
  const [dark, setDark] = useState<boolean>(() => resolveDark(theme));

  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    function onChange() {
      setDark(media.matches);
      applyTheme("system");
    }
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((preference: ThemePreference) => {
    writeThemePreference(preference);
    setThemeState(preference);
    setDark(resolveDark(preference));
    applyTheme(preference);
  }, []);

  const value: ThemeContextValue = { theme, dark, setTheme };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}