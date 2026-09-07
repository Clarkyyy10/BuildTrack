import { useState } from 'react';

/** Path served from client/public/. Save the logo image here (see below). */
export const LOGO_SRC = '/buildtrack-logo.png';

/**
 * Brand mark. Renders the logo image; if the file isn't present yet it
 * gracefully falls back to a lettered tile so the UI never breaks.
 */
export function BrandMark({ size = 32, radius = 9 }: { size?: number; radius?: number }) {
  const [ok, setOk] = useState(true);
  if (ok) {
    return (
      <img
        src={LOGO_SRC}
        alt="BuildTrack"
        width={size}
        height={size}
        onError={() => setOk(false)}
        style={{ width: size, height: size, borderRadius: radius, objectFit: 'contain', display: 'block' }}
      />
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: radius, background: 'var(--accent)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: size * 0.45 }}>
      B
    </div>
  );
}

/** Icon + wordmark lockup. */
export function BrandLockup({ size = 32 }: { size?: number }) {
  return (
    <div className="row" style={{ gap: 10 }}>
      <BrandMark size={size} />
      <strong style={{ fontSize: '1.05rem', letterSpacing: '-0.02em' }}>BuildTrack</strong>
    </div>
  );
}
