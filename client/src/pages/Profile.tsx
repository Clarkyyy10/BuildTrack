import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.js';
import { useT } from '../lib/i18n.js';
import { api, ApiError } from '../lib/api.js';
import { Avatar, Button, Card } from '../components/ui.js';
import { IconCamera } from '../components/icons.js';
import { dateTime } from '../lib/format.js';
import type { Settings } from '../lib/types.js';

/** Reads an image file and downscales it to a square data URL (keeps payload small). */
function fileToResizedDataUrl(file: File, max = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        const canvas = document.createElement('canvas');
        canvas.width = max;
        canvas.height = max;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas unavailable'));
        ctx.drawImage(img, sx, sy, side, side, 0, 0, max, max);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Invalid image'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

export function ProfilePage() {
  const { user, settings, refresh } = useAuth();
  const t = useT();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [preview, setPreview] = useState<string | null>(user?.avatarUrl ?? null);
  const [dirtyPhoto, setDirtyPhoto] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr('');
    if (!file.type.startsWith('image/')) { setErr('Please choose an image file.'); return; }
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setPreview(dataUrl);
      setDirtyPhoto(true);
    } catch {
      setErr('Could not process that image.');
    }
  }

  function removePhoto() {
    setPreview(null);
    setDirtyPhoto(true);
  }

  async function save() {
    setBusy(true); setMsg(''); setErr('');
    try {
      const payload: Record<string, unknown> = { displayName };
      if (dirtyPhoto) payload.avatarUrl = preview ?? '';
      await api.patch('/me', payload);
      await refresh();
      setDirtyPhoto(false);
      setMsg('Profile saved.');
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Failed to update.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 620 }}>
      <h1 style={{ marginBottom: 20 }}>{t('profile.title')}</h1>

      <Card style={{ marginBottom: 16 }}>
        {/* Photo */}
        <div className="row" style={{ gap: 18, marginBottom: 22 }}>
          <div style={{ position: 'relative' }}>
            <Avatar name={displayName || user?.displayName || '?'} src={preview} size={72} />
            <button
              onClick={() => fileRef.current?.click()}
              aria-label={t('profile.changephoto')}
              className="bt-btn"
              style={{ position: 'absolute', right: -4, bottom: -4, width: 30, height: 30, borderRadius: '50%', background: 'var(--accent)', color: 'var(--on-accent)', border: '2px solid var(--surface)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
            >
              <IconCamera size={15} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={onPick} style={{ display: 'none' }} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{user?.displayName}</div>
            <div className="muted" style={{ fontSize: '0.85rem' }}>{user?.email}</div>
            <div className="row" style={{ gap: 8, marginTop: 10 }}>
              <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>{t('profile.uploadphoto')}</Button>
              {preview && <Button size="sm" variant="ghost" onClick={removePhoto}>{t('profile.remove')}</Button>}
            </div>
          </div>
        </div>

        {/* Identity */}
        <dl style={{ margin: '0 0 20px', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '10px 20px', fontSize: '0.9rem' }}>
          <dt className="muted">{t('profile.userid')}</dt><dd style={{ margin: 0 }}><span className="mono">{user?.id}</span> <span className="muted">· {t('profile.permanent')}</span></dd>
          <dt className="muted">{t('profile.joined')}</dt><dd style={{ margin: 0 }}>{user ? dateTime(user.createdAt) : ''}</dd>
        </dl>

        <div className="field">
          <label htmlFor="dn">{t('profile.displayname')}</label>
          <input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>

        {msg && <p style={{ color: 'var(--success)', fontSize: '0.85rem', marginBottom: 12 }}>{msg}</p>}
        {err && <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginBottom: 12 }}>{err}</p>}
        <Button onClick={save} disabled={busy}>{busy ? t('common.saving') : t('profile.save')}</Button>
      </Card>

      <PrivacyPreview
        settings={settings}
        name={displayName || user?.displayName || '?'}
        avatar={preview}
        joined={user ? dateTime(user.createdAt) : ''}
        t={t}
      />

      <Card>
        <h3 style={{ marginBottom: 6 }}>{t('profile.morecustomization')}</h3>
        <p className="muted" style={{ fontSize: '0.88rem', marginBottom: 14 }}>{t('profile.morecustomization.hint')}</p>
        <Button variant="secondary" size="sm" onClick={() => navigate('/settings')}>{t('profile.opensettings')}</Button>
      </Card>
    </div>
  );
}

/** Live preview of what other users would see, driven by the Privacy settings.
 *  This makes the visibility/online/last-active toggles produce a real,
 *  immediate, on-screen effect. */
function PrivacyPreview({
  settings, name, avatar, joined, t,
}: {
  settings: Settings | null;
  name: string;
  avatar: string | null;
  joined: string;
  t: (k: string) => string;
}) {
  const visibility = settings?.profile_visibility ?? 'members';
  const isPrivate = visibility === 'private';
  const showOnline = !!settings?.show_online;
  const showLast = !!settings?.show_last_active;
  const visLabel = t(`settings.visibility.${visibility === 'public' ? 'public' : isPrivate ? 'private' : 'members'}`);

  return (
    <Card style={{ marginBottom: 16 }}>
      <h3 style={{ marginBottom: 6 }}>{t('profile.preview.title')}</h3>
      <p className="muted" style={{ fontSize: '0.82rem', marginBottom: 14 }}>
        {t('profile.preview.visibleto')}: <strong style={{ color: 'var(--text-secondary)' }}>{visLabel}</strong>
      </p>

      {isPrivate ? (
        <p className="muted" style={{ fontSize: '0.88rem' }}>{t('profile.preview.privatenote')}</p>
      ) : (
        <div className="row" style={{ gap: 14, opacity: 1 }}>
          <Avatar name={name} src={avatar} size={48} />
          <div className="stack" style={{ gap: 4 }}>
            <div style={{ fontWeight: 600 }}>{name}</div>
            <div className="row" style={{ gap: 8, fontSize: '0.82rem' }}>
              <span className="row" style={{ gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: showOnline ? 'var(--success)' : 'var(--text-muted)' }} />
                <span className={showOnline ? 'secondary' : 'muted'}>
                  {showOnline ? t('profile.preview.online') : t('profile.preview.onlinehidden')}
                </span>
              </span>
            </div>
            <div className="muted" style={{ fontSize: '0.8rem' }}>
              {showLast ? `${t('profile.preview.lastactive')} · ${joined}` : t('profile.preview.lastactivehidden')}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
