import { useState } from 'react';
import { useAuth } from '../lib/auth.js';
import { useT } from '../lib/i18n.js';
import { api } from '../lib/api.js';
import { Card } from '../components/ui.js';
import type { Settings } from '../lib/types.js';

/** Curated accent presets. Swatch colour is the light-mode fill; each preset
 *  also ships a dark-mode variant + accessible on-accent text (see tokens.css). */
const ACCENTS = [
  { key: 'terracotta', label: 'Terracotta', color: '#c2410c' },
  { key: 'amber', label: 'Amber', color: '#b45309' },
  { key: 'forest', label: 'Forest', color: '#15803d' },
  { key: 'teal', label: 'Teal', color: '#0f766e' },
  { key: 'blue', label: 'Steel blue', color: '#1d4ed8' },
  { key: 'violet', label: 'Violet', color: '#6d28d9' },
  { key: 'rose', label: 'Rose', color: '#be123c' },
  { key: 'graphite', label: 'Graphite', color: '#334155' },
] as const;

/** Dark-mode surface tones. Swatch colour is each tone's base background
 *  (see the data-dark-theme blocks in tokens.css). Only visible in dark mode. */
const DARK_THEMES = [
  { key: 'warm', label: 'Warm brown', color: '#16130f' },
  { key: 'neutral', label: 'Neutral gray', color: '#141414' },
  { key: 'slate', label: 'Slate', color: '#0f1319' },
  { key: 'midnight', label: 'Midnight', color: '#0b0f24' },
  { key: 'black', label: 'True black', color: '#000000' },
] as const;

