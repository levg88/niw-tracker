/**
 * Route handlers for all pages and the JSON health endpoint.
 *
 * Registers Express routes on a Router using the shared RouteContext (repository
 * and config). Kept separate from app.ts so routing logic is testable in
 * isolation.
 */

import { existsSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

import express, { type Request, type Response, type Router } from 'express';
import multer from 'multer';

import { CATEGORIES } from './catalog';
import type { AppConfig } from './config';
import type { Repository } from './db';
import { clampScore, summarize } from './scoring';

export interface RouteContext {
  repo: Repository;
  config: AppConfig;
}

const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.rtf',
  '.txt',
  '.md',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.tif',
  '.tiff',
]);

/** Coerce a form value to a bounded string. */
function safeString(value: unknown, maxLength = 20000): string {
  if (typeof value !== 'string') return '';
  return value.slice(0, maxLength);
}

/** Redirect with a flash message or error query parameter. */
function redirectWith(
  res: Response,
  location: string,
  kind: 'message' | 'error',
  text: string,
): void {
  const separator = location.includes('?') ? '&' : '?';
  res.redirect(`${location}${separator}${kind}=${encodeURIComponent(text)}`);
}

/** Render the 404 error page. */
function notFound(res: Response, message = 'The page you requested does not exist.'): void {
  res.status(404).render('error', {
    title: 'Page not found',
    statusCode: 404,
    message,
  });
}

/** Parse and validate checked-criteria indices from form input. */
function parseCheckedCriteria(raw: unknown, total: number): number[] {
  const values = Array.isArray(raw) ? raw : raw === undefined || raw === null ? [] : [raw];
  const checked = values
    .map((value) => Number.parseInt(String(value), 10))
    .filter((value) => Number.isInteger(value) && value >= 0 && value < total);
  return [...new Set(checked)].sort((a, b) => a - b);
}

/** Parse a manual score from form input, or null when blank/invalid. */
function parseManualScore(raw: unknown): number | null {
  const text = typeof raw === 'string' ? raw.trim() : '';
  if (text === '') return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? clampScore(parsed) : null;
}

