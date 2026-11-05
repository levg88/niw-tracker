/**
 * Shared domain types for the NIW exceptional-ability tracker.
 *
 * The app models two layers of law:
 *  - 8 CFR 204.5(k): exceptional ability, three of seven criteria (A–G)
 *  - Matter of Dhanasar: the three-prong national interest waiver test
 */

export type CategoryKey =
  | 'procedural'
  | 'exceptional_ability'
  | 'dhanasar_1'
  | 'dhanasar_2'
  | 'dhanasar_3'
  | 'supporting';

export type Status = 'missing' | 'needs_improvement' | 'ok' | 'strong';

export interface CategoryDefinition {
  key: CategoryKey;
  title: string;
  shortTitle: string;
  description: string;
  legalBasis: string;
}

export interface EvidenceDefinition {
  slug: string;
  category: CategoryKey;
  /** Criterion letter for exceptional-ability items (A–G), otherwise empty. */
  code: string;
  title: string;
  description: string;
  legalBasis: string;
  required: boolean;
  /** Relative importance, 1–5. Used for the weighted readiness score. */
  weight: number;
  criteria: string[];
  tips: string[];
}

export interface EvidenceItem extends EvidenceDefinition {
  id: number;
  sortOrder: number;
}

export interface ItemProgress {
  itemId: number;
  checkedCriteria: number[];
  manualScore: number | null;
  notes: string;
  improvements: string;
  lastReviewed: string | null;
  updatedAt: string | null;
}

export interface DocumentRecord {
  id: number;
  itemId: number;
  originalName: string;
  storedName: string;
  mime: string;
  size: number;
  uploadedAt: string;
}

export interface ItemState {
  item: EvidenceItem;
  progress: ItemProgress;
  documents: DocumentRecord[];
  checkedCount: number;
  totalCriteria: number;
  score: number;
  status: Status;
}

export interface StatusCounts {
  missing: number;
  needs_improvement: number;
  ok: number;
  strong: number;
}

export interface CategorySummary {
  key: CategoryKey;
  title: string;
  shortTitle: string;
  description: string;
  legalBasis: string;
  itemCount: number;
  score: number;
  counts: StatusCounts;
  requiredRemaining: number;
}

export interface ExceptionalAbilityCriterion {
  code: string;
  slug: string;
  title: string;
  status: Status;
  score: number;
  met: boolean;
}

export interface NextAction {
  slug: string;
  title: string;
  category: CategoryKey;
  status: Status;
  score: number;
  weight: number;
  tips: string[];
}

export interface ReadinessSummary {
  overallScore: number;
  totalItems: number;
  totalDocuments: number;
  counts: StatusCounts;
  categories: CategorySummary[];
  exceptionalAbility: {
    criteria: ExceptionalAbilityCriterion[];
    metCount: number;
    target: number;
    satisfied: boolean;
  };
  nextActions: NextAction[];
  completedRequired: number;
  totalRequired: number;
}

export interface CaseProfile {
  fullName: string;
  email: string;
  field: string;
  endeavorSummary: string;
  targetFilingDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityEntry {
  id: number;
  action: string;
  detail: string;
  createdAt: string;
}

export interface DashboardData {
  summary: ReadinessSummary;
  states: ItemState[];
  recentDocuments: Array<DocumentRecord & { itemTitle: string; itemSlug: string }>;
  activity: ActivityEntry[];
}
