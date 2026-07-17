/**
 * Zero-config local development.
 *
 *   npm run dev:local
 *
 * Starts a throwaway in-memory MongoDB, seeds it, and boots the API against it.
 * No Atlas account, no connection string, no .env needed — so every teammate
 * can run the app immediately instead of waiting on shared credentials.
 *
 * The database is wiped on exit. Use `npm run dev` against Atlas when you need
 * data to survive a restart.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// This file lives at backend/src/scripts/, so the package root is two up.
const BACKEND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

console.log('[dev:local] starting in-memory MongoDB…');
const mongod = await MongoMemoryServer.create();

const env = {
  ...process.env,
  MONGO_URI: mongod.getUri('quicknext'),
  JWT_SECRET: process.env.JWT_SECRET || 'local-dev-only-not-a-real-secret',
  PORT: process.env.PORT || '5000',
  CORS_ORIGINS: process.env.CORS_ORIGINS || 'http://localhost:5173',
  NODE_ENV: 'development',
};

console.log('[dev:local] seeding demo data…');
execFileSync('node', ['src/scripts/seed.js'], { cwd: BACKEND, env, stdio: 'inherit' });

console.log('[dev:local] booting API…\n');
const server = spawn('node', ['--watch', 'src/server.js'], {
  cwd: BACKEND,
  env,
  stdio: 'inherit',
});

const shutdown = async () => {
  server.kill();
  await mongod.stop();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
server.on('exit', shutdown);
