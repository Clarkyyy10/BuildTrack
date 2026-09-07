import { Router } from 'express';
import { z } from 'zod';
import { one, exec, query, tx } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { validateBody } from '../middleware/validate.js';
import { ah } from '../lib/http.js';
import { newMaterialId, newTxnId } from '../lib/ids.js';
import { nowIso } from '../lib/time.js';
import { writeAudit } from '../lib/audit.js';
import { badRequest, notFound } from '../lib/errors.js';
import {
  componentMaterials,
  deriveStock,
  getMaterial,
  materialSummary,
  type TxnRow,
} from '../services/materials.js';
import { notifyProjectMembers } from '../services/notify.js';

export const materialsOnComponentRouter = Router({ mergeParams: true });
export const materialsRouter = Router();

const LOW_STOCK_THRESHOLD = 0.1;

/** List a component's materials with derived summaries (Req 9.7). */
materialsOnComponentRouter.get('/', requireAuth, requirePermission('view_project'), ah(async (req, res) => {
  res.json({ materials: await componentMaterials(req.params.componentId) });
}));

const createSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).optional(),
  category: z.string().trim().max(80).optional(),
  unit: z.string().trim().max(40).default('unit'),
  unitCost: z.number().min(0).default(0),
  supplier: z.string().trim().max(160).optional(),
  totalNeeded: z.number().min(0).default(0),
  notes: z.string().trim().max(1000).optional(),
});

materialsOnComponentRouter.post('/', requireAuth, requirePermission('manage_materials'), validateBody(createSchema), ah(async (req, res) => {
  const body = req.body as z.infer<typeof createSchema>;
  const componentId = req.params.componentId;
  const id = await newMaterialId();
  const ts = nowIso();
  await exec(
    `INSERT INTO materials
       (id, component_id, name, description, category, unit, unit_cost, supplier, status, total_needed, notes, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)`,
    [
      id, componentId, body.name, body.description ?? null, body.category ?? null,
      body.unit, body.unitCost, body.supplier ?? null, body.totalNeeded, body.notes ?? null,
      req.auth!.userId, ts, ts,
    ],
  );
  await writeAudit({
    projectId: req.projectId!,
    componentId,
    actorUserId: req.auth!.userId,
    action: 'material.create',
    entityType: 'material',
    entityId: id,
    after: { name: body.name },
  });
  res.status(201).json({ material: await materialSummary((await getMaterial(id))!) });
}));

/** Transaction history for a material (Req 9.6). */
materialsRouter.get('/:materialId/transactions', requireAuth, requirePermission('view_project'), ah(async (req, res) => {
  const rows = await query<TxnRow>(
    'SELECT * FROM material_transactions WHERE material_id = ? ORDER BY created_at DESC',
    [req.params.materialId],
  );
  res.json({
    transactions: rows.map((t) => ({
      id: t.id,
      type: t.type,
      quantity: t.quantity,
      fromComponentId: t.from_component_id,
      toComponentId: t.to_component_id,
      reason: t.reason,
      createdBy: t.created_by,
      createdAt: t.created_at,
    })),
    stock: await deriveStock(req.params.materialId),
  });
}));

const txnSchema = z.object({
  type: z.enum(['receive', 'use', 'waste', 'adjustment']),
  quantity: z.number(),
  reason: z.string().trim().max(500).optional(),
});

