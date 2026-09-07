import { one } from '../db/connection.js';
import {
  buildTree,
  getProjectComponents,
  type ComponentNode,
} from '../lib/tree.js';

export type ProgressMethod =
  | 'budget_weighted'
  | 'simple_average'
  | 'quantity_weighted'
  | 'manual';

/**
 * Computes rolled-up progress for a node (Req 8). Leaves use their stored
 * progress; parents combine children by the project's configured method.
 */
export async function computeProgress(node: ComponentNode, method: ProgressMethod): Promise<number> {
  if (node.children.length === 0) {
    return clamp(node.progress);
  }

  const parts: Array<{ value: number; child: ComponentNode }> = [];
  for (const child of node.children) {
    parts.push({ value: await computeProgress(child, method), child });
  }

  switch (method) {
    case 'simple_average':
      return avg(parts.map((p) => p.value));

    case 'quantity_weighted': {
      const items = [];
      for (const p of parts) items.push({ value: p.value, weight: await materialQuantity(p.child.id) });
      return weighted(items);
    }

    case 'manual':
      return weighted(parts.map((p) => ({ value: p.value, weight: p.child.weight })));

    case 'budget_weighted':
    default:
      return weighted(parts.map((p) => ({ value: p.value, weight: p.child.approved_budget })));
  }
}

/** Overall project progress: roll-up across root components. */
export async function computeProjectProgress(projectId: string, method: ProgressMethod): Promise<number> {
  const roots = buildTree(await getProjectComponents(projectId));
  if (roots.length === 0) return 0;
  const synthetic: ComponentNode = {
    id: '__root__',
    project_id: projectId,
    parent_id: null,
    name: '',
    component_type: 'custom',
    sort_order: 0,
    status: 'planning',
    progress: 0,
    weight: 1,
    approved_budget: 0,
    start_date: null,
    end_date: null,
    created_at: '',
    updated_at: '',
    children: roots,
  };
  return Math.round(await computeProgress(synthetic, method));
}

async function materialQuantity(componentId: string): Promise<number> {
  const row = await one<{ q: number }>(
    'SELECT COALESCE(SUM(total_needed), 0) AS q FROM materials WHERE component_id = ?',
    [componentId],
  );
  return row?.q ?? 0;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Weighted average; falls back to simple average when all weights are 0. */
function weighted(items: Array<{ value: number; weight: number }>): number {
  const totalWeight = items.reduce((a, b) => a + b.weight, 0);
  if (totalWeight <= 0) return avg(items.map((i) => i.value));
  return items.reduce((a, b) => a + b.value * b.weight, 0) / totalWeight;
}
