/** Current UTC timestamp in ISO-8601 (stored as TEXT throughout). */
export const nowIso = (): string => new Date().toISOString();

/** ISO timestamp N hours from now. */
export const hoursFromNow = (hours: number): string =>
  new Date(Date.now() + hours * 3600_000).toISOString();

/** Today's date as YYYY-MM-DD (UTC). */
export const todayDate = (): string => new Date().toISOString().slice(0, 10);
