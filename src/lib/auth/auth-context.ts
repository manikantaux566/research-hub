import { createContext } from "react";
import type { ReactNode } from "react";
import type { AuthUser, SignUpInput } from "./api";

export type AuthStatus =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; user: AuthUser; demo: boolean };

export type AuthContextValue = {
  status: AuthStatus;
  error: string | null;
  signUp: (input: SignUpInput) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ resetLink?: string }>;
  resetPassword: (token: string, password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateDisplayName: (displayName: string | null) => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export type AuthProviderProps = {
  children: ReactNode;
};