/** Record a receive/use/waste/adjustment transaction (Req 9.2, 9.5). */
materialsRouter.post('/:materialId/transactions', requireAuth, requirePermission('manage_materials'), validateBody(txnSchema), ah(async (req, res) => {
  const body = req.body as z.infer<typeof txnSchema>;
  const material = await getMaterial(req.params.materialId);
  if (!material) throw notFound('That material could not be found.');

  if (body.type !== 'adjustment' && body.quantity <= 0) {
    throw badRequest('Quantity must be greater than zero.', 'invalid_quantity');
  }

  const current = await deriveStock(material.id);
  const delta =
    body.type === 'receive' ? body.quantity
    : body.type === 'adjustment' ? body.quantity
    : -body.quantity;
  if (current + delta < 0) {
    throw badRequest(
      `This would drop stock below zero (current ${current} ${material.unit}).`,
      'insufficient_stock',
    );
  }

  const storedQty = body.type === 'adjustment' ? body.quantity : Math.abs(body.quantity);
  await exec(
    `INSERT INTO material_transactions (id, material_id, type, quantity, reason, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [await newTxnId(), material.id, body.type, storedQty, body.reason ?? null, req.auth!.userId, nowIso()],
  );
  await writeAudit({
    projectId: req.projectId!,
    componentId: material.component_id,
    actorUserId: req.auth!.userId,
    action: `material.${body.type}`,
    entityType: 'material',
    entityId: material.id,
    after: { type: body.type, quantity: body.quantity },
  });

  const remaining = await deriveStock(material.id);
  if (material.total_needed > 0 && remaining <= material.total_needed * LOW_STOCK_THRESHOLD) {
    await notifyProjectMembers(
      req.projectId!,
      'material_low',
      `Low stock: ${material.name}`,
      `${material.name} is down to ${remaining} ${material.unit}.`,
    );
  }
  res.status(201).json({ material: await materialSummary((await getMaterial(material.id))!) });
}));

const transferSchema = z.object({
  quantity: z.number().positive(),
  toComponentId: z.string().trim(),
  reason: z.string().trim().max(500).optional(),
});

/** Transfer material to another component (Req 9.4): decrements source, increments destination. */
materialsRouter.post('/:materialId/transfer', requireAuth, requirePermission('manage_materials'), validateBody(transferSchema), ah(async (req, res) => {
  const body = req.body as z.infer<typeof transferSchema>;
  const source = await getMaterial(req.params.materialId);
  if (!source) throw notFound('That material could not be found.');

  const dest = await one<{ id: string; project_id: string }>(
    'SELECT id, project_id FROM project_components WHERE id = ?',
    [body.toComponentId],
  );
  if (!dest || dest.project_id !== req.projectId) {
    throw badRequest('The destination component is invalid.', 'invalid_destination');
  }
  if ((await deriveStock(source.id)) < body.quantity) {
    throw badRequest('Not enough stock to transfer.', 'insufficient_stock');
  }

  // Resolve or create destination material outside the txn (id gen is autocommit).
  let destId = (await one<{ id: string }>(
    'SELECT id FROM materials WHERE component_id = ? AND name = ?',
    [body.toComponentId, source.name],
  ))?.id;
  if (!destId) destId = await newMaterialId();
  const srcTxnId = await newTxnId();
  const dstTxnId = await newTxnId();

  await tx(async (c) => {
    const ts = nowIso();
    const exists = await c.one('SELECT id FROM materials WHERE id = ?', [destId]);
    if (!exists) {
      await c.exec(
        `INSERT INTO materials (id, component_id, name, category, unit, unit_cost, supplier, status, total_needed, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 0, ?, ?, ?)`,
        [destId, body.toComponentId, source.name, source.category, source.unit, source.unit_cost, source.supplier, req.auth!.userId, ts, ts],
      );
    }
    await c.exec(
      `INSERT INTO material_transactions (id, material_id, type, quantity, from_component_id, to_component_id, reason, created_by, created_at)
       VALUES (?, ?, 'transfer', ?, ?, ?, ?, ?, ?)`,
      [srcTxnId, source.id, body.quantity, source.component_id, body.toComponentId, body.reason ?? null, req.auth!.userId, ts],
    );
    await c.exec(
      `INSERT INTO material_transactions (id, material_id, type, quantity, from_component_id, to_component_id, reason, created_by, created_at)
       VALUES (?, ?, 'transfer', ?, ?, ?, ?, ?, ?)`,
      [dstTxnId, destId, body.quantity, source.component_id, body.toComponentId, body.reason ?? null, req.auth!.userId, ts],
    );
    await writeAudit({
      projectId: req.projectId!,
      componentId: source.component_id,
      actorUserId: req.auth!.userId,
      action: 'material.transfer',
      entityType: 'material',
      entityId: source.id,
      after: { quantity: body.quantity, toComponentId: body.toComponentId },
    }, c);
  });

  res.status(201).json({ material: await materialSummary((await getMaterial(source.id))!) });
}));
