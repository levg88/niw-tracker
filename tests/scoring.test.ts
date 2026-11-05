import { describe, expect, it } from 'vitest';

import {
  clampScore,
  computeScore,
  deriveStatus,
  emptyProgress,
  scoreTone,
  statusClass,
  summarize,
} from '../src/scoring';
import { buildItemState } from '../src/scoring';
import { CATEGORIES, EVIDENCE_CATALOG } from '../src/catalog';
import type { DocumentRecord, EvidenceItem, ItemState } from '../src/types';

function makeItem(overrides: Partial<EvidenceItem> = {}): EvidenceItem {
  return {
    id: 1,
    slug: 'test-item',
    category: 'procedural',
    code: '',
    title: 'Test item',
    description: 'A test item.',
    legalBasis: 'Test basis',
    required: true,
    weight: 5,
    sortOrder: 0,
    criteria: ['one', 'two', 'three', 'four'],
    tips: ['tip'],
    ...overrides,
  };
}

function makeDocument(id: number, itemId = 1): DocumentRecord {
  return {
    id,
    itemId,
    originalName: `doc-${id}.pdf`,
    storedName: `stored-${id}.pdf`,
    mime: 'application/pdf',
    size: 10,
    uploadedAt: new Date().toISOString(),
  };
}

function stateFor(
  item: EvidenceItem,
  checked: number[],
  documents: DocumentRecord[] = [],
  manualScore: number | null = null,
): ItemState {
  return buildItemState(
    item,
    { ...emptyProgress(item.id), checkedCriteria: checked, manualScore },
    documents,
  );
}

