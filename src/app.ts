import { mkdirSync } from 'node:fs';
import path from 'node:path';

import express from 'express';

import { CATEGORIES } from './catalog';
import type { AppConfig } from './config';
import { Repository } from './db';
import { registerRoutes } from './routes';
import { STATUS_LABELS, scoreTone, statusClass } from './scoring';

export interface AppHandle {
  app: express.Express;
  repo: Repository;
  config: AppConfig;
  close: () => void;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(year, (month ?? 1) - 1, day ?? 1));
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

/**
 * Build the Express application. Kept separate from server.ts so tests can
 * create an isolated app with a temporary data directory.
 */
export function createApp(config: AppConfig): AppHandle {
  mkdirSync(config.dataDir, { recursive: true });
  mkdirSync(config.uploadsDir, { recursive: true });

  const repo = new Repository(config.dbPath);
  const app = express();

  app.disable('x-powered-by');
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '..', 'views'));

  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.use(express.urlencoded({ extended: false, limit: '2mb' }));

  app.use((req, res, next) => {
    res.locals.currentPath = req.path;
    res.locals.appName = 'NIW Evidence Tracker';
    res.locals.statusLabels = STATUS_LABELS;
    res.locals.statusClass = statusClass;
    res.locals.scoreTone = scoreTone;
    res.locals.maxUploadMb = config.maxUploadMb;
    res.locals.categories = CATEGORIES;
    res.locals.message = typeof req.query.message === 'string' ? req.query.message : '';
    res.locals.flashError = typeof req.query.error === 'string' ? req.query.error : '';
    res.locals.caseProfile = repo.getCaseProfile();
    res.locals.formatDate = formatDate;
    res.locals.formatDateTime = formatDateTime;
    res.locals.formatBytes = formatBytes;
    res.locals.currentYear = new Date().getFullYear();
    next();
  });

  app.use(registerRoutes({ repo, config }));

  app.use((_req, res) => {
    res.status(404).render('error', {
      title: 'Page not found',
      statusCode: 404,
      message: 'The page you requested does not exist.',
    });
  });

  const errorHandler: express.ErrorRequestHandler = (error, _req, res, _next) => {
    console.error('[niw-tracker]', error);
    const statusCandidate = (error as { status?: unknown }).status;
    const statusCode =
      typeof statusCandidate === 'number' && statusCandidate >= 400 && statusCandidate < 600
        ? statusCandidate
        : 500;
    res.status(statusCode).render('error', {
      title: 'Something went wrong',
      statusCode,
      message: error instanceof Error ? error.message : 'Unexpected error.',
    });
  };
  app.use(errorHandler);

  return {
    app,
    repo,
    config,
    close: () => repo.close(),
  };
}
