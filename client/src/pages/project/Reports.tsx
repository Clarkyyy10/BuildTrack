import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../lib/useApi.js';
import { Button, Card, Spinner, ProgressBar } from '../../components/ui.js';
import { IconPrinter } from '../../components/icons.js';
import { money, titleCase } from '../../lib/format.js';
import type { ProjectContext } from '../ProjectWorkspace.js';

const KINDS = [
  { key: 'progress', label: 'Progress' },
  { key: 'budget', label: 'Budget' },
  { key: 'material', label: 'Materials' },
  { key: 'personnel', label: 'Personnel' },
  { key: 'daily', label: 'Daily Activity' },
  { key: 'activity', label: 'Audit' },
];

export function Reports({ ctx }: { ctx: ProjectContext }) {
  const [kind, setKind] = useState('progress');
  const navigate = useNavigate();
  const { data, loading } = useApi<Record<string, unknown>>(`/projects/${ctx.project.id}/reports/${kind}`);

  return (
    <div>
      <div className="row-between wrap" style={{ gap: 12, marginBottom: 16 }}>
        <p className="muted" style={{ fontSize: '0.9rem' }}>Reports are computed live from this project's current data.</p>
        <Button variant="secondary" size="sm" onClick={() => navigate(`/projects/${ctx.project.id}/print`)}><IconPrinter size={16} />Print full report</Button>
      </div>
      <div className="row wrap" style={{ gap: 8, marginBottom: 16 }}>
        {KINDS.map((k) => (
          <button
            key={k.key}
            onClick={() => setKind(k.key)}
            style={{
              padding: '6px 14px', borderRadius: 999, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
              border: '1px solid ' + (kind === k.key ? 'var(--accent)' : 'var(--border-strong)'),
              background: kind === k.key ? 'var(--accent-soft)' : 'var(--surface)',
              color: kind === k.key ? 'var(--accent)' : 'var(--text-secondary)',
            }}
          >
            {k.label}
          </button>
        ))}
      </div>

      <Card>
        {loading && <Spinner />}
        {!loading && data && <ReportBody kind={kind} data={data} />}
      </Card>
    </div>
  );
}

function ReportBody({ kind, data }: { kind: string; data: Record<string, unknown> }) {
  if (kind === 'progress') {
    const components = (data.components as Array<{ id: string; name: string; type: string; status: string; progress: number }>) ?? [];
    return (
      <div>
        <div className="row-between wrap" style={{ marginBottom: 16, gap: 12 }}>
          <h3>Overall Progress</h3>
          <div style={{ flex: '1 1 200px', maxWidth: 260 }}><ProgressBar value={Number(data.overall ?? 0)} /></div>
        </div>
        <table>
          <thead><tr><th>Component</th><th>Type</th><th>Status</th><th>Progress</th></tr></thead>
          <tbody>
            {components.map((c) => (
              <tr key={c.id}><td>{c.name}</td><td>{c.type}</td><td>{titleCase(c.status)}</td><td>{c.progress}%</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (kind === 'budget') {
    const byCategory = (data.byCategory as Array<{ category: string; amount: number }>) ?? [];
    return (
      <div>
        <div className="grid grid-3" style={{ marginBottom: 16 }}>
          <div><div className="muted" style={{ fontSize: '0.8rem' }}>Approved</div><strong>{money(Number(data.approved))}</strong></div>
          <div><div className="muted" style={{ fontSize: '0.8rem' }}>Spent</div><strong>{money(Number(data.spent))}</strong></div>
          <div><div className="muted" style={{ fontSize: '0.8rem' }}>Remaining</div><strong>{money(Number(data.remaining))}</strong></div>
        </div>
        <table>
          <thead><tr><th>Category</th><th>Amount</th></tr></thead>
          <tbody>{byCategory.map((c) => <tr key={c.category}><td>{titleCase(c.category)}</td><td>{money(c.amount)}</td></tr>)}</tbody>
        </table>
      </div>
    );
  }
  if (kind === 'material') {
    const materials = (data.materials as Array<{ name: string; unit: string; category: string; component: string }>) ?? [];
    return (
      <table>
        <thead><tr><th>Material</th><th>Unit</th><th>Category</th><th>Component</th></tr></thead>
        <tbody>{materials.map((m, i) => <tr key={i}><td>{m.name}</td><td>{m.unit}</td><td>{m.category}</td><td>{m.component}</td></tr>)}</tbody>
      </table>
    );
  }
  if (kind === 'personnel') {
    const personnel = (data.personnel as Array<{ person_name: string; site_role: string; is_lead: number; component: string }>) ?? [];
    return (
      <table>
        <thead><tr><th>Name</th><th>Role</th><th>Lead</th><th>Component</th></tr></thead>
        <tbody>{personnel.map((p, i) => <tr key={i}><td>{p.person_name}</td><td>{p.site_role}</td><td>{p.is_lead ? 'Yes' : '—'}</td><td>{p.component}</td></tr>)}</tbody>
      </table>
    );
  }
  if (kind === 'daily') {
    const records = (data.records as Array<{ record_date: string; work_completed: string; issues: string }>) ?? [];
    return (
      <table>
        <thead><tr><th>Date</th><th>Work completed</th><th>Issues</th></tr></thead>
        <tbody>{records.map((r, i) => <tr key={i}><td>{r.record_date}</td><td>{r.work_completed}</td><td>{r.issues ?? '—'}</td></tr>)}</tbody>
      </table>
    );
  }
  const activity = (data.activity as Array<{ action: string; entity_type: string; created_at: string; actor: string }>) ?? [];
  return (
    <table>
      <thead><tr><th>Action</th><th>Entity</th><th>Actor</th><th>When</th></tr></thead>
      <tbody>{activity.map((a, i) => <tr key={i}><td>{a.action}</td><td>{a.entity_type}</td><td>{a.actor}</td><td>{new Date(a.created_at).toLocaleString()}</td></tr>)}</tbody>
    </table>
  );
}
