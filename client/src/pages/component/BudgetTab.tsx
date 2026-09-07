import { useState } from 'react';
import { useApi } from '../../lib/useApi.js';
import { api, ApiError } from '../../lib/api.js';
import { Button, Card, ErrorState, Spinner, StatusPill } from '../../components/ui.js';
import { Modal } from '../../components/Modal.js';
import { money, shortDate, titleCase } from '../../lib/format.js';
import type { BudgetSummary } from '../../lib/types.js';

interface BudgetResponse {
  summary: BudgetSummary;
  changes: Array<{ id: string; previous_amount: number; new_amount: number; difference: number; reason: string | null; created_at: string }>;
  expenses: Array<{ id: string; amount: number; category: string; description: string | null; spent_on: string }>;
}

export function BudgetTab({ componentId, canManage, onChanged }: { componentId: string; canManage: boolean; onChanged: () => void }) {
  const { data, loading, error, reload } = useApi<BudgetResponse>(`/components/${componentId}/budget`);
  const [modal, setModal] = useState<'expense' | 'change' | null>(null);

  if (loading) return <Spinner label="Loading budget…" />;
  if (error || !data) return <ErrorState message={error ?? 'Failed to load.'} onRetry={reload} />;
  const s = data.summary;
  const ring = `conic-gradient(var(--accent) ${s.percentSpent * 3.6}deg, var(--surface-2) 0deg)`;

  return (
    <div className="grid grid-2" style={{ alignItems: 'start' }}>
      <Card>
        <div className="row-between" style={{ marginBottom: 16 }}>
          <h3>Budget</h3>
          {canManage && <Button size="sm" variant="secondary" onClick={() => setModal('change')}>Change approved</Button>}
        </div>
        <div className="row" style={{ gap: 20 }}>
          <div className="bt-ring" style={{ width: 120, height: 120, borderRadius: '50%', background: ring, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'var(--surface)', display: 'grid', placeItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{s.percentSpent}%</div>
                <div className="muted" style={{ fontSize: '0.7rem' }}>spent</div>
              </div>
            </div>
          </div>
          <div className="stack" style={{ gap: 8, flex: 1 }}>
            <div className="row-between"><span className="muted">Approved</span><strong>{money(s.approved)}</strong></div>
            <div className="row-between"><span className="muted">Spent</span><strong>{money(s.spent)}</strong></div>
            <div className="row-between"><span className="muted">Remaining</span><strong>{money(s.remaining)}</strong></div>
            <div className="row-between"><span className="muted">Status</span><StatusPill status={s.status} /></div>
          </div>
        </div>

        <h4 style={{ margin: '20px 0 10px', fontSize: '0.9rem' }}>Cost breakdown</h4>
        {s.breakdown.length === 0 ? <p className="muted" style={{ fontSize: '0.88rem' }}>No expenses recorded yet.</p> : (
          <table>
            <thead><tr><th>Category</th><th>Amount</th><th>%</th></tr></thead>
            <tbody>{s.breakdown.map((b) => <tr key={b.category}><td>{titleCase(b.category)}</td><td>{money(b.amount)}</td><td>{b.percent}%</td></tr>)}</tbody>
          </table>
        )}
      </Card>

      <Card>
        <div className="row-between" style={{ marginBottom: 12 }}>
          <h3>Expenses</h3>
          {canManage && <Button size="sm" onClick={() => setModal('expense')}>+ Add expense</Button>}
        </div>
        {data.expenses.length === 0 ? <p className="muted" style={{ fontSize: '0.88rem' }}>No expenses yet.</p> : (
          <table>
            <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th></tr></thead>
            <tbody>{data.expenses.map((e) => <tr key={e.id}><td>{shortDate(e.spent_on)}</td><td>{titleCase(e.category)}</td><td>{e.description ?? '—'}</td><td>{money(e.amount)}</td></tr>)}</tbody>
          </table>
        )}
        {data.changes.length > 0 && (
          <>
            <h4 style={{ margin: '20px 0 10px', fontSize: '0.9rem' }}>Approved budget changes</h4>
            <div className="stack" style={{ gap: 8 }}>
              {data.changes.map((c) => (
                <div key={c.id} style={{ fontSize: '0.85rem', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                  <div>{money(c.previous_amount)} → {money(c.new_amount)} <span style={{ color: c.difference >= 0 ? 'var(--success)' : 'var(--error)' }}>({c.difference >= 0 ? '+' : ''}{money(c.difference)})</span></div>
                  <div className="muted" style={{ fontSize: '0.78rem' }}>{c.reason ?? 'No reason given'} · {shortDate(c.created_at)}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {modal === 'expense' && <ExpenseModal componentId={componentId} onClose={() => setModal(null)} onDone={() => { setModal(null); reload(); onChanged(); }} />}
      {modal === 'change' && <ChangeBudgetModal componentId={componentId} current={s.approved} onClose={() => setModal(null)} onDone={() => { setModal(null); reload(); onChanged(); }} />}
    </div>
  );
}

function ExpenseModal({ componentId, onClose, onDone }: { componentId: string; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState('materials');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true); setError('');
    try { await api.post(`/components/${componentId}/budget/expenses`, { amount, category, description: description || undefined }); onDone(); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Failed.'); setBusy(false); }
  }
  return (
    <Modal title="Add Expense" onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <div className="grid grid-2">
          <div className="field"><label>Amount</label><input type="number" min={0} value={amount} onChange={(e) => setAmount(Number(e.target.value))} autoFocus required /></div>
          <div className="field"><label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="materials">Materials</option><option value="labor">Labor</option><option value="equipment">Equipment</option><option value="misc">Misc</option>
            </select>
          </div>
        </div>
        <div className="field"><label>Description</label><input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        {error && <p style={{ color: 'var(--error)', fontSize: '0.85rem' }}>{error}</p>}
        <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Adding…' : 'Add expense'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function ChangeBudgetModal({ componentId, current, onClose, onDone }: { componentId: string; current: number; onClose: () => void; onDone: () => void }) {
  const [newAmount, setNewAmount] = useState(current);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true); setError('');
    try { await api.post(`/components/${componentId}/budget/change`, { newAmount, reason: reason || undefined }); onDone(); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Failed.'); setBusy(false); }
  }
  return (
    <Modal title="Change Approved Budget" onClose={onClose}>
      <p className="muted" style={{ fontSize: '0.85rem', marginBottom: 12 }}>Current approved: <strong style={{ color: 'var(--text)' }}>{money(current)}</strong>. This is logged as a separate, auditable event.</p>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <div className="field"><label>New approved amount</label><input type="number" min={0} value={newAmount} onChange={(e) => setNewAmount(Number(e.target.value))} autoFocus /></div>
        <div className="field"><label>Reason</label><input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Additional approved work" /></div>
        {error && <p style={{ color: 'var(--error)', fontSize: '0.85rem' }}>{error}</p>}
        <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save change'}</Button>
        </div>
      </form>
    </Modal>
  );
}
