import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createApp, type AppHandle } from '../src/app';
import { loadConfig } from '../src/config';

let dir: string;
let handle: AppHandle;

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'niw-app-'));
  const config = loadConfig({ NIW_DATA_DIR: dir } as NodeJS.ProcessEnv);
  handle = createApp(config);
});

afterEach(() => {
  handle.close();
  rmSync(dir, { recursive: true, force: true });
});

function location(res: request.Response): string {
  return decodeURIComponent(String(res.headers.location));
}

describe('pages', () => {
  it('renders the dashboard', async () => {
    const res = await request(handle.app).get('/').expect(200);
    expect(res.text).toContain('NIW evidence dashboard');
    expect(res.text).toContain('Not legal advice');
    expect(res.text).toContain('Exceptional ability');
  });

  it('renders the evidence catalog grouped by category', async () => {
    const res = await request(handle.app).get('/evidence').expect(200);
    expect(res.text).toContain('All evidence items');
    expect(res.text).toContain('Identity &amp; procedural');
    expect(res.text).toContain('Dhanasar prong 1');
    expect(res.text).toContain('Required');
  });

  it('renders an evidence detail page with checklist and upload form', async () => {
    const res = await request(handle.app).get('/evidence/ea-a-degree').expect(200);
    expect(res.text).toContain('Criterion A');
    expect(res.text).toContain('Checklist');
    expect(res.text).toContain('Documents');
    expect(res.text).toContain('Improvement tips');
  });

  it('renders the case profile form', async () => {
    const res = await request(handle.app).get('/case').expect(200);
    expect(res.text).toContain('Your case details');
    expect(res.text).toContain('Proposed endeavor');
  });

  it('renders the readiness report with the disclaimer', async () => {
    const res = await request(handle.app).get('/report').expect(200);
    expect(res.text).toContain('Readiness report');
    expect(res.text).toContain('Exceptional ability (8 CFR 204.5(k))');
    expect(res.text).toContain('Not legal advice');
  });

  it('returns 404 for unknown evidence and pages', async () => {
    await request(handle.app).get('/evidence/not-a-real-item').expect(404);
    await request(handle.app).get('/nope').expect(404);
    await request(handle.app).get('/documents/9999').expect(404);
  });
});

describe('progress', () => {
  it('saves checklist progress and redirects back', async () => {
    const res = await request(handle.app)
      .post('/evidence/cv-resume')
      .type('form')
      .send({ criteria: ['0', '1', '2', '3'], notes: 'CV draft', improvements: '' })
      .expect(302);

    expect(location(res)).toContain('/evidence/cv-resume');
    expect(location(res)).toContain('Progress saved');

    const item = handle.repo.getItemBySlug('cv-resume')!;
    const progress = handle.repo.getProgress(item.id);
    expect(progress.checkedCriteria).toEqual([0, 1, 2, 3]);
    expect(progress.notes).toBe('CV draft');
    expect(handle.repo.getStateBySlug('cv-resume')?.status).toBe('strong');
  });

  it('honours a manual score override', async () => {
    await request(handle.app)
      .post('/evidence/cv-resume')
      .type('form')
      .send({ criteria: [], manual_score: '150', notes: '', improvements: '' })
      .expect(302);

    const state = handle.repo.getStateBySlug('cv-resume');
    expect(state?.progress.manualScore).toBe(100);
    expect(state?.score).toBe(100);
  });

  it('ignores an invalid manual score', async () => {
    await request(handle.app)
      .post('/evidence/cv-resume')
      .type('form')
      .send({ criteria: [], manual_score: 'abc', notes: '', improvements: '' })
      .expect(302);

    expect(handle.repo.getStateBySlug('cv-resume')?.progress.manualScore).toBeNull();
  });

  it('resets progress without deleting documents', async () => {
    const item = handle.repo.getItemBySlug('cv-resume')!;
    handle.repo.addDocument({
      itemId: item.id,
      originalName: 'cv.pdf',
      storedName: 'stored-cv.pdf',
      mime: 'application/pdf',
      size: 10,
    });
    await request(handle.app)
      .post('/evidence/cv-resume')
      .type('form')
      .send({ criteria: ['0'], notes: 'x', improvements: 'y' })
      .expect(302);

    const res = await request(handle.app)
      .post('/evidence/cv-resume/reset')
      .type('form')
      .send({})
      .expect(302);

    expect(location(res)).toContain('reset');
    expect(handle.repo.getProgress(item.id).checkedCriteria).toEqual([]);
    expect(handle.repo.listDocuments(item.id)).toHaveLength(1);
  });
});

