import { useApi } from '../lib/useApi.js';
import { Card, ErrorState, Spinner } from '../components/ui.js';
import { ActivityFeed } from '../components/ActivityFeed.js';
import type { ActivityEntry } from '../lib/types.js';

export function HistoryPage() {
  const { data, loading, error, reload } = useApi<{ activity: ActivityEntry[] }>('/history');
  return (
    <div>
      <h1 style={{ marginBottom: 6 }}>History</h1>
      <p className="muted" style={{ fontSize: '0.9rem', marginBottom: 20 }}>Recent activity across all of your projects.</p>
      <Card>
        {loading && <Spinner />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {data && <ActivityFeed entries={data.activity} />}
      </Card>
    </div>
  );
}