/** Register all application routes on a new Express Router. */
export function registerRoutes(context: RouteContext): Router {
  const { repo, config } = context;
  const router = express.Router();

  const storage = multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, config.uploadsDir),
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, `${randomUUID()}${extension}`);
    },
  });

  const upload = multer({
    storage,
    limits: { fileSize: config.maxUploadBytes, files: 5 },
    fileFilter: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(extension)) {
        callback(new Error(`Unsupported file type "${extension || 'unknown'}".`));
        return;
      }
      callback(null, true);
    },
  });

  // ── Dashboard ────────────────────────────────────────────────────────────
  router.get('/', (_req, res) => {
    const states = repo.getAllStates();
    const summary = summarize(states);
    res.render('dashboard', {
      title: 'Dashboard',
      summary,
      states,
      recentDocuments: repo.recentDocuments(6),
      activity: repo.recentActivity(8),
    });
  });

  // ── Evidence list ────────────────────────────────────────────────────────
  router.get('/evidence', (_req, res) => {
    const states = repo.getAllStates();
    const summary = summarize(states);
    const grouped = CATEGORIES.map((category) => ({
      ...category,
      items: states.filter((state) => state.item.category === category.key),
      summary: summary.categories.find((entry) => entry.key === category.key),
    }));
    res.render('evidence-list', { title: 'Evidence', summary, grouped });
  });

  // ── Evidence detail ──────────────────────────────────────────────────────
  router.get('/evidence/:slug', (req, res) => {
    const state = repo.getStateBySlug(req.params.slug);
    if (!state) {
      notFound(res, 'That evidence item does not exist.');
      return;
    }
    res.render('evidence-detail', { title: state.item.title, state });
  });

  router.post('/evidence/:slug', (req, res) => {
    const item = repo.getItemBySlug(req.params.slug);
    if (!item) {
      notFound(res, 'That evidence item does not exist.');
      return;
    }

    const checkedCriteria = parseCheckedCriteria(req.body.criteria, item.criteria.length);
    const manualScore = parseManualScore(req.body.manual_score);
    const notes = safeString(req.body.notes);
    const improvements = safeString(req.body.improvements);

    repo.saveProgress(item.id, { checkedCriteria, manualScore, notes, improvements });
    repo.log('progress.saved', item.title);
    redirectWith(res, `/evidence/${item.slug}`, 'message', 'Progress saved.');
  });

  router.post('/evidence/:slug/reset', (req, res) => {
    const item = repo.getItemBySlug(req.params.slug);
    if (!item) {
      notFound(res, 'That evidence item does not exist.');
      return;
    }
    repo.resetProgress(item.id);
    repo.log('progress.reset', item.title);
    redirectWith(res, `/evidence/${item.slug}`, 'message', 'Checklist and score reset.');
  });

  // ── Documents ────────────────────────────────────────────────────────────
  router.post('/evidence/:slug/documents', (req, res) => {
    const item = repo.getItemBySlug(req.params.slug);
    if (!item) {
      notFound(res, 'That evidence item does not exist.');
      return;
    }

    upload.array('documents', 5)(req, res, (uploadError: unknown) => {
      if (uploadError) {
        const message =
          uploadError instanceof multer.MulterError && uploadError.code === 'LIMIT_FILE_SIZE'
            ? `Each file must be ${config.maxUploadMb} MB or smaller.`
            : uploadError instanceof Error
              ? uploadError.message
              : 'The upload failed.';
        redirectWith(res, `/evidence/${item.slug}`, 'error', message);
        return;
      }

      const files = Array.isArray(req.files) ? (req.files as Express.Multer.File[]) : [];
      if (files.length === 0) {
        redirectWith(res, `/evidence/${item.slug}`, 'error', 'Choose at least one file to upload.');
        return;
      }

      for (const file of files) {
        repo.addDocument({
          itemId: item.id,
          originalName: file.originalname,
          storedName: file.filename,
          mime: file.mimetype,
          size: file.size,
        });
      }
      repo.log('document.uploaded', `${files.length} file(s) → ${item.title}`);
      redirectWith(
        res,
        `/evidence/${item.slug}`,
        'message',
        `${files.length} document${files.length === 1 ? '' : 's'} uploaded.`,
      );
    });
  });

  router.get('/documents/:id', (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    const document = Number.isInteger(id) ? repo.getDocument(id) : undefined;
    if (!document) {
      notFound(res, 'That document does not exist.');
      return;
    }
    const filePath = path.join(config.uploadsDir, path.basename(document.storedName));
    if (!existsSync(filePath)) {
      notFound(res, 'The stored file is missing from disk.');
      return;
    }
    res.download(filePath, document.originalName);
  });

  router.post('/documents/:id/delete', (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    const document = Number.isInteger(id) ? repo.getDocument(id) : undefined;
    if (!document) {
      notFound(res, 'That document does not exist.');
      return;
    }
    const item = repo.getItemById(document.itemId);
    repo.deleteDocument(document.id);
    try {
      unlinkSync(path.join(config.uploadsDir, path.basename(document.storedName)));
    } catch {
      // The database row is the source of truth; a missing file is not fatal.
    }
    repo.log('document.deleted', document.originalName);
    redirectWith(
      res,
      item ? `/evidence/${item.slug}` : '/evidence',
      'message',
      'Document deleted.',
    );
  });

  // ── Case profile ─────────────────────────────────────────────────────────
  router.get('/case', (_req, res) => {
    res.render('case', { title: 'Case profile', profile: repo.getCaseProfile() });
  });

  router.post('/case', (req, res) => {
    repo.saveCaseProfile({
      fullName: safeString(req.body.full_name, 200).trim(),
      email: safeString(req.body.email, 200).trim(),
      field: safeString(req.body.field, 200).trim(),
      endeavorSummary: safeString(req.body.endeavor_summary),
      targetFilingDate: safeString(req.body.target_filing_date, 40).trim(),
    });
    repo.log('case.saved', 'Case profile updated');
    redirectWith(res, '/case', 'message', 'Case profile saved.');
  });

  // ── Report ───────────────────────────────────────────────────────────────
  router.get('/report', (_req, res) => {
    const states = repo.getAllStates();
    const summary = summarize(states);
    const grouped = CATEGORIES.map((category) => ({
      ...category,
      items: states.filter((state) => state.item.category === category.key),
    })).filter((group) => group.items.length > 0);
    res.render('report', {
      title: 'Readiness report',
      summary,
      grouped,
      profile: repo.getCaseProfile(),
      generatedAt: new Date().toISOString(),
    });
  });

  // ── Health ───────────────────────────────────────────────────────────────
  router.get('/health', (_req, res) => {
    const summary = summarize(repo.getAllStates());
    res.json({
      ok: true,
      app: 'niw-tracker',
      version: '1.0.0',
      uptimeSeconds: Math.round(process.uptime()),
      dataDir: config.dataDir,
      readiness: summary.overallScore,
      exceptionalAbilityMet: summary.exceptionalAbility.metCount,
      ...repo.stats(),
    });
  });

  return router;
}
