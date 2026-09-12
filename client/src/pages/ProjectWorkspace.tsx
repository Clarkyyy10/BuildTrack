import { NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../lib/useApi.js';
import { BackLink, Button, Card, ErrorState, ProgressBar, Spinner, StatusPill, Stat } from '../components/ui.js';
import { IconPrinter } from '../components/icons.js';
import { money, titleCase } from '../lib/format.js';
import type { Project } from '../lib/types.js';
import { Overview } from './project/Overview.js';
import { Breakdown } from './project/Breakdown.js';
import { ProjectActivity } from './project/ProjectActivity.js';
import { Reports } from './project/Reports.js';
import { ComponentDetail } from './component/ComponentDetail.js';

export interface ProjectContext {
  project: Project;
  reloadProject: () => void;
  canManage: boolean;
}

const TABS = [
  { to: '', label: 'Overview', end: true },
  { to: 'breakdown', label: 'Breakdown' },
  { to: 'activity', label: 'Activity Log' },
  { to: 'reports', label: 'Reports' },
];

export function ProjectWorkspace() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApi<{ project: Project }>(projectId ? `/projects/${projectId}` : null);

  if (loading) return <Spinner label="Loading project…" />;
  if (error || !data) return <ErrorState message={error ?? 'Project not found.'} onRetry={reload} />;

  const p = data.project;
  const canManage = ['project_manager', 'site_engineer', 'architect'].includes(p.role ?? '');
  const ctx: ProjectContext = { project: p, reloadProject: reload, canManage };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <BackLink label="Projects" onClick={() => navigate('/projects')} />
        <div className="row-between wrap" style={{ gap: 12, marginTop: 8 }}>
          <div className="row" style={{ gap: 12 }}>
            <h1>{p.name}</h1>
            <StatusPill status={p.status} />
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate(`/projects/${p.id}/print`)}><IconPrinter size={16} />Print report</Button>
        </div>
        <p className="muted" style={{ fontSize: '0.9rem', marginTop: 4 }}>
          {titleCase(p.type)}{p.location ? ` · ${p.location}` : ''}
        </p>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <Card padding="var(--sp-4)">
          <div className="muted" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Overall Progress</div>
          <ProgressBar value={p.progress} />
        </Card>
        <Stat label="Approved Budget" value={money(p.budget.approved)} />
        <Stat label="Spent" value={money(p.budget.spent)} />
        <Stat label="Remaining" value={money(p.budget.remaining)} />
      </div>

      {/* Tabs */}
      <div className="row" style={{ gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 20, overflowX: 'auto', overflowY: 'hidden' }}>
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className="bt-tab"
            style={({ isActive }) => ({
              padding: '10px 14px', fontSize: '0.9rem', fontWeight: 500, whiteSpace: 'nowrap',
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1, textDecoration: 'none',
            })}
          >
            {t.label}
          </NavLink>
        ))}
      </div>

      <Routes>
        <Route index element={<Overview ctx={ctx} />} />
        <Route path="breakdown" element={<Breakdown ctx={ctx} />} />
        <Route path="activity" element={<ProjectActivity ctx={ctx} />} />
        <Route path="reports" element={<Reports ctx={ctx} />} />
        <Route path="c/:componentId" element={<ComponentDetail ctx={ctx} />} />
      </Routes>
    </div>
  );
}
