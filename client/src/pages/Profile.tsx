import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.js';
import { api, ApiError } from '../lib/api.js';
import { Avatar, Button, Card } from '../components/ui.js';
import { IconCamera } from '../components/icons.js';
import { dateTime } from '../lib/format.js';

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
  const { user, refresh } = useAuth();
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
      <h1 style={{ marginBottom: 20 }}>Profile</h1>

      <Card style={{ marginBottom: 16 }}>
        {/* Photo */}
        <div className="row" style={{ gap: 18, marginBottom: 22 }}>
          <div style={{ position: 'relative' }}>
            <Avatar name={displayName || user?.displayName || '?'} src={preview} size={72} />
            <button
              onClick={() => fileRef.current?.click()}
              aria-label="Change photo"
              className="bt-btn"
              style={{ position: 'absolute', right: -4, bottom: -4, width: 30, height: 30, borderRadius: '50%', background: 'var(--accent)', color: '#fff', border: '2px solid var(--surface)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
            >
              <IconCamera size={15} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={onPick} style={{ display: 'none' }} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{user?.displayName}</div>
            <div className="muted" style={{ fontSize: '0.85rem' }}>{user?.email}</div>
            <div className="row" style={{ gap: 8, marginTop: 10 }}>
              <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>Upload photo</Button>
              {preview && <Button size="sm" variant="ghost" onClick={removePhoto}>Remove</Button>}
            </div>
          </div>
        </div>

        {/* Identity */}
        <dl style={{ margin: '0 0 20px', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '10px 20px', fontSize: '0.9rem' }}>
          <dt className="muted">User ID</dt><dd style={{ margin: 0 }}><span className="mono">{user?.id}</span> <span className="muted">· permanent</span></dd>
          <dt className="muted">Joined</dt><dd style={{ margin: 0 }}>{user ? dateTime(user.createdAt) : ''}</dd>
        </dl>

        <div className="field">
          <label htmlFor="dn">Display name</label>
          <input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>

        {msg && <p style={{ color: 'var(--success)', fontSize: '0.85rem', marginBottom: 12 }}>{msg}</p>}
        {err && <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginBottom: 12 }}>{err}</p>}
        <Button onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</Button>
      </Card>

      <Card>
        <h3 style={{ marginBottom: 6 }}>More customization</h3>
        <p className="muted" style={{ fontSize: '0.88rem', marginBottom: 14 }}>Theme, accent, density, accessibility, privacy, and language live in Settings.</p>
        <Button variant="secondary" size="sm" onClick={() => navigate('/settings')}>Open Settings</Button>
      </Card>
    </div>
  );
}
