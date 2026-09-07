import { useState } from 'react';
import { useApi } from '../../lib/useApi.js';
import { api, ApiError } from '../../lib/api.js';
import { Button, Card, EmptyState, ErrorState, Spinner, StatusPill } from '../../components/ui.js';
import { Modal } from '../../components/Modal.js';
import { shortDate } from '../../lib/format.js';
import type { ScheduleActivity } from '../../lib/types.js';

interface ScheduleResponse {
  schedule: { startDate: string | null; endDate: string | null; status: string; progress: number };
  activities: ScheduleActivity[];
  currentPhase: { id: string; name: string; startDate: string | null; endDate: string | null } | null;
}

function span(a: ScheduleActivity, min: number, max: number): { left: string; width: string } {
  if (!a.startDate || !a.endDate || max <= min) return { left: '0%', width: '100%' };
  const s = new Date(a.startDate).getTime();
  const e = new Date(a.endDate).getTime();
  const left = ((s - min) / (max - min)) * 100;
  const width = Math.max(4, ((e - s) / (max - min)) * 100);
  return { left: `${left}%`, width: `${width}%` };
}

export function ScheduleTab({ componentId, canManage }: { componentId: string; canManage: boolean }) {
  const { data, loading, error, reload } = useApi<ScheduleResponse>(`/components/${componentId}/schedule`);
  const [showAdd, setShowAdd] = useState(false);

  if (loading) return <Spinner label="Loading schedule…" />;
  if (error || !data) return <ErrorState message={error ?? 'Failed to load.'} onRetry={reload} />;

  const acts = data.activities;
  const dates = acts.flatMap((a) => [a.startDate, a.endDate]).filter(Boolean).map((d) => new Date(d as string).getTime());
  const min = dates.length ? Math.min(...dates) : 0;
  const max = dates.length ? Math.max(...dates) : 0;
  const colors = ['#2f6df6', '#1f9d63', '#c9880a', '#8b5cf6', '#0ea5e9', '#e0518d', '#14b8a6'];

  return (
    <Card>
      <div className="row-between" style={{ marginBottom: 12 }}>
        <h3>Schedule</h3>
        {canManage && <Button size="sm" onClick={() => setShowAdd(true)}>+ Add activity</Button>}
      </div>

      {data.currentPhase && (
        <div className="row" style={{ gap: 8, marginBottom: 16, padding: '10px 12px', background: 'var(--accent-soft)', borderRadius: 8, fontSize: '0.88rem' }}>
          <span className="muted">Current phase:</span><strong style={{ color: 'var(--accent)' }}>{data.currentPhase.name}</strong>
          <span className="muted">{shortDate(data.currentPhase.startDate)} – {shortDate(data.currentPhase.endDate)}</span>
        </div>
      )}

      {acts.length === 0 ? (
        <EmptyState title="No schedule yet" hint="Add activities to plan and track this component's timeline." action={canManage ? <Button size="sm" onClick={() => setShowAdd(true)}>+ Add activity</Button> : undefined} />
      ) : (
        <>
          {/* Timeline */}
          <div className="stack" style={{ gap: 8, marginBottom: 20 }}>
            {acts.map((a, i) => {
              const pos = span(a, min, max);
              return (
                <div key={a.id} className="row" style={{ gap: 10 }}>
                  <div style={{ width: 130, fontSize: '0.85rem', flexShrink: 0 }}>{a.name}</div>
                  <div style={{ flex: 1, position: 'relative', height: 18, background: 'var(--surface-2)', borderRadius: 6 }}>
                    <div title={`${shortDate(a.startDate)} – ${shortDate(a.endDate)}`} style={{ position: 'absolute', left: pos.left, width: pos.width, top: 0, bottom: 0, background: colors[i % colors.length], borderRadius: 6, opacity: a.status === 'completed' ? 0.55 : 1 }} />
                  </div>
                </div>
              );
            })}
          </div>
          {/* List */}
          <table>
            <thead><tr><th>Activity</th><th>Start</th><th>End</th><th>Status</th></tr></thead>
            <tbody>
              {acts.map((a) => (
                <tr key={a.id}><td>{a.name}</td><td>{shortDate(a.startDate)}</td><td>{shortDate(a.endDate)}</td><td><StatusPill status={a.status} /></td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {showAdd && <AddActivityModal componentId={componentId} onClose={() => setShowAdd(false)} onDone={() => { setShowAdd(false); reload(); }} />}
    </Card>
  );
}

function AddActivityModal({ componentId, onClose, onDone }: { componentId: string; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', status: 'planned' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true); setError('');
    try { await api.post(`/components/${componentId}/schedule/activities`, form); onDone(); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Failed.'); setBusy(false); }
  }
  return (
    <Modal title="Add Schedule Activity" onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <div className="field"><label>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus required /></div>
        <div className="grid grid-2">
          <div className="field"><label>Start date</label><input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
          <div className="field"><label>End date</label><input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
        </div>
        <div className="field"><label>Status</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="planned">Planned</option><option value="in_progress">In progress</option><option value="completed">Completed</option>
          </select>
        </div>
        {error && <p style={{ color: 'var(--error)', fontSize: '0.85rem' }}>{error}</p>}
        <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Adding…' : 'Add'}</Button>
        </div>
      </form>
    </Modal>
  );
}
