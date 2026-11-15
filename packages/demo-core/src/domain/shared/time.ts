const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

/**
 * Short relative time, matching the prototypes: "just now", "45 min ago", "2 h ago",
 * "yesterday", "3 d ago", "2 wk ago", "3 mo ago". Dates in the future are clamped to "just now".
 */
export function formatRelative(now: Date | string, date: Date | string): string {
  const diff = toDate(now).getTime() - toDate(date).getTime();
  if (diff < MINUTE) return 'just now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} min ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)} h ago`;
  if (diff < 2 * DAY) return 'yesterday';
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} d ago`;
  if (diff < 30 * DAY) return `${Math.floor(diff / (7 * DAY))} wk ago`;
  return `${Math.floor(diff / (30 * DAY))} mo ago`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Nov 3, 2026 09:10:04" (UTC), the clock format of the run summaries. */
export function formatClock(date: Date | string): string {
  const d = toDate(date);
  const two = (n: number) => String(n).padStart(2, '0');
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()} ${two(d.getUTCHours())}:${two(d.getUTCMinutes())}:${two(d.getUTCSeconds())}`;
}

/** "5.4 s" or "212 ms". */
export function formatDuration(ms: number): string {
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(ms < 10_000 ? 2 : 1)} s`;
}