export function SettingsPage() {
  const { settings, setSettings } = useAuth();
  const t = useT();
  const [saving, setSaving] = useState(false);

  if (!settings) return null;

  async function update(patch: Record<string, string | number | boolean>) {
    setSaving(true);
    // Optimistically apply (booleans -> 0/1 to match stored shape) so theme
    // and accessibility changes feel instant; the API receives real booleans.
    const normalized: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(patch)) normalized[k] = typeof v === 'boolean' ? (v ? 1 : 0) : v;
    setSettings({ ...(settings as Settings), ...normalized } as Settings);
    try {
      const res = await api.patch<{ settings: Settings }>('/settings', patch);
      setSettings(res.settings);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="row-between" style={{ marginBottom: 20 }}>
        <h1>{t('settings.title')}<span className="sr-hint"> — {t('a11y.autosave')}</span></h1>
        <span aria-live="polite">{saving && <span className="muted" style={{ fontSize: '0.82rem' }}>{t('common.saving')}</span>}</span>
      </div>

      <Section title={t('settings.appearance')} hint={t('settings.appearance.hint')}>
        <Row label={t('settings.theme')}>
          <select value={settings.theme} onChange={(e) => update({ theme: e.target.value })}>
            <option value="light">{t('settings.theme.light')}</option><option value="dark">{t('settings.theme.dark')}</option><option value="system">{t('settings.theme.system')}</option>
          </select>
        </Row>

        <div>
          <div className="row-between" style={{ gap: 12, marginBottom: 10 }}>
            <span style={{ fontSize: '0.9rem' }}>{t('settings.darktone')}</span>
            <span className="muted" style={{ fontSize: '0.82rem' }}>
              {settings.theme === 'light' ? t('settings.darktone.appliesInDark') : (DARK_THEMES.find((tone) => tone.key === (settings.dark_theme || 'warm'))?.label ?? 'Warm brown')}
            </span>
          </div>
          <div className="row wrap" style={{ gap: 10 }} role="radiogroup" aria-label={t('settings.darktone')}>
            {DARK_THEMES.map((tone) => {
              const selected = (settings.dark_theme || 'warm') === tone.key;
              return (
                <button
                  key={tone.key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={tone.label}
                  title={tone.label}
                  onClick={() => update({ dark_theme: tone.key })}
                  style={{
                    width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', padding: 0,
                    background: tone.color,
                    border: selected ? '2px solid var(--accent)' : '2px solid var(--border-strong)',
                    boxShadow: selected ? '0 0 0 3px var(--bg), 0 0 0 4px var(--accent)' : 'none',
                    display: 'grid', placeItems: 'center',
                    transition: 'box-shadow .15s ease, transform .12s ease',
                  }}
                >
                  {selected && (
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m5 13 4 4L19 7" /></svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="row-between" style={{ gap: 12, marginBottom: 10 }}>
            <span style={{ fontSize: '0.9rem' }}>{t('settings.accent')}</span>
            <span className="muted" style={{ fontSize: '0.82rem' }}>{ACCENTS.find((a) => a.key === settings.accent)?.label ?? 'Terracotta'}</span>
          </div>
          <div className="row wrap" style={{ gap: 10 }} role="radiogroup" aria-label={t('settings.accent')}>
            {ACCENTS.map((a) => {
              const selected = (settings.accent || 'terracotta') === a.key;
              return (
                <button
                  key={a.key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={a.label}
                  title={a.label}
                  onClick={() => update({ accent: a.key })}
                  style={{
                    width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', padding: 0,
                    background: a.color,
                    border: selected ? '2px solid var(--text)' : '2px solid var(--border)',
                    boxShadow: selected ? '0 0 0 3px var(--bg), 0 0 0 4px var(--text)' : 'none',
                    display: 'grid', placeItems: 'center',
                    transition: 'box-shadow .15s ease, transform .12s ease',
                  }}
                >
                  {selected && (
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m5 13 4 4L19 7" /></svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <Row label={t('settings.density')}>
          <select value={settings.density} onChange={(e) => update({ density: e.target.value })}>
            <option value="comfortable">{t('settings.density.comfortable')}</option><option value="compact">{t('settings.density.compact')}</option>
          </select>
        </Row>
        <Row label={t('settings.fontscale')}>
          <input type="range" min={0.85} max={1.4} step={0.05} value={settings.font_scale} onChange={(e) => update({ font_scale: Number(e.target.value) })} style={{ padding: 0 }} />
          <span className="muted" style={{ fontSize: '0.82rem' }}>{Math.round(settings.font_scale * 100)}%</span>
        </Row>
      </Section>

      <Section title={t('settings.interface')} hint={t('settings.interface.hint')}>
        <Row label={t('settings.sidebar')}>
          <select value={settings.sidebar_behavior} onChange={(e) => update({ sidebar_behavior: e.target.value })}>
            <option value="expanded">{t('settings.sidebar.expanded')}</option><option value="collapsed">{t('settings.sidebar.collapsed')}</option>
          </select>
        </Row>
        <Row label={t('settings.defaultpage')}>
          <select value={settings.default_project_page} onChange={(e) => update({ default_project_page: e.target.value })}>
            <option value="overview">{t('settings.defaultpage.overview')}</option><option value="breakdown">{t('settings.defaultpage.breakdown')}</option>
          </select>
        </Row>
        <Row label={t('settings.tabledensity')}>
          <select value={settings.table_density} onChange={(e) => update({ table_density: e.target.value })}>
            <option value="comfortable">{t('settings.density.comfortable')}</option><option value="compact">{t('settings.density.compact')}</option>
          </select>
        </Row>
      </Section>

      <Section title={t('settings.accessibility')} hint={t('settings.accessibility.hint')}>
        <Toggle label={t('settings.highcontrast')} checked={!!settings.high_contrast} onChange={(v) => update({ high_contrast: v })} />
        <Toggle label={t('settings.reducedmotion')} checked={!!settings.reduced_motion} onChange={(v) => update({ reduced_motion: v })} />
        <Toggle label={t('settings.srhints')} checked={!!settings.screen_reader_hint} onChange={(v) => update({ screen_reader_hint: v })} />
      </Section>

      <Section title={t('settings.privacy')} hint={t('settings.privacy.hint')}>
        <Row label={t('settings.visibility')}>
          <select value={settings.profile_visibility} onChange={(e) => update({ profile_visibility: e.target.value })}>
            <option value="members">{t('settings.visibility.members')}</option><option value="private">{t('settings.visibility.private')}</option><option value="public">{t('settings.visibility.public')}</option>
          </select>
        </Row>
        <Toggle label={t('settings.showonline')} checked={!!settings.show_online} onChange={(v) => update({ show_online: v })} />
        <Toggle label={t('settings.showlastactive')} checked={!!settings.show_last_active} onChange={(v) => update({ show_last_active: v })} />
      </Section>

      <Section title={t('settings.langregion')} hint={t('settings.langregion.hint')}>
        <Row label={t('settings.language')}>
          <select value={settings.language} onChange={(e) => update({ language: e.target.value })}>
            <option value="en">{t('settings.language.en')}</option><option value="fil">{t('settings.language.fil')}</option>
          </select>
        </Row>
        <Row label={t('settings.region')}>
          <select value={settings.region} onChange={(e) => update({ region: e.target.value })}>
            <option value="PH">{t('settings.region.ph')}</option><option value="US">{t('settings.region.us')}</option>
          </select>
        </Row>
      </Section>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <Card style={{ marginBottom: 16 }}>
      <h3 style={{ marginBottom: 2 }}>{title}</h3>
      <p className="muted" style={{ fontSize: '0.82rem', marginBottom: 16 }}>{hint}</p>
      <div className="stack" style={{ gap: 12 }}>{children}</div>
    </Card>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="row-between" style={{ gap: 12 }}>
      <span style={{ fontSize: '0.9rem' }}>{label}</span>
      <div className="row" style={{ gap: 10, minWidth: 200, justifyContent: 'flex-end' }}>{children}</div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="row-between" style={{ gap: 12, cursor: 'pointer' }}>
      <span style={{ fontSize: '0.9rem' }}>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 'auto' }} />
    </label>
  );
}
