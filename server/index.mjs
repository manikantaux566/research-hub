import express from "express";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  consumeResetToken,
  createResetToken,
  createSession,
  destroySession,
  destroyUserSessions,
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  publicUser,
  resolveSession,
} from "./store.mjs";
import { hashPassword, verifyPassword } from "./passwords.mjs";
import { rateLimit, error } from "./rate-limit.mjs";
import { sendPasswordResetEmail } from "./mailer.mjs";
import {
  cleanDisplayName,
  isValidEmail,
  isValidPassword,
  normalizeEmail,
} from "./validate.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, "..", "dist");

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "64kb" }));

const isDev = process.env.NODE_ENV !== "production";
// Cross-origin mode (frontend hosted separately, e.g. GitHub Pages talking to
// a hosted backend). Requires SameSite=None cookies and CORS headers.
const isCrossOrigin = Boolean(process.env.CORS_ORIGIN);
const useSecureCookies =
  process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production" || isCrossOrigin;
const SESSION_COOKIE = "rh_session";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

// Allow the static frontend origin(s) to call this API with credentials.
// CORS_ORIGIN is a comma-separated list of origins (no trailing slashes), e.g.
// "https://manikantaux566.github.io". Unset means same-origin only (local dev).
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (ALLOWED_ORIGINS.length > 0) {
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.setHeader("Vary", "Origin");
      if (req.method === "OPTIONS") {
        res.setHeader("Access-Control-Max-Age", "600");
        return res.status(204).end();
      }
    }
    return next();
  });
}

function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header) return {};
  const out = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = decodeURIComponent(part.slice(idx + 1).trim());
    out[key] = value;
  }
  return out;
}

function sessionCookieAttributes({ maxAge = SESSION_MAX_AGE } = {}) {
  const attributes = [
    "HttpOnly",
    `SameSite=${isCrossOrigin ? "None" : "Lax"}`,
    "Path=/",
    `Max-Age=${maxAge}`,
  ];
  // SameSite=None is rejected by browsers unless the cookie is Secure.
  if (useSecureCookies) attributes.push("Secure");
  return attributes.join("; ");
}

function setSessionCookie(res, token) {
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; ${sessionCookieAttributes()}`,
  );
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; ${sessionCookieAttributes({ maxAge: 0 })}`);
}

function currentUser(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  const userId = token ? resolveSession(token) : null;
  if (!userId) return null;
  return findUserById(userId);
}

function requireAuth(handler) {
  return (req, res) => {
    const user = currentUser(req);
    if (!user) return error(res, 401, "unauthenticated", "Your session has expired. Please sign in again.");
    return handler(req, res, user);
  };
}

const auth = express.Router();

auth.post(
  "/signup",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 10, keyPrefix: "signup" }),
  async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const { password } = req.body ?? {};
    const displayName = cleanDisplayName(req.body?.displayName);

    if (!isValidEmail(email)) {
      return error(res, 400, "invalid-email", "Please enter a valid email address.");
    }
    if (!isValidPassword(password)) {
      return error(res, 400, "weak-password", "Password must be at least 8 characters.");
    }
    if (findUserByEmail(email)) {
      return error(res, 409, "email-taken", "An account with this email may already exist.");
    }

    const passwordHash = await hashPassword(password);
    const user = createUser({ email, displayName, passwordHash });
    const token = createSession(user.id);
    setSessionCookie(res, token);
    return res.status(201).json({ user: publicUser(user) });
  },
);

auth.post(
  "/login",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 10, keyPrefix: "login" }),
  async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password ?? "");
    const user = findUserByEmail(email);
    const valid = user ? await verifyPassword(password, user.passwordHash) : false;
    if (!user || !valid) {
      return error(res, 401, "invalid-credentials", "Email or password is incorrect.");
    }
    const token = createSession(user.id);
    setSessionCookie(res, token);
    return res.json({ user: publicUser(user) });
  },
);

auth.post("/logout", (req, res) => {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (token) destroySession(token);
  clearSessionCookie(res);
  return res.status(204).end();
});

