import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { EVIDENCE_CATALOG } from './catalog';
import { buildItemState, emptyProgress } from './scoring';
import type {
  ActivityEntry,
  CaseProfile,
  DocumentRecord,
  EvidenceItem,
  ItemProgress,
  ItemState,
} from './types';

interface ItemRow {
  id: number;
  slug: string;
  category: string;
  code: string;
  title: string;
  description: string;
  legal_basis: string;
  required: number;
  weight: number;
  sort_order: number;
  criteria_json: string;
  tips_json: string;
}

interface ProgressRow {
  item_id: number;
  checked_json: string;
  manual_score: number | null;
  notes: string;
  improvements: string;
  last_reviewed: string | null;
  updated_at: string | null;
}

interface DocumentRow {
  id: number;
  item_id: number;
  original_name: string;
  stored_name: string;
  mime: string;
  size: number;
  uploaded_at: string;
}

interface CaseRow {
  full_name: string;
  email: string;
  field: string;
  endeavor_summary: string;
  target_filing_date: string;
  created_at: string;
  updated_at: string;
}

interface ActivityRow {
  id: number;
  action: string;
  detail: string;
  created_at: string;
}

export interface ProgressPatch {
  checkedCriteria: number[];
  manualScore: number | null;
  notes: string;
  improvements: string;
}

export interface NewDocument {
  itemId: number;
  originalName: string;
  storedName: string;
  mime: string;
  size: number;
}

