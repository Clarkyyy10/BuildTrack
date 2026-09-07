import { one } from '../db/connection.js';
import { verifySession } from '../lib/jwt.js';
import { unauthorized } from '../lib/errors.js';
import { nowIso } from '../lib/time.js';
import { ah } from '../lib/http.js';

export const SESSION_COOKIE = 'bt_session';

/**
 * Requires a valid session cookie mapping to a live (non-revoked, unexpired)
 * session row. Populates req.auth. Rejects otherwise (Req 1.5, 18).
 */
export const requireAuth = ah(async (req, _res, next) => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return next(unauthorized());

  const claims = verifySession(token);
  if (!claims) return next(unauthorized());

  const session = await one<{ id: string; expires_at: string; revoked_at: string | null }>(
    'SELECT id, expires_at, revoked_at FROM sessions WHERE id = ?',
    [claims.sid],
  );

  if (!session || session.revoked_at || session.expires_at < nowIso()) {
    return next(unauthorized());
  }

  req.auth = { userId: claims.uid, sessionId: claims.sid };
  next();
});
