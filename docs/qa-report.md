# QA report

## Scope

Verified the `niw-tracker` build, automated tests, and a live end-to-end smoke test of every user-facing flow.

## Environment

- macOS (darwin), Node.js 26.13.0, npm 11.20.0
- TypeScript 5.9.3 (strict), Express 5.3.0, EJS 3.1.10, multer 2.5.0, better-sqlite3 13.0.3
- vitest 3.2.7, supertest 7.3.1
- Server: `127.0.0.1:8770`, data dir `./data`

## Automated checks

### Build

```
npm run build
> tsc -p tsconfig.json
exit 0
```

Strict TypeScript compile with no errors.

### Tests

```
npm test
> vitest run

 ✓ tests/scoring.test.ts (19 tests)
 ✓ tests/db.test.ts (14 tests)
 ✓ tests/app.test.ts (17 tests)

 Test Files  3 passed (3)
      Tests  50 passed (50)
```

Coverage by area:

| Area | Cases |
| --- | --- |
| Score clamping/rounding | negative, fractional, >100, NaN/Infinity |
| Checklist score | 0/25/50/75/100, zero-criteria guard |
| Manual override | preferred, clamped, null ignored |
| Status thresholds | missing vs needs improvement at 0 with/without docs; 69/70/84/85 |
| State derivation | duplicate/out-of-range checks ignored |
| Readiness | empty case, three-strongest rule, satisfaction at 3, category list |
| Catalog | unique slugs, A–G exactly once, criteria/tips/weights, valid categories |
| Persistence | first sync, idempotent reopen, progress round-trip, reset |
| Documents | add/list/get/delete, recent-with-title, cascade delete |
| Case profile | empty default, create, update |
| Activity | newest-first ordering |
| HTTP pages | dashboard, catalog, detail, case, report, 404s |
| Progress | save, override clamp, invalid override, reset keeps documents |
| Uploads | single, multiple, no-file rejection, unsupported extension, download headers, delete, unknown id |
| Case via HTTP | save + reflected in report |
| Health | readiness, EA count, catalog/document/progress stats |

One test initially over-specified the next-action list (expected two recommendations when only one more criterion was needed). The app behavior was correct; the assertion was tightened to match the intended rule.

## Live smoke test

| Step | Expected | Observed |
| --- | --- | --- |
| `GET /health` | 200, `ok: true` | `{"ok":true,...,"items":39,"documents":0}` |
| `GET /` | 200 dashboard | 200 |
| `GET /evidence` | 200 catalog | 200 |
| `GET /evidence/ea-a-degree` | 200 detail | 200 |
| `GET /case` | 200 form | 200 |
| `GET /report` | 200 report | 200 |
| `GET /nope` | 404 page | 404 |
| `POST /case` | 302 + saved profile | 302, profile in DB |
| `POST /evidence/ea-a-degree` | 302 + progress | 302, `[0,1,2,3]`, notes saved |
| `POST .../documents` | 302 + file stored | 302, 1 document, 20 bytes |
| `GET /documents/1` | 200 attachment | 200, `Content-Disposition: attachment; filename=niw-evidence.txt` |
| Upload `.sh` | rejected | 302 with "Unsupported file type" |
| `POST .../reset` | progress cleared, docs kept | 302, progress 0, document kept |
| `POST /documents/1/delete` | 302 + removed | 302, DB and disk clean |
| `/health` after progress | readiness > 0, EA met = 1 | `readiness: 5, exceptionalAbilityMet: 1` |
| `/report` contents | applicant, notes, file name | all present |

The readiness value of 5 is correct for one fully checked EA item against 39 mostly-missing items, given the weighted formula.

## Non-functional checks

- **Strict typing:** compile passes with `strict: true`.
- **Isolation:** tests use temporary directories; real `data/` was removed after the smoke test.
- **Upload safety:** extension allowlist, 15 MB limit, 5-file limit, UUID storage names, `path.basename` on file access.
- **HTML escaping:** user text is rendered with `<%= %>` in all templates.
- **Accessibility:** skip link, labelled inputs, status conveyed by text as well as colour, progress bars with ARIA attributes.
- **Responsive/print:** layouts collapse at 980/760 px; report hides navigation and chrome when printing.
- **Disclaimer:** present on every page footer and prominently in the report.

## Risks and gaps

| Risk | Severity | Note |
| --- | --- | --- |
| No authentication | Medium | Acceptable only because it binds to loopback. Do not expose publicly. |
| Self-assessed scores | Medium | The app cannot verify that a document actually satisfies a criterion. |
| Legal content can age | Medium | Fees/forms/policy change; UI tells users to verify before filing. |
| No encrypted backup | Low | Users must back up `data/` themselves. |
| No PDF generation | Low | Print-to-PDF is the supported path. |
| Activity log not tamper-evident | Low | Informational only. |

## Verdict

**Pass.** Build, automated tests, and live smoke tests all succeed. The app is usable end to end for a single local user, with the limitations above documented and surfaced in the UI.