export interface CaseProfileInput {
  fullName: string;
  email: string;
  field: string;
  endeavorSummary: string;
  targetFilingDate: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function parseJsonArray(value: string): unknown[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapItem(row: ItemRow): EvidenceItem {
  return {
    id: row.id,
    slug: row.slug,
    category: row.category as EvidenceItem['category'],
    code: row.code,
    title: row.title,
    description: row.description,
    legalBasis: row.legal_basis,
    required: row.required === 1,
    weight: row.weight,
    sortOrder: row.sort_order,
    criteria: parseJsonArray(row.criteria_json).filter(
      (entry): entry is string => typeof entry === 'string',
    ),
    tips: parseJsonArray(row.tips_json).filter(
      (entry): entry is string => typeof entry === 'string',
    ),
  };
}

function mapProgress(row: ProgressRow | undefined, itemId: number): ItemProgress {
  if (!row) return emptyProgress(itemId);
  return {
    itemId: row.item_id,
    checkedCriteria: parseJsonArray(row.checked_json).filter(
      (entry): entry is number => typeof entry === 'number',
    ),
    manualScore: row.manual_score,
    notes: row.notes,
    improvements: row.improvements,
    lastReviewed: row.last_reviewed,
    updatedAt: row.updated_at,
  };
}

function mapDocument(row: DocumentRow): DocumentRecord {
  return {
    id: row.id,
    itemId: row.item_id,
    originalName: row.original_name,
    storedName: row.stored_name,
    mime: row.mime,
    size: row.size,
    uploadedAt: row.uploaded_at,
  };
}

function mapCase(row: CaseRow | undefined): CaseProfile {
  if (!row) {
    return {
      fullName: '',
      email: '',
      field: '',
      endeavorSummary: '',
      targetFilingDate: '',
      createdAt: '',
      updatedAt: '',
    };
  }
  return {
    fullName: row.full_name,
    email: row.email,
    field: row.field,
    endeavorSummary: row.endeavor_summary,
    targetFilingDate: row.target_filing_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class Repository {
  readonly db: Database.Database;

  constructor(dbPath: string) {
    mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.migrate();
    this.syncCatalog();
  }

  close(): void {
    this.db.close();
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS case_profile (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        full_name TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL DEFAULT '',
        field TEXT NOT NULL DEFAULT '',
        endeavor_summary TEXT NOT NULL DEFAULT '',
        target_filing_date TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS evidence_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT NOT NULL UNIQUE,
        category TEXT NOT NULL,
        code TEXT NOT NULL DEFAULT '',
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        legal_basis TEXT NOT NULL,
        required INTEGER NOT NULL DEFAULT 1,
        weight INTEGER NOT NULL DEFAULT 3,
        sort_order INTEGER NOT NULL DEFAULT 0,
        criteria_json TEXT NOT NULL DEFAULT '[]',
        tips_json TEXT NOT NULL DEFAULT '[]'
      );

      CREATE TABLE IF NOT EXISTS item_progress (
        item_id INTEGER PRIMARY KEY REFERENCES evidence_items(id) ON DELETE CASCADE,
        checked_json TEXT NOT NULL DEFAULT '[]',
        manual_score INTEGER,
        notes TEXT NOT NULL DEFAULT '',
        improvements TEXT NOT NULL DEFAULT '',
        last_reviewed TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL REFERENCES evidence_items(id) ON DELETE CASCADE,
        original_name TEXT NOT NULL,
        stored_name TEXT NOT NULL UNIQUE,
        mime TEXT NOT NULL DEFAULT '',
        size INTEGER NOT NULL DEFAULT 0,
        uploaded_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        detail TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_documents_item ON documents(item_id);
      CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at);
    `);
  }

  /** Upsert the static catalog into the database without touching user progress. */
  syncCatalog(): void {
    const statement = this.db.prepare(`
      INSERT INTO evidence_items
        (slug, category, code, title, description, legal_basis, required, weight,
         sort_order, criteria_json, tips_json)
      VALUES
        (@slug, @category, @code, @title, @description, @legalBasis, @required, @weight,
         @sortOrder, @criteriaJson, @tipsJson)
      ON CONFLICT(slug) DO UPDATE SET
        category = excluded.category,
        code = excluded.code,
        title = excluded.title,
        description = excluded.description,
        legal_basis = excluded.legal_basis,
        required = excluded.required,
        weight = excluded.weight,
        sort_order = excluded.sort_order,
        criteria_json = excluded.criteria_json,
        tips_json = excluded.tips_json
    `);

    const run = this.db.transaction(() => {
      EVIDENCE_CATALOG.forEach((item, index) => {
        statement.run({
          slug: item.slug,
          category: item.category,
          code: item.code,
          title: item.title,
          description: item.description,
          legalBasis: item.legalBasis,
          required: item.required ? 1 : 0,
          weight: item.weight,
          sortOrder: index,
          criteriaJson: JSON.stringify(item.criteria),
          tipsJson: JSON.stringify(item.tips),
        });
      });
    });
    run();
  }

  listItems(): EvidenceItem[] {
    const rows = this.db
      .prepare('SELECT * FROM evidence_items ORDER BY sort_order ASC, id ASC')
      .all() as ItemRow[];
    return rows.map(mapItem);
  }

  getItemBySlug(slug: string): EvidenceItem | undefined {
    const row = this.db.prepare('SELECT * FROM evidence_items WHERE slug = ?').get(slug) as
      | ItemRow
      | undefined;
    return row ? mapItem(row) : undefined;
  }

  getItemById(id: number): EvidenceItem | undefined {
    const row = this.db.prepare('SELECT * FROM evidence_items WHERE id = ?').get(id) as
      | ItemRow
      | undefined;
    return row ? mapItem(row) : undefined;
  }

  getProgress(itemId: number): ItemProgress {
    const row = this.db.prepare('SELECT * FROM item_progress WHERE item_id = ?').get(itemId) as
      | ProgressRow
      | undefined;
    return mapProgress(row, itemId);
  }

  saveProgress(itemId: number, patch: ProgressPatch): void {
    const now = nowIso();
    this.db
      .prepare(
        `INSERT INTO item_progress
           (item_id, checked_json, manual_score, notes, improvements, last_reviewed, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(item_id) DO UPDATE SET
           checked_json = excluded.checked_json,
           manual_score = excluded.manual_score,
           notes = excluded.notes,
           improvements = excluded.improvements,
           last_reviewed = excluded.last_reviewed,
           updated_at = excluded.updated_at`,
      )
      .run(
        itemId,
        JSON.stringify(patch.checkedCriteria),
        patch.manualScore,
        patch.notes,
        patch.improvements,
        now,
        now,
      );
  }

  resetProgress(itemId: number): void {
    this.db.prepare('DELETE FROM item_progress WHERE item_id = ?').run(itemId);
  }

  listDocuments(itemId: number): DocumentRecord[] {
    const rows = this.db
      .prepare('SELECT * FROM documents WHERE item_id = ? ORDER BY uploaded_at DESC, id DESC')
      .all(itemId) as DocumentRow[];
    return rows.map(mapDocument);
  }

  getDocument(id: number): DocumentRecord | undefined {
    const row = this.db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as
      | DocumentRow
      | undefined;
    return row ? mapDocument(row) : undefined;
  }

  addDocument(input: NewDocument): DocumentRecord {
    const result = this.db
      .prepare(
        `INSERT INTO documents (item_id, original_name, stored_name, mime, size, uploaded_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.itemId,
        input.originalName,
        input.storedName,
        input.mime,
        input.size,
        nowIso(),
      );
    const created = this.getDocument(Number(result.lastInsertRowid));
    if (!created) throw new Error('Failed to read back the uploaded document');
    return created;
  }

  deleteDocument(id: number): DocumentRecord | undefined {
    const document = this.getDocument(id);
    if (!document) return undefined;
    this.db.prepare('DELETE FROM documents WHERE id = ?').run(id);
    return document;
  }

  countDocuments(): number {
    const row = this.db.prepare('SELECT COUNT(*) AS count FROM documents').get() as {
      count: number;
    };
    return row.count;
  }

  recentDocuments(
    limit = 6,
  ): Array<DocumentRecord & { itemTitle: string; itemSlug: string }> {
    const rows = this.db
      .prepare(
        `SELECT d.*, i.title AS item_title, i.slug AS item_slug
         FROM documents d
         JOIN evidence_items i ON i.id = d.item_id
         ORDER BY d.uploaded_at DESC, d.id DESC
         LIMIT ?`,
      )
      .all(limit) as Array<DocumentRow & { item_title: string; item_slug: string }>;
    return rows.map((row) => ({
      ...mapDocument(row),
      itemTitle: row.item_title,
      itemSlug: row.item_slug,
    }));
  }

  getCaseProfile(): CaseProfile {
    const row = this.db.prepare('SELECT * FROM case_profile WHERE id = 1').get() as
      | CaseRow
      | undefined;
    return mapCase(row);
  }

  saveCaseProfile(input: CaseProfileInput): CaseProfile {
    const now = nowIso();
    this.db
      .prepare(
        `INSERT INTO case_profile
           (id, full_name, email, field, endeavor_summary, target_filing_date, created_at, updated_at)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           full_name = excluded.full_name,
           email = excluded.email,
           field = excluded.field,
           endeavor_summary = excluded.endeavor_summary,
           target_filing_date = excluded.target_filing_date,
           updated_at = excluded.updated_at`,
      )
      .run(
        input.fullName,
        input.email,
        input.field,
        input.endeavorSummary,
        input.targetFilingDate,
        now,
        now,
      );
    return this.getCaseProfile();
  }

  log(action: string, detail = ''): void {
    this.db
      .prepare('INSERT INTO activity_log (action, detail, created_at) VALUES (?, ?, ?)')
      .run(action, detail, nowIso());
  }

  recentActivity(limit = 8): ActivityEntry[] {
    const rows = this.db
      .prepare('SELECT * FROM activity_log ORDER BY created_at DESC, id DESC LIMIT ?')
      .all(limit) as ActivityRow[];
    return rows.map((row) => ({
      id: row.id,
      action: row.action,
      detail: row.detail,
      createdAt: row.created_at,
    }));
  }

  getAllStates(): ItemState[] {
    return this.listItems().map((item) =>
      buildItemState(item, this.getProgress(item.id), this.listDocuments(item.id)),
    );
  }

  getStateBySlug(slug: string): ItemState | undefined {
    const item = this.getItemBySlug(slug);
    if (!item) return undefined;
    return buildItemState(item, this.getProgress(item.id), this.listDocuments(item.id));
  }

  stats(): { items: number; documents: number; progressRows: number } {
    const items = this.db.prepare('SELECT COUNT(*) AS count FROM evidence_items').get() as {
      count: number;
    };
    const documents = this.db.prepare('SELECT COUNT(*) AS count FROM documents').get() as {
      count: number;
    };
    const progress = this.db.prepare('SELECT COUNT(*) AS count FROM item_progress').get() as {
      count: number;
    };
    return {
      items: items.count,
      documents: documents.count,
      progressRows: progress.count,
    };
  }
}
