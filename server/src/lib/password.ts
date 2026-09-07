import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

const KEYLEN = 64;

/** Hashes a password with scrypt and a fresh random salt (Req 18.2). */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, KEYLEN).toString('hex');
  return { hash, salt };
}

/** Constant-time verification of a password against a stored hash+salt. */
export function verifyPassword(
  password: string,
  hash: string,
  salt: string,
): boolean {
  const candidate = scryptSync(password, salt, KEYLEN);
  const stored = Buffer.from(hash, 'hex');
  if (stored.length !== candidate.length) return false;
  return timingSafeEqual(stored, candidate);
}
