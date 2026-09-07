import { Router } from 'express';
import { z } from 'zod';
import { one, exec, query, tx } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { validateBody } from '../middleware/validate.js';
import { ah } from '../lib/http.js';
import { newExpenseId, randomId } from '../lib/ids.js';
import { nowIso, todayDate } from '../lib/time.js';
import { writeAudit } from '../lib/audit.js';
import { componentBudgetSummary } from '../services/stats.js';
import { notifyProjectMembers } from '../services/notify.js';

export const budgetRouter = Router({ mergeParams: true });

async function componentBudget(componentId: string): Promise<number> {
  const row = await one<{ a: number }>('SELECT approved_budget AS a FROM project_components WHERE id = ?', [componentId]);
  return row?.a ?? 0;
}

/** Budget summary + approved-budget change history + expenses (Req 10.5). */
budgetRouter.get('/', requireAuth, requirePermission('view_project'), ah(async (req, res) => {
  const componentId = req.params.componentId;
  const changes = await query('SELECT * FROM budget_changes WHERE component_id = ? ORDER BY created_at DESC', [componentId]);
  const expenses = await query('SELECT * FROM expenses WHERE component_id = ? ORDER BY spent_on DESC, created_at DESC', [componentId]);
  res.json({ summary: await componentBudgetSummary(componentId), changes, expenses });
}));

const changeSchema = z.object({
  newAmount: z.number().min(0),
  reason: z.string().trim().max(500).optional(),
});

/** Change approved budget — a separate, logged event (Req 10.2, 10.3). */
budgetRouter.post('/change', requireAuth, requirePermission('manage_budget'), validateBody(changeSchema), ah(async (req, res) => {
  const body = req.body as z.infer<typeof changeSchema>;
  const componentId = req.params.componentId;
  const previous = await componentBudget(componentId);
  const difference = body.newAmount - previous;

  await tx(async (c) => {
    await c.exec('UPDATE project_components SET approved_budget = ?, updated_at = ? WHERE id = ?', [body.newAmount, nowIso(), componentId]);
    await c.exec(
      `INSERT INTO budget_changes (id, component_id, previous_amount, new_amount, difference, reason, changed_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomId(), componentId, previous, body.newAmount, difference, body.reason ?? null, req.auth!.userId, nowIso()],
    );
    await writeAudit({
      projectId: req.projectId!,
      componentId,
      actorUserId: req.auth!.userId,
      action: 'budget.change',
      entityType: 'budget',
      entityId: componentId,
      before: { approved: previous },
      after: { approved: body.newAmount, difference },
    }, c);
  });

  res.json({ summary: await componentBudgetSummary(componentId) });
}));

const expenseSchema = z.object({
  amount: z.number().positive(),
  category: z.enum(['materials', 'labor', 'equipment', 'misc']).default('materials'),
  description: z.string().trim().max(500).optional(),
  spentOn: z.string().trim().optional(),
});

/** Record an expense — does NOT change approved budget (Req 10.2, 10.4). */
budgetRouter.post('/expenses', requireAuth, requirePermission('manage_budget'), validateBody(expenseSchema), ah(async (req, res) => {
  const body = req.body as z.infer<typeof expenseSchema>;
  const componentId = req.params.componentId;
  const id = await newExpenseId();
  await exec(
    `INSERT INTO expenses (id, component_id, amount, category, description, spent_on, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, componentId, body.amount, body.category, body.description ?? null, body.spentOn ?? todayDate(), req.auth!.userId, nowIso()],
  );
  await writeAudit({
    projectId: req.projectId!,
    componentId,
    actorUserId: req.auth!.userId,
    action: 'expense.create',
    entityType: 'expense',
    entityId: id,
    after: { amount: body.amount, category: body.category },
  });

  const summary = await componentBudgetSummary(componentId);
  if (summary.status === 'over_budget') {
    await notifyProjectMembers(req.projectId!, 'budget_warning', 'Budget exceeded', 'Spending has exceeded the approved budget for a component.');
  }
  res.status(201).json({ summary });
}));
