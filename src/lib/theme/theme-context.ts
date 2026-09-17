import { createContext } from "react";
import type { ReactNode } from "react";
import type { ThemePreference } from "./theme";

export type ThemeContextValue = {
  theme: ThemePreference;
  dark: boolean;
  setTheme: (preference: ThemePreference) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export type ThemeProviderProps = {
  children: ReactNode;
};