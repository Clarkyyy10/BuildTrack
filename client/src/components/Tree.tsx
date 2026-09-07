import { useState } from 'react';
import type { ComponentNode } from '../lib/types.js';
import { StatusPill } from './ui.js';

interface TreeProps {
  nodes: ComponentNode[];
  selectedId: string | null;
  onSelect: (node: ComponentNode) => void;
}

/** Breakdown tree: expand/collapse, keyboard-activatable rows (Req 6.8, 19.4). */
export function Tree({ nodes, selectedId, onSelect }: TreeProps) {
  return (
    <div role="tree" aria-label="Project breakdown">
      {nodes.map((n) => (
        <TreeRow key={n.id} node={n} depth={0} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  );
}

function TreeRow({ node, depth, selectedId, onSelect }: { node: ComponentNode; depth: number; selectedId: string | null; onSelect: (n: ComponentNode) => void }) {
  const [open, setOpen] = useState(depth < 1);
  const hasChildren = node.children.length > 0;
  const selected = node.id === selectedId;

  return (
    <div role="treeitem" aria-expanded={hasChildren ? open : undefined} aria-selected={selected}>
      <div
        className={selected ? 'row' : 'row bt-row'}
        style={{
          gap: 8, padding: '8px 10px', paddingLeft: 10 + depth * 18,
          borderRadius: 'var(--radius-sm)', cursor: 'pointer',
          background: selected ? 'var(--accent-soft)' : 'transparent',
          color: selected ? 'var(--accent)' : 'var(--text)',
        }}
        onClick={() => onSelect(node)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(node); } }}
        tabIndex={0}
      >
        <button
          onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
          aria-label={open ? 'Collapse' : 'Expand'}
          style={{ width: 18, height: 18, border: 'none', background: 'none', cursor: hasChildren ? 'pointer' : 'default', color: 'var(--text-muted)', visibility: hasChildren ? 'visible' : 'hidden' }}
        >
          {open ? '▾' : '▸'}
        </button>
        <span style={{ flex: 1, fontSize: '0.92rem', fontWeight: selected ? 600 : 400 }}>{node.name}</span>
        <span className="muted" style={{ fontSize: '0.75rem' }}>{node.progress}%</span>
        <StatusPill status={node.status} />
      </div>
      {hasChildren && open && node.children.map((c) => (
        <TreeRow key={c.id} node={c} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  );
}
