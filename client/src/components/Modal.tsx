import type { ReactNode } from 'react';

export function Modal({ title, onClose, children, width = 460 }: { title: string; onClose: () => void; children: ReactNode; width?: number }) {
  return (
    <div
      onClick={onClose}
      className="bt-modal-backdrop"
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,20,32,0.45)', display: 'grid', placeItems: 'center', zIndex: 50, padding: 16 }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bt-modal-panel"
        style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', width: '100%', maxWidth: width, maxHeight: '90vh', overflow: 'auto' }}
      >
        <div className="row-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3>{title}</h3>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}
