import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.js';
import { Button } from '../components/ui.js';
import { BrandMark } from '../components/Brand.js';
import { NewProjectModal } from '../components/NewProjectModal.js';
import { projectLandingPath } from './Projects.js';
import { IconFolder, IconMail, IconPlus } from '../components/icons.js';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function HomePage() {
  const { user, settings } = useAuth();
  const navigate = useNavigate();
  const [showNew, setShowNew] = useState(false);
  const firstName = user?.displayName.split(' ')[0] ?? '';

  return (
    <div style={{ position: 'relative', minHeight: 'calc(100vh - 120px)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
      {/* Blueprint grid backdrop (thematic, subtle) */}
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: -2, pointerEvents: 'none',
          backgroundImage:
            'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
          opacity: 0.6,
          maskImage: 'radial-gradient(circle at 50% 38%, #000 0%, transparent 72%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 38%, #000 0%, transparent 72%)',
        }}
      />
      {/* Accent glow */}
      <div
        aria-hidden
        className="bt-glow"
        style={{
          position: 'absolute', top: '4%', left: '50%', transform: 'translateX(-50%)',
          width: 640, height: 340, pointerEvents: 'none',
          background: 'radial-gradient(closest-side, var(--accent-soft), transparent)',
        }}
      />

      <div className="route-fade" style={{ position: 'relative', textAlign: 'center', maxWidth: 620, padding: 'var(--sp-4)' }}>
        {/* Logo with soft ring */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
          <div className="bt-float" style={{ padding: 10, borderRadius: 26, background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
            <BrandMark size={76} radius={18} />
          </div>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.06em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 18 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
          Projects first. Details when needed.
        </div>

        <h1 style={{ fontSize: '2.4rem', lineHeight: 1.1, marginBottom: 14 }}>
          {greeting()}, {firstName}.
        </h1>

        <p style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 10, color: 'var(--accent)' }}>
          Track Every Part. Build With Confidence.
        </p>
        <p className="secondary" style={{ fontSize: '1rem', marginBottom: 30, maxWidth: 460, marginInline: 'auto' }}>
          Break your build into components, then track budget, materials, schedule, personnel, and progress, all in one place.
        </p>

        <div className="row" style={{ gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
          <Button onClick={() => navigate('/projects')} style={{ padding: '12px 22px', fontSize: '0.98rem' }}>Explore Projects →</Button>
          <Button variant="secondary" onClick={() => setShowNew(true)} style={{ padding: '12px 20px' }}><IconPlus size={16} />New Project</Button>
        </div>

        {/* Quick-access tiles (navigation, not a dashboard) */}
        <div className="grid grid-2" style={{ gap: 12, textAlign: 'left' }}>
          <HomeTile icon={<IconFolder size={20} />} title="Projects" desc="View & open your builds" onClick={() => navigate('/projects')} />
          <HomeTile icon={<IconMail size={20} />} title="Invitations" desc="Join projects you're invited to" onClick={() => navigate('/invitations')} />
        </div>
      </div>

      {showNew && (
        <NewProjectModal onClose={() => setShowNew(false)} onCreated={(id) => { setShowNew(false); navigate(projectLandingPath(id, settings?.default_project_page)); }} />
      )}
    </div>
  );
}

function HomeTile({ icon, title, desc, onClick }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bt-hero-tile"
      style={{
        display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start', textAlign: 'left',
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
        padding: 'var(--sp-4)', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text)',
      }}
    >
      <span style={{ display: 'grid', placeItems: 'center', width: 38, height: 38, borderRadius: 10, background: 'var(--accent-soft)', color: 'var(--accent)' }}>{icon}</span>
      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{title}</span>
      <span className="muted" style={{ fontSize: '0.82rem' }}>{desc}</span>
    </button>
  );
}
