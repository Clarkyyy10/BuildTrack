import { useApi } from '../../lib/useApi.js';
import { Card, ErrorState, RowsSkeleton } from '../../components/ui.js';
import { ActivityFeed } from '../../components/ActivityFeed.js';
import type { ActivityEntry } from '../../lib/types.js';
import type { ProjectContext } from '../ProjectWorkspace.js';

export function ProjectActivity({ ctx }: { ctx: ProjectContext }) {
  const { data, loading, error, reload } = useApi<{ activity: ActivityEntry[] }>(`/projects/${ctx.project.id}/activity`);
  return (
    <Card>
      <h3 style={{ marginBottom: 6 }}>Activity Log</h3>
      <p className="muted" style={{ fontSize: '0.85rem', marginBottom: 12 }}>An automatic record of what changed in this project's data: who, what, and when.</p>
      {loading && <RowsSkeleton />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && <ActivityFeed entries={data.activity} />}
    </Card>
  );
}
