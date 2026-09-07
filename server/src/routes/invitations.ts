import { Router } from 'express';
import { z } from 'zod';
import { one, exec, query, tx } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { validateBody } from '../middleware/validate.js';
import { ah } from '../lib/http.js';
import { randomId } from '../lib/ids.js';
import { nowIso, hoursFromNow } from '../lib/time.js';
import { writeAudit } from '../lib/audit.js';
import { badRequest, forbidden, notFound } from '../lib/errors.js';
import { ALL_ROLES, type Role } from '../services/permissions.js';
import { findUserById } from '../services/users.js';
import { notifyUser } from '../services/notify.js';

export const projectInvitationsRouter = Router({ mergeParams: true });
export const invitationsRouter = Router();

interface InvitationRow {
  id: string;
  project_id: string;
  invitee_user_id: string;
  inviter_user_id: string;
  proposed_role: string;
  state: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

function getInvitation(id: string): Promise<InvitationRow | undefined> {
  return one<InvitationRow>('SELECT * FROM project_invitations WHERE id = ?', [id]);
}

/** Treat past-expiry pending invitations as expired (Req 5.6). */
function effectiveState(inv: InvitationRow): string {
  if (inv.state === 'pending' && inv.expires_at && inv.expires_at < nowIso()) return 'expired';
  return inv.state;
}

const inviteSchema = z.object({
  inviteeUserId: z.string().trim().min(1),
  role: z.enum(ALL_ROLES as [Role, ...Role[]]),
});

/** Send an invitation (Req 5.1). */
projectInvitationsRouter.post('/', requireAuth, requirePermission('invite_members'), validateBody(inviteSchema), ah(async (req, res) => {
  const body = req.body as z.infer<typeof inviteSchema>;
  const projectId = req.params.projectId;

  if (!(await findUserById(body.inviteeUserId))) throw notFound('That user could not be found.');

  const alreadyMember = await one('SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, body.inviteeUserId]);
  if (alreadyMember) throw badRequest('That user is already a member.', 'already_member');

  const pending = await one("SELECT 1 FROM project_invitations WHERE project_id = ? AND invitee_user_id = ? AND state = 'pending'", [projectId, body.inviteeUserId]);
  if (pending) throw badRequest('That user already has a pending invitation.', 'already_invited');

  const id = randomId();
  const ts = nowIso();
  await exec(
    `INSERT INTO project_invitations (id, project_id, invitee_user_id, inviter_user_id, proposed_role, state, expires_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
    [id, projectId, body.inviteeUserId, req.auth!.userId, body.role, hoursFromNow(24 * 14), ts, ts],
  );
  await writeAudit({
    projectId,
    actorUserId: req.auth!.userId,
    action: 'invitation.send',
    entityType: 'invitation',
    entityId: id,
    after: { invitee: body.inviteeUserId, role: body.role },
  });
  await notifyUser(body.inviteeUserId, projectId, 'invitation', 'Project invitation', `You were invited to join a project as ${body.role}.`);
  res.status(201).json({ id });
}));

/** My invitations (Req 5). */
invitationsRouter.get('/', requireAuth, ah(async (req, res) => {
  const rows = await query<InvitationRow & { project_name: string; inviter_name: string }>(
    `SELECT i.*, p.name AS project_name, u.display_name AS inviter_name
     FROM project_invitations i
     JOIN projects p ON p.id = i.project_id
     JOIN users u ON u.id = i.inviter_user_id
     WHERE i.invitee_user_id = ?
     ORDER BY i.created_at DESC`,
    [req.auth!.userId],
  );
  res.json({
    invitations: rows.map((r) => ({
      id: r.id,
      projectId: r.project_id,
      projectName: r.project_name,
      inviterName: r.inviter_name,
      role: r.proposed_role,
      state: effectiveState(r),
      createdAt: r.created_at,
    })),
  });
}));

/** Accept — creates membership only from a valid pending invitation (Req 5.3, 5.7). */
invitationsRouter.post('/:invitationId/accept', requireAuth, ah(async (req, res) => {
  const inv = await getInvitation(req.params.invitationId);
  if (!inv) throw notFound('That invitation could not be found.');
  if (inv.invitee_user_id !== req.auth!.userId) throw forbidden('This invitation is not addressed to you.');
  if (effectiveState(inv) !== 'pending') throw badRequest('This invitation can no longer be accepted.', 'invitation_closed');

  await tx(async (c) => {
    const ts = nowIso();
    await c.exec("UPDATE project_invitations SET state = 'accepted', updated_at = ? WHERE id = ?", [ts, inv.id]);
    await c.exec(
      `INSERT INTO project_members (id, project_id, user_id, role, added_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [randomId(), inv.project_id, inv.invitee_user_id, inv.proposed_role, inv.inviter_user_id, ts],
    );
    await writeAudit({
      projectId: inv.project_id,
      actorUserId: req.auth!.userId,
      action: 'invitation.accept',
      entityType: 'member',
      entityId: inv.invitee_user_id,
      after: { role: inv.proposed_role },
    }, c);
  });
  await notifyUser(inv.inviter_user_id, inv.project_id, 'invitation_accepted', 'Invitation accepted', 'Your invitation was accepted.');
  res.json({ ok: true });
}));

/** Decline (Req 5.4). */
invitationsRouter.post('/:invitationId/decline', requireAuth, ah(async (req, res) => {
  const inv = await getInvitation(req.params.invitationId);
  if (!inv) throw notFound('That invitation could not be found.');
  if (inv.invitee_user_id !== req.auth!.userId) throw forbidden('This invitation is not addressed to you.');
  if (effectiveState(inv) !== 'pending') throw badRequest('This invitation can no longer be declined.', 'invitation_closed');

  await exec("UPDATE project_invitations SET state = 'declined', updated_at = ? WHERE id = ?", [nowIso(), inv.id]);
  await writeAudit({
    projectId: inv.project_id,
    actorUserId: req.auth!.userId,
    action: 'invitation.decline',
    entityType: 'invitation',
    entityId: inv.id,
  });
  res.json({ ok: true });
}));

/** Cancel a pending invitation (Req 5.5). */
projectInvitationsRouter.post('/:invitationId/cancel', requireAuth, requirePermission('invite_members'), ah(async (req, res) => {
  const inv = await getInvitation(req.params.invitationId);
  if (!inv || inv.project_id !== req.params.projectId) throw notFound('That invitation could not be found.');
  if (effectiveState(inv) !== 'pending') throw badRequest('Only pending invitations can be cancelled.', 'invitation_closed');

  await exec("UPDATE project_invitations SET state = 'cancelled', updated_at = ? WHERE id = ?", [nowIso(), inv.id]);
  await writeAudit({
    projectId: inv.project_id,
    actorUserId: req.auth!.userId,
    action: 'invitation.cancel',
    entityType: 'invitation',
    entityId: inv.id,
  });
  res.json({ ok: true });
}));
