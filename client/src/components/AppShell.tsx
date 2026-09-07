import { useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.js';
import { Avatar } from './ui.js';
import { BrandMark } from './Brand.js';
import { IconBell, IconClock, IconFolder, IconHome, IconLogout, IconMail, IconMenu, IconSettings, IconUser } from './icons.js';

const NAV = [
  { to: '/', label: 'Home', Icon: IconHome, end: true },
  { to: '/projects', label: 'Projects', Icon: IconFolder },
  { to: '/notifications', label: 'Notifications', Icon: IconBell },
  { to: '/invitations', label: 'Invitations', Icon: IconMail },
  { to: '/history', label: 'History', Icon: IconClock },
  { to: '/profile', label: 'Profile', Icon: IconUser },
  { to: '/settings', label: 'Settings', Icon: IconSettings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  // Use the top-level route segment as the key so navigating between sections
  // retriggers the fade, but in-page tab changes don't.
  const routeKey = '/' + (location.pathname.split('/')[1] ?? '');

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile top bar */}
      <div className="row-between" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 56, padding: '0 16px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', zIndex: 30 }} data-mobilebar>
        <div className="row" style={{ gap: 8 }}><BrandMark size={24} radius={6} /><strong style={{ letterSpacing: '-0.02em' }}>BuildTrack</strong></div>
        <button aria-label="Toggle navigation" onClick={() => setOpen((o) => !o)} style={{ display: 'grid', placeItems: 'center', background: 'none', border: '1px solid var(--border-strong)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'var(--text)' }}><IconMenu size={18} /></button>
      </div>

      {/* Sidebar */}
      <aside
        style={{
          width: 'var(--sidebar-w)', flexShrink: 0, background: 'var(--surface)',
          borderRight: '1px solid var(--border)', padding: 'var(--sp-4)',
          display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh',
        }}
        data-sidebar
        data-open={open}
      >
        <div className="row" style={{ gap: 10, padding: '6px 8px 22px' }}>
          <BrandMark size={32} />
          <strong style={{ fontSize: '1.05rem', letterSpacing: '-0.02em' }}>BuildTrack</strong>
        </div>

        <nav className="stack" style={{ gap: 2, flex: 1 }}>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className="bt-nav-link"
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontSize: '0.92rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-soft)' : 'transparent',
              })}
            >
              <item.Icon size={18} />{item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <div className="row" style={{ gap: 10, padding: '4px 8px 10px' }}>
            <Avatar name={user?.displayName ?? '?'} src={user?.avatarUrl} />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.displayName}</div>
              <div className="muted" style={{ fontSize: '0.75rem' }}>{user?.id}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="bt-nav-link" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '9px 12px', cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem', fontFamily: 'inherit' }}><IconLogout size={18} />Sign out</button>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 15 }} data-backdrop />}

      <main style={{ flex: 1, minWidth: 0, padding: 'var(--sp-6)', maxWidth: 1200, margin: '0 auto', width: '100%' }} data-main>
        <div key={routeKey} className="route-fade">
          {children}
        </div>
      </main>

      <ShellResponsiveStyles />
    </div>
  );
}

/** Small inline stylesheet for responsive sidebar behavior (Req 19.3). */
function ShellResponsiveStyles() {
  return (
    <style>{`
      [data-mobilebar] { display: none; }
      @media (max-width: 860px) {
        [data-mobilebar] { display: flex; }
        [data-sidebar] {
          position: fixed; z-index: 20; left: 0; top: 0;
          transform: translateX(-100%); transition: transform .2s ease;
          box-shadow: var(--shadow);
        }
        [data-sidebar][data-open="true"] { transform: translateX(0); }
        [data-main] {
          padding-top: 72px !important;
          padding-left: 16px !important;
          padding-right: 16px !important;
        }
      }
    `}</style>
  );
}
