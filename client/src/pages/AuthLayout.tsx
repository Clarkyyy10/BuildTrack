import type { ReactNode } from 'react';
import { Card } from '../components/ui.js';
import { BrandMark } from '../components/Brand.js';

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 'var(--sp-4)' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
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
