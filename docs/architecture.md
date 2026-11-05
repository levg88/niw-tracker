# Architecture

## Overview

The app is a single-process Express server that renders EJS pages and stores everything in a local SQLite database plus an uploads directory.

```
Browser
   │  HTML forms / multipart uploads
   ▼
Express 5 (src/app.ts)
   │  locals: formatting, status labels, categories, case profile
   ├── routes (src/routes.ts)
   │     ├── pages: dashboard, catalog, detail, case, report
   │     ├── progress: save / reset
   │     ├── documents: upload / download / delete
   │     └── health
   ├── Repository (src/db.ts) ── better-sqlite3 ── data/niw.db
   ├── catalog (src/catalog.ts) ── static legal content
   └── scoring (src/scoring.ts) ── pure functions
   │
   └── data/uploads/<uuid>.<ext>
```

## Key decisions

### better-sqlite3 instead of `node:sqlite`

`better-sqlite3` is synchronous, mature, and has a prebuilt binary for the Node ABI in use. The synchronous API keeps route handlers simple and transactional. `node:sqlite` is still experimental on the target Node line.

### Static catalog, synced into SQLite

The legal content lives in `src/catalog.ts` as typed data. On startup, `Repository.syncCatalog()` upserts each item by slug. This gives:

- a single source of truth for text, criteria, and tips;
- database-backed foreign keys for progress and documents;
- safe content updates that never overwrite user progress.

### Pure scoring module

`src/scoring.ts` has no I/O. Given item definitions, progress rows, and document lists it returns fully-derived `ItemState` values and a `ReadinessSummary`. This makes the rules easy to unit test and reuse (for example, in the health endpoint).

### Readiness weighting

The headline score is the weighted average of:

- all **required** items, and
- the applicant's **three strongest** exceptional-ability criteria.

The regulation requires three of seven criteria. Including only the best three prevents a strong applicant from being penalized for leaving optional criteria blank, while the EA panel still reports `n / 3 met` explicitly. Optional non-EA evidence is displayed but excluded from the headline.

### App factory

`createApp(config)` builds the Express app, opens the repository, wires locals and routes, and returns a handle with `close()`. `server.ts` only handles process concerns (listen, signals). Tests call `createApp` with a temporary data directory, so no test touches real data.

### Uploads

Multer disk storage writes to `data/uploads` with a random UUID filename and the original extension. The original name is stored in SQLite for display/download. The extension allowlist and size limit are enforced before the handler. Downloads use `res.download` with the stored original name; delete removes the row and best-effort unlinks the file (the DB row is the source of truth).

### Rendering

EJS templates share `partials/head.ejs` and `partials/foot.ejs`. Formatting helpers (`formatDate`, `formatDateTime`, `formatBytes`), status labels, CSS class mapping, score tone, category metadata, and the case profile are injected once as `res.locals`. The report page reuses the same data as the dashboard and adds print CSS.

## Data model

```sql
case_profile (id=1, full_name, email, field, endeavor_summary,
              target_filing_date, created_at, updated_at)

evidence_items (id, slug UNIQUE, category, code, title, description,
                legal_basis, required, weight, sort_order,
                criteria_json, tips_json)

item_progress (item_id PK/FK, checked_json, manual_score, notes,
               improvements, last_reviewed, updated_at)

documents (id, item_id FK, original_name, stored_name UNIQUE,
           mime, size, uploaded_at)

activity_log (id, action, detail, created_at)
```

Foreign keys are on; deleting an item cascades to progress and documents. The database uses WAL mode.

## Request flow: saving progress

1. `POST /evidence/:slug` with checkbox values `criteria`.
2. Route looks up the item, validates indices against the item's criteria count, de-duplicates and sorts them.
3. `manual_score` is parsed and clamped to 0–100; blank means no override.
4. Notes and improvements are length-capped.
5. `Repository.saveProgress` upserts one row and sets `last_reviewed`/`updated_at`.
6. The route logs activity and redirects with a flash message (POST/redirect/GET).

## Request flow: upload

1. `POST /evidence/:slug/documents` (multipart).
2. Multer validates extension and size, writes files with UUID names.
3. The route inserts one `documents` row per file.
4. Activity is logged; the user is redirected to the item detail page.

If multer rejects a file, the route redirects with an error message rather than throwing a 500.

## Error handling

- Unknown pages and items render the `error.ejs` template with a 404.
- The terminal error handler logs the error and renders the same template with a 4xx/5xx status, without leaking stack traces to the browser.

## Security posture

The app is a local tool, not a hardened internet service:

- binds to `127.0.0.1` by default;
- no accounts or authentication;
- no outbound network calls;
- upload allowlist, 15 MB per file, 5 files per request;
- stored filenames are random UUIDs; paths are resolved with `path.basename`;
- HTML is escaped by EJS (`<%= %>`), except the two include calls.

Do not expose it publicly. Use disk encryption and your own encrypted backup.

## Testing strategy

- **Unit:** scoring thresholds, manual overrides, weighting, the three-strongest rule, catalog integrity.
- **Persistence:** catalog sync idempotence, progress round-trips, document CRUD, cascade deletion, case profile, activity order.
- **HTTP (supertest):** all pages, 404s, progress save/reset, upload validation, multi-file upload, download headers, delete, case profile, report contents, health payload.

Each test uses `mkdtemp` for isolation and removes the directory afterwards.

## Extension points

- Add items by appending to `EVIDENCE_CATALOG`; the next start syncs them.
- Change weights, criteria, or tips in the catalog; progress is preserved.
- Add a route in `routes.ts` and a template in `views/`.
- Add an optional LLM review layer behind a new module; keep it opt-in and never send data without consent.
