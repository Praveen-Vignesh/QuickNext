import dotenv from 'dotenv';

dotenv.config();

// Fail loudly at boot rather than with a confusing 500 on the first request.
// The brief explicitly penalises "environment configuration errors", and a
// missing var on a deployed host is the classic way that happens.
function required(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`\n[config] Missing required environment variable: ${name}`);
    console.error('[config] Copy .env.example to .env and fill it in.\n');
    process.exit(1);
  }
  return value;
}

export const env = {
  PORT: Number(process.env.PORT) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  MONGO_URI: required('MONGO_URI'),
  JWT_SECRET: required('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Comma-separated so localhost and the deployed frontend can both be allowed.
  CORS_ORIGINS: (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
};

// Both integrations are optional on purpose: the app must boot and be fully
// demoable with neither configured. Add the keys and the feature switches on.
export const googleEnabled = Boolean(env.GOOGLE_CLIENT_ID);
export const razorpayEnabled = Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
