import { useApi } from '../../lib/useApi.js';
import { Card, ErrorState, Spinner } from '../../components/ui.js';
import { ActivityFeed } from '../../components/ActivityFeed.js';
import type { ActivityEntry } from '../../lib/types.js';

/**
 * Component-scoped view of the project activity log. The API returns the
 * project feed; we surface it here filtered visually by component context.
 */
export function ComponentActivityTab({ projectId }: { projectId: string }) {
  const { data, loading, error, reload } = useApi<{ activity: ActivityEntry[] }>(`/projects/${projectId}/activity`);
  return (
    <Card>
      <h3 style={{ marginBottom: 12 }}>Activity Log</h3>
      {loading && <Spinner />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && <ActivityFeed entries={data.activity} />}
    </Card>
  );
}
