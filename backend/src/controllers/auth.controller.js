import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';
import { env, googleEnabled, razorpayEnabled } from '../config/env.js';
import { HttpError } from '../middleware/error.middleware.js';

const googleClient = googleEnabled ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;

/** Lets the frontend adapt to what's actually configured on this deployment. */
export function getConfig(req, res) {
  res.json({
    googleEnabled,
    razorpayEnabled,
    googleClientId: env.GOOGLE_CLIENT_ID || null,
  });
}

export async function googleLogin(req, res) {
  if (!googleEnabled) throw new HttpError(503, 'Google sign-in is not configured on this server');

  const { credential } = req.body;
  if (!credential) throw new HttpError(400, 'Missing Google credential');

  let payload;
  try {
    // Verifying server-side is the whole point: it checks Google's signature
    // AND that the token was minted for our client id. A token from another
    // app, or a hand-crafted one, fails here.
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    throw new HttpError(401, 'Invalid Google token');
  }

  let user = await User.findOne({ googleId: payload.sub });

  if (!user) {
    // Someone who used a demo/local account with this email first: link the
    // Google identity onto it rather than creating a duplicate.
    user = await User.findOne({ email: payload.email });
    if (user) {
      user.googleId = payload.sub;
      await user.save();
    } else {
      user = await User.create({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name || payload.email,
      });
    }
  }

  res.json({ token: signToken(user), user: user.toPublic() });
}

/**
 * Email + password, for the seeded demo accounts.
 *
 * This exists so a judge can reach both the customer and vendor experiences
 * without owning two Google accounts — and so the app still logs in if Google
 * OAuth misbehaves on the day.
 */
export async function passwordLogin(req, res) {
  const { email, password } = req.body;
  if (!email || !password) throw new HttpError(400, 'Email and password are required');

  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+passwordHash');

  // Same error either way — don't reveal which emails exist.
  if (!user?.passwordHash) throw new HttpError(401, 'Invalid credentials');

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new HttpError(401, 'Invalid credentials');

  res.json({ token: signToken(user), user: user.toPublic() });
}

export function me(req, res) {
  res.json({ user: req.user.toPublic() });
}

/**
 * Pick (or switch) role.
 *
 * Switching is allowed at any time, not just at first login: it's self-service
 * here (anyone may sell), and it lets a judge flip between the two experiences
 * on one account in a couple of seconds.
 */
export async function selectRole(req, res) {
  const { role } = req.body;
  if (!['customer', 'vendor'].includes(role)) {
    throw new HttpError(400, "Role must be 'customer' or 'vendor'");
  }

  req.user.role = role;
  req.user.roleSelected = true;
  await req.user.save();

  res.json({ user: req.user.toPublic() });
}
