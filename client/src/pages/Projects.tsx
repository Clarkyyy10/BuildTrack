import { useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../lib/useApi.js';
import { api, ApiError } from '../lib/api.js';
import { useAuth } from '../lib/auth.js';
import { useT } from '../lib/i18n.js';
import { Button, Card, EmptyState, ErrorState, ListSkeleton, ProgressBar, StatusPill } from '../components/ui.js';
import { IconFolder, IconSearch } from '../components/icons.js';
import { money, roleLabel, titleCase } from '../lib/format.js';
import type { Project } from '../lib/types.js';
import { NewProjectModal } from '../components/NewProjectModal.js';

/** Landing path for opening a project, honoring the user's default-page setting. */
export function projectLandingPath(id: string, defaultPage: string | undefined): string {
  return defaultPage === 'breakdown' ? `/projects/${id}/breakdown` : `/projects/${id}`;
}

export function ProjectsPage() {
  const { data, loading, error, reload } = useApi<{ projects: Project[] }>('/projects');
  const { settings } = useAuth();
  const t = useT();
  const navigate = useNavigate();
  const openProject = (id: string) => navigate(projectLandingPath(id, settings?.default_project_page));
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [role, setRole] = useState('all');
  const [sort, setSort] = useState('recent');
  const [showNew, setShowNew] = useState(false);

  const projects = useMemo(() => {
    let list = data?.projects ?? [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.location ?? '').toLowerCase().includes(q));
    }
    if (status !== 'all') list = list.filter((p) => p.status === status);
    if (role !== 'all') list = list.filter((p) => p.role === role);
    list = [...list].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'progress') return b.progress - a.progress;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    return list;
  }, [data, search, status, role, sort]);

  return (
    <div>
      <div className="row-between wrap" style={{ marginBottom: 20 }}>
        <div>
          <h1>{t('projects.title')}</h1>
          <p className="muted" style={{ fontSize: '0.9rem', marginTop: 4 }}>{t('projects.subtitle')}</p>
        </div>
        <Button onClick={() => setShowNew(true)}>{t('projects.new')}</Button>
      </div>

      <Card padding="var(--sp-4)" style={{ marginBottom: 20 }}>
        <div className="row wrap" style={{ gap: 12 }}>
          <div style={{ position: 'relative', flex: '2 1 220px' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'grid', pointerEvents: 'none' }}><IconSearch size={18} /></span>
            <input placeholder="Search projects…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ flex: '1 1 130px' }} aria-label="Status">
            <option value="all">All statuses</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on_hold">On hold</option>
            <option value="completed">Completed</option>
          </select>
          <select value={role} onChange={(e) => setRole(e.target.value)} style={{ flex: '1 1 130px' }} aria-label="Role">
            <option value="all">All roles</option>
            <option value="project_manager">Project Manager</option>
            <option value="site_engineer">Site Engineer</option>
            <option value="architect">Architect</option>
            <option value="contractor">Contractor</option>
            <option value="viewer">Viewer</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ flex: '1 1 130px' }} aria-label="Sort by">
            <option value="recent">Most recent</option>
            <option value="name">Name</option>
            <option value="progress">Progress</option>
          </select>
        </div>
      </Card>

      {loading && <ListSkeleton rows={4} />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && projects.length === 0 && (
        <Card>
          <EmptyState
            icon={<IconFolder size={24} />}
            title="No projects yet"
            hint="Create your first project to begin breaking down and tracking your build."
            action={<Button onClick={() => setShowNew(true)}>+ New Project</Button>}
          />
        </Card>
      )}

      <div className="stack" style={{ gap: 12 }}>
        {projects.map((p, i) => (
          <Card key={p.id} interactive className="bt-stagger" style={{ ['--i' as string]: i } as CSSProperties} onClick={() => openProject(p.id)}>
            <div className="row-between wrap" style={{ gap: 16 }}>
              <div style={{ minWidth: 220, flex: 1 }}>
                <div className="row" style={{ gap: 10 }}>
                  <h3>{p.name}</h3>
                  <StatusPill status={p.status} />
                </div>
                <p className="muted" style={{ fontSize: '0.85rem', marginTop: 4 }}>
                  {titleCase(p.type)}{p.location ? ` • ${p.location}` : ''} • {roleLabel(p.role ?? '')}
                </p>
              </div>
              <div style={{ flex: '1 1 200px', maxWidth: 280 }}>
                <ProgressBar value={p.progress} />
                <p className="muted" style={{ fontSize: '0.8rem', marginTop: 6 }}>
                  {money(p.budget.spent)} spent of {money(p.budget.approved)}
                </p>
              </div>
              <Button variant="secondary" size="sm">Open →</Button>
            </div>
          </Card>
        ))}
      </div>

      {showNew && (
        <NewProjectModal
          onClose={() => setShowNew(false)}
          onCreated={(id) => { setShowNew(false); openProject(id); }}
        />
      )}
    </div>
  );
}

export async function createProject(input: { name: string; type: string; location?: string; useTemplate: boolean }): Promise<string> {
  try {
    const res = await api.post<{ project: Project }>('/projects', input);
    return res.project.id;
  } catch (err) {
    throw err instanceof ApiError ? err : new Error('Could not create project.');
  }
}
