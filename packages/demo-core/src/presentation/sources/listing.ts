import { SOURCE_ORIGINS, formatDay, formatHourMinute, formatShortClock, type Importer, type SourceOrigin, type SourceStatus, type SyncChange } from '../../domain/importing/index.js';

/** Word of a source status, on its card. */
export const STATUS_WORD: Record<SourceStatus, string> = { imported: 'Imported', warning: 'Imported · 1 warning', failed: 'Failed', inactive: 'Inactive', running: 'Importing' };

/** Icon of a source status, on its card. */
export const STATUS_ICON: Record<SourceStatus, 'check' | 'warning' | 'cross' | 'pause-narrow' | 'running'> = { imported: 'check', warning: 'warning', failed: 'cross', inactive: 'pause-narrow', running: 'running' };

/** Word of the result of an import, in the sync timeline. */
export const RESULT_WORD = { imported: 'Imported', warning: 'Warning', failed: 'Failed', paused: 'Paused' } as const;

/** Icon of the result of an import, in the sync timeline. */
export const RESULT_ICON = { imported: 'check', warning: 'warning', failed: 'cross', paused: 'pause-narrow' } as const;

/** The "last import" shield of the detail pane: the word and fill come from the source status, not from the last outcome. */
export const SHIELD: Record<Exclude<SourceStatus, 'running'>, { word: string; status: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  imported: { word: 'imported', status: 'success' },
  warning: { word: '1 warning', status: 'warning' },
  failed: { word: 'failed', status: 'danger' },
  inactive: { word: 'inactive', status: 'neutral' },
};

/** Sign of a contract diff line, in its gutter. */
export const DIFF_SIGN = { added: '+', removed: '−', skipped: '!', hunk: '', context: '' } as const;

/** Hidden word of an added, removed or skipped diff line. */
export const DIFF_WORD = { added: 'added', removed: 'removed', skipped: 'skipped' } as const;

/** Options of the Status filter, with their counts. */
export function statusOptions(counts: Readonly<Record<SourceStatus | 'all', number>>): {
  id: SourceStatus | 'all';
  label: string;
  icon?: 'check' | 'warning' | 'cross' | 'pause-narrow';
  iconTone?: 'success' | 'warning' | 'danger' | 'muted';
  count: number;
}[] {
  return [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'imported', label: 'Imported', icon: 'check', iconTone: 'success', count: counts.imported },
    { id: 'warning', label: 'Warnings', icon: 'warning', iconTone: 'warning', count: counts.warning },
    { id: 'failed', label: 'Failing', icon: 'cross', iconTone: 'danger', count: counts.failed },
    { id: 'inactive', label: 'Inactive', icon: 'pause-narrow', iconTone: 'muted', count: counts.inactive },
  ];
}

/** Options of the Origin filter, with their counts. */
export function originOptions(totals: Readonly<Record<SourceOrigin | 'all', number>>): { id: SourceOrigin | 'all'; label: string; count: number }[] {
  return [{ id: 'all', label: 'All', count: totals.all }, ...SOURCE_ORIGINS.map((o) => ({ id: o.id, label: o.label, count: totals[o.id] }))];
}

/** Short name of an origin ("Upload", "Git"). */
export function originLabel(origin: SourceOrigin): string {
  return SOURCE_ORIGINS.find((o) => o.id === origin)?.label ?? origin;
}

/** Last import of a card: "started just now" while it runs, the day of a paused source, the relative time otherwise. */
export function lastImportText(importer: Importer, status: SourceStatus, relative: (date: string) => string): string {
  if (status === 'running') return 'started just now';
  if (!importer.lastSyncAt) return '';
  return `${importer.origin === 'upload' ? 'uploaded' : 'last import'} ${status === 'inactive' ? formatShortClock(importer.lastSyncAt).split(' · ')[0] : relative(importer.lastSyncAt)}`;
}

/** Schedule of a card: none for an upload, the next scan of an active source, else paused. */
export function scheduleText(importer: Importer, nextScanAt: Date | string): string {
  return importer.origin === 'upload' ? 'no schedule · one-off' : importer.active ? `next scan ${formatHourMinute(nextScanAt)}` : 'scans paused';
}

/** Sign before a change of the sync timeline: none for a skipped one, a minus sign for a removal. */
export const changeSign = (sign: SyncChange['sign']): string => (sign === '!' ? '' : sign === '-' ? '−' : sign);

/** Sentence of the diff pane when the source has no change to diff yet. */
export function emptyDiffText(importer: Importer): string {
  return importer.origin === 'upload'
    ? `Uploaded once on ${formatDay(importer.createdAt)}. Re-upload a new version of the file and the change will appear here as a diff.`
    : `The contract has not changed since its initial import (${formatDay(importer.createdAt)}). Nothing to compare yet: the next change will appear here as a diff.`;
}

/** A part of a sentence: a token in a mono span (`className`), or plain text. */
export interface MonoPart {
  text: string;
  className?: string;
}

/** Splits a sentence around its tokens (secret name, header): the first part found is the secret, the others mono. */
export function monoParts(text: string, tokens: readonly (string | undefined)[]): MonoPart[] {
  const list = tokens.filter((t): t is string => Boolean(t));
  if (!list.length) return [{ text }];
  const re = new RegExp(`(${list.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`);
  return text.split(re).map((part, i) => (list.includes(part) ? { text: part, className: i === 1 ? 'demo-mono source-failure-secret' : 'demo-mono' } : { text: part }));
}

/** A fact of the detail pane, in the shape of the design system's `Fact`. */
export interface SourceFact {
  term: string;
  value: string;
  sub?: string;
  mono?: boolean;
}

/** Facts of the detail pane: origin, artifact, secret, TLS validation, schedule, labels and creation. */
export function facts(s: Importer, nextScanAt: Date | string): SourceFact[] {
  const up = s.origin === 'upload';
  return [
    { term: 'Origin', value: SOURCE_ORIGINS.find((o) => o.id === s.origin)?.fact ?? s.origin, sub: up ? 'Re-upload a new version to update its Services' : undefined },
    { term: 'Artifact', value: `${s.role === 'primary' ? 'Primary' : 'Secondary'} · ${s.artifactLabel}`, mono: true,
      sub: s.artifactNote ?? (s.role === 'primary' ? 'Creates or updates Services from this contract' : 'Merges examples into existing Services only') },
    { term: 'Secret', value: up ? 'None, uploaded file' : s.secretName ?? 'None, public resource', sub: s.secretName ? s.secretType : undefined, mono: Boolean(s.secretName) },
    { term: 'TLS validation', value: up ? 'Not applicable' : s.sslValidation ? 'Enabled' : 'Disabled for this source' },
    up ? { term: 'Schedule', value: 'None · one-off upload' }
      : s.active ? { term: 'Schedule', value: `Global hourly scan · next ${formatHourMinute(nextScanAt)}`, sub: 'Also on demand with Import now' }
      : { term: 'Schedule', value: 'Paused, not scanned', sub: 'Turn the switch on to resume' },
    { term: 'Labels', value: s.labels.map((l) => `${l.key}=${l.value}`).join(' · ') || 'None', mono: true },
    { term: 'Created', value: `${formatDay(s.createdAt)} by ${s.createdBy}` },
  ];
}
