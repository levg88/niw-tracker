/**
 * Application configuration.
 *
 * Reads environment variables and resolves the local data directory, database
 * path, uploads directory, and upload size limit. Everything defaults to a
 * local, single-user setup bound to 127.0.0.1.
 */

import path from 'node:path';

export interface AppConfig {
  /** Hostname the HTTP server binds to. */
  host: string;
  /** TCP port the HTTP server listens on. */
  port: number;
  /** Absolute path to the data directory. */
  dataDir: string;
  /** Absolute path to the SQLite database file. */
  dbPath: string;
  /** Absolute path to the uploaded-files directory. */
  uploadsDir: string;
  /** Maximum upload size in megabytes. */
  maxUploadMb: number;
  /** Maximum upload size in bytes (derived from maxUploadMb). */
  maxUploadBytes: number;
}

/**
 * Load configuration from the environment.
 *
 * Everything is local by default: the server binds to 127.0.0.1 and stores data
 * under ./data. There is no authentication, so do not expose it publicly.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  // Resolve the data directory to an absolute path, defaulting to ./data.
  const dataDir = path.resolve(env.NIW_DATA_DIR?.trim() || './data');
  // Parse and validate the upload limit, falling back to 15 MB on bad input.
  const parsedMb = Number.parseInt(env.NIW_MAX_UPLOAD_MB ?? '15', 10);
  const maxUploadMb = Number.isFinite(parsedMb) && parsedMb > 0 ? parsedMb : 15;
  // NIW_PORT takes precedence over the generic PORT variable.
  const parsedPort = Number.parseInt(env.NIW_PORT ?? env.PORT ?? '8770', 10);
  const port = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 8770;

  return {
    host: env.NIW_HOST?.trim() || '127.0.0.1',
    port,
    dataDir,
    dbPath: path.join(dataDir, 'niw.db'),
    uploadsDir: path.join(dataDir, 'uploads'),
    maxUploadMb,
    maxUploadBytes: maxUploadMb * 1024 * 1024,
  };
}
