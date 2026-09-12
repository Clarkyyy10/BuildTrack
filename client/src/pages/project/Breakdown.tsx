import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../lib/useApi.js';
import { api } from '../../lib/api.js';
import { Button, Card, EmptyState, ErrorState, Spinner } from '../../components/ui.js';
import { Tree } from '../../components/Tree.js';
import { Modal } from '../../components/Modal.js';
import type { ComponentNode } from '../../lib/types.js';
import type { ProjectContext } from '../ProjectWorkspace.js';

const TYPES = ['building', 'floor', 'area', 'room', 'phase', 'trade', 'work', 'task', 'custom'];

export function Breakdown({ ctx }: { ctx: ProjectContext }) {
  const { data, loading, error, reload } = useApi<{ components: ComponentNode[] }>(`/projects/${ctx.project.id}/components`);
  const navigate = useNavigate();
  const [selected, setSelected] = useState<ComponentNode | null>(null);
  const [showAdd, setShowAdd] = useState<{ parentId: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [progEditing, setProgEditing] = useState(false);
  const [progValue, setProgValue] = useState(0);
  const canProgress = ['project_manager', 'site_engineer', 'architect', 'contractor'].includes(ctx.project.role ?? '');

  async function saveProgress(node: ComponentNode) {
    await api.patch(`/components/${node.id}/progress`, { progress: progValue });
    setProgEditing(false);
    // Reflect immediately in the panel, then refresh the tree + project header.
    setSelected({ ...node, progress: progValue, directProgress: progValue });
    reload();
    ctx.reloadProject();
  }

  async function addComponent(name: string, type: string, parentId: string | null) {
    setBusy(true);
    try {
      await api.post(`/projects/${ctx.project.id}/components`, { name, componentType: type, parentId });
      setShowAdd(null);
      reload();
    } finally {
      setBusy(false);
    }
  }

  async function rename(node: ComponentNode) {
    const name = window.prompt('Rename component', node.name);
    if (name && name.trim()) {
      await api.patch(`/components/${node.id}`, { name: name.trim() });
      reload();
    }
  }

  async function remove(node: ComponentNode) {
    if (window.confirm(`Delete "${node.name}" and everything inside it? This cannot be undone.`)) {
      await api.del(`/components/${node.id}`);
      if (selected?.id === node.id) setSelected(null);
      reload();
    }
  }

  if (loading) return <Spinner label="Loading breakdown…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const components = data?.components ?? [];

  return (
    <div className="grid grid-2" style={{ alignItems: 'start' }}>
      <Card>
        <div className="row-between" style={{ marginBottom: 12 }}>
          <h3>Breakdown</h3>
          {ctx.canManage && <Button size="sm" onClick={() => setShowAdd({ parentId: null })}>+ Add root</Button>}
        </div>
        {components.length === 0 ? (
          <EmptyState
            title="No components yet"
            hint="Break your project into buildings, floors, rooms, phases, or trades."
            action={ctx.canManage ? <Button size="sm" onClick={() => setShowAdd({ parentId: null })}>+ Add first component</Button> : undefined}
          />
        ) : (
          <Tree nodes={components} selectedId={selected?.id ?? null} onSelect={(n) => { setSelected(n); setProgEditing(false); }} />
        )}
      </Card>

      <Card>
        {selected ? (
          <div>
            <div className="row-between" style={{ marginBottom: 8 }}>
              <h3>{selected.name}</h3>
              <span className="muted" style={{ fontSize: '0.8rem' }}>{selected.type}</span>
            </div>
            <p className="muted" style={{ fontSize: '0.85rem', marginBottom: 16 }}>Progress {selected.progress}% · {selected.children.length} sub-component{selected.children.length === 1 ? '' : 's'}</p>
            <div className="row wrap" style={{ gap: 8 }}>
              <Button size="sm" onClick={() => navigate(`../c/${selected.id}`)}>Open details →</Button>
              {ctx.canManage && <>
                <Button size="sm" variant="secondary" onClick={() => setShowAdd({ parentId: selected.id })}>+ Add child</Button>
                <Button size="sm" variant="secondary" onClick={() => rename(selected)}>Rename</Button>
                <Button size="sm" variant="danger" onClick={() => remove(selected)}>Delete</Button>
              </>}
            </div>

            {/* Manual progress: only leaf components are directly editable; parents roll up. */}
            {canProgress && selected.children.length === 0 && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                {progEditing ? (
                  <div className="row wrap" style={{ gap: 8 }}>
                    <input type="range" min={0} max={100} value={progValue} onChange={(e) => setProgValue(Number(e.target.value))} style={{ padding: 0, flex: '1 1 140px' }} aria-label="Progress percent" />
                    <span className="stat-value" style={{ minWidth: 44, fontWeight: 600 }}>{progValue}%</span>
                    <Button size="sm" onClick={() => saveProgress(selected)}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setProgEditing(false)}>Cancel</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => { setProgValue(selected.directProgress); setProgEditing(true); }}>Update progress</Button>
                )}
              </div>
            )}
            {canProgress && selected.children.length > 0 && (
              <p className="muted" style={{ fontSize: '0.82rem', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                Progress here rolls up from sub-components. Select a leaf component to set its percentage.
              </p>
            )}
          </div>
        ) : (
          <EmptyState title="Select a component" hint="Choose a node in the breakdown to see actions and open its details." />
        )}
      </Card>

      {showAdd && (
        <AddComponentModal
          parentId={showAdd.parentId}
          busy={busy}
          onClose={() => setShowAdd(null)}
          onSubmit={addComponent}
        />
      )}
    </div>
  );
}

function AddComponentModal({ parentId, busy, onClose, onSubmit }: { parentId: string | null; busy: boolean; onClose: () => void; onSubmit: (name: string, type: string, parentId: string | null) => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('room');
  return (
    <Modal title={parentId ? 'Add sub-component' : 'Add root component'} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) onSubmit(name.trim(), type, parentId); }}>
        <div className="field">
          <label htmlFor="cname">Name</label>
          <input id="cname" value={name} onChange={(e) => setName(e.target.value)} autoFocus required placeholder="e.g. Living Room" />
        </div>
        <div className="field">
          <label htmlFor="ctype">Type</label>
          <select id="ctype" value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Adding…' : 'Add'}</Button>
        </div>
      </form>
    </Modal>
  );
}
