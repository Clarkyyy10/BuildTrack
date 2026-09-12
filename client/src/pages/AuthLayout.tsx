import type { ReactNode } from 'react';
import { Card } from '../components/ui.js';
import { BrandMark } from '../components/Brand.js';

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 'var(--sp-4)', overflow: 'hidden' }}>
      {/* Blueprint grid backdrop — same signature motif as Home, kept subtle */}
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: -2, pointerEvents: 'none',
          backgroundImage:
            'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
          opacity: 0.5,
          maskImage: 'radial-gradient(circle at 50% 42%, #000 0%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 42%, #000 0%, transparent 70%)',
        }}
      />
      <div className="route-fade" style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
        <div className="row" style={{ gap: 10, justifyContent: 'center', marginBottom: 24 }}>
          <BrandMark size={40} radius={10} />
          <strong style={{ fontSize: '1.2rem', letterSpacing: '-0.02em' }}>BuildTrack</strong>
        </div>
        <Card>
          <h2 style={{ marginBottom: 4 }}>{title}</h2>
          <p className="muted" style={{ marginBottom: 22, fontSize: '0.9rem' }}>{subtitle}</p>
          {children}
        </Card>
      </div>
    </div>
  );
}
