import { useNavigate } from 'react-router-dom';
import { useApi } from '../../lib/useApi.js';
import { Card, ProgressBar, Spinner, StatusPill } from '../../components/ui.js';
import type { ComponentNode } from '../../lib/types.js';
import type { ProjectContext } from '../ProjectWorkspace.js';

export function Overview({ ctx }: { ctx: ProjectContext }) {
  const { data, loading } = useApi<{ components: ComponentNode[] }>(`/projects/${ctx.project.id}/components`);
  const navigate = useNavigate();

  return (
    <div className="grid grid-2" style={{ alignItems: 'start' }}>
      <Card>
        <h3 style={{ marginBottom: 12 }}>About this project</h3>
        <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '10px 20px', fontSize: '0.9rem' }}>
          <dt className="muted">Status</dt><dd style={{ margin: 0 }}><StatusPill status={ctx.project.status} /></dd>
          <dt className="muted">Type</dt><dd style={{ margin: 0 }}>{ctx.project.type}</dd>
          <dt className="muted">Location</dt><dd style={{ margin: 0 }}>{ctx.project.location ?? '—'}</dd>
          <dt className="muted">Progress method</dt><dd style={{ margin: 0 }}>{ctx.project.progressMethod.replace(/_/g, ' ')}</dd>
          <dt className="muted">Project ID</dt><dd style={{ margin: 0 }}>{ctx.project.id}</dd>
        </dl>
      </Card>

      <Card>
        <h3 style={{ marginBottom: 12 }}>Project Breakdown</h3>
        {loading && <Spinner />}
        {!loading && (
          <div className="stack" style={{ gap: 6 }}>
            {(data?.components ?? []).map((c) => (
              <div
                key={c.id}
                className="row-between bt-row"
                style={{ padding: '8px 10px', borderRadius: 8, cursor: 'pointer', gap: 12 }}
                onClick={() => navigate(`c/${c.id}`)}
              >
                <span style={{ fontSize: '0.9rem' }}>{c.name}</span>
                <div style={{ width: 130 }}><ProgressBar value={c.progress} /></div>
              </div>
            ))}
            {(data?.components ?? []).length === 0 && <p className="muted" style={{ fontSize: '0.9rem' }}>No components yet. Open the Breakdown tab to add some.</p>}
          </div>
        )}
      </Card>
    </div>
  );
}
