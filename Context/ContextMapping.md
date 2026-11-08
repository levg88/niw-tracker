# ContextMapping — Agent Knowledge Router

> Single entry point for domain knowledge in this repo. Read this FIRST, then read the `Memory.md` files for the topics your task touches.

## How to use

0. **Always first — project orientation**: read `Context/Overview/Memory.md` before anything else, regardless of topic match. It says what this project is and how it is organized. Skip only if it is already in your context this session.
1. **Before a task**: find your topic(s) in the table below (aliases count). Read those `Memory.md` files.
2. **During/after a task**: learned substantial new domain info? Write it to `Context/_inbox/` (format: `_inbox/README.md`). Do NOT edit `Memory.md` directly — the Librarian agent (`/curate-context`) owns those files.
3. **Explicit load**: `/context <topic>` loads a topic's Memory.md into the conversation.

## Topic table

| Topic | Aliases | Path |
|---|---|---|
| Overview | project overview, what this project is, orientation | `Context/Overview/Memory.md` |
| NIW Legal Framework | NIW, national interest waiver, Dhanasar, exceptional ability, 8 CFR 204.5(k), EB-2, prongs | `Context/Domain/NIW-Legal-Framework/Memory.md` |
| Evidence Catalog | evidence catalog, evidence items, checklist criteria, criteria A-G, legal citation, required evidence | `Context/Domain/Evidence-Catalog/Memory.md` |
| Scoring Readiness | scoring, readiness score, status thresholds, weighted average, next actions, exceptional ability progress | `Context/Domain/Scoring-Readiness/Memory.md` |
| Document Management | uploads, document upload, file storage, allowed extensions, download document, delete document | `Context/Domain/Document-Management/Memory.md` |
| Readiness Report | readiness report, printable report, save as PDF, case profile, exhibit summary | `Context/Domain/Readiness-Report/Memory.md` |
| Data Storage | sqlite, database schema, niw.db, data directory, catalog sync, uploads directory | `Context/Platform/Data-Storage/Memory.md` |
| Configuration Hosting | configuration, environment variables, NIW_PORT, NIW_DATA_DIR, upload limit, local-only | `Context/Platform/Configuration-Hosting/Memory.md` |
| Testing CI | tests, vitest, supertest, github actions, typecheck, test suite | `Context/Platform/Testing-CI/Memory.md` |

## External sources (canonical home is NOT Context/)

| Topic | Canonical source |
|---|---|
| Config values | `src/config.ts` and the `README.md` Configuration table — canonical env vars and defaults |
| Evidence catalog content | `src/catalog.ts` — the app's canonical evidence items, criteria, tips, and citations |
| Primary legal sources | eCFR 8 CFR 204.5(k), USCIS Form I-140 instructions, and *Matter of Dhanasar* — verify current text; this repo is not legal advice |
| Code structure | `src/**` and the README "Project structure" section — no generated code graph exists |
| API routes | `src/routes.ts` |
| Database schema | `src/db.ts` `SCHEMA` constant |
| Package scripts and dependencies | `package.json` |

## Write rules

1. Domain knowledge only — knowledge about the code's structure belongs in generated docs or a code graph, not here.
2. **NEVER secrets or credentials** (passwords, tokens, connection strings).
3. **Every fact tagged** `(OS, YYYY-MM-DD)` or `(General)`.
4. Supersede, don't append duplicates — a newer dated fact replaces an older one.
5. All writes go through `_inbox/` → Librarian. New topics: the Librarian creates the folder and registers it here.
6. **Auth-gated external sources** (SSO wikis, SharePoint): a URL pointer alone is useless to a headless agent. Mirror the content as a dated snapshot file NEXT TO the topic's `Memory.md`, link it from that file's Pointers section, and note the refresh procedure. `Memory.md` keeps the stable facts; the mirror holds the volatile tables.
