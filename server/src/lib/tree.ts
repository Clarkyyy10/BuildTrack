import { one, query } from '../db/connection.js';

export interface ComponentRow {
  id: string;
  project_id: string;
  parent_id: string | null;
  name: string;
  component_type: string;
  sort_order: number;
  status: string;
  progress: number;
  weight: number;
  approved_budget: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

/** All components for a project, ordered for stable tree assembly. */
export async function getProjectComponents(projectId: string): Promise<ComponentRow[]> {
  return query<ComponentRow>(
    `SELECT * FROM project_components
     WHERE project_id = ?
     ORDER BY COALESCE(parent_id, ''), sort_order, created_at`,
    [projectId],
  );
}

export interface ComponentNode extends ComponentRow {
  children: ComponentNode[];
}

/** Builds a nested tree from a flat component list. */
export function buildTree(rows: ComponentRow[]): ComponentNode[] {
  const byId = new Map<string, ComponentNode>();
  rows.forEach((r) => byId.set(r.id, { ...r, children: [] }));
  const roots: ComponentNode[] = [];
  for (const node of byId.values()) {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

/**
 * Returns true if componentId is the same node as, or an ancestor of,
 * candidateChildId. Used to reject cycle-creating moves (Req 6.5).
 */
export async function isSelfOrDescendant(componentId: string, candidateChildId: string): Promise<boolean> {
  if (componentId === candidateChildId) return true;
  let current: string | null = candidateChildId;
  const guard = new Set<string>();
  while (current) {
    if (current === componentId) return true;
    if (guard.has(current)) break;
    guard.add(current);
    const row: { parent_id: string | null } | undefined = await one<{ parent_id: string | null }>(
      'SELECT parent_id FROM project_components WHERE id = ?',
      [current],
    );
    current = row?.parent_id ?? null;
  }
  return false;
}
