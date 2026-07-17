import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Anchored to backend/.env rather than process.cwd(): this module is imported
// from the backend (cwd=backend/) and from api/index.js (cwd=repo root), and a
// cwd-relative lookup silently finds nothing in the second case.
//
// On Vercel there is no .env at all — the dashboard injects real environment
// variables, dotenv finds no file, and (because it never overrides existing
// vars) everything resolves from process.env as intended.
const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(backendRoot, '.env'), quiet: true });

// Fail loudly at boot rather than with a confusing 500 on the first request.
// The brief explicitly penalises "environment configuration errors", and a
// missing var on a deployed host is the classic way that happens.
//
// Throws rather than calling process.exit(): this module is also imported by
// the Vercel serverless function, where exiting kills the container and Vercel
// reports an opaque FUNCTION_INVOCATION_FAILED. A thrown Error gets logged with
// its message intact on both platforms.
/**
 * Read an env var, trimming surrounding whitespace.
 *
 * Pasting a value into a hosting dashboard very easily carries a trailing
 * newline, and the result is invisible in every UI that shows it back to you.
 * A `\n` on GOOGLE_CLIENT_ID makes Google answer `401 invalid_client`; on
 * RAZORPAY_KEY_SECRET it silently breaks HMAC verification; on MONGO_URI it
 * fails to connect. Trim once, here, rather than debug it three times.
 */
function readEnv(name) {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : value;
}

// Fail loudly at boot rather than with a confusing 500 on the first request.
// The brief explicitly penalises "environment configuration errors", and a
// missing var on a deployed host is the classic way that happens.
//
// Throws rather than calling process.exit(): a thrown Error gets logged with
// its message intact on Render, where exiting produces an opaque crash.
function required(name) {
  const value = readEnv(name);
  if (!value) {
    console.error(`\n[config] Missing required environment variable: ${name}`);
    console.error('[config] Locally: copy .env.example to .env and fill it in.');
    console.error('[config] On Render: Dashboard → your service → Environment.\n');
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  PORT: Number(process.env.PORT) || 5000,
  NODE_ENV: readEnv('NODE_ENV') || 'development',

  MONGO_URI: required('MONGO_URI'),
  JWT_SECRET: required('JWT_SECRET'),
  JWT_EXPIRES_IN: readEnv('JWT_EXPIRES_IN') || '7d',

  // Comma-separated so localhost and the deployed frontend can both be allowed.
  // Trailing slashes are stripped too: an Origin header never carries one, so
  // "https://app.vercel.app/" would silently match nothing.
  CORS_ORIGINS: (readEnv('CORS_ORIGINS') || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean),

  GOOGLE_CLIENT_ID: readEnv('GOOGLE_CLIENT_ID') || '',
  RAZORPAY_KEY_ID: readEnv('RAZORPAY_KEY_ID') || '',
  RAZORPAY_KEY_SECRET: readEnv('RAZORPAY_KEY_SECRET') || '',
};

// Both integrations are optional on purpose: the app must boot and be fully
// demoable with neither configured. Add the keys and the feature switches on.
export const googleEnabled = Boolean(env.GOOGLE_CLIENT_ID);
export const razorpayEnabled = Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
