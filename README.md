# Research Hub

A local-first research workspace for collecting sources, extracting evidence,
tracking claims, running experiments, and turning it all into writing.

Your research data lives entirely in your browser (`localStorage`). A small,
self-hosted Node authentication server manages sign-in only — it never touches
your research. No telemetry, no cloud, no third parties. Your data belongs to
you, and you can take it with you.

## Features

- **Projects** organize sources, questions, evidence, hypotheses, experiments,
  findings, insights, gaps, claims, and notes.
- **Traceable research** — evidence is extracted from sources; findings cite
  evidence; claims are supported by evidence and findings; hypotheses are
  backed by questions and tested by experiments.
- **Claim support is derived, not implied** — the app never decides whether a
  claim is true. Support status (`unsupported`, `partially supported`,
  `supported`, `disputed`) is computed purely from what links exist. Verification
  is always the researcher's decision.
- **Writing system** — draft papers, theses, or reports as hierarchical
  sections (part → chapter → section → subsection → node) with a rich-text
  editor, autosave, and references back to research.
- **Accounts & sessions** — create an account, sign in with an httpOnly
  session cookie, reset a forgotten password, and change your password. Signing
  out never deletes your local research.
- **Light / dark / system theme** — theme choice is stored per browser with no
  flash on load.
- **Search** across all fourteen collections, with type filters and live results.
- **Tags** for cross-cutting organization.
- **Review hub** surfaces unsupported claims, unverified evidence, untested
  questions, gaps without direction, and data-integrity issues.
- **Portability** — export everything to JSON (the authoritative lossless
  format; backups, per-project, and per-writing exports), export Markdown and
  CSV, and import with duplicate-safe validation:
  - *Import as new copy* regenerates all IDs and rewrites every reference so
    nothing in your current data is touched.
  - *Replace all data* validates first and requires explicit confirmation.
- **Integrity checks** catch broken references and malformed records
  automatically — they never make scientific judgments.

## Commands

Run the app locally with two terminals:

```bash
npm install        # install dependencies
npm run server     # start the Node auth server (default port 4000)
npm run dev        # start the Vite dev server (default port 5173)
```

Other commands:

```bash
npm run build      # typecheck + production build (tsc -b && vite build)
npm run lint       # oxlint
npm run start      # production: serve ./dist + the auth server on one port
```

For production serving, build first (`npm run build`), then `npm run start`;
the auth server also serves the built app from `./dist`.

## Scripts

- `dev` — Vite dev server with HMR
- `server` — Node authentication server (`node --env-file-if-exists=.env server/index.mjs`)
- `start` — auth server that also serves the production build from `dist`
- `build` — `tsc -b && vite build`
- `lint` — `oxlint`
- `preview` — serve the production build

## Authentication

Research Hub ships a minimal, self-hosted auth server (`server/`) so a single
seed works in multiple browsers without sharing research data. How it works:

- **Passwords are never stored** — only a scrypt hash (Node `node:crypto`)
  plus a random salt.
- **Sessions** are random 128-bit tokens held in an **in-memory** map on the
  server and delivered as an `rh_session` cookie with `HttpOnly`, `SameSite=Lax`,
  and `Path=/`. `HttpOnly` means browser JavaScript cannot read the token.
- **Reset tokens** are single-use, hashed at rest, expire after 30 minutes, and
  can't be guessed. Reset links are emailed via **SMTP** when configured (see
  `.env.example`). Without SMTP, the link is written to the server console — and
  in development also returned in the reset response — so the flow still works
  locally with no mail server.
- **Forgot-password is neutral** — the response doesn't reveal whether the email
  exists.
- **Password-facing endpoints are rate-limited** (signup, login, forgot,
  reset) per IP with a fixed window.
- **Sessions are memory-only by design**: restarting the server signs everyone
  out. A future deployment behind a load balancer would need shared session
  storage (see `FUTURE.md`).

### Server configuration (all variables are server-only)

Copy `.env.example` to `.env`. The Vite dev client needs none of these — the
dev server proxies `/api` to the auth server. See `.env.example` for each
variable's meaning, including the optional SMTP block for real reset emails.

## Data model

All records share `id`, `createdAt`, `updatedAt`, plus `projectId` where they
belong to a project. Writing nodes form a tree via `parentId`/`order` and hold
`researchRefs` (typed ID arrays) linking to research records.

The canonical schema lives in `src/types/index.ts`. JSON exports include a
`schemaVersion`; unsupported or newer versions are rejected on import rather
than silently mis-interpreted.

## Privacy & safety

- Research data never leaves your browser. The only network requests are to the
  local authentication server for sign-in and account management.
- Signing out (or signing in as a different user) never touches your local
  research data.
- The auth server stores only accounts (`server-data/users.json`): email,
  display name, password hash, and timestamps. It cannot read your research.
- Evidence, findings, and claims are never auto-verifiable — AI-generated
  evidence is simply flagged, not trusted.
- Deleting a record shows exactly what would be affected first.

## Notes

- Sample data can be loaded from Settings → *Developer tools* in a development
  build. It is clearly labeled and never loaded automatically.
- User accounts and localStorage are independent: clearing browser storage does
  not delete accounts (those live on the server), and deleting the server's
  account file does not delete local research.