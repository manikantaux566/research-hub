# FUTURE — Research Hub

Future work ideas for Research Hub. These are intentionally out of scope for
the local-first MVP; they are here so the shape of future decisions can be
seen clearly.

---

## Automated testing

An E2E harness using Playwright or Cypress to exercise the primary flows
(create project → add source → extract evidence → record claim → export
JSON → clear → import), plus the auth flows (signup → login → logout →
reset → change password) and theme persistence.

## Authentication & accounts

- **Hosted outbound email**: reset links are already sent via SMTP
  (`server/mailer.mjs`); a future upgrade could hand off to a provider API for
  better deliverability tracking. Without SMTP config the link falls back to the
  server console + dev-only API response.
- **Shared session storage**: sessions are currently in-memory, so restarting
  the server signs everyone out and a multi-process deployment needs a shared
  store (Redis, Postgres, or a DB-backed store).
- **Account deletion / password change logging**: researchers may want to close
  an account and keep local data; decide how that interacts with the server.
- **Optional 2FA (TOTP) and OAuth**: deliberately out of scope for now; the
  server is a single-file Express app designed around scrypt + httpOnly cookies
  so a TOTP step could be added per-user without rethinking sessions.
- **Account-level backups** (research data lives in the browser, so this must
  remain opt-in and never silently upload).

## Data layer improvements

- Move from `localStorage` to IndexedDB (via `idb` or `opfs`) for larger data
  volumes and true concurrent writes.
- Add automatic migration versioning that runs on boot beyond the current
  read-normalize-write approach.
- Background export snapshots to the origin-private file system.

## Writing system refinements

- Keyboard shortcuts for content editing.
- ProseMirror or TipTap for richer editing instead of raw `contentEditable`
  + `execCommand`.
- Table support in the writing content (for statistics and variables).

## UI polish

- Keyboard navigation and full ARIA audit for all forms and modals.
- Global `Cmd+K` command palette wired into real routes.
- `react-router` URL search-state persistence for saved views.
- Per-panel coloring in a future accent-color theme (the current dark palettes
  are fixed via `.dark` overrides in `src/index.css`).

## Integrity & traceability

- Persist the integrity report and surface a "last checked" indicator.
- Allow users to export or dismiss individual integrity warnings.
- Let claims declare custom expected link counts beyond evidence + finding.

## Portability

- Replace-all import: persist a snapshot of pre-import state and expose a
  simple rollback button in the UI.
- CSV import for bulk-adding evidence or claims.

## Out-of-scope (explicitly excluded)

- Cloud sync, payments, and hosted deployment.
- AI-assisted claims, evidence summarization, or semantic search.
- Collaborative multi-user editing.