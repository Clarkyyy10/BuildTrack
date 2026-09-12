import { useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.js';
import { useT } from '../lib/i18n.js';
import { Avatar } from './ui.js';
import { BrandMark } from './Brand.js';
import { IconBell, IconFolder, IconHome, IconLogout, IconMail, IconMenu, IconSettings, IconUser } from './icons.js';

const NAV = [
  { to: '/', i18n: 'nav.home', Icon: IconHome, end: true },
  { to: '/projects', i18n: 'nav.projects', Icon: IconFolder },
  { to: '/notifications', i18n: 'nav.notifications', Icon: IconBell },
  { to: '/invitations', i18n: 'nav.invitations', Icon: IconMail },
  { to: '/profile', i18n: 'nav.profile', Icon: IconUser },
  { to: '/settings', i18n: 'nav.settings', Icon: IconSettings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, settings, logout } = useAuth();
  const t = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const collapsed = settings?.sidebar_behavior === 'collapsed';
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
      <div className="row-between" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 56, padding: '0 16px', background: 'var(--panel)', borderBottom: '1px solid var(--panel-border)', zIndex: 30 }} data-mobilebar>
        <div className="row" style={{ gap: 8 }}><BrandMark size={24} radius={6} /><strong style={{ letterSpacing: '-0.02em' }}>BuildTrack</strong></div>
        <button aria-label="Toggle navigation" onClick={() => setOpen((o) => !o)} style={{ display: 'grid', placeItems: 'center', background: 'none', border: '1px solid var(--border-strong)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'var(--text)' }}><IconMenu size={18} /></button>
      </div>

      {/* Sidebar */}
      <aside
        style={{
          width: collapsed ? 72 : 'var(--sidebar-w)', flexShrink: 0, background: 'var(--panel)',
          borderRight: '1px solid var(--panel-border)', padding: collapsed ? '16px 10px' : 'var(--sp-4)',
          display: 'flex', flexDirection: 'column', position: 'sticky', top: 0,
          // align-self:flex-start stops the flex row from stretching the aside to
          // the full (tall) page height — that stretch is what breaks position:
          // sticky and leaves the footer/empty space stranded on scroll. Pinning
          // the height to the viewport and letting it scroll internally keeps the
          // nav + footer correctly placed no matter how long the page gets.
          alignSelf: 'flex-start', height: '100vh', overflowY: 'auto',
        }}
        data-sidebar
        data-open={open}
        data-collapsed={collapsed}
      >
        <div className="row" style={{ gap: 10, padding: '6px 8px 22px', justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <BrandMark size={32} />
          <strong className="bt-brand-text" style={{ fontSize: '1.05rem', letterSpacing: '-0.02em' }}>BuildTrack</strong>
        </div>

        <nav className="stack" style={{ gap: 6, flex: 1 }} aria-label={t('a11y.mainnav')}>
          <span className="sr-hint">{t('a11y.mainnav')}</span>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className="bt-nav-link"
              title={collapsed ? t(item.i18n) : undefined}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontSize: '0.92rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-soft)' : 'transparent',
                boxShadow: isActive ? 'inset 3px 0 0 var(--accent)' : undefined,
              })}
            >
              <item.Icon size={18} /><span className="bt-nav-label">{t(item.i18n)}</span>
            </NavLink>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <div className="row" style={{ gap: 10, padding: '4px 8px 10px', justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <Avatar name={user?.displayName ?? '?'} src={user?.avatarUrl} />
            <div className="bt-user-info" style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.displayName}</div>
              <div className="muted" style={{ fontSize: '0.75rem' }}>{user?.id}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="bt-nav-link" title={collapsed ? t('nav.signout') : undefined} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start', textAlign: 'left', background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '9px 12px', cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem', fontFamily: 'inherit' }}><IconLogout size={18} /><span className="bt-signout-label">{t('nav.signout')}</span></button>
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
      /* Collapsed sidebar (desktop): show icons only, hide text. Overridden
         inside the mobile media query below where the drawer is full-width. */
      [data-sidebar][data-collapsed="true"] .bt-brand-text,
      [data-sidebar][data-collapsed="true"] .bt-nav-label,
      [data-sidebar][data-collapsed="true"] .bt-user-info,
      [data-sidebar][data-collapsed="true"] .bt-signout-label { display: none; }
      @media (max-width: 860px) {
        [data-mobilebar] { display: flex; }
        /* !important is required: the sidebar sets position/top/height inline,
           and inline styles beat stylesheet rules. Without it the sidebar stays
           position:sticky, keeps reserving its 256px column, and leaves an empty
           gutter on mobile while content is squeezed to one side. */
        [data-sidebar] {
          position: fixed !important; z-index: 20; left: 0 !important; top: 0 !important;
          height: 100vh !important; width: var(--sidebar-w) !important; max-width: 84vw;
          transform: translateX(-100%) !important; transition: transform .2s ease;
          box-shadow: var(--shadow);
        }
        [data-sidebar][data-open="true"] { transform: translateX(0) !important; }
        /* On mobile the sidebar is a full drawer, so a "collapsed" preference
           must not turn it into a useless icon-only strip — restore labels. */
        [data-sidebar][data-collapsed="true"] { padding: var(--sp-4) !important; }
        [data-sidebar][data-collapsed="true"] .bt-brand-text,
        [data-sidebar][data-collapsed="true"] .bt-nav-label,
        [data-sidebar][data-collapsed="true"] .bt-user-info,
        [data-sidebar][data-collapsed="true"] .bt-signout-label { display: revert !important; }
        [data-main] {
          padding-top: 72px !important;
          padding-left: 16px !important;
          padding-right: 16px !important;
        }
      }
    `}</style>
  );
}
