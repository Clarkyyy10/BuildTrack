import { one } from '../db/connection.js';

export type Role =
  | 'project_manager'
  | 'site_engineer'
  | 'architect'
  | 'contractor'
  | 'viewer';

export type Permission =
  | 'view_project'
  | 'edit_project'
  | 'manage_components'
  | 'manage_budget'
  | 'manage_materials'
  | 'manage_schedule'
  | 'manage_personnel'
  | 'invite_members'
  | 'create_daily_record'
  | 'update_progress'
  | 'view_activity';

/**
 * Single source of truth: role -> permission set (design.md permission matrix,
 * Req 4). Enforced server-side; independent of any UI state.
 */
const MATRIX: Record<Role, Permission[]> = {
  project_manager: [
    'view_project', 'edit_project', 'manage_components', 'manage_budget',
    'manage_materials', 'manage_schedule', 'manage_personnel', 'invite_members',
    'create_daily_record', 'update_progress', 'view_activity',
  ],
  site_engineer: [
    'view_project', 'edit_project', 'manage_components', 'manage_materials',
    'manage_schedule', 'manage_personnel', 'create_daily_record',
    'update_progress', 'view_activity',
  ],
  architect: [
    'view_project', 'edit_project', 'manage_components', 'manage_schedule',
    'update_progress', 'view_activity',
  ],
  contractor: [
    'view_project', 'manage_materials', 'create_daily_record',
    'update_progress', 'view_activity',
  ],
  viewer: ['view_project', 'view_activity'],
};

export function roleHasPermission(role: Role, perm: Permission): boolean {
  return MATRIX[role]?.includes(perm) ?? false;
}

export const ALL_ROLES: Role[] = [
  'project_manager', 'site_engineer', 'architect', 'contractor', 'viewer',
];

/** Returns the requester's role in a project, or null if not a member. */
export async function getMemberRole(projectId: string, userId: string): Promise<Role | null> {
  const row = await one<{ role: Role }>(
    'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
    [projectId, userId],
  );
  return row?.role ?? null;
}
