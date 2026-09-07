import { randomUUID } from 'node:crypto';
import { one } from '../db/connection.js';

/**
 * Generates the next human-readable sequential ID for a given prefix,
 * e.g. nextSeqId('user', 'USR') -> "USR-000587". Backed by id_sequences.
 * Runs autocommit (ids are fine to advance even if a surrounding op rolls back).
 */
export async function nextSeqId(name: string, prefix: string, pad = 6): Promise<string> {
  const row = await one<{ current: number }>(
    `INSERT INTO id_sequences (name, current) VALUES (?, 1)
     ON CONFLICT (name) DO UPDATE SET current = id_sequences.current + 1
     RETURNING current`,
    [name],
  );
  return `${prefix}-${String(row!.current).padStart(pad, '0')}`;
}

export const newUserId = () => nextSeqId('user', 'USR');
export const newProjectId = () => nextSeqId('project', 'PRJ');
export const newComponentId = () => nextSeqId('component', 'CMP');
export const newMaterialId = () => nextSeqId('material', 'MAT');
export const newExpenseId = () => nextSeqId('expense', 'EXP');
export const newTxnId = () => nextSeqId('txn', 'TXN');

/** Opaque random ID for internal records (sessions, joins, logs, etc.). */
export const randomId = () => randomUUID();
