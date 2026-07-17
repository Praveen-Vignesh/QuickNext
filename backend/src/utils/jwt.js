import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// The token carries identity only, never the role. Role lives in the DB and is
// re-read on every request, so a user who switches to vendor doesn't have to
// re-login, and a revoked role takes effect immediately.
export function signToken(user) {
  return jwt.sign({ sub: user._id.toString() }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}
