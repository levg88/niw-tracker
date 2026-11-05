import { createApp } from './app';
import { loadConfig } from './config';

const config = loadConfig();
const { app, close } = createApp(config);

const server = app.listen(config.port, config.host, () => {
  console.log('');
  console.log('  NIW Evidence Tracker');
  console.log(`  http://${config.host}:${config.port}`);
  console.log(`  data: ${config.dataDir}`);
  console.log('');
  console.log('  Local tool only — not legal advice. Press Ctrl+C to stop.');
  console.log('');
});

function shutdown(signal: string): void {
  console.log(`\n${signal} received — shutting down.`);
  server.close(() => {
    close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