describe('documents', () => {
  it('uploads, lists, downloads, and deletes a document', async () => {
    await request(handle.app)
      .post('/evidence/passport-identity/documents')
      .attach('documents', Buffer.from('hello world'), 'passport.txt')
      .expect(302);

    const item = handle.repo.getItemBySlug('passport-identity')!;
    const documents = handle.repo.listDocuments(item.id);
    expect(documents).toHaveLength(1);
    expect(documents[0].originalName).toBe('passport.txt');
    expect(documents[0].size).toBe(11);

    const detail = await request(handle.app).get('/evidence/passport-identity').expect(200);
    expect(detail.text).toContain('passport.txt');

    const download = await request(handle.app).get(`/documents/${documents[0].id}`).expect(200);
    expect(String(download.headers['content-disposition'])).toContain('passport.txt');

    const removed = await request(handle.app)
      .post(`/documents/${documents[0].id}/delete`)
      .type('form')
      .send({})
      .expect(302);
    expect(location(removed)).toContain('/evidence/passport-identity');
    expect(handle.repo.listDocuments(item.id)).toHaveLength(0);
  });

  it('rejects an upload with no file', async () => {
    const res = await request(handle.app)
      .post('/evidence/passport-identity/documents')
      .type('form')
      .send({})
      .expect(302);
    expect(location(res)).toContain('Choose at least one file');
  });

  it('rejects an unsupported file extension', async () => {
    const res = await request(handle.app)
      .post('/evidence/passport-identity/documents')
      .attach('documents', Buffer.from('#!/bin/sh'), 'script.sh')
      .expect(302);
    expect(location(res)).toContain('Unsupported file type');
    expect(handle.repo.countDocuments()).toBe(0);
  });

  it('accepts multiple files at once', async () => {
    await request(handle.app)
      .post('/evidence/recommendation-letters/documents')
      .attach('documents', Buffer.from('one'), 'one.txt')
      .attach('documents', Buffer.from('two'), 'two.pdf')
      .expect(302);
    expect(handle.repo.countDocuments()).toBe(2);
  });

  it('returns 404 when deleting an unknown document', async () => {
    await request(handle.app).post('/documents/424242/delete').type('form').send({}).expect(404);
  });
});

describe('case profile', () => {
  it('saves the profile and shows it in the report', async () => {
    const res = await request(handle.app)
      .post('/case')
      .type('form')
      .send({
        full_name: 'Alex Doe',
        email: 'alex@example.com',
        field: 'computational biology',
        endeavor_summary: 'Build open protein-folding tools for U.S. researchers.',
        target_filing_date: '2027-03-01',
      })
      .expect(302);
    expect(location(res)).toContain('Case profile saved');

    const profile = handle.repo.getCaseProfile();
    expect(profile.fullName).toBe('Alex Doe');
    expect(profile.email).toBe('alex@example.com');

    const report = await request(handle.app).get('/report').expect(200);
    expect(report.text).toContain('Alex Doe');
    expect(report.text).toContain('Build open protein-folding tools');
  });
});

describe('health', () => {
  it('reports readiness and catalog stats', async () => {
    const res = await request(handle.app).get('/health').expect(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.app).toBe('niw-tracker');
    expect(res.body.readiness).toBe(0);
    expect(res.body.exceptionalAbilityMet).toBe(0);
    expect(res.body.items).toBeGreaterThan(30);
    expect(res.body.documents).toBe(0);
    expect(res.body.dataDir).toBe(dir);
  });
});
