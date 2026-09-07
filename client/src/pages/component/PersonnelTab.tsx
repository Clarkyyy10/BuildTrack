import { useState } from 'react';
import { useApi } from '../../lib/useApi.js';
import { api, ApiError } from '../../lib/api.js';
import { Avatar, Button, Card, EmptyState, ErrorState, Spinner } from '../../components/ui.js';
import { Modal } from '../../components/Modal.js';
import { shortDate } from '../../lib/format.js';
import type { Personnel } from '../../lib/types.js';

export function PersonnelTab({ componentId, canManage }: { componentId: string; canManage: boolean }) {
  const { data, loading, error, reload } = useApi<{ personnel: Personnel[] }>(`/components/${componentId}/personnel`);
  const [showAdd, setShowAdd] = useState(false);

  if (loading) return <Spinner label="Loading personnel…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const people = data?.personnel ?? [];

  async function remove(id: string) {
    if (window.confirm('Remove this person from the component?')) {
      await api.del(`/components/${componentId}/personnel/${id}`);
      reload();
    }
  }

  return (
    <Card>
      <div className="row-between" style={{ marginBottom: 12 }}>
        <h3>Team assigned</h3>
        {canManage && <Button size="sm" onClick={() => setShowAdd(true)}>+ Assign person</Button>}
      </div>
      {people.length === 0 ? (
        <EmptyState title="No one assigned yet" hint="Assign on-site personnel to this component." action={canManage ? <Button size="sm" onClick={() => setShowAdd(true)}>+ Assign person</Button> : undefined} />
      ) : (
        <div className="stack" style={{ gap: 4 }}>
          {people.map((p) => (
            <div key={p.id} className="row-between" style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>
              <div className="row" style={{ gap: 12 }}>
                <Avatar name={p.name} />
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 500 }}>{p.name} {p.isLead && <span style={{ fontSize: '0.7rem', color: 'var(--accent)', background: 'var(--accent-soft)', padding: '1px 7px', borderRadius: 999, marginLeft: 4 }}>Lead</span>}</div>
                  <div className="muted" style={{ fontSize: '0.8rem' }}>{p.role}{p.startDate ? ` · since ${shortDate(p.startDate)}` : ''}</div>
                </div>
              </div>
              {canManage && <Button size="sm" variant="ghost" onClick={() => remove(p.id)}>Remove</Button>}
            </div>
          ))}
        </div>
      )}
      {showAdd && <AssignModal componentId={componentId} onClose={() => setShowAdd(false)} onDone={() => { setShowAdd(false); reload(); }} />}
    </Card>
  );
}

function AssignModal({ componentId, onClose, onDone }: { componentId: string; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ personName: '', siteRole: '', isLead: false, startDate: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true); setError('');
    try { await api.post(`/components/${componentId}/personnel`, { ...form, startDate: form.startDate || undefined }); onDone(); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Failed.'); setBusy(false); }
  }
  return (
    <Modal title="Assign Personnel" onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <div className="field"><label>Name</label><input value={form.personName} onChange={(e) => setForm({ ...form, personName: e.target.value })} autoFocus required /></div>
        <div className="field"><label>Site role</label><input value={form.siteRole} onChange={(e) => setForm({ ...form, siteRole: e.target.value })} required placeholder="e.g. Electrician" /></div>
        <div className="field"><label>Start date</label><input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
        <label className="row" style={{ gap: 8, fontWeight: 400, color: 'var(--text)' }}>
          <input type="checkbox" checked={form.isLead} onChange={(e) => setForm({ ...form, isLead: e.target.checked })} style={{ width: 'auto' }} /> Mark as lead
        </label>
        {error && <p style={{ color: 'var(--error)', fontSize: '0.85rem' }}>{error}</p>}
        <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Assigning…' : 'Assign'}</Button>
        </div>
      </form>
    </Modal>
  );
}
