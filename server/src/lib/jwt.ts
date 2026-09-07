import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export interface SessionClaims {
  uid: string; // user id
  sid: string; // session id (for revocation)
}

export function signSession(claims: SessionClaims): string {
  return jwt.sign(claims, config.jwtSecret, {
    expiresIn: `${config.sessionTtlHours}h`,
  });
}

export function verifySession(token: string): SessionClaims | null {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as SessionClaims;
    if (!decoded?.uid || !decoded?.sid) return null;
    return { uid: decoded.uid, sid: decoded.sid };
  } catch {
    return null;
  }
}
