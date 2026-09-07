import { one, query } from '../db/connection.js';

/** Sum of approved budgets across all components of a project. */
export async function projectApprovedBudget(projectId: string): Promise<number> {
  const row = await one<{ total: number }>(
    'SELECT COALESCE(SUM(approved_budget), 0) AS total FROM project_components WHERE project_id = ?',
    [projectId],
  );
  return row?.total ?? 0;
}

/** Sum of expenses across all components of a project. */
export async function projectSpent(projectId: string): Promise<number> {
  const row = await one<{ total: number }>(
    `SELECT COALESCE(SUM(e.amount), 0) AS total
     FROM expenses e JOIN project_components c ON c.id = e.component_id
     WHERE c.project_id = ?`,
    [projectId],
  );
  return row?.total ?? 0;
}

export interface BudgetSummary {
  approved: number;
  spent: number;
  remaining: number;
  percentSpent: number;
  status: 'on_track' | 'over_budget';
  breakdown: Array<{ category: string; amount: number; percent: number }>;
}

/** Budget summary for a single component (Req 10.5). */
export async function componentBudgetSummary(componentId: string): Promise<BudgetSummary> {
  const approvedRow = await one<{ a: number }>(
    'SELECT approved_budget AS a FROM project_components WHERE id = ?',
    [componentId],
  );
  const approved = approvedRow?.a ?? 0;

  const spentRow = await one<{ s: number }>(
    'SELECT COALESCE(SUM(amount), 0) AS s FROM expenses WHERE component_id = ?',
    [componentId],
  );
  const spent = spentRow?.s ?? 0;

  const byCat = await query<{ category: string; amount: number }>(
    `SELECT category, COALESCE(SUM(amount), 0) AS amount
     FROM expenses WHERE component_id = ?
     GROUP BY category ORDER BY amount DESC`,
    [componentId],
  );

  const remaining = approved - spent;
  const percentSpent = approved > 0 ? Math.round((spent / approved) * 100) : 0;

  return {
    approved,
    spent,
    remaining,
    percentSpent,
    status: spent > approved ? 'over_budget' : 'on_track',
    breakdown: byCat.map((c) => ({
      category: c.category,
      amount: c.amount,
      percent: spent > 0 ? Math.round((c.amount / spent) * 100) : 0,
    })),
  };
}
