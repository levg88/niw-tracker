import path from 'node:path';

export interface AppConfig {
  host: string;
  port: number;
  dataDir: string;
  dbPath: string;
  uploadsDir: string;
  maxUploadMb: number;
  maxUploadBytes: number;
}

/**
 * Load configuration from the environment.
 *
 * Everything is local by default: the server binds to 127.0.0.1 and stores data
 * under ./data. There is no authentication, so do not expose it publicly.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const dataDir = path.resolve(env.NIW_DATA_DIR?.trim() || './data');
  const parsedMb = Number.parseInt(env.NIW_MAX_UPLOAD_MB ?? '15', 10);
  const maxUploadMb = Number.isFinite(parsedMb) && parsedMb > 0 ? parsedMb : 15;
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
