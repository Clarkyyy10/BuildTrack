import type { Request, Response } from 'express';
import { exec } from '../db/connection.js';
import { randomId } from './ids.js';
import { signSession } from './jwt.js';
import { nowIso, hoursFromNow } from './time.js';
import { config } from '../config.js';
import { SESSION_COOKIE } from '../middleware/auth.js';

/** Creates a session row, signs a JWT, and sets the HTTP-only cookie. */
export async function startSession(req: Request, res: Response, userId: string): Promise<void> {
  const sessionId = randomId();
  await exec(
    `INSERT INTO sessions (id, user_id, issued_at, expires_at, user_agent, ip)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      sessionId,
      userId,
      nowIso(),
      hoursFromNow(config.sessionTtlHours),
      req.get('user-agent') ?? null,
      req.ip ?? null,
    ],
  );

  const token = signSession({ uid: userId, sid: sessionId });
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProd,
    maxAge: config.sessionTtlHours * 3600_000,
    path: '/',
  });
}

/** Revokes the current session and clears the cookie. */
export async function endSession(res: Response, sessionId: string): Promise<void> {
  await exec('UPDATE sessions SET revoked_at = ? WHERE id = ?', [nowIso(), sessionId]);
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}
