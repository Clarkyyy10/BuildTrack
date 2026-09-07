import { useState } from 'react';
import { useAuth } from '../lib/auth.js';
import { api } from '../lib/api.js';
import { Card } from '../components/ui.js';
import type { Settings } from '../lib/types.js';

export function SettingsPage() {
  const { settings, setSettings } = useAuth();
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
        <h1>Settings</h1>
        {saving && <span className="muted" style={{ fontSize: '0.82rem' }}>Saving…</span>}
      </div>

      <Section title="Appearance" hint="Theme, accent, and density.">
        <Row label="Theme">
          <select value={settings.theme} onChange={(e) => update({ theme: e.target.value })}>
            <option value="light">Light</option><option value="dark">Dark</option>
          </select>
        </Row>
        <Row label="Density">
          <select value={settings.density} onChange={(e) => update({ density: e.target.value })}>
            <option value="comfortable">Comfortable</option><option value="compact">Compact</option>
          </select>
        </Row>
        <Row label="Font scale">
          <input type="range" min={0.85} max={1.4} step={0.05} value={settings.font_scale} onChange={(e) => update({ font_scale: Number(e.target.value) })} style={{ padding: 0 }} />
          <span className="muted" style={{ fontSize: '0.82rem' }}>{Math.round(settings.font_scale * 100)}%</span>
        </Row>
      </Section>

      <Section title="Interface" hint="Navigation and default views.">
        <Row label="Sidebar">
          <select value={settings.sidebar_behavior} onChange={(e) => update({ sidebar_behavior: e.target.value })}>
            <option value="expanded">Expanded</option><option value="collapsed">Collapsed</option>
          </select>
        </Row>
        <Row label="Default project page">
          <select value={settings.default_project_page} onChange={(e) => update({ default_project_page: e.target.value })}>
            <option value="overview">Overview</option><option value="breakdown">Breakdown</option>
          </select>
        </Row>
        <Row label="Table density">
          <select value={settings.table_density} onChange={(e) => update({ table_density: e.target.value })}>
            <option value="comfortable">Comfortable</option><option value="compact">Compact</option>
          </select>
        </Row>
      </Section>

      <Section title="Accessibility" hint="Contrast, motion, and readability.">
        <Toggle label="High contrast" checked={!!settings.high_contrast} onChange={(v) => update({ high_contrast: v })} />
        <Toggle label="Reduced motion" checked={!!settings.reduced_motion} onChange={(v) => update({ reduced_motion: v })} />
        <Toggle label="Screen-reader hints" checked={!!settings.screen_reader_hint} onChange={(v) => update({ screen_reader_hint: v })} />
      </Section>

      <Section title="Privacy" hint="What others can see.">
        <Row label="Profile visibility">
          <select value={settings.profile_visibility} onChange={(e) => update({ profile_visibility: e.target.value })}>
            <option value="members">Project members</option><option value="private">Private</option><option value="public">Public</option>
          </select>
        </Row>
        <Toggle label="Show online status" checked={!!settings.show_online} onChange={(v) => update({ show_online: v })} />
        <Toggle label="Show last active" checked={!!settings.show_last_active} onChange={(v) => update({ show_last_active: v })} />
      </Section>

      <Section title="Language & Region" hint="Localization preferences.">
        <Row label="Language">
          <select value={settings.language} onChange={(e) => update({ language: e.target.value })}>
            <option value="en">English</option><option value="fil">Filipino</option>
          </select>
        </Row>
        <Row label="Region">
          <select value={settings.region} onChange={(e) => update({ region: e.target.value })}>
            <option value="PH">Philippines</option><option value="US">United States</option>
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
