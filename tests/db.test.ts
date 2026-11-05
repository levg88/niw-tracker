import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { EVIDENCE_CATALOG } from '../src/catalog';
import { Repository } from '../src/db';

let dir: string;
let repo: Repository;

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'niw-db-'));
  repo = new Repository(path.join(dir, 'niw.db'));
});

afterEach(() => {
  repo.close();
  rmSync(dir, { recursive: true, force: true });
});

describe('Repository catalog', () => {
  it('syncs the whole catalog on first run', () => {
    const items = repo.listItems();
    expect(items).toHaveLength(EVIDENCE_CATALOG.length);
    expect(repo.stats().items).toBe(EVIDENCE_CATALOG.length);
  });

  it('is idempotent across re-opens and preserves progress', () => {
    const first = repo.getItemBySlug('form-i140');
    expect(first).toBeDefined();
    repo.saveProgress(first!.id, {
      checkedCriteria: [0, 1],
      manualScore: null,
      notes: 'keep me',
      improvements: '',
    });
    repo.close();

    repo = new Repository(path.join(dir, 'niw.db'));
    expect(repo.listItems()).toHaveLength(EVIDENCE_CATALOG.length);
    const progress = repo.getProgress(first!.id);
    expect(progress.checkedCriteria).toEqual([0, 1]);
    expect(progress.notes).toBe('keep me');
  });

  it('round-trips item fields including criteria and tips', () => {
    const item = repo.getItemBySlug('ea-a-degree');
    expect(item?.code).toBe('A');
    expect(item?.category).toBe('exceptional_ability');
    expect(item?.required).toBe(false);
    expect(item?.criteria.length).toBeGreaterThan(0);
    expect(item?.tips.length).toBeGreaterThan(0);
  });

  it('returns undefined for unknown slugs and ids', () => {
    expect(repo.getItemBySlug('nope')).toBeUndefined();
    expect(repo.getItemById(99999)).toBeUndefined();
  });
});

describe('Repository progress', () => {
  it('defaults to an empty progress record', () => {
    const item = repo.getItemBySlug('cv-resume')!;
    const progress = repo.getProgress(item.id);
    expect(progress.checkedCriteria).toEqual([]);
    expect(progress.manualScore).toBeNull();
    expect(progress.notes).toBe('');
    expect(progress.updatedAt).toBeNull();
  });

  it('saves, updates, and resets progress', () => {
    const item = repo.getItemBySlug('cv-resume')!;
    repo.saveProgress(item.id, {
      checkedCriteria: [0, 2],
      manualScore: 80,
      notes: 'draft',
      improvements: 'needs dates',
    });

    let progress = repo.getProgress(item.id);
    expect(progress.checkedCriteria).toEqual([0, 2]);
    expect(progress.manualScore).toBe(80);
    expect(progress.lastReviewed).not.toBeNull();

    repo.saveProgress(item.id, {
      checkedCriteria: [1],
      manualScore: null,
      notes: 'updated',
      improvements: '',
    });
    progress = repo.getProgress(item.id);
    expect(progress.checkedCriteria).toEqual([1]);
    expect(progress.manualScore).toBeNull();
    expect(progress.notes).toBe('updated');

    repo.resetProgress(item.id);
    progress = repo.getProgress(item.id);
    expect(progress.checkedCriteria).toEqual([]);
    expect(progress.notes).toBe('');
  });

  it('derives state and status from progress plus documents', () => {
    const item = repo.getItemBySlug('cv-resume')!;
    repo.saveProgress(item.id, {
      checkedCriteria: [0, 1, 2, 3],
      manualScore: null,
      notes: '',
      improvements: '',
    });
    const state = repo.getStateBySlug('cv-resume');
    expect(state?.score).toBe(100);
    expect(state?.status).toBe('strong');

    repo.saveProgress(item.id, {
      checkedCriteria: [],
      manualScore: null,
      notes: '',
      improvements: '',
    });
    expect(repo.getStateBySlug('cv-resume')?.status).toBe('missing');

    repo.addDocument({
      itemId: item.id,
      originalName: 'cv.pdf',
      storedName: 'stored-cv.pdf',
      mime: 'application/pdf',
      size: 123,
    });
    expect(repo.getStateBySlug('cv-resume')?.status).toBe('needs_improvement');
  });
});

