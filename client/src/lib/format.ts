/** Region-driven locale/currency. Set from user settings via setLocale();
 *  defaults to the Philippines (the app's home region). */
type Region = 'PH' | 'US';

interface RegionFormat {
  locale: string;
  currency: string;
  symbol: string;
}

const REGIONS: Record<Region, RegionFormat> = {
  PH: { locale: 'en-PH', currency: 'PHP', symbol: '₱' },
  US: { locale: 'en-US', currency: 'USD', symbol: '$' },
};

let current: RegionFormat = REGIONS.PH;

/** Called by applySettings() whenever the user's region changes. */
export function setLocale(region: Region): void {
  current = REGIONS[region] ?? REGIONS.PH;
}

/** Currency formatting for the active region. Amounts are stored in the
 *  project's own currency; this only changes grouping and the symbol shown. */
export function money(n: number): string {
  return current.symbol + Math.round(n).toLocaleString(current.locale);
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(current.locale, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function dateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(current.locale, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function roleLabel(role: string): string {
  return titleCase(role);
}
