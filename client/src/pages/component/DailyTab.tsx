import { useState } from 'react';
import { useApi } from '../../lib/useApi.js';
import { api, ApiError } from '../../lib/api.js';
import { Button, Card, EmptyState, ErrorState, Spinner } from '../../components/ui.js';
import { Modal } from '../../components/Modal.js';
import { shortDate } from '../../lib/format.js';

interface DailyRecord {
  id: string;
  record_date: string;
  work_completed: string | null;
  materials_used: string | null;
  people_present: string | null;
  progress: number | null;
  issues: string | null;
  notes: string | null;
}

export function DailyTab({ projectId, componentId, canManage }: { projectId: string; componentId: string; canManage: boolean }) {
  const { data, loading, error, reload } = useApi<{ records: DailyRecord[] }>(`/projects/${projectId}/daily-records?componentId=${componentId}`);
  const [showAdd, setShowAdd] = useState(false);

  if (loading) return <Spinner label="Loading daily records…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const records = data?.records ?? [];

  return (
    <Card>
      <div className="row-between" style={{ marginBottom: 12 }}>
        <div>
          <h3>Daily Records</h3>
          <p className="muted" style={{ fontSize: '0.82rem', marginTop: 2 }}>What happened on-site — distinct from the system Activity Log.</p>
        </div>
        {canManage && <Button size="sm" onClick={() => setShowAdd(true)}>+ Add record</Button>}
      </div>
      {records.length === 0 ? (
        <EmptyState title="No daily records yet" hint="Record daily site activity to keep an on-the-ground history." action={canManage ? <Button size="sm" onClick={() => setShowAdd(true)}>+ Add record</Button> : undefined} />
      ) : (
        <div className="stack" style={{ gap: 12 }}>
          {records.map((r) => (
            <div key={r.id} style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
              <div className="row-between" style={{ marginBottom: 6 }}>
                <strong style={{ fontSize: '0.9rem' }}>{shortDate(r.record_date)}</strong>
                {r.progress != null && <span className="muted" style={{ fontSize: '0.8rem' }}>Progress {r.progress}%</span>}
              </div>
              {r.work_completed && <p style={{ fontSize: '0.88rem', marginBottom: 4 }}>{r.work_completed}</p>}
              {r.materials_used && <p className="muted" style={{ fontSize: '0.82rem' }}>Materials: {r.materials_used}</p>}
              {r.people_present && <p className="muted" style={{ fontSize: '0.82rem' }}>Present: {r.people_present}</p>}
              {r.issues && <p style={{ fontSize: '0.82rem', color: 'var(--warning)' }}>Issues: {r.issues}</p>}
            </div>
          ))}
        </div>
      )}
      {showAdd && <AddRecordModal projectId={projectId} componentId={componentId} onClose={() => setShowAdd(false)} onDone={() => { setShowAdd(false); reload(); }} />}
    </Card>
  );
}

function AddRecordModal({ projectId, componentId, onClose, onDone }: { projectId: string; componentId: string; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ workCompleted: '', materialsUsed: '', peoplePresent: '', issues: '', notes: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true); setError('');
    try { await api.post(`/projects/${projectId}/daily-records`, { ...form, componentId }); onDone(); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Failed.'); setBusy(false); }
  }
  return (
    <Modal title="Add Daily Record" onClose={onClose} width={520}>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <div className="field"><label>Work completed</label><textarea rows={2} value={form.workCompleted} onChange={(e) => setForm({ ...form, workCompleted: e.target.value })} /></div>
        <div className="field"><label>Materials used</label><input value={form.materialsUsed} onChange={(e) => setForm({ ...form, materialsUsed: e.target.value })} /></div>
        <div className="field"><label>People present</label><input value={form.peoplePresent} onChange={(e) => setForm({ ...form, peoplePresent: e.target.value })} /></div>
        <div className="field"><label>Issues</label><input value={form.issues} onChange={(e) => setForm({ ...form, issues: e.target.value })} /></div>
        {error && <p style={{ color: 'var(--error)', fontSize: '0.85rem' }}>{error}</p>}
        <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save record'}</Button>
        </div>
      </form>
    </Modal>
  );
}
