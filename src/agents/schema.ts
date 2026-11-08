/**
 * @file Mapping from markdown `schema:` names to output validators.
 *
 * Agent definitions stay declarative; the runtime resolves the named validator
 * here so JSON output is still checked. Validators are plain functions (no
 * zod dependency) and throw with a field-level message on failure.
 */

import type { AgentDefinition, AgentSchemaName } from './definitions';

export interface ReadinessReview {
  slug: string;
  score: number;
  status: 'missing' | 'needs_improvement' | 'ok' | 'strong';
  summary: string;
  evidenceGaps: string[];
  recommendations: string[];
}

export interface ReportSummary {
  overallScore: number;
  summary: string;
  nextActions: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
    throw new Error(`Invalid report: field '${field}' must be an array of strings`);
  }
  return value as string[];
}

function clampScore(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error("Invalid review: field 'score' must be a number");
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** Validate a `readiness_review` payload and return the typed review. */
export function parseReadinessReview(value: unknown): ReadinessReview {
  if (!isRecord(value)) throw new Error('Invalid review: expected a JSON object');
  const score = clampScore(value.score);
  const status = value.status;
  if (status !== 'missing' && status !== 'needs_improvement' && status !== 'ok' && status !== 'strong') {
    throw new Error("Invalid review: field 'status' must be missing|needs_improvement|ok|strong");
  }
  if (typeof value.slug !== 'string' || !value.slug.trim()) {
    throw new Error("Invalid review: field 'slug' must be a non-empty string");
  }
  if (typeof value.summary !== 'string' || !value.summary.trim()) {
    throw new Error("Invalid review: field 'summary' must be a non-empty string");
  }
  return {
    slug: value.slug,
    score,
    status,
    summary: value.summary,
    evidenceGaps: stringArray(value.evidenceGaps ?? [], 'evidenceGaps'),
    recommendations: stringArray(value.recommendations ?? [], 'recommendations'),
  };
}

/** Validate a `report_summary` payload and return the typed summary. */
export function parseReportSummary(value: unknown): ReportSummary {
  if (!isRecord(value)) throw new Error('Invalid summary: expected a JSON object');
  if (typeof value.overallScore !== 'number' || !Number.isFinite(value.overallScore)) {
    throw new Error("Invalid summary: field 'overallScore' must be a number");
  }
  if (typeof value.summary !== 'string' || !value.summary.trim()) {
    throw new Error("Invalid summary: field 'summary' must be a non-empty string");
  }
  return {
    overallScore: clampScore(value.overallScore),
    summary: value.summary,
    nextActions: stringArray(value.nextActions ?? [], 'nextActions'),
  };
}

export type AgentOutput = ReadinessReview | ReportSummary | Record<string, unknown>;

/** Resolve the validator declared by an agent definition, if any. */
export function validatorForAgent(
  definition: AgentDefinition,
): ((value: unknown) => AgentOutput) | undefined {
  const name: AgentSchemaName = definition.schema;
  if (name === 'none') return undefined;
  if (name === 'readiness_review') return parseReadinessReview;
  return parseReportSummary;
}
