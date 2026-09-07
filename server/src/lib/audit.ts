import { exec, type TxClient } from '../db/connection.js';
import { randomId } from './ids.js';
import { nowIso } from './time.js';

export interface AuditEntry {
  projectId: string;
  componentId?: string | null;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
}

/** Minimal executor shape shared by the pool and a transaction client. */
type Runner = Pick<TxClient, 'exec'>;

/**
 * Appends an audit log entry (Req 14). Append-only. Pass a transaction client
 * to keep the log atomic with the change it records.
 */
export async function writeAudit(entry: AuditEntry, client?: Runner): Promise<void> {
  const runner: Runner = client ?? { exec };
  await runner.exec(
    `INSERT INTO audit_logs
       (id, project_id, component_id, actor_user_id, action, entity_type, entity_id, before_json, after_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      randomId(),
      entry.projectId,
      entry.componentId ?? null,
      entry.actorUserId,
      entry.action,
      entry.entityType,
      entry.entityId ?? null,
      entry.before === undefined ? null : JSON.stringify(entry.before),
      entry.after === undefined ? null : JSON.stringify(entry.after),
      nowIso(),
    ],
  );
}
