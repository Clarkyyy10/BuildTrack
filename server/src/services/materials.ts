import { one, query } from '../db/connection.js';
import { todayDate } from '../lib/time.js';

export interface MaterialRow {
  id: string;
  component_id: string;
  name: string;
  description: string | null;
  category: string | null;
  unit: string;
  unit_cost: number;
  supplier: string | null;
  status: string;
  total_needed: number;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TxnRow {
  id: string;
  material_id: string;
  type: string;
  quantity: number;
  from_component_id: string | null;
  to_component_id: string | null;
  reason: string | null;
  created_by: string;
  created_at: string;
}

export function getMaterial(id: string): Promise<MaterialRow | undefined> {
  return one<MaterialRow>('SELECT * FROM materials WHERE id = ?', [id]);
}

function transactions(materialId: string): Promise<TxnRow[]> {
  return query<TxnRow>(
    'SELECT * FROM material_transactions WHERE material_id = ? ORDER BY created_at',
    [materialId],
  );
}

/** Signed effect of a transaction on a material's stock. */
function effect(txn: TxnRow, componentId: string): number {
  switch (txn.type) {
    case 'receive':
      return txn.quantity;
    case 'use':
    case 'waste':
      return -txn.quantity;
    case 'adjustment':
      return txn.quantity;
    case 'transfer':
      return txn.to_component_id === componentId ? txn.quantity : -txn.quantity;
    default:
      return 0;
  }
}

/** Current derived stock for a material (Req 9.3) — never a stored column. */
export async function deriveStock(materialId: string): Promise<number> {
  const m = await getMaterial(materialId);
  if (!m) return 0;
  const txns = await transactions(materialId);
  return txns.reduce((sum, t) => sum + effect(t, m.component_id), 0);
}

export interface MaterialSummary {
  id: string;
  name: string;
  category: string | null;
  unit: string;
  unitCost: number;
  supplier: string | null;
  status: string;
  totalNeeded: number;
  received: number;
  used: number;
  waste: number;
  usedToday: number;
  remaining: number;
}

export async function materialSummary(m: MaterialRow): Promise<MaterialSummary> {
  const txns = await transactions(m.id);
  const today = todayDate();
  let received = 0, used = 0, waste = 0, usedToday = 0, stock = 0;
  for (const t of txns) {
    stock += effect(t, m.component_id);
    if (t.type === 'receive') received += t.quantity;
    if (t.type === 'use') {
      used += t.quantity;
      if (t.created_at.slice(0, 10) === today) usedToday += t.quantity;
    }
    if (t.type === 'waste') waste += t.quantity;
  }
  return {
    id: m.id,
    name: m.name,
    category: m.category,
    unit: m.unit,
    unitCost: m.unit_cost,
    supplier: m.supplier,
    status: m.status,
    totalNeeded: m.total_needed,
    received,
    used,
    waste,
    usedToday,
    remaining: stock,
  };
}

/** Materials for a component, with derived summaries. */
export async function componentMaterials(componentId: string): Promise<MaterialSummary[]> {
  const rows = await query<MaterialRow>(
    'SELECT * FROM materials WHERE component_id = ? ORDER BY name',
    [componentId],
  );
  return Promise.all(rows.map((r) => materialSummary(r)));
}
