export type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
};

// Fictional session used when no auth backend is reachable (e.g. the app is
// served from a static site with no /api). The app stays fully usable and all
// research still lives in the visitor's browser.
export const DEMO_USER: AuthUser = {
  id: "demo-local-session",
  email: "demo@research-hub.local",
  displayName: "Demo",
  createdAt: "2026-01-01T00:00:00.000Z",
};

export type ApiError = {
  code: string;
  message: string | null;
};

export class AuthError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}

function friendlyMessage(code: string, fallback: string | null): string {
  const map: Record<string, string> = {
    "invalid-credentials": "Email or password is incorrect.",
    unauthenticated: "Your session has expired. Please sign in again.",
    "email-taken": "An account with this email may already exist.",
    "invalid-email": "Please enter a valid email address.",
    "weak-password": "Password must be at least 8 characters.",
    "invalid-token": "This reset link is invalid or has expired.",
    "invalid-current-password": "Your current password is incorrect.",
    "rate-limited": "Too many attempts. Please try again later.",
    "bad-request": "The request could not be processed.",
  };
  return map[code] ?? fallback ?? "Something went wrong. Please try again.";
}

export type AuthResponse = { status: number; data: unknown };

// Where the auth API lives. Set VITE_AUTH_BASE_URL at build time to point the
// production bundle at a hosted backend (e.g. a Render service). When unset,
// requests stay same-origin — in dev the Vite proxy forwards /api to the local
// server, and single-origin deployments need no extra config.
const AUTH_BASE_URL = ((import.meta.env.VITE_AUTH_BASE_URL as string | undefined) ?? "").replace(/\/+$/, "");

export async function request(path: string, init?: RequestInit): Promise<AuthResponse> {
  let response: Response;
  try {
    response = await fetch(`${AUTH_BASE_URL}${path}`, {
      credentials: "include",
      ...init,
      headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers },
    });
  } catch {
    throw new AuthError(
      "network",
      "Unable to connect to the authentication service. Please try again.",
    );
  }

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = null;
    }
  }
  return { status: response.status, data };
}

function dataOrError(response: AuthResponse): unknown {
  const body = response.data as { error?: ApiError } | null;
  if (response.status >= 200 && response.status < 300) return body;
  if (body && typeof body.error === "object" && body.error) {
    throw new AuthError(body.error.code, friendlyMessage(body.error.code, body.error.message));
  }
  if (response.status >= 500) {
    // Non-JSON 5xx (e.g. the dev proxy's 502 when the auth server is not
    // running). Explain what happened instead of a dead-end message.
    throw new AuthError(
      "service-unavailable",
      "The authentication service is unavailable. Make sure the server is running (npm run server).",
    );
  }
  throw new AuthError("internal", "Something went wrong. Please try again.");
}

export type SignUpInput = { email: string; password: string; displayName?: string };

export async function signUpApi(input: SignUpInput): Promise<AuthUser> {
  const response = await request("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const body = dataOrError(response) as { user?: AuthUser };
  if (!body?.user) throw new AuthError("internal", "Something went wrong. Please try again.");
  return body.user;
}

export async function signInApi(email: string, password: string): Promise<AuthUser> {
  const response = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const body = dataOrError(response) as { user?: AuthUser };
  if (!body?.user) throw new AuthError("internal", "Something went wrong. Please try again.");
  return body.user;
}

export async function signOutApi(): Promise<void> {
  await request("/api/auth/logout", { method: "POST" });
}

export async function meApi(): Promise<{ status: number; user?: AuthUser }> {
  const response = await request("/api/auth/me");
  if (response.status < 200 || response.status >= 300) {
    return { status: response.status };
  }
  const body = response.data as { user?: AuthUser } | null;
  return { status: response.status, user: body?.user };
}

export async function requestPasswordResetApi(email: string): Promise<{ resetLink?: string }> {
  const response = await request("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  const body = dataOrError(response) as { message?: string; resetLink?: string } | null;
  return { resetLink: body?.resetLink };
}

export async function resetPasswordApi(token: string, password: string): Promise<AuthUser> {
  const response = await request("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
  const body = dataOrError(response) as { user?: AuthUser };
  if (!body?.user) throw new AuthError("internal", "Something went wrong. Please try again.");
  return body.user;
}

export async function changePasswordApi(currentPassword: string, newPassword: string): Promise<void> {
  const response = await request("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  dataOrError(response);
}

export async function updateDisplayNameApi(displayName: string | null): Promise<AuthUser> {
  const response = await request("/api/auth/account", {
    method: "PATCH",
    body: JSON.stringify({ displayName: displayName ?? undefined }),
  });
  const body = dataOrError(response) as { user?: AuthUser };
  if (!body?.user) throw new AuthError("internal", "Something went wrong. Please try again.");
  return body.user;
}