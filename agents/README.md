# NIW agent definitions

These Markdown files define the NIW tracker's agents. They are loaded at
runtime by `src/agents/definitions.ts`; editing one changes the next agent run
without a rebuild or restart. There are no per-role TypeScript wrappers —
`src/agents/dynamic.ts` is the single script base that runs any definition.

This tracker is an informational self-assessment aid. Agent outputs must never
be presented as legal advice, and system prompts must keep that disclaimer.

## Format

```md
---
id: readiness_reviewer
name: Readiness Reviewer
role: readiness_reviewer
description: Reviews one evidence item and recommends a score and next steps.
schema: readiness_review
workflow: niw_review
temperature: 0.2
max_tokens: null
---

# System Prompt

You are ...

# Task

Review this evidence item for readiness:

{{evidence_item}}
```

## Frontmatter

| Key | Required | Meaning |
|---|---|---|
| `id` | no | Unique agent id; defaults to the filename. |
| `name` | no | Human-readable name; defaults to `id`. |
| `role` | no | Audit role; defaults to `id`. |
| `description` | no | One-line summary shown by `niw agents`. |
| `schema` | no | `readiness_review`, `report_summary`, or `none` (default). |
| `workflow` | no | Workflow label; defaults to `id`. |
| `temperature` | no | Sampling temperature; defaults to `0.2`. |
| `max_tokens` | no | Per-call token cap; `null` uses the global setting. |

## Sections

- `# System Prompt` — the role prompt. Required.
- `# Task` — the user task template. `{{name}}` placeholders are replaced with
  the values supplied by the caller; objects are pretty-printed as JSON. Keep
  subsection headings at `###` or deeper so they do not split the sections.

## Overrides

The loader searches the bundled `agents/` directory first, then
`<dataDir>/agents` (default `data/agents`). A file in a later directory with
the same `id` replaces the bundled definition. `NIW_AGENTS_DIR` changes the
override directory.

## Adding an agent

1. Add `agents/<name>.md` with frontmatter and `# System Prompt` / `# Task`
   sections (see above). If the output needs validation, declare a `schema:`
   name and add the validator to `src/agents/schema.ts`.
2. Run it with `runAgentById('<id>', variables, completer)` from
   `src/agents/dynamic.ts`. No new TypeScript module is needed.
