# Research Hub — AGENTS

Guidance for AI-assisted development in this repository.

## Commands

- `npm run dev` — start Vite dev server (default port 5173)
- `npm run server` — start the Node auth server (`node --env-file-if-exists=.env server/index.mjs`, port 4000). Remember to run it alongside `npm run dev` when testing auth flows.
- `npm run build` — typecheck + build: `tsc -b && vite build` (MUST pass before finishing)
- `npm run lint` — `oxlint` (only warnings are pre-existing; no new errors)

## Conventions

- **TypeScript strictness**: `verbatimModuleSyntax` (use `import type` for
  types), `erasableSyntaxOnly` (no enums), `noUnusedLocals` (unused imports fail
  the build). After editing, always run `npm run build`. Type-only `React.X`
  usage (e.g. `React.FormEvent`) is fine without importing React.
- **React version**: React 19, function components + hooks. No class components.
- **Routing**: `react-router-dom` v7 `<BrowserRouter>` with `<Routes>` in
  `src/App.tsx`. Don't break the existing route hierarchy. The app root is
  `AuthProvider` (from `src/lib/auth/AuthProvider.tsx`) wrapping `RequireAuth`
  (protected) and `PublicOnly` (login/signup/forgot/reset) routes.
- **Auth**: components consume `useAuth` from `src/lib/auth/useAuth.ts` (NOT
  `AuthProvider.tsx`, which must export only the component). Auth pages live in
  `src/pages/auth/` and share `AuthShell`, `PasswordInput`, `FieldError`,
  `FormNotice` from `AuthShell.tsx`. API calls go through
  `src/lib/auth/api.ts`. Never store tokens/passwords in localStorage.
- **Theme**: Tailwind v4 class-based dark mode (`@custom-variant dark` in
  `src/index.css`). Use semantic tokens only: `bg-background`, `bg-surface`,
  `bg-surface-muted`, `bg-surface-hover`, `border-border`, `border-strong`,
  `text-foreground`, `text-muted`, `text-faint`, `text-link`. Do NOT introduce
  new raw `bg-slate-*`/`bg-white` classes. Consume via `useTheme` from
  `src/lib/theme/useTheme.ts`; preference localStorage key is
  `research-hub:ux:theme`.
- **UI**: Tailwind CSS v4 (utility classes only), no component library. Reuse
  primitives in `src/components/ui/` (`Button`, `Field`, `FormModal`, `Select`,
  `Badge`, `Spinner`, `EmptyState`, `ConfirmDialog` — re-exported from
  `./Modal`, etc.).
- **Storage layer**: `src/lib/storage/` provides typed repositories
  (`createRepository`), `writeBatch`, subscriptions, and the boot migration
  (`migrateStorage`, `assertStorageReadable`). Entity forms wrap
  `useCollection(repo, projectId?)` from `src/hooks/useCollection.ts`.
  `tableNames()` only returns research tables — non-table keys with `:` in the
  name (e.g. `ux:theme`) are ignored and must never be treated as tables.
- **Don't** import the entities repositories' hooks in lib code; keep `lib/*`
  free of React.

## Data integrity rules (do not change)

- Claim support status is **derived** in `claimSupportStatus` — never stored.
  `disputed` if `verificationStatus === "disputed"`; `unsupported` if 0 linked;
  `partiallySupported` if linked < expected counts; else `supported`.
- The app must not auto-verify evidence or claims, and must not auto-support
  hypotheses. Verification is researcher-controlled.
- JSON export is the authoritative lossless format; Markdown/CSV are secondary.
- `schemaVersion` in `src/lib/portable.ts` must be incremented on breaking data
  changes, with a migration added to `MIGRATIONS`; newer schema versions are
  rejected on import.
- Signing out must never delete local research. Auth and data persistence are
  independent concerns.

## Server conventions

- Keep everything in `server/` as ESM `.mjs`. No frontend dependency.
- Auth endpoints mount under `/api/auth`. All server-only config comes from
  env vars (read in `server/index.mjs`); the Vite client must never receive
  secrets — the dev proxy only forwards.
- `server/store.mjs` persists accounts to `DATA_DIR/users.json`. Sessions and
  rate-limit buckets are intentionally in-memory (documented tradeoff).
- `server/mailer.mjs` sends password-reset emails via SMTP (env-var driven).
  When `SMTP_HOST` is unset it is disabled and the reset link falls back to the
  console log; never fail a forgot-password request because mail sending failed
  (the response must stay neutral).
- Never leak account existence (neutral `forgot-password` behavior), never log
  password hashes, and always prefer the generic error handler in
  `server/index.mjs`.

## Scope constraints

Keep the app local-first and topic-agnostic. No AI, cloud, payments, semantic
search, analytics, or deployment.

## Testing

No automated test suite exists yet. Verify manually via `npm run dev`
(http://localhost:5175 in E2E checks) using Chrome CDP (ports 9333–9336). Fresh
Chrome profile recommended per check. Auth flows additionally require
`npm run server` on port 4000 (the Vite dev proxy forwards `/api`).