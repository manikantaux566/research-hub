import { useCallback, useEffect, useState } from "react";
import { AuthContext } from "./auth-context";
import type { AuthContextValue, AuthProviderProps, AuthStatus } from "./auth-context";
import {
  changePasswordApi,
  DEMO_USER,
  meApi,
  requestPasswordResetApi,
  resetPasswordApi,
  signInApi,
  signOutApi,
  signUpApi,
  updateDisplayNameApi,
} from "./api";
import type { SignUpInput } from "./api";

export function AuthProvider({ children }: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>({ status: "loading" });
  const [error, setError] = useState<string | null>(null);

  // Open a local demo session: the whole app stays usable with research saved
  // in this browser. Only used when no auth backend is reachable at all.
  const enterDemo = useCallback(() => {
    setStatus({ status: "authenticated", user: DEMO_USER, demo: true });
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const { status: httpStatus, user } = await meApi();
      if (httpStatus === 200 && user) {
        setStatus({ status: "authenticated", user, demo: false });
        setError(null);
      } else if (httpStatus === 401 || httpStatus === 403) {
        // The auth server is reachable but has no session → real login wall.
        setStatus({ status: "unauthenticated" });
        setError(null);
      } else {
        // No backend behind /api: 404/405 (static host), 4xx/5xx, or another
        // unexpected response → demo mode.
        enterDemo();
      }
    } catch {
      // The fetch itself failed (connectivity) → demo mode.
      enterDemo();
    }
  }, [enterDemo]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signUp = useCallback(
    async (input: SignUpInput) => {
      const user = await signUpApi(input);
      setStatus({ status: "authenticated", user, demo: false });
      setError(null);
    },
    [],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      const user = await signInApi(email, password);
      setStatus({ status: "authenticated", user, demo: false });
      setError(null);
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      await signOutApi();
    } catch {
      // No backend (demo mode) — nothing to invalidate server-side.
    }
    setStatus({ status: "unauthenticated" });
    setError(null);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    return requestPasswordResetApi(email);
  }, []);

  const resetPassword = useCallback(
    async (token: string, password: string) => {
      const user = await resetPasswordApi(token, password);
      setStatus({ status: "authenticated", user, demo: false });
      setError(null);
    },
    [],
  );

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await changePasswordApi(currentPassword, newPassword);
  }, []);

  const updateDisplayName = useCallback(
    async (displayName: string | null) => {
      const user = await updateDisplayNameApi(displayName);
      setStatus((previous) =>
        previous.status === "authenticated"
          ? { status: "authenticated", user, demo: previous.demo }
          : { status: "authenticated", user, demo: false },
      );
    },
    [],
  );

  const value: AuthContextValue = {
    status,
    error,
    signUp,
    signIn,
    signOut,
    requestPasswordReset,
    resetPassword,
    changePassword,
    updateDisplayName,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}