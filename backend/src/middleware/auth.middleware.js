import User from '../models/User.js';
import { verifyToken } from '../utils/jwt.js';

function extractToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null;
}

// Bearer token rather than a session cookie: the frontend and API live on
// different domains once deployed, and this sidesteps SameSite / third-party
// cookie failures entirely.
export async function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  const user = await User.findById(payload.sub);
  if (!user) return res.status(401).json({ error: 'Account no longer exists' });

  req.user = user;
  next();
}

// Attaches req.user when a token is present but never rejects. Used by the
// catalog so signed-out visitors can still browse.
export async function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return next();

  try {
    const payload = verifyToken(token);
    req.user = await User.findById(payload.sub);
  } catch {
    // An expired token shouldn't stop anyone browsing the storefront.
  }
  next();
}
