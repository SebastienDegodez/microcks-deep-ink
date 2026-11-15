import type { DiffLine, Importer, SourceOrigin, SyncEntry } from './types.js';

export type SourceStatus = 'imported' | 'warning' | 'failed' | 'inactive' | 'running';

/** The one status a source row shows: running beats inactive beats the outcome of the last import. */
export function importerStatus(importer: Importer): SourceStatus {
  if (importer.state === 'running') return 'running';
  if (importer.origin !== 'upload' && !importer.active) return 'inactive';
  return importer.health;
}

export interface SourceFilter {
  status?: SourceStatus | 'all';
  origin?: SourceOrigin | 'all';
  query?: string;
}

/** Sources per origin, plus `all`. */
export function originCounts(importers: readonly Importer[]): Record<SourceOrigin | 'all', number> {
  const counts = { all: importers.length, upload: 0, url: 0, git: 0, hub: 0 };
  for (const i of importers) counts[i.origin] += 1;
  return counts;
}

/** Text a person can search: name, URL, secret, kind, labels and the services it produces. */
export function sourceSearchText(importer: Importer): string {
  return [
    importer.name,
    importer.url,
    importer.secretName ?? '',
    importer.artifactLabel,
    importer.labels.map((l) => `${l.key}=${l.value}`).join(' '),
    importer.workflows ?? '',
    importer.produces.map((p) => `${p.name} ${p.version}`).join(' '),
  ]
    .join(' ')
    .toLowerCase();
}

export function filterImporters(importers: readonly Importer[], filter: SourceFilter): Importer[] {
  const q = (filter.query ?? '').trim().toLowerCase();
  return importers.filter(
    (i) => (!filter.status || filter.status === 'all' || importerStatus(i) === filter.status) &&
      (!filter.origin || filter.origin === 'all' || i.origin === filter.origin) &&
      (!q || sourceSearchText(i).includes(q)),
  );
}

export function statusCounts(importers: readonly Importer[]): Record<SourceStatus | 'all', number> {
  const counts = { all: importers.length, imported: 0, warning: 0, failed: 0, inactive: 0, running: 0 };
  for (const i of importers) counts[importerStatus(i)] += 1;
  return counts;
}

export function diffStats(lines: readonly DiffLine[]): { adds: number; dels: number } {
  return {
    adds: lines.filter((l) => l.kind === 'added').length,
    dels: lines.filter((l) => l.kind === 'removed').length,
  };
}

/** Splits `3c9e1d0 → a41f9c2` into its two revisions. */
export function splitRevision(revision: string): { from: string; to: string } {
  const [from = '', to = ''] = revision.split('→').map((x) => x.trim());
  return { from, to };
}

/** The entry whose diff is shown when nothing was picked: the newest one that has a diff. */
export function defaultDiffEntry(timeline: readonly SyncEntry[]): string | undefined {
  const entry = timeline.find((e) => e.kind === 'run' && e.revision);
  return entry?.id;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Nov 3 · 09:00" (UTC), the clock of the sync timeline. */
export function formatShortClock(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const two = (n: number) => String(n).padStart(2, '0');
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()} · ${two(d.getUTCHours())}:${two(d.getUTCMinutes())}`;
}

/** "Nov 3, 2026" (UTC). */
export function formatDay(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/** "09:00" (UTC). */
export function formatHourMinute(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

export interface ScanWindow {
  last: Date;
  next: Date;
  minutesSince: number;
  minutesUntil: number;
}

/** Hourly global scan (`0 0 * * * *`): the previous and the next full hour. */
export function scanWindow(now: Date): ScanWindow {
  const hour = 60 * 60_000;
  const last = new Date(Math.floor(now.getTime() / hour) * hour);
  const next = new Date(last.getTime() + hour);
  return {
    last,
    next,
    minutesSince: Math.round((now.getTime() - last.getTime()) / 60_000),
    minutesUntil: Math.round((next.getTime() - now.getTime()) / 60_000),
  };
}
