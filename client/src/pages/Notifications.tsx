import type { CSSProperties } from 'react';
import { useApi } from '../lib/useApi.js';
import { api } from '../lib/api.js';
import { Button, Card, EmptyState, ErrorState, Spinner } from '../components/ui.js';
import { dateTime } from '../lib/format.js';
import type { Notification } from '../lib/types.js';

export function NotificationsPage() {
  const { data, loading, error, reload } = useApi<{ unread: number; notifications: Notification[] }>('/notifications');

  async function markAll() { await api.post('/notifications/read-all'); reload(); }
  async function markOne(id: string) { await api.post(`/notifications/${id}/read`); reload(); }

  return (
    <div>
      <div className="row-between" style={{ marginBottom: 20 }}>
        <div>
          <h1>Notifications</h1>
          {data && <p className="muted" style={{ fontSize: '0.9rem', marginTop: 4 }}>{data.unread} unread</p>}
        </div>
        {data && data.unread > 0 && <Button variant="secondary" size="sm" onClick={markAll}>Mark all read</Button>}
      </div>

      {loading && <Spinner />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.notifications.length === 0 && (
        <Card><EmptyState title="You're all caught up" hint="Project updates and invitations will show up here." /></Card>
      )}

      <div className="stack" style={{ gap: 10 }}>
        {data?.notifications.map((n, i) => (
          <Card key={n.id} className="bt-stagger" style={{ ['--i' as string]: i, borderLeft: n.isRead ? '1px solid var(--border)' : '3px solid var(--accent)' } as CSSProperties}>
            <div className="row-between">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{n.title}</div>
                {n.body && <p className="muted" style={{ fontSize: '0.85rem', marginTop: 2 }}>{n.body}</p>}
                <div className="muted" style={{ fontSize: '0.76rem', marginTop: 4 }}>{dateTime(n.createdAt)}</div>
              </div>
              {!n.isRead && <Button variant="ghost" size="sm" onClick={() => markOne(n.id)}>Mark read</Button>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
