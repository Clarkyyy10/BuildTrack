import { one, exec } from '../db/connection.js';
import { newComponentId } from '../lib/ids.js';
import { nowIso } from '../lib/time.js';
import { writeAudit } from '../lib/audit.js';
import type { TemplateNode } from './templates.js';

export interface CreateComponentInput {
  projectId: string;
  parentId?: string | null;
  name: string;
  componentType?: string;
  approvedBudget?: number;
  startDate?: string | null;
  endDate?: string | null;
}

/** Next sort_order among siblings under the same parent. */
async function nextSortOrder(projectId: string, parentId: string | null): Promise<number> {
  const row = await one<{ next: number }>(
    `SELECT COALESCE(MAX(sort_order), -1) + 1 AS next
     FROM project_components
     WHERE project_id = ? AND parent_id IS NOT DISTINCT FROM ?`,
    [projectId, parentId],
  );
  return row?.next ?? 0;
}

export async function createComponent(input: CreateComponentInput, actorId: string): Promise<string> {
  const id = await newComponentId();
  const ts = nowIso();
  const parentId = input.parentId ?? null;
  await exec(
    `INSERT INTO project_components
       (id, project_id, parent_id, name, component_type, sort_order,
        status, progress, weight, approved_budget, start_date, end_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'planning', 0, 1, ?, ?, ?, ?, ?)`,
    [
      id,
      input.projectId,
      parentId,
      input.name,
      input.componentType ?? 'custom',
      await nextSortOrder(input.projectId, parentId),
      input.approvedBudget ?? 0,
      input.startDate ?? null,
      input.endDate ?? null,
      ts,
      ts,
    ],
  );

  await writeAudit({
    projectId: input.projectId,
    componentId: id,
    actorUserId: actorId,
    action: 'component.create',
    entityType: 'component',
    entityId: id,
    after: { name: input.name, type: input.componentType ?? 'custom', parentId },
  });
  return id;
}

/** Recursively inserts a template subtree under an optional parent. */
export async function insertTemplate(
  projectId: string,
  nodes: TemplateNode[],
  parentId: string | null,
  actorId: string,
): Promise<void> {
  for (const node of nodes) {
    const id = await createComponent(
      { projectId, parentId, name: node.name, componentType: node.type },
      actorId,
    );
    if (node.children?.length) {
      await insertTemplate(projectId, node.children, id, actorId);
    }
  }
}
