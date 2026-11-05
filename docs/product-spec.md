# Product spec — NIW Evidence Tracker

## 1. Problem

A self-filing EB-2 National Interest Waiver applicant with an **exceptional ability** claim must assemble a large, cross-referenced evidence package:

- procedural documents (identity, Form I-140, fee, translations, credential evaluation, cover letter);
- at least **three of seven** exceptional-ability criteria under 8 CFR 204.5(k)(3)(i);
- evidence for each of the three *Dhanasar* prongs;
- supporting materials (exhibit index, timeline, review, backup).

The legal standard is clear but the work is unstructured. Applicants lose track of what exists, what is weak, and what is missing. Generic to-do apps do not model the regulation, and paid case-management tools are built for law firms.

## 2. Goal

A **local-first, single-user web app** that:

1. presents the full NIW evidence model as concrete items with tips;
2. stores and organizes the applicant's documents per item;
3. scores each item and labels it **Missing / Needs improvement / OK / Strong**;
4. computes an explainable readiness score and a short next-action list;
5. produces a printable readiness report;
6. never sends case data off the machine.

**Non-goals:** legal advice, approval prediction, e-filing, multi-user collaboration, attorney workflows, OCR, or automatic document generation.

## 3. Users

- **Primary:** a self-filing applicant with an advanced degree or exceptional-ability claim who is comfortable running a local Node app.
- **Secondary:** an applicant working with a reviewer who wants a shared checklist and a printable snapshot.

## 4. Legal model

| Group | Basis | Items | Required |
| --- | --- | --- | --- |
| Identity & procedural | Form I-140 instructions, 8 CFR 103.2, 8 CFR 204.5(k) | 7 | 7 |
| Exceptional ability A–G | 8 CFR 204.5(k)(2)–(3) | 7 | 0 (need 3 met) |
| Dhanasar prong 1 | *Matter of Dhanasar*, 26 I&N Dec. 884, 889–90 | 5 | 3 |
| Dhanasar prong 2 | *Dhanasar*, 890–91 | 11 | 2 |
| Dhanasar prong 3 | *Dhanasar*, 891–93 | 5 | 1 |
| Supporting materials | I-140 instructions, 8 CFR 103.2(b)(4)–(5) | 4 | 1 |

Total: **39 items** across 6 categories, each with a checklist, tips, weight, and legal citation.

## 5. Functional requirements

### 5.1 Dashboard

- Weighted readiness percentage.
- Counts for each status.
- `completed required / total required`.
- Total uploaded documents.
- Exceptional-ability progress `n / 3 met`, listing all seven criteria.
- Next actions: required items below OK plus enough unmet criteria to reach three.
- Category progress bars.
- Recent uploads and recent activity.
- Prompt to complete the case profile when empty.

### 5.2 Evidence catalog

- All items grouped by category.
- Per item: title, required pill, checklist progress, status badge, score, document count, weight.
- Category header shows the legal basis, description, item count, and weighted score.
- Status legend.

### 5.3 Evidence detail

- Description, legal basis, required/optional, weight, criterion letter.
- Checklist of item-specific criteria.
- Manual score override (0–100).
- Free-text notes and "improvements needed".
- Upload up to 5 files per request (PDF, DOC/DOCX/RTF/TXT/MD, PNG/JPG/WEBP/TIF), max 15 MB each.
- Document list with download and delete.
- Improvement tips and a reminder that scoring is not a legal determination.

### 5.4 Case profile

- Full name, email, field of exceptional ability, one-paragraph endeavor, target filing date.
- Stored locally and rendered on the report.

### 5.5 Readiness report

- Applicant header, target date, generation timestamp.
- Summary statistics.
- Exceptional-ability table and met count.
- Per-category sections with per-item status, score, notes, improvements, and document names.
- Print stylesheet (save as PDF).
- Prominent disclaimer.

### 5.6 Health

`GET /health` returns JSON: `ok`, `app`, `version`, `uptimeSeconds`, `dataDir`, `readiness`, `exceptionalAbilityMet`, `items`, `documents`, `progressRows`.

## 6. Scoring specification

```
score = manualOverride ?? round(checkedCriteria / totalCriteria * 100)
status = missing            if score == 0 and documents == 0
       = needs_improvement  if score < 70
       = ok                 if 70 <= score < 85
       = strong             if score >= 85
```

```
overall = weightedAverage(requiredItems ∪ threeStrongestExceptionalAbilityItems)
category = weightedAverage(all items in category)
weight = max(1, item.weight)
```

The three-strongest rule reflects the regulation: only three criteria are required, so a fourth or fifth strong criterion should not be punished for the absence of the others. The exceptional-ability panel separately reports whether the three-criterion threshold is satisfied.

## 7. Non-functional requirements

- **Local only:** bind `127.0.0.1`, no outbound calls, no telemetry.
- **Private storage:** SQLite + uploads in `./data`, gitignored.
- **Safe uploads:** extension allowlist, size limit, random stored filenames, path basename on download/delete.
- **Resilient catalog:** item text syncs on every start without erasing progress.
- **Accessible UI:** skip link, labelled form controls, status text (not colour alone), keyboard-friendly.
- **Responsive and printable.**
- **Tested:** scoring, persistence, and HTTP flows.
- **TypeScript strict mode.**

## 8. Success criteria

- `npm run build` succeeds with strict TypeScript.
- `npm test` passes.
- A user can, from a clean install: complete the case profile, score an item, upload/download/delete a document, and print a report containing their data.
- No case data leaves the machine.

## 9. Future work

- Optional LLM-assisted review of notes and document checklists (provider-agnostic, opt-in).
- PDF text extraction to check whether an uploaded document satisfies a criterion.
- Exhibit numbering that auto-generates an index and cross-references.
- Encrypted backup/export bundle.
- Deadline reminders and letter-tracking.
- Import/export of the case database.

## 10. Disclaimer

This product is informational. It is **not legal advice**, does not create an attorney–client relationship, does not predict approval, and does not determine legal sufficiency. Applicants remain responsible for verifying current USCIS forms, fees, and policy.
