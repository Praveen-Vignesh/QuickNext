import mongoose from 'mongoose';
import app from '../backend/src/app.js';
import { env } from '../backend/src/config/env.js';

/**
 * Vercel serverless entry point.
 *
 * Serverless is not a long-running server: this module is evaluated once per
 * container, but a container is reused across many invocations and several
 * containers run concurrently. So the connection is cached on `globalThis` —
 * and, more importantly, the *promise* is cached. Otherwise two concurrent
 * invocations during a cold start each start their own `mongoose.connect`, and
 * Atlas M0's 500-connection cap is reachable fast.
 *
 * `connectDB()` from config/db.js is deliberately NOT used here: it calls
 * process.exit(1) on failure, which is correct for `npm start` and fatal in a
 * lambda — the container dies with an opaque 500 instead of a useful error.
 */
const cache = (globalThis.__quicknextMongo ??= { conn: null, promise: null });

async function ensureDb() {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(env.MONGO_URI, {
        serverSelectionTimeoutMS: 8_000,
        // Fail queries fast rather than buffering them until the function
        // times out with no explanation.
        bufferCommands: false,
        // Each container keeps its own pool; small pools across many
        // containers is how you stay under the Atlas connection cap.
        maxPoolSize: 5,
      })
      .then((m) => m.connection);
  }

  try {
    cache.conn = await cache.promise;
  } catch (err) {
    // Drop the promise so the next invocation retries instead of awaiting a
    // permanently rejected one.
    cache.promise = null;
    throw err;
  }

  return cache.conn;
}

export default async function handler(req, res) {
  try {
    await ensureDb();
  } catch (err) {
    console.error('[api] database connection failed:', err.message);
    return res.status(503).json({ error: 'Database unavailable' });
  }

  return app(req, res);
}