auth.get("/me", (req, res) => {
  const user = currentUser(req);
  if (!user) return error(res, 401, "unauthenticated", null);
  return res.json({ user: publicUser(user) });
});

auth.post(
  "/forgot-password",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 5, keyPrefix: "forgot" }),
  async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const body = {
      message: "If an account exists with that email, a reset link has been sent.",
    };
    if (!isValidEmail(email)) {
      // Neutral response regardless of whether the email is valid or known.
      return res.json(body);
    }
    const user = findUserByEmail(email);
    if (user) {
      const token = createResetToken(user.id);
      const base = process.env.APP_BASE_URL
        ? process.env.APP_BASE_URL.replace(/\/+$/, "")
        : `${req.protocol}://${req.get("host")}`;
      const resetLink = `${base}/reset-password?token=${token}`;
      try {
        const sent = await sendPasswordResetEmail({ to: user.email, resetLink });
        if (sent) {
          console.log(`[auth] Password reset email sent to ${user.email}`);
        } else {
          console.log(`[auth] SMTP not configured; password reset for ${user.email}: ${resetLink}`);
        }
        if (isDev) body.resetLink = resetLink;
      } catch (err) {
        console.error("[auth] Failed to send reset email:", err && err.message ? err.message : err);
        if (isDev) body.resetLink = resetLink;
      }
    }
    return res.json(body);
  },
);

auth.post(
  "/reset-password",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 5, keyPrefix: "reset" }),
  async (req, res) => {
    const { token, password } = req.body ?? {};
    if (!isValidPassword(password)) {
      return error(res, 400, "weak-password", "Password must be at least 8 characters.");
    }
    const userId = consumeResetToken(token);
    if (!userId) {
      return error(res, 400, "invalid-token", "This reset link is invalid or has expired.");
    }
    const passwordHash = await hashPassword(password);
    updateUser(userId, { passwordHash });
    destroyUserSessions(userId);
    const sessionToken = createSession(userId);
    setSessionCookie(res, sessionToken);
    const user = findUserById(userId);
    return res.json({ user: publicUser(user) });
  },
);

auth.patch(
  "/account",
  requireAuth(async (req, res, user) => {
    const displayName = cleanDisplayName(req.body?.displayName);
    const updated = updateUser(user.id, { displayName });
    return res.json({ user: publicUser(updated) });
  }),
);

auth.post(
  "/change-password",
  requireAuth(async (req, res, user) => {
    const { currentPassword, newPassword } = req.body ?? {};
    if (!isValidPassword(newPassword)) {
      return error(res, 400, "weak-password", "Password must be at least 8 characters.");
    }
    const matches = await verifyPassword(String(currentPassword ?? ""), user.passwordHash);
    if (!matches) {
      return error(res, 400, "invalid-current-password", "Your current password is incorrect.");
    }
    const passwordHash = await hashPassword(newPassword);
    const token = parseCookies(req)[SESSION_COOKIE];
    updateUser(user.id, { passwordHash });
    destroyUserSessions(user.id, token);
    return res.json({ ok: true });
  }),
);

app.use("/api/auth", auth);

// Liveness probe for hosted platforms (Render health checks expect a 2xx).
app.get("/api/health", (req, res) => {
  res.status(200).json({ ok: true });
});

app.use("/api", (req, res) => {
  error(res, 404, "not-found", "Not found.");
});

if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
}

// SPA history fallback (only for non-API GET requests).
app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api/")) return next();
  if (existsSync(DIST_DIR)) return res.sendFile(join(DIST_DIR, "index.html"));
  return next();
});

// Central error handler: never leak internals to clients.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err && typeof err.status === "number" && err.status < 500) {
    return error(res, err.status, "bad-request", "The request could not be processed.");
  }
  console.error("[auth] Unhandled error:", err && err.message ? err.message : err);
  error(res, 500, "internal", "Something went wrong. Please try again.");
});

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`[research-hub] Auth server listening on http://localhost:${PORT}`);
  if (isDev) {
    console.log("[research-hub] Development mode: password reset links are returned by /api/auth/forgot-password.");
  }
});