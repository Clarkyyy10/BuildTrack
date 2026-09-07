import { EmptyState } from './ui.js';
import { dateTime, titleCase } from '../lib/format.js';
import type { ActivityEntry } from '../lib/types.js';

function describe(a: ActivityEntry): string {
  const map: Record<string, string> = {
    'progress.update': 'updated progress',
    'component.create': 'added a component',
    'component.update': 'updated a component',
    'component.delete': 'deleted a component',
    'component.move': 'moved a component',
    'budget.change': 'changed the approved budget',
    'expense.create': 'recorded an expense',
    'material.create': 'added a material',
    'material.receive': 'received materials',
    'material.use': 'used materials',
    'material.waste': 'recorded material waste',
    'material.transfer': 'transferred materials',
    'personnel.add': 'assigned personnel',
    'personnel.remove': 'removed personnel',
    'daily_record.create': 'submitted a daily record',
    'project.create': 'created the project',
    'project.update': 'updated the project',
    'invitation.send': 'sent an invitation',
    'invitation.accept': 'joined the project',
  };
  return map[a.action] ?? titleCase(a.action.replace('.', ' '));
}

function beforeAfter(a: ActivityEntry): string | null {
  if (a.action === 'progress.update' && a.before && a.after) {
    return `${a.before.progress}% → ${a.after.progress}%`;
  }
  if (a.action === 'budget.change' && a.before && a.after) {
    return `${a.before.approved} → ${a.after.approved}`;
  }
  return null;
}

export function ActivityFeed({ entries }: { entries: ActivityEntry[] }) {
  if (entries.length === 0) {
    return <EmptyState title="No activity yet" hint="Changes to this project's data will appear here automatically." />;
  }
  return (
    <div className="stack" style={{ gap: 0 }}>
      {entries.map((a) => {
        const delta = beforeAfter(a);
        return (
          <div key={a.id} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', marginTop: 7, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.9rem' }}>
                <strong>{a.actorName}</strong> {describe(a)}
                {a.componentName && <span className="muted"> · {a.componentName}</span>}
              </div>
              {delta && <div className="muted" style={{ fontSize: '0.82rem', marginTop: 2 }}>{delta}</div>}
              <div className="muted" style={{ fontSize: '0.76rem', marginTop: 2 }}>{dateTime(a.createdAt)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