describe('clampScore', () => {
  it('rounds and clamps to 0–100', () => {
    expect(clampScore(-10)).toBe(0);
    expect(clampScore(49.4)).toBe(49);
    expect(clampScore(49.5)).toBe(50);
    expect(clampScore(140)).toBe(100);
  });

  it('returns 0 for non-finite values', () => {
    expect(clampScore(Number.NaN)).toBe(0);
    expect(clampScore(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe('computeScore', () => {
  it('uses the checked percentage when there is no override', () => {
    expect(computeScore(0, 4)).toBe(0);
    expect(computeScore(1, 4)).toBe(25);
    expect(computeScore(3, 4)).toBe(75);
    expect(computeScore(4, 4)).toBe(100);
  });

  it('prefers a manual override and clamps it', () => {
    expect(computeScore(0, 4, 88)).toBe(88);
    expect(computeScore(4, 4, -5)).toBe(0);
    expect(computeScore(0, 4, 250)).toBe(100);
  });

  it('treats a null override as absent', () => {
    expect(computeScore(2, 4, null)).toBe(50);
  });

  it('never divides by zero', () => {
    expect(computeScore(0, 0)).toBe(0);
  });
});

describe('deriveStatus', () => {
  it('is missing only when there is no score and no documents', () => {
    expect(deriveStatus(0, 0)).toBe('missing');
    expect(deriveStatus(0, 1)).toBe('needs_improvement');
  });

  it('applies the 70 and 85 thresholds', () => {
    expect(deriveStatus(69, 0)).toBe('needs_improvement');
    expect(deriveStatus(70, 0)).toBe('ok');
    expect(deriveStatus(84, 0)).toBe('ok');
    expect(deriveStatus(85, 0)).toBe('strong');
    expect(deriveStatus(100, 0)).toBe('strong');
  });
});

describe('helpers', () => {
  it('maps statuses to CSS classes and tones', () => {
    expect(statusClass('needs_improvement')).toBe('needs-improvement');
    expect(scoreTone(0)).toBe('missing');
    expect(scoreTone(10)).toBe('needs-improvement');
    expect(scoreTone(70)).toBe('ok');
    expect(scoreTone(90)).toBe('strong');
  });
});

describe('buildItemState', () => {
  it('ignores out-of-range and duplicate checks', () => {
    const state = stateFor(makeItem(), [0, 0, 2, 9, -1]);
    expect(state.checkedCount).toBe(2);
    expect(state.progress.checkedCriteria).toEqual([0, 2]);
    expect(state.score).toBe(50);
    expect(state.status).toBe('needs_improvement');
  });

  it('counts uploaded documents in the status', () => {
    const state = stateFor(makeItem(), [], [makeDocument(1)]);
    expect(state.score).toBe(0);
    expect(state.status).toBe('needs_improvement');
  });
});

describe('summarize', () => {
  const requiredItem = makeItem({ id: 1, slug: 'required', required: true, weight: 5 });
  const eaA = makeItem({
    id: 2,
    slug: 'ea-a',
    category: 'exceptional_ability',
    code: 'A',
    required: false,
    weight: 4,
  });
  const eaB = makeItem({
    id: 3,
    slug: 'ea-b',
    category: 'exceptional_ability',
    code: 'B',
    required: false,
    weight: 4,
  });
  const eaC = makeItem({
    id: 4,
    slug: 'ea-c',
    category: 'exceptional_ability',
    code: 'C',
    required: false,
    weight: 4,
  });
  const eaD = makeItem({
    id: 5,
    slug: 'ea-d',
    category: 'exceptional_ability',
    code: 'D',
    required: false,
    weight: 4,
  });

  it('reports the empty case as zero readiness and missing', () => {
    const summary = summarize([
      stateFor(requiredItem, []),
      stateFor(eaA, []),
      stateFor(eaB, []),
      stateFor(eaC, []),
      stateFor(eaD, []),
    ]);
    expect(summary.overallScore).toBe(0);
    expect(summary.counts.missing).toBe(5);
    expect(summary.exceptionalAbility.metCount).toBe(0);
    expect(summary.exceptionalAbility.satisfied).toBe(false);
    expect(summary.completedRequired).toBe(0);
    expect(summary.totalRequired).toBe(1);
    expect(summary.nextActions.map((action) => action.slug)).toContain('required');
  });

  it('counts only the three strongest exceptional-ability criteria', () => {
    const summary = summarize([
      stateFor(requiredItem, [0, 1, 2, 3]),
      stateFor(eaA, [0, 1, 2, 3]),
      stateFor(eaB, [0, 1, 2, 3]),
      stateFor(eaC, [0, 1]),
      stateFor(eaD, []),
    ]);
    expect(summary.exceptionalAbility.metCount).toBe(2);
    expect(summary.exceptionalAbility.satisfied).toBe(false);
    // Required (100) + A (100) + B (100) + C (50) => 350 / 4
    expect(summary.overallScore).toBe(88);
    // Only one more criterion is needed, so only the strongest unmet one is recommended.
    expect(summary.nextActions.map((action) => action.slug)).toContain('ea-c');
    expect(summary.nextActions.map((action) => action.slug)).not.toContain('ea-d');
  });

  it('becomes satisfied at three met criteria and stops recommending criteria', () => {
    const summary = summarize([
      stateFor(requiredItem, [0, 1, 2, 3]),
      stateFor(eaA, [0, 1, 2, 3]),
      stateFor(eaB, [0, 1, 2, 3]),
      stateFor(eaC, [0, 1, 2, 3]),
      stateFor(eaD, []),
    ]);
    expect(summary.exceptionalAbility.metCount).toBe(3);
    expect(summary.exceptionalAbility.satisfied).toBe(true);
    expect(summary.overallScore).toBe(100);
    expect(summary.nextActions.map((action) => action.slug)).not.toContain('ea-d');
  });

  it('builds one category summary per catalog category', () => {
    const summary = summarize([stateFor(requiredItem, [])]);
    expect(summary.categories.map((category) => category.key)).toEqual(
      CATEGORIES.map((category) => category.key),
    );
    expect(summary.totalItems).toBe(1);
  });
});

describe('catalog integrity', () => {
  it('has unique slugs', () => {
    const slugs = EVIDENCE_CATALOG.map((item) => item.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('covers all seven exceptional-ability criteria exactly once', () => {
    const codes = EVIDENCE_CATALOG.filter(
      (item) => item.category === 'exceptional_ability',
    ).map((item) => item.code);
    expect(codes.sort()).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
  });

  it('gives every item criteria, tips, and a valid weight', () => {
    for (const item of EVIDENCE_CATALOG) {
      expect(item.criteria.length, item.slug).toBeGreaterThan(0);
      expect(item.tips.length, item.slug).toBeGreaterThan(0);
      expect(item.weight, item.slug).toBeGreaterThanOrEqual(1);
      expect(item.weight, item.slug).toBeLessThanOrEqual(5);
    }
  });

  it('assigns every item to a declared category', () => {
    const keys = new Set(CATEGORIES.map((category) => category.key));
    for (const item of EVIDENCE_CATALOG) {
      expect(keys.has(item.category), item.slug).toBe(true);
    }
  });
});
