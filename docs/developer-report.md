# Developer report

## Summary

Built `niw-tracker`, a TypeScript/Express/SQLite web app for tracking an EB-2 National Interest Waiver exceptional-ability self-petition. The app implements the full evidence model, document storage, scoring/status flags, and a printable readiness report.

## Delivery context

The original plan was to run the `dev-firm` build pipeline (PM → Architect → Developer → QA) against the NIW brief. That pipeline could not run:

- OpenCode free models return `HTTP 429 FreeUsageLimitError`;
- paid OpenCode models return `HTTP 403 Model access is disabled` and no longer appear in the model list;
- the local OpenCode CLI works only intermittently before hitting the same free-tier limit.

Per the agreed fallback, the app was built directly. The brief remains at `dev-firm/data/briefs/niw-tracker.md` and the pipeline can regenerate or extend the app once model quota/billing is available.

## What was built

### Backend

| File | Responsibility |
| --- | --- |
| `src/types.ts` | Domain types for categories, items, progress, documents, states, summaries |
| `src/catalog.ts` | 6 categories and 39 evidence items with criteria, tips, weights, citations |
| `src/scoring.ts` | Pure score/status/readiness/next-action functions |
| `src/db.ts` | SQLite schema, catalog sync, repository methods |
| `src/config.ts` | Environment config with safe defaults |
| `src/routes.ts` | All HTTP routes |
| `src/app.ts` | Express factory, locals, 404/error handling |
| `src/server.ts` | Listen and graceful shutdown |

### Frontend

- EJS pages: dashboard, evidence list, evidence detail, case profile, readiness report, error page.
- Partials: head/nav, footer/disclaimer, status badge, progress bar.
- Responsive stylesheet with status colours, progress bars, tables, forms, and print rules.

### Data

SQLite tables for `case_profile`, `evidence_items`, `item_progress`, `documents`, and `activity_log`, with foreign keys and cascade deletes. Uploads are stored under `data/uploads` with UUID names.

### Behaviour

- Checklist scoring with optional manual override.
- Status: missing / needs improvement / OK / strong.
- Weighted readiness using required items + the three strongest EA criteria.
- EA target reporting (`n / 3 met`).
- Next-action list capped at 10.
- Upload validation (extension, size, count), download, delete.
- Case profile rendered into the report.
- Health endpoint.

## Deviations and decisions

1. **Direct build instead of pipeline** — forced by the model-access block described above.
2. **`better-sqlite3`** — synchronous API and a working prebuild; avoids the experimental `node:sqlite`.
3. **Pinned majors** — Express 5, EJS 3, Multer 2, Vitest 3, TypeScript 5, to avoid surprise major upgrades while keeping current security patches.
4. **Readiness excludes optional non-EA evidence** — keeps the headline explainable and avoids rewarding volume.
5. **Manual override is a first-class field** — lets an applicant record a considered judgement while preserving the checklist as the default.
6. **Activity log is informational** — recent actions appear on the dashboard but are not a full audit trail.

## Verification

- `npm run build` — TypeScript strict compile succeeds.
- `npm test` — 50 tests pass across 3 files.
- Live smoke test on `127.0.0.1:8770`:
  - `/`, `/evidence`, `/evidence/ea-a-degree`, `/case`, `/report` → 200;
  - unknown page → 404;
  - case profile saved;
  - progress saved (`[0,1,2,3]`, notes persisted);
  - upload accepted, listed, downloaded with the original filename, then deleted;
  - unsupported `.sh` upload rejected;
  - reset cleared progress but kept documents;
  - `/health` reflected readiness, EA met count, item/document/progress counts;
  - report contained the applicant name, notes, and document name.
- Smoke-test data was removed afterwards, so the delivered app starts clean.

## Known limitations

- Single user, no authentication; must stay on loopback.
- No OCR or PDF text extraction; the checklist is self-assessed.
- No automatic exhibit numbering or cross-reference validation.
- No encrypted backup/export; users must back up `data/` themselves.
- Report is HTML/print only; no generated PDF file.
- Legal content is a practical summary, not a substitute for an attorney or current USCIS guidance.

## Suggested next steps

1. Add opt-in LLM review of notes and evidence descriptions via a provider-agnostic layer.
2. Add PDF text extraction to pre-check uploaded exhibits.
3. Add an exhibit index generator with stable numbering.
4. Add encrypted export/import of the case database.
5. Add reminder dates for letters, translations, and filing.
6. Re-run the dev-firm pipeline against the brief once model access works, and compare output.
