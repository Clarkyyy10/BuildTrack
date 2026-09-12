import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.js';
import { api } from '../../lib/api.js';
import { BackLink, Button, Card, ErrorState, ProgressBar, Spinner, StatusPill, Stat } from '../../components/ui.js';
import { money, shortDate } from '../../lib/format.js';
import type { ComponentDetail as CD } from '../../lib/types.js';
import type { ProjectContext } from '../ProjectWorkspace.js';
import { MaterialsTab } from './MaterialsTab.js';
import { BudgetTab } from './BudgetTab.js';
import { ScheduleTab } from './ScheduleTab.js';
import { PersonnelTab } from './PersonnelTab.js';
import { DailyTab } from './DailyTab.js';
import { ComponentActivityTab } from './ComponentActivityTab.js';

const TABS = ['Overview', 'Materials', 'Budget', 'Schedule', 'Personnel', 'Daily Records', 'Activity'] as const;
type Tab = (typeof TABS)[number];

export function ComponentDetail({ ctx }: { ctx: ProjectContext }) {
  const { componentId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('Overview');
  const { data, loading, error, reload } = useApi<{ component: CD }>(componentId ? `/components/${componentId}` : null);

  if (loading) return <Spinner label="Loading component…" />;
  if (error || !data) return <ErrorState message={error ?? 'Component not found.'} onRetry={reload} />;
  const c = data.component;
  // Any change here (progress, budget) must also refresh the project header
  // (overall progress + budget totals), which is fetched once by ProjectWorkspace.
  const reloadAll = () => { reload(); ctx.reloadProject(); };

  return (
    <div>
      <BackLink label="Breakdown" onClick={() => navigate('../breakdown')} style={{ marginBottom: 8 }} />
      <div className="row-between wrap" style={{ marginBottom: 16, gap: 12 }}>
        <div className="row" style={{ gap: 12 }}>
          <h2>{c.name}</h2>
          <StatusPill status={c.status} />
        </div>
        <span className="muted" style={{ fontSize: '0.85rem' }}>{c.type} · {c.id}</span>
      </div>

      {/* Tabs */}
      <div className="row" style={{ gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 20, overflowX: 'auto', overflowY: 'hidden' }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="bt-tab"
            data-active={tab === t}
            style={{
              padding: '10px 14px', fontSize: '0.9rem', fontWeight: 500, whiteSpace: 'nowrap', background: 'none',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              color: tab === t ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent', marginBottom: -1,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && <OverviewTab c={c} ctx={ctx} onChanged={reloadAll} />}
      {tab === 'Materials' && <MaterialsTab componentId={c.id} canManage={ctx.canManage} />}
      {tab === 'Budget' && <BudgetTab componentId={c.id} canManage={ctx.project.role === 'project_manager'} onChanged={reloadAll} />}
      {tab === 'Schedule' && <ScheduleTab componentId={c.id} canManage={ctx.canManage} />}
      {tab === 'Personnel' && <PersonnelTab componentId={c.id} canManage={ctx.canManage} />}
      {tab === 'Daily Records' && <DailyTab projectId={c.projectId} componentId={c.id} canManage={ctx.canManage} />}
      {tab === 'Activity' && <ComponentActivityTab projectId={c.projectId} />}
    </div>
  );
}

function OverviewTab({ c, ctx, onChanged }: { c: CD; ctx: ProjectContext; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(c.directProgress);
  const canProgress = ['project_manager', 'site_engineer', 'architect', 'contractor'].includes(ctx.project.role ?? '');
  // Progress is only directly editable on leaf components; parents roll up from
  // their sub-components, so editing a parent's own number would have no effect.
  const isLeaf = c.childCount === 0;

  async function save() {
    await api.patch(`/components/${c.id}/progress`, { progress: value });
    setEditing(false);
    onChanged();
  }

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="grid grid-4">
        <Card padding="var(--sp-4)">
          <div className="muted" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Progress (rolled up)</div>
          <ProgressBar value={c.progress} />
        </Card>
        <Stat label="Materials" value={`${c.materialCount} items`} />
        <Stat label="Team" value={`${c.teamCount} people`} />
        <Stat label="Budget" value={money(c.budget.approved)} sub={`${c.budget.percentSpent}% spent`} />
      </div>

      <Card>
        <div className="row-between" style={{ marginBottom: 12 }}>
          <h3>Summary</h3>
          {canProgress && isLeaf && !editing && <Button size="sm" variant="secondary" onClick={() => { setValue(c.directProgress); setEditing(true); }}>Update progress</Button>}
        </div>
        <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '10px 20px', fontSize: '0.9rem' }}>
          <dt className="muted">Status</dt><dd style={{ margin: 0 }}><StatusPill status={c.status} /></dd>
          <dt className="muted">Start date</dt><dd style={{ margin: 0 }}>{shortDate(c.startDate)}</dd>
          <dt className="muted">End date</dt><dd style={{ margin: 0 }}>{shortDate(c.endDate)}</dd>
          <dt className="muted">{isLeaf ? 'Progress' : 'Rolled-up progress'}</dt>
          <dd style={{ margin: 0 }}>
            {isLeaf && editing ? (
              <div className="row wrap" style={{ gap: 8, maxWidth: 360 }}>
                <input type="range" min={0} max={100} value={value} onChange={(e) => setValue(Number(e.target.value))} style={{ padding: 0, flex: '1 1 140px' }} aria-label="Progress percent" />
                <span className="stat-value" style={{ minWidth: 44, fontWeight: 600 }}>{value}%</span>
                <Button size="sm" onClick={save}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            ) : (
              <span>{isLeaf ? `${c.directProgress}%` : `${c.progress}%`}</span>
            )}
          </dd>
        </dl>
        {!isLeaf && (
          <p className="muted" style={{ fontSize: '0.82rem', marginTop: 12 }}>
            This component's progress is calculated automatically from its {c.childCount} sub-component{c.childCount === 1 ? '' : 's'}. Update progress on the individual sub-components to move it.
          </p>
        )}
      </Card>
    </div>
  );
}
