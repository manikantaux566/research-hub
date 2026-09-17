import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { newSecret, sha256Hex } from "./passwords.mjs";

const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), "server-data");
const USERS_FILE = join(DATA_DIR, "users.json");
const SESSION_TTL_MS = (Number(process.env.SESSION_TTL_HOURS) || 168) * 60 * 60 * 1000;
const RESET_TTL_MS = 30 * 60 * 1000;

mkdirSync(DATA_DIR, { recursive: true });

function readJsonFile(file, fallback) {
  if (!existsSync(file)) return fallback;
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    console.error(`[auth] Failed to parse ${file}:`, error.message);
    return fallback;
  }
}

function writeJsonFile(file, data) {
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
  renameSync(tmp, file);
}

/** User: { id, email, displayName, passwordHash, createdAt, updatedAt } */
let users = readJsonFile(USERS_FILE, []);

if (!Array.isArray(users)) {
  // A users file that parses but is not an array (e.g. a hand-edited or
  // partially written file) would break every account operation at runtime.
  // Reset it rather than fail with an opaque 500.
  console.error("[auth] users.json is not an array; resetting to an empty account list.");
  users = [];
  persistUsers();
}

function persistUsers() {
  writeJsonFile(USERS_FILE, users);
}

export function findUserByEmail(email) {
  return users.find((user) => user.email === email);
}

export function findUserById(id) {
  return users.find((user) => user.id === id);
}

export function createUser({ email, displayName, passwordHash }) {
  const now = new Date().toISOString();
  const user = {
    id: newSecret(16),
    email,
    displayName: displayName || null,
    passwordHash,
    createdAt: now,
    updatedAt: now,
  };
  users.push(user);
  persistUsers();
  return user;
}

export function updateUser(id, patch) {
  const user = findUserById(id);
  if (!user) return undefined;
  Object.assign(user, patch, { id: user.id, updatedAt: new Date().toISOString() });
  persistUsers();
  return user;
}

export function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt,
  };
}

/* ---- Sessions (in-memory, httpOnly cookie-bound) ---- */

const sessions = new Map(); // token -> { userId, expiresAt }

function pruneSessions() {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (session.expiresAt <= now) sessions.delete(token);
  }
}

export function createSession(userId) {
  pruneSessions();
  const token = newSecret(32);
  sessions.set(token, { userId, expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

export function resolveSession(token) {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  return session.userId;
}

export function destroySession(token) {
  if (token) sessions.delete(token);
}

export function destroyUserSessions(userId, keepToken) {
  for (const [token, session] of sessions) {
    if (session.userId === userId && token !== keepToken) sessions.delete(token);
  }
}

/* ---- Password reset tokens (hashed at rest, short-lived) ---- */

const resetTokens = new Map(); // sha256(token) -> { userId, expiresAt }

function pruneResetTokens() {
  const now = Date.now();
  for (const [hash, entry] of resetTokens) {
    if (entry.expiresAt <= now) resetTokens.delete(hash);
  }
}

export function createResetToken(userId) {
  pruneResetTokens();
  const token = newSecret(32);
  resetTokens.set(sha256Hex(token), { userId, expiresAt: Date.now() + RESET_TTL_MS });
  return token;
}

export function consumeResetToken(token) {
  if (!token || typeof token !== "string") return null;
  const hash = sha256Hex(token);
  const entry = resetTokens.get(hash);
  if (!entry || entry.expiresAt <= Date.now()) return null;
  resetTokens.delete(hash);
  return entry.userId;
}

export { SESSION_TTL_MS };