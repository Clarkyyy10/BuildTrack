import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import { IconArrowLeft } from './icons.js';

/* ---- Button ---- */
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
};

export function Button({ variant = 'primary', size = 'md', style, className, ...rest }: ButtonProps) {
  const palette: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--accent)', color: 'var(--on-accent)', border: '1px solid var(--accent)' },
    secondary: { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border-strong)' },
    ghost: { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid transparent' },
    danger: { background: 'var(--error)', color: '#fff', border: '1px solid var(--error)' },
  };
  return (
    <button
      {...rest}
      data-variant={variant}
      className={`bt-btn ${className ?? ''}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center',
        padding: size === 'sm' ? '6px 12px' : '10px 16px',
        fontSize: size === 'sm' ? '0.85rem' : '0.92rem',
        fontWeight: 500, cursor: 'pointer', borderRadius: 'var(--radius-sm)',
        boxShadow: variant === 'primary' || variant === 'danger' ? 'var(--shadow-sm)' : 'none',
        ...palette[variant],
        opacity: rest.disabled ? 0.55 : 1, ...style,
      }}
    />
  );
}

/* ---- BackLink: a visible, themed "go back" chip (accent-bordered) ---- */
export function BackLink({ label, onClick, style }: { label: string; onClick: () => void; style?: CSSProperties }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bt-backlink"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '5px 12px 5px 9px', borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--accent-border)', background: 'var(--surface)',
        color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 500,
        cursor: 'pointer', fontFamily: 'inherit', ...style,
      }}
    >
      <IconArrowLeft size={16} />{label}
    </button>
  );
}

/* ---- Card ---- */
export function Card({ children, style, padding = 'var(--sp-5)', interactive, className, onClick }: { children: ReactNode; style?: React.CSSProperties; padding?: string; interactive?: boolean; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`bt-card ${interactive ? 'is-interactive' : ''} ${className ?? ''}`}
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding, ...style }}
    >
      {children}
    </div>
  );
}

/* ---- StatusPill: never color-only (Req 19.4) — icon glyph + label ---- */
const STATUS_MAP: Record<string, { color: string; soft: string; label?: string }> = {
  active: { color: 'var(--success)', soft: 'var(--success-soft)' },
  in_progress: { color: 'var(--info)', soft: 'var(--info-soft)', label: 'In progress' },
  planning: { color: 'var(--text-muted)', soft: 'var(--surface-2)' },
  planned: { color: 'var(--text-muted)', soft: 'var(--surface-2)' },
  on_hold: { color: 'var(--warning)', soft: 'var(--warning-soft)', label: 'On hold' },
  completed: { color: 'var(--success)', soft: 'var(--success-soft)' },
  over_budget: { color: 'var(--error)', soft: 'var(--error-soft)', label: 'Over budget' },
  on_track: { color: 'var(--success)', soft: 'var(--success-soft)', label: 'On track' },
};

export function StatusPill({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { color: 'var(--text-muted)', soft: 'var(--surface-2)' };
  const label = s.label ?? status.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
  // Dot conveys state alongside the always-present text label (never color-only).
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '3px 10px 3px 8px', borderRadius: 999, background: s.soft, color: s.color, fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap', border: '1px solid color-mix(in srgb, currentColor 18%, transparent)' }}>
      <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />{label}
    </span>
  );
}

/* ---- ProgressBar ---- */
export function ProgressBar({ value, showLabel = true }: { value: number; showLabel?: boolean }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="row" style={{ gap: 10 }}>
      <div style={{ flex: 1, height: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 999, overflow: 'hidden' }}>
        <div className="bt-progress-fill" style={{ width: `${v}%`, height: '100%', background: 'var(--accent)' }} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} />
      </div>
      {showLabel && <span style={{ fontSize: '0.82rem', fontWeight: 600, minWidth: 34, textAlign: 'right' }}>{v}%</span>}
    </div>
  );
}

/* ---- EmptyState: tells the user what to do next (Req 19.5, DESIGN.md §5) ---- */
export function EmptyState({ title, hint, action, icon }: { title: string; hint?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div style={{ textAlign: 'center', padding: 'var(--sp-6)', color: 'var(--text-secondary)' }}>
      <div aria-hidden style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center', margin: '0 auto 14px', border: '1px solid var(--accent-border)' }}>
        {icon ?? (
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" />
          </svg>
        )}
      </div>
      <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{title}</div>
      {hint && <p className="muted" style={{ marginBottom: action ? 16 : 0, fontSize: '0.9rem', maxWidth: 360, marginInline: 'auto' }}>{hint}</p>}
      {action}
    </div>
  );
}

/* ---- ErrorState: human, actionable (Req 19.5) ---- */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: 'var(--sp-6)' }}>
      <div aria-hidden style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--error-soft)', color: 'var(--error)', display: 'grid', placeItems: 'center', margin: '0 auto 14px', border: '1px solid color-mix(in srgb, var(--error) 22%, transparent)' }}>
        <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        </svg>
      </div>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Something went wrong</div>
      <p className="muted" style={{ marginBottom: onRetry ? 16 : 0, fontSize: '0.9rem', maxWidth: 360, marginInline: 'auto' }}>{message}</p>
      {onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

/* ---- Skeleton: content-shaped loading placeholder (preferred over a
   centered spinner for lists/panels — see Operate-mode guidance) ---- */
export function Skeleton({ width = '100%', height = 14, radius = 'var(--radius-sm)', style }: { width?: number | string; height?: number | string; radius?: string; style?: React.CSSProperties }) {
  return <div className="bt-skeleton" aria-hidden style={{ width, height, borderRadius: radius, ...style }} />;
}

/* Skeleton shaped like a project/list card, for first-load states. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="stack" role="status" aria-label="Loading" style={{ gap: 12 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Card key={i}>
          <div className="row-between wrap" style={{ gap: 16 }}>
            <div style={{ flex: 1, minWidth: 220 }} className="stack">
              <Skeleton width="42%" height={18} />
              <Skeleton width="60%" height={12} />
            </div>
            <div style={{ flex: '1 1 200px', maxWidth: 280 }} className="stack">
              <Skeleton height={10} radius="999px" />
              <Skeleton width="55%" height={11} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* Skeleton shaped like a feed/list of rows, for panels that load inside a Card. */
export function RowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="stack" role="status" aria-label="Loading" style={{ gap: 16 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
          <Skeleton width={8} height={8} radius="50%" style={{ flexShrink: 0, marginTop: 5 }} />
          <div className="stack" style={{ gap: 6, flex: 1 }}>
            <Skeleton width={`${58 - (i % 3) * 12}%`} height={12} />
            <Skeleton width="28%" height={10} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---- Spinner ---- */
export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div style={{ padding: 'var(--sp-5)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div className="bt-spinner-ring" aria-hidden />
      <span className="muted" style={{ fontSize: '0.88rem' }}>{label}</span>
    </div>
  );
}

/* ---- Avatar (image when available, else initials) ---- */
export function Avatar({ name, size = 32, src }: { name: string; size?: number; src?: string | null }) {
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }}
      />
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--accent-soft)', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 600, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

/* ---- Stat tile ---- */
export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <Card padding="var(--sp-4)">
      <div className="muted" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>{label}</div>
      <div className="stat-value" style={{ fontSize: '1.3rem', fontWeight: 600 }}>{value}</div>
      {sub && <div className="muted" style={{ fontSize: '0.82rem', marginTop: 4 }}>{sub}</div>}
    </Card>
  );
}
