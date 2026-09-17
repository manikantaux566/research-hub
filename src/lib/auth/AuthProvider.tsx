import { useCallback, useEffect, useState } from "react";
import { AuthContext } from "./auth-context";
import type { AuthContextValue, AuthProviderProps, AuthStatus } from "./auth-context";
import {
  changePasswordApi,
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

  const refresh = useCallback(async () => {
    try {
      const { status: httpStatus, user } = await meApi();
      if (httpStatus === 200 && user) {
        setStatus({ status: "authenticated", user });
        setError(null);
      } else {
        setStatus({ status: "unauthenticated" });
      }
    } catch {
      setStatus({ status: "unauthenticated" });
      setError("Unable to connect to the authentication service. Please try again.");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signUp = useCallback(
    async (input: SignUpInput) => {
      const user = await signUpApi(input);
      setStatus({ status: "authenticated", user });
      setError(null);
    },
    [],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      const user = await signInApi(email, password);
      setStatus({ status: "authenticated", user });
      setError(null);
    },
    [],
  );

  const signOut = useCallback(async () => {
    await signOutApi();
    setStatus({ status: "unauthenticated" });
    setError(null);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    return requestPasswordResetApi(email);
  }, []);

  const resetPassword = useCallback(
    async (token: string, password: string) => {
      const user = await resetPasswordApi(token, password);
      setStatus({ status: "authenticated", user });
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
      setStatus({ status: "authenticated", user });
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