describe('Repository documents', () => {
  it('adds, lists, reads, and deletes documents', () => {
    const item = repo.getItemBySlug('passport-identity')!;
    const created = repo.addDocument({
      itemId: item.id,
      originalName: 'passport.pdf',
      storedName: 'uuid-passport.pdf',
      mime: 'application/pdf',
      size: 2048,
    });

    expect(created.id).toBeGreaterThan(0);
    expect(repo.listDocuments(item.id)).toHaveLength(1);
    expect(repo.getDocument(created.id)?.originalName).toBe('passport.pdf');
    expect(repo.countDocuments()).toBe(1);

    const deleted = repo.deleteDocument(created.id);
    expect(deleted?.storedName).toBe('uuid-passport.pdf');
    expect(repo.getDocument(created.id)).toBeUndefined();
    expect(repo.countDocuments()).toBe(0);
    expect(repo.deleteDocument(created.id)).toBeUndefined();
  });

  it('lists recent documents with their item title', () => {
    const item = repo.getItemBySlug('recommendation-letters')!;
    repo.addDocument({
      itemId: item.id,
      originalName: 'letter.pdf',
      storedName: 'uuid-letter.pdf',
      mime: 'application/pdf',
      size: 10,
    });
    const recent = repo.recentDocuments(5);
    expect(recent).toHaveLength(1);
    expect(recent[0].itemSlug).toBe('recommendation-letters');
    expect(recent[0].itemTitle).toContain('Recommendation letters');
  });

  it('cascades document deletion when the item is removed', () => {
    const item = repo.getItemBySlug('passport-identity')!;
    repo.addDocument({
      itemId: item.id,
      originalName: 'a.pdf',
      storedName: 'uuid-a.pdf',
      mime: 'application/pdf',
      size: 1,
    });
    repo.db.prepare('DELETE FROM evidence_items WHERE id = ?').run(item.id);
    expect(repo.listDocuments(item.id)).toHaveLength(0);
  });
});

describe('Repository case profile and activity', () => {
  it('returns an empty profile before it is saved', () => {
    const profile = repo.getCaseProfile();
    expect(profile.fullName).toBe('');
    expect(profile.updatedAt).toBe('');
  });

  it('saves and updates the case profile', () => {
    repo.saveCaseProfile({
      fullName: 'Alex Doe',
      email: 'alex@example.com',
      field: 'computational biology',
      endeavorSummary: 'Build open protein-folding tools.',
      targetFilingDate: '2027-03-01',
    });
    const profile = repo.getCaseProfile();
    expect(profile.fullName).toBe('Alex Doe');
    expect(profile.targetFilingDate).toBe('2027-03-01');
    expect(profile.createdAt).not.toBe('');

    repo.saveCaseProfile({
      fullName: 'Alex Doe',
      email: 'new@example.com',
      field: 'computational biology',
      endeavorSummary: 'Updated.',
      targetFilingDate: '2027-04-01',
    });
    expect(repo.getCaseProfile().email).toBe('new@example.com');
    expect(repo.getCaseProfile().targetFilingDate).toBe('2027-04-01');
  });

  it('logs activity newest first', () => {
    repo.log('progress.saved', 'first');
    repo.log('document.uploaded', 'second');
    const activity = repo.recentActivity(10);
    expect(activity[0].detail).toBe('second');
    expect(activity[1].detail).toBe('first');
  });

  it('reports stats', () => {
    expect(repo.stats()).toEqual({
      items: EVIDENCE_CATALOG.length,
      documents: 0,
      progressRows: 0,
    });
  });
});
