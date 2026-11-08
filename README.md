# NIW Evidence Tracker

A local-first web app for a **self-filing EB-2 National Interest Waiver (NIW) exceptional-ability** case. It turns the regulation and the Dhanasar test into a concrete checklist of evidence items, tracks the documents you upload for each one, scores your progress, flags items that are **OK** versus **needs improvement**, and produces a printable readiness report.

> **Not legal advice.** This tracker is an informational self-assessment aid. It does not predict approval, does not determine legal sufficiency, and does not replace an immigration attorney. Verify current USCIS forms, fees, and policy before filing.

## What it covers

The catalog models three layers:

| Layer | Legal basis | What the app tracks |
| --- | --- | --- |
| Identity & procedural | Form I-140 instructions, 8 CFR 103.2, 8 CFR 204.5(k) | Passport, I-140, fee, waiver request, translations, credential evaluation, cover letter |
| Exceptional ability | 8 CFR 204.5(k)(2)–(3) | Criteria **A–G**; at least **3 of 7** must be documented |
| National interest | *Matter of Dhanasar*, 26 I&N Dec. 884 (AAO 2016) | Prong 1 (substantial merit + national importance), prong 2 (well positioned), prong 3 (waiver on balance) |
| Supporting materials | I-140 instructions, 8 CFR 103.2(b)(4)–(5) | Exhibit index, timeline, optional professional review, backup/retention |

Each of the ~39 evidence items ships with:

- a description and the exact legal citation;
- a checklist of concrete criteria;
- practical improvement tips;
- required/optional status and a 1–5 importance weight;
- upload slots for supporting documents.

## Features

- **Dashboard** — weighted readiness score, status counts, exceptional-ability progress (`n / 3 met`), next actions, category progress, recent uploads and activity.
- **Evidence catalog** — every item grouped by category with status, score, document count, and weight.
- **Evidence detail** — checklist, manual score override, notes, "improvements needed" notes, drag-free multi-file upload, download, and delete.
- **Case profile** — name, email, field, one-paragraph endeavor, target filing date; appears on the report.
- **Readiness report** — printable / save-as-PDF summary with per-item notes, improvements, and document names.
- **Local storage** — SQLite database plus files on disk. Nothing leaves the machine.
- **Health endpoint** — `GET /health` for readiness and catalog stats.

## Quick start

Requires Node.js 20+ (developed on Node 26) and a C toolchain only if a `better-sqlite3` prebuild is unavailable.

```bash
cd niw-tracker
npm install
npm run build
npm start
```

Open <http://127.0.0.1:8770>.

For development with auto-reload:

```bash
npm run dev
```

## Scoring rules

An item's score is:

1. the **manual override**, clamped to 0–100, if one is set; otherwise
2. the **percentage of checklist criteria checked**.

Status thresholds:

| Status | Rule |
| --- | --- |
| **Missing** | score 0 **and** no uploaded documents |
| **Needs improvement** | score < 70, or unscored with at least one document |
| **OK** | score 70–84 |
| **Strong** | score ≥ 85 |

**Overall readiness** is the weighted average of:

- every **required** item, plus
- the applicant's **three strongest** exceptional-ability criteria (because the regulation requires only three of seven).

Category scores are the weighted average of all items in that category. Optional evidence is visible but does not inflate or deflate the headline number. The exceptional-ability panel separately reports how many criteria are met against the target of three.

## Configuration

All configuration is via environment variables:

| Variable | Default | Meaning |
| --- | --- | --- |
| `NIW_HOST` | `127.0.0.1` | Bind address |
| `NIW_PORT` | `8770` | HTTP port |
| `NIW_DATA_DIR` | `./data` | Directory for `niw.db` and `uploads/` |
| `NIW_MAX_UPLOAD_MB` | `15` | Maximum size per uploaded file |
| `NIW_AGENTS_DIR` | `<dataDir>/agents` | Override directory for agent definitions |

There is **no authentication**. Keep the bind address on loopback and do not expose the app to the internet. The SQLite database and uploads are plain files; use full-disk encryption and a separate encrypted backup.

## Data layout

```
data/
├── niw.db          SQLite database (case profile, progress, documents, activity)
└── uploads/        uploaded files, stored under random UUID names
```

The static evidence catalog is re-synced into SQLite on every start. That sync updates item text, criteria, and tips **without touching your progress, notes, or documents**.

## Project structure

```
src/
├── app.ts          Express app factory (views, locals, error handling)
├── server.ts       process entry point and graceful shutdown
├── config.ts       environment configuration
├── routes.ts       all HTTP routes (pages, uploads, downloads, report, health)
├── catalog.ts      categories and the ~39-item evidence catalog
├── scoring.ts      score, status, readiness, and next-action logic
├── db.ts           SQLite schema, catalog sync, repository
├── agents/         Markdown agent loader + dynamic runner (no per-role TS)
└── types.ts        shared domain types
agents/             Markdown agent definitions (readiness reviewer, report)
views/              EJS templates (pages + partials)
public/styles.css   responsive UI and print styles
tests/              vitest + supertest suites
```

## Extending

Agent identity, prompts, task templates, and validation schemas live in
Markdown files under `agents/`. A single script base,
`src/agents/dynamic.ts`, runs any definition — there are no per-role
TypeScript wrappers, so adding a role is one new `.md` file (plus a validator
only if a new `schema:` name is needed). See `agents/README.md` for the file
format and override rules (`<dataDir>/agents`, `NIW_AGENTS_DIR`).

## HTTP routes

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/` | Dashboard |
| `GET` | `/evidence` | Full catalog |
| `GET` | `/evidence/:slug` | Evidence detail |
| `POST` | `/evidence/:slug` | Save checklist, override, notes |
| `POST` | `/evidence/:slug/reset` | Reset progress (keeps documents) |
| `POST` | `/evidence/:slug/documents` | Upload up to 5 files |
| `GET` | `/documents/:id` | Download a document |
| `POST` | `/documents/:id/delete` | Delete a document |
| `GET/POST` | `/case` | View / save case profile |
| `GET` | `/report` | Printable readiness report |
| `GET` | `/health` | JSON health and readiness stats |

Accepted upload extensions: `.pdf .doc .docx .rtf .txt .md .png .jpg .jpeg .webp .tif .tiff`.

## Scripts

```bash
npm run build      # compile TypeScript to dist/
npm run typecheck  # type-check without emitting
npm start          # run the compiled server
npm run dev        # tsx watch mode
npm test           # run the vitest suite
```

## Tests

```bash
npm test
```

The suite covers scoring/status thresholds, readiness weighting, catalog integrity, SQLite persistence and cascades, HTTP behavior (pages, 404s, progress save/reset, upload/download/delete, case profile, report, health), and the Markdown agent loader + dynamic runner (`tests/agents_md.test.ts`).

## Privacy

Everything runs locally. The app has no telemetry, no external API calls, and no accounts. Uploaded files are stored with random names and served only through the app. Back up `data/` yourself; deleting it deletes the case.

## License

MIT.
