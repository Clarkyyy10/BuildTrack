import { useState } from 'react';
import { useApi } from '../../lib/useApi.js';
import { api, ApiError } from '../../lib/api.js';
import { Button, Card, EmptyState, ErrorState, Spinner } from '../../components/ui.js';
import { Modal } from '../../components/Modal.js';
import { money } from '../../lib/format.js';
import type { MaterialSummary } from '../../lib/types.js';

export function MaterialsTab({ componentId, canManage }: { componentId: string; canManage: boolean }) {
  const { data, loading, error, reload } = useApi<{ materials: MaterialSummary[] }>(`/components/${componentId}/materials`);
  const [showAdd, setShowAdd] = useState(false);
  const [txnFor, setTxnFor] = useState<MaterialSummary | null>(null);

  if (loading) return <Spinner label="Loading materials…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const materials = data?.materials ?? [];
  const totalUsedToday = materials.reduce((s, m) => s + m.usedToday, 0);
  const estCost = materials.reduce((s, m) => s + m.usedToday * m.unitCost, 0);

  return (
    <Card>
      <div className="row-between" style={{ marginBottom: 12 }}>
        <h3>Materials</h3>
        {canManage && <Button size="sm" onClick={() => setShowAdd(true)}>+ Add Material</Button>}
      </div>

      {materials.length === 0 ? (
        <EmptyState
          title="No materials have been added yet."
          hint="Add your first material to begin tracking project inventory."
          action={canManage ? <Button size="sm" onClick={() => setShowAdd(true)}>+ Add Material</Button> : undefined}
        />
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr><th>Material</th><th>Total Needed</th><th>Received</th><th>Used (Today)</th><th>Remaining</th><th></th></tr>
              </thead>
              <tbody>
                {materials.map((m) => (
                  <tr key={m.id}>
                    <td><strong>{m.name}</strong><div className="muted" style={{ fontSize: '0.78rem' }}>{m.unit}{m.category ? ` · ${m.category}` : ''}</div></td>
                    <td>{m.totalNeeded} {m.unit}</td>
                    <td>{m.received} {m.unit}</td>
                    <td>{m.usedToday} {m.unit}</td>
                    <td><strong>{m.remaining} {m.unit}</strong></td>
                    <td style={{ textAlign: 'right' }}>{canManage && <Button size="sm" variant="secondary" onClick={() => setTxnFor(m)}>Record</Button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="row-between" style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', fontSize: '0.88rem' }}>
            <span className="muted">Daily usage: <strong style={{ color: 'var(--text)' }}>{totalUsedToday} units</strong></span>
            <span className="muted">Estimated cost today: <strong style={{ color: 'var(--text)' }}>{money(estCost)}</strong></span>
          </div>
        </>
      )}

      {showAdd && <AddMaterialModal componentId={componentId} onClose={() => setShowAdd(false)} onDone={() => { setShowAdd(false); reload(); }} />}
      {txnFor && <TxnModal material={txnFor} onClose={() => setTxnFor(null)} onDone={() => { setTxnFor(null); reload(); }} />}
    </Card>
  );
}

function AddMaterialModal({ componentId, onClose, onDone }: { componentId: string; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ name: '', unit: 'pcs', category: 'materials', unitCost: 0, totalNeeded: 0, supplier: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true); setError('');
    try {
      await api.post(`/components/${componentId}/materials`, form);
      onDone();
    } catch (err) { setError(err instanceof ApiError ? err.message : 'Failed.'); setBusy(false); }
  }
  return (
    <Modal title="Add Material" onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <div className="field"><label>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus /></div>
        <div className="grid grid-2">
          <div className="field"><label>Unit</label><input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
          <div className="field"><label>Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="materials">Materials</option><option value="labor">Labor</option><option value="equipment">Equipment</option><option value="misc">Misc</option>
            </select>
          </div>
          <div className="field"><label>Unit cost</label><input type="number" min={0} value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: Number(e.target.value) })} /></div>
          <div className="field"><label>Total needed</label><input type="number" min={0} value={form.totalNeeded} onChange={(e) => setForm({ ...form, totalNeeded: Number(e.target.value) })} /></div>
        </div>
        <div className="field"><label>Supplier</label><input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></div>
        {error && <p style={{ color: 'var(--error)', fontSize: '0.85rem' }}>{error}</p>}
        <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Adding…' : 'Add material'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function TxnModal({ material, onClose, onDone }: { material: MaterialSummary; onClose: () => void; onDone: () => void }) {
  const [type, setType] = useState('use');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true); setError('');
    try {
      await api.post(`/materials/${material.id}/transactions`, { type, quantity, reason: reason || undefined });
      onDone();
    } catch (err) { setError(err instanceof ApiError ? err.message : 'Failed.'); setBusy(false); }
  }
  return (
    <Modal title={`Record — ${material.name}`} onClose={onClose}>
      <p className="muted" style={{ fontSize: '0.85rem', marginBottom: 12 }}>Current stock: <strong style={{ color: 'var(--text)' }}>{material.remaining} {material.unit}</strong></p>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <div className="grid grid-2">
          <div className="field"><label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="receive">Receive</option><option value="use">Use</option><option value="waste">Waste</option><option value="adjustment">Adjustment</option>
            </select>
          </div>
          <div className="field"><label>Quantity ({material.unit})</label><input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} autoFocus /></div>
        </div>
        <div className="field"><label>Reason (optional)</label><input value={reason} onChange={(e) => setReason(e.target.value)} /></div>
        {error && <p style={{ color: 'var(--error)', fontSize: '0.85rem' }}>{error}</p>}
        <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Recording…' : 'Record'}</Button>
        </div>
      </form>
    </Modal>
  );
}
