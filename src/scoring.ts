import { CATEGORIES } from './catalog';
import type {
  CategorySummary,
  DocumentRecord,
  EvidenceItem,
  ExceptionalAbilityCriterion,
  ItemProgress,
  ItemState,
  NextAction,
  ReadinessSummary,
  Status,
  StatusCounts,
} from './types';

export const STATUS_LABELS: Record<Status, string> = {
  missing: 'Missing',
  needs_improvement: 'Needs improvement',
  ok: 'OK',
  strong: 'Strong',
};

export const STATUS_ORDER: Status[] = ['missing', 'needs_improvement', 'ok', 'strong'];

/** The number of exceptional-ability criteria that must be met. */
export const EXCEPTIONAL_ABILITY_TARGET = 3;

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Score an evidence item.
 *
 * A manual override wins (clamped to 0–100). Otherwise the score is the share
 * of checklist criteria that are checked.
 */
export function computeScore(
  checkedCount: number,
  totalCriteria: number,
  manualScore?: number | null,
): number {
  if (manualScore !== null && manualScore !== undefined && Number.isFinite(manualScore)) {
    return clampScore(manualScore);
  }
  if (totalCriteria <= 0) return 0;
  const checked = Math.max(0, Math.min(checkedCount, totalCriteria));
  return clampScore((checked / totalCriteria) * 100);
}

/**
 * Derive the display status.
 *
 * A score of zero with no uploaded documents is "missing"; once a document
 * exists, an unscored item is "needs_improvement" rather than missing.
 */
export function deriveStatus(score: number, documentCount: number): Status {
  const value = clampScore(score);
  if (value <= 0 && documentCount === 0) return 'missing';
  if (value < 70) return 'needs_improvement';
  if (value < 85) return 'ok';
  return 'strong';
}

export function statusClass(status: Status): string {
  return status.replace(/_/g, '-');
}

/** CSS tone for a progress bar, derived from the score thresholds. */
export function scoreTone(score: number): string {
  const value = clampScore(score);
  if (value <= 0) return 'missing';
  if (value < 70) return 'needs-improvement';
  if (value < 85) return 'ok';
  return 'strong';
}

export function emptyProgress(itemId: number): ItemProgress {
  return {
    itemId,
    checkedCriteria: [],
    manualScore: null,
    notes: '',
    improvements: '',
    lastReviewed: null,
    updatedAt: null,
  };
}

export function buildItemState(
  item: EvidenceItem,
  progress: ItemProgress,
  documents: DocumentRecord[],
): ItemState {
  const validChecked = [...new Set(progress.checkedCriteria)].filter(
    (index) => Number.isInteger(index) && index >= 0 && index < item.criteria.length,
  );
  const checkedCount = validChecked.length;
  const totalCriteria = item.criteria.length;
  const score = computeScore(checkedCount, totalCriteria, progress.manualScore);
  const status = deriveStatus(score, documents.length);
  return {
    item,
    progress: { ...progress, checkedCriteria: validChecked.sort((a, b) => a - b) },
    documents,
    checkedCount,
    totalCriteria,
    score,
    status,
  };
}

function emptyCounts(): StatusCounts {
  return { missing: 0, needs_improvement: 0, ok: 0, strong: 0 };
}

function weightedScore(items: ItemState[]): number {
  let weightSum = 0;
  let total = 0;
  for (const state of items) {
    const weight = Math.max(1, state.item.weight);
    weightSum += weight;
    total += state.score * weight;
  }
  return weightSum > 0 ? Math.round(total / weightSum) : 0;
}

function isMet(status: Status): boolean {
  return status === 'ok' || status === 'strong';
}

/**
 * Build the whole-case readiness summary.
 *
 * Readiness counts every required item plus the applicant's three strongest
 * exceptional-ability criteria, because the regulation requires only three of
 * the seven. Optional evidence is displayed but does not inflate or deflate the
 * headline number.
 */
export function summarize(states: ItemState[]): ReadinessSummary {
  const counts = emptyCounts();
  for (const state of states) counts[state.status] += 1;

  const totalDocuments = states.reduce((sum, state) => sum + state.documents.length, 0);

  const categories: CategorySummary[] = CATEGORIES.map((category) => {
    const items = states.filter((state) => state.item.category === category.key);
    const categoryCounts = emptyCounts();
    for (const item of items) categoryCounts[item.status] += 1;
    return {
      key: category.key,
      title: category.title,
      shortTitle: category.shortTitle,
      description: category.description,
      legalBasis: category.legalBasis,
      itemCount: items.length,
      score: weightedScore(items),
      counts: categoryCounts,
      requiredRemaining: items.filter((item) => item.item.required && !isMet(item.status)).length,
    };
  });

  const eaStates = states
    .filter((state) => state.item.category === 'exceptional_ability')
    .sort((a, b) => a.item.code.localeCompare(b.item.code));

  const criteria: ExceptionalAbilityCriterion[] = eaStates.map((state) => ({
    code: state.item.code,
    slug: state.item.slug,
    title: state.item.title,
    status: state.status,
    score: state.score,
    met: isMet(state.status),
  }));

  const metCount = criteria.filter((criterion) => criterion.met).length;

  const required = states.filter((state) => state.item.required);
  const bestEa = [...eaStates].sort((a, b) => b.score - a.score).slice(0, EXCEPTIONAL_ABILITY_TARGET);
  const overallScore = weightedScore([...required, ...bestEa]);

  const nextActions: NextAction[] = [];
  const pushAction = (state: ItemState) => {
    if (nextActions.some((action) => action.slug === state.item.slug)) return;
    nextActions.push({
      slug: state.item.slug,
      title: state.item.title,
      category: state.item.category,
      status: state.status,
      score: state.score,
      weight: state.item.weight,
      tips: state.item.tips.slice(0, 3),
    });
  };

  for (const state of required) {
    if (!isMet(state.status)) pushAction(state);
  }

  if (metCount < EXCEPTIONAL_ABILITY_TARGET) {
    const needed = EXCEPTIONAL_ABILITY_TARGET - metCount;
    let added = 0;
    for (const state of [...eaStates].sort((a, b) => b.score - a.score)) {
      if (added >= needed) break;
      if (isMet(state.status)) continue;
      if (nextActions.some((action) => action.slug === state.item.slug)) continue;
      pushAction(state);
      added += 1;
    }
  }

  nextActions.sort(
    (a, b) => b.weight - a.weight || a.score - b.score || a.title.localeCompare(b.title),
  );

  const completedRequired = required.filter((state) => isMet(state.status)).length;

  return {
    overallScore,
    totalItems: states.length,
    totalDocuments,
    counts,
    categories,
    exceptionalAbility: {
      criteria,
      metCount,
      target: EXCEPTIONAL_ABILITY_TARGET,
      satisfied: metCount >= EXCEPTIONAL_ABILITY_TARGET,
    },
    nextActions: nextActions.slice(0, 10),
    completedRequired,
    totalRequired: required.length,
  };
}
