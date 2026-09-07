import { Router } from 'express';
import { z } from 'zod';
import { exec } from '../db/connection.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { ah } from '../lib/http.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { newUserId, randomId } from '../lib/ids.js';
import { nowIso, hoursFromNow } from '../lib/time.js';
import { badRequest, unauthorized } from '../lib/errors.js';
import { startSession, endSession } from '../lib/session.js';
import {
  ensureUserSettings,
  findUserByEmail,
  findUserById,
  toPublicUser,
} from '../services/users.js';

export const authRouter = Router();

const signupSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(200),
});

authRouter.post('/signup', validateBody(signupSchema), ah(async (req, res) => {
  const { displayName, email, password } = req.body as z.infer<typeof signupSchema>;

  if (await findUserByEmail(email)) {
    throw badRequest('We could not create that account. Try a different email.', 'signup_failed');
  }

  const { hash, salt } = hashPassword(password);
  const id = await newUserId();
  const ts = nowIso();
  await exec(
    `INSERT INTO users
       (id, email, email_lower, password_hash, password_salt, display_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, email.trim(), email.trim().toLowerCase(), hash, salt, displayName, ts, ts],
  );
  await ensureUserSettings(id);

  await startSession(req, res, id);
  const user = await findUserById(id);
  res.status(201).json({ user: toPublicUser(user!) });
}));

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

authRouter.post('/login', validateBody(loginSchema), ah(async (req, res) => {
  const { email, password } = req.body as z.infer<typeof loginSchema>;
  const user = await findUserByEmail(email);

  const invalid = unauthorized('Incorrect email or password.', 'invalid_credentials');
  if (!user) throw invalid;
  if (!verifyPassword(password, user.password_hash, user.password_salt)) throw invalid;

  await startSession(req, res, user.id);
  res.json({ user: toPublicUser(user) });
}));

authRouter.post('/logout', requireAuth, ah(async (req, res) => {
  await endSession(res, req.auth!.sessionId);
  res.json({ ok: true });
}));

const recoverSchema = z.object({ email: z.string().trim().email() });

authRouter.post('/recover', validateBody(recoverSchema), ah(async (req, res) => {
  const { email } = req.body as z.infer<typeof recoverSchema>;
  const user = await findUserByEmail(email);

  if (user) {
    await exec(
      `INSERT INTO password_resets (id, user_id, token_hash, expires_at)
       VALUES (?, ?, ?, ?)`,
      [randomId(), user.id, randomId(), hoursFromNow(1)],
    );
  }

  res.json({
    ok: true,
    message: 'If that email is registered, we have sent recovery instructions.',
  });
}));
