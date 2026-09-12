import { useApi } from '../lib/useApi.js';
import { api } from '../lib/api.js';
import { Button, Card, EmptyState, ErrorState, ListSkeleton, StatusPill } from '../components/ui.js';
import { roleLabel, dateTime } from '../lib/format.js';
import type { Invitation } from '../lib/types.js';

export function InvitationsPage() {
  const { data, loading, error, reload } = useApi<{ invitations: Invitation[] }>('/invitations');

  async function respond(id: string, action: 'accept' | 'decline') {
    await api.post(`/invitations/${id}/${action}`);
    reload();
  }

  return (
    <div>
      <h1 style={{ marginBottom: 20 }}>Invitations</h1>
      {loading && <ListSkeleton rows={3} />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.invitations.length === 0 && (
        <Card><EmptyState title="No invitations" hint="When someone invites you to a project, it will appear here." /></Card>
      )}
      <div className="stack" style={{ gap: 10 }}>
        {data?.invitations.map((inv) => (
          <Card key={inv.id}>
            <div className="row-between wrap" style={{ gap: 12 }}>
              <div>
                <div className="row" style={{ gap: 10 }}>
                  <strong>{inv.projectName}</strong>
                  <StatusPill status={inv.state === 'pending' ? 'planning' : inv.state === 'accepted' ? 'completed' : 'on_hold'} />
                </div>
                <p className="muted" style={{ fontSize: '0.85rem', marginTop: 4 }}>
                  {inv.inviterName} invited you as {roleLabel(inv.role)} · {dateTime(inv.createdAt)}
                </p>
              </div>
              {inv.state === 'pending' && (
                <div className="row" style={{ gap: 8 }}>
                  <Button size="sm" onClick={() => respond(inv.id, 'accept')}>Accept</Button>
                  <Button size="sm" variant="secondary" onClick={() => respond(inv.id, 'decline')}>Decline</Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
