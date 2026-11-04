import '../explore-kit/explore.css';
import './sources.css';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router';
import {
  defaultDiffEntry, diffStats, filterImporters, formatDay, formatHourMinute, formatShortClock, importerStatus, originCounts, splitRevision, statusCounts, SOURCE_ORIGINS,
  type Importer, type SourceOrigin, type SourceStatus, type SyncEntry,
} from '@/domain/importing';
import { PageHeader, useAnnounce, useClock, useQuery, useRelativeTime, useReturnFocus, useUseCases, usePageTitle } from '@/ui/app';
import { ApiBadge } from '@/ui/components/ui/api-badge';
import { Button } from '@/ui/components/ui/button';
import { CopyButton } from '@/ui/components/ui/copy-button';
import { Icon } from '@/ui/components/ui/icon';
import { FilterRow, FilterSearch } from '@/ui/components/ui/filter-bar';
import { LiveIndicator } from '@/ui/components/ui/live-indicator';
import { Segmented } from '@/ui/components/ui/segmented';
import { Switch } from '@/ui/components/ui/switch';
import { ErrorBlock, LoadingBlock } from '../explore-kit/states';

const STATUS_WORD: Record<SourceStatus, string> = { imported: 'Imported', warning: 'Imported · 1 warning', failed: 'Failed', inactive: 'Inactive', running: 'Importing' };
const STATUS_ICON: Record<SourceStatus, 'check' | 'warning' | 'cross' | 'pause-narrow' | 'running'> = { imported: 'check', warning: 'warning', failed: 'cross', inactive: 'pause-narrow', running: 'running' };
const RESULT_WORD = { imported: 'Imported', warning: 'Warning', failed: 'Failed', paused: 'Paused' } as const;
/** The "last import" shield of the detail pane: the word and fill come from the source status, not from the last outcome. */
const SHIELD: Record<Exclude<SourceStatus, 'running'>, { word: string; status: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  imported: { word: 'imported', status: 'success' },
  warning: { word: '1 warning', status: 'warning' },
  failed: { word: 'failed', status: 'danger' },
  inactive: { word: 'inactive', status: 'neutral' },
};
const DIFF_SIGN = { added: '+', removed: '−', skipped: '!', hunk: '', context: '' } as const;
const DIFF_WORD = { added: 'added', removed: 'removed', skipped: 'skipped' } as const;

function ServiceLinks({ importer, className = 'ex-row' }: { importer: Importer; className?: string }) {
  return (
    <span className={className}>
      {importer.produces.map((p) => (
        p.id ? (
          <RouterLink key={`${p.name}${p.version}`} to={`/services/${p.id}`}>
            <ApiBadge protocol={p.protocol} name={p.name} version={p.version} size="sm" />
          </RouterLink>
        ) : <ApiBadge key={`${p.name}${p.version}`} protocol={p.protocol} name={p.name} version={p.version} size="sm" />
      ))}
      {importer.workflows ? (
        <RouterLink to="/workflows"><ApiBadge arazzo name={importer.workflows} size="sm" /></RouterLink>
      ) : null}
    </span>
  );
}

export default function SourcesPage() {
  usePageTitle('Sources · Microcks');
  const { importerId } = useParams();
  const navigate = useNavigate();
  const uc = useUseCases();
  const announce = useAnnounce();
  const relative = useRelativeTime();
  const clock = useClock();
  const list = useQuery(() => uc.importing.listImporters(), [uc]);
  const schedule = uc.importing.getScanSchedule();
  const [status, setStatus] = useState<SourceStatus | 'all'>('all');
  const [origin, setOrigin] = useState<SourceOrigin | 'all'>('all');
  const [query, setQuery] = useState('');
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [confirm, setConfirm] = useState<string | undefined>();
  const [undoing, setUndoing] = useState<{ importer: Importer; wasSelected: boolean } | undefined>();
  /** Card whose name takes focus once the list has reloaded (after an undo). */
  const focusId = useRef<string | undefined>(undefined);
  const undoRef = useRef<HTMLButtonElement>(null);
  const { focusLater } = useReturnFocus();
  /** Closing the inline confirmation gives focus back to the card's Delete button. */
  const backToDelete = (id: string) => focusLater(() => document.getElementById(`source-delete-${id}`));
  const autoRuns = useRef(new Map<string, () => void>());
  const [entryId, setEntryId] = useState<string | undefined>();
  // The inline confirmation takes focus once, when it opens.
  const focusOnOpen = useCallback((el: HTMLButtonElement | null) => el?.focus(), []);

  // Importers that are mid-import when the page opens finish on their own, once: a later reload
  // (after a delete or an undo) must not restart them nor announce "Import started." again.
  useEffect(() => {
    if (!list.data) return;
    for (const i of list.data) {
      if (i.state === 'running' && !autoRuns.current.has(i.id)) autoRuns.current.set(i.id, run(i.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.data]);
  useEffect(() => {
    const runs = autoRuns.current;
    return () => runs.forEach((u) => u());
  }, []);

  // After an undo, focus moves to the restored card's name once the list has reloaded.
  useEffect(() => {
    const id = focusId.current;
    if (!id || !list.data?.some((i) => i.id === id)) return;
    document.getElementById(`source-name-${id}`)?.focus();
    focusId.current = undefined;
  }, [list.data]);

  function run(id: string) {
    setProgress((p) => ({ ...p, [id]: 0 }));
    announce('Import started.');
    return uc.importing.runImporter(id, (value) => {
      setProgress((p) => ({ ...p, [id]: value }));
      if (value >= 100) {
        setProgress((p) => { const { [id]: _done, ...rest } = p; return rest; });
        list.reload();
        announce('Import finished.');
      }
    });
  }

  const all = list.data ?? [];
  const importers = all.map((i) => (progress[i.id] !== undefined ? { ...i, state: 'running' as const } : i));
  const counts = statusCounts(importers);
  const originTotals = originCounts(importers);
  const shown = filterImporters(importers, { status, origin, query });
  const selected = shown.find((i) => i.id === importerId) ?? shown[0];
  const defaultEntry = selected ? defaultDiffEntry(selected.timeline) : undefined;
  const activeEntry = (selected?.timeline.find((e) => e.kind === 'run' && e.id === entryId && e.revision) ?? selected?.timeline.find((e) => e.id === defaultEntry)) as Extract<SyncEntry, { kind: 'run' }> | undefined;
  const revisions = activeEntry?.revision ? splitRevision(activeEntry.revision) : undefined;
  const diff = useQuery(
    () => (selected && revisions ? uc.importing.getImporterDiff(selected.id, revisions.from, revisions.to) : Promise.resolve(undefined)),
    [uc, selected?.id, revisions?.from, revisions?.to],
  );

  if (list.status === 'error' && !list.data) {
    return (<><PageHeader title="Sources" /><ErrorBlock error={list.error} what="The sources" onRetry={list.reload} /></>);
  }
  if (!list.data) return (<><PageHeader title="Sources" /><LoadingBlock label="the sources" /></>);

  const toggleActive = async (i: Importer, active: boolean) => {
    await uc.importing.setImporterActive(i.id, active);
    list.reload();
    announce(`${i.name} ${active ? 'will be scanned on schedule' : 'is paused'}.`);
  };
  const doDelete = async (gone: Importer) => {
    await uc.importing.deleteImporter(gone.id);
    setConfirm(undefined);
    setUndoing({ importer: gone, wasSelected: selected?.id === gone.id });
    // The card and its confirmation are gone: focus moves to Undo.
    focusLater(undoRef);
    list.reload();
    if (importerId === gone.id) navigate('/sources', { replace: true });
    announce(`${gone.name} deleted. Undo is available.`);
  };
  const undo = async () => {
    if (!undoing) return;
    const { importer: back, wasSelected } = undoing;
    await uc.importing.undoDeleteImporter(back.id);
    announce(`${back.name} restored.`);
    setUndoing(undefined);
    if (wasSelected) navigate(`/sources/${back.id}`, { replace: true });
    focusId.current = back.id;
    list.reload();
  };

  const stats = diff.data ? diffStats(diff.data.lines) : undefined;
  const failing = counts.failed;
  const selectedStatus = selected ? importerStatus(selected) : 'imported';
  /** Relative time for the last week, the day after that ("Jul 14"). */
  const when = (at: string) => (clock.now().getTime() - new Date(at).getTime() > 7 * 86_400_000 ? formatShortClock(at).split(' · ')[0] ?? '' : relative(at));

  return (
    <div className="sources-page">
      <div className="sources-head">
        <PageHeader
          title="Sources"
          description="Everything Microcks imports is a source: files you upload once and URLs or repositories it keeps in sync."
          descriptionTone="secondary"
          actions={<Button asChild variant="primary" icon="plus"><RouterLink to="/sources/new">Add source</RouterLink></Button>}
        />

        <div className="scan-strip" role="group" aria-label="Scan schedule">
          <span className="scan-strip-group">
            <Icon name="clock" size={15} />
            <span className="muted">Scan schedule</span>
            <span className="scan-strip-cron">{schedule.cron}</span>
            <span className="secondary">{schedule.description}</span>
            <span className="scan-strip-env">{schedule.envVar}</span>
          </span>
          <span className="scan-strip-sep" aria-hidden="true" />
          <span className="scan-strip-pair"><span className="muted">Last scan</span><span className="mono">{formatHourMinute(schedule.lastScanAt)}</span><span className="muted">{schedule.minutesSinceLast} min ago</span></span>
          <span className="scan-strip-pair"><span className="muted">Next scan</span><span className="mono">{formatHourMinute(schedule.nextScanAt)}</span><span className="muted">in {schedule.minutesUntilNext} min</span></span>
          <span className="scan-strip-counts">
            <ApiBadge label="sources" value={String(counts.all)} />
            {failing ? <ApiBadge label="failing" value={String(failing)} status="danger" /> : null}
          </span>
        </div>
      </div>

      <section aria-label="Filter sources">
        <FilterRow>
          <FilterSearch label="Filter sources by name, URL, secret or Service" placeholder="Filter by name, URL, secret, Service…" autoComplete="off" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Segmented
            label="Status"
            pressedFill="selected"
            iconSize={13}
            value={status}
            onChange={(id) => setStatus(id as SourceStatus | 'all')}
            options={[
              { id: 'all', label: 'All', count: counts.all },
              { id: 'imported', label: 'Imported', icon: 'check', iconTone: 'success', count: counts.imported },
              { id: 'warning', label: 'Warnings', icon: 'warning', iconTone: 'warning', count: counts.warning },
              { id: 'failed', label: 'Failing', icon: 'cross', iconTone: 'danger', count: counts.failed },
              { id: 'inactive', label: 'Inactive', icon: 'pause-narrow', iconTone: 'muted', count: counts.inactive },
            ]}
          />
          <Segmented
            label="Origin"
            pressedFill="selected"
            value={origin}
            onChange={(id) => setOrigin(id as SourceOrigin | 'all')}
            options={[{ id: 'all', label: 'All', count: originTotals.all }, ...SOURCE_ORIGINS.map((o) => ({ id: o.id, label: o.label, count: originTotals[o.id] }))]}
          />
          <span role="status" className="filter-bar-end sources-shown">{shown.length} of {counts.all} sources</span>
        </FilterRow>
      </section>

      <div className="sources-split">
        <section aria-label="Sources" className="sources-list">
          {undoing ? (
            <div role="status" className="undo-banner">
              <span className="undo-banner-text"><strong>{undoing.importer.name}</strong> deleted. Services already discovered remain but are no longer updated.</span>
              <button type="button" ref={undoRef} className="undo-banner-action" onClick={() => void undo()}>Undo</button>
            </div>
          ) : null}
          {shown.map((j) => {
            const st = importerStatus(j);
            const running = st === 'running';
            const upload = j.origin === 'upload';
            const isSel = selected?.id === j.id;
            const last = running ? 'started just now'
              : j.lastSyncAt ? `${upload ? 'uploaded' : 'last import'} ${st === 'inactive' ? formatShortClock(j.lastSyncAt).split(' · ')[0] : relative(j.lastSyncAt)}` : '';
            return (
              <article key={j.id} aria-label={j.name} className="source-card" data-selected={isSel ? '' : undefined}>
                <div className="source-card-head">
                  {upload ? (
                    <span className="source-card-upload" aria-hidden="true" title="Uploaded file, no schedule"><Icon name="upload" size={16} /></span>
                  ) : <Switch label={<span className="sr-only">{`Scan ${j.name} on schedule`}</span>} checked={j.active} onChange={(v) => void toggleActive(j, v)} />}
                  <button type="button" id={`source-name-${j.id}`} className="source-card-name" aria-pressed={isSel} onClick={() => navigate(`/sources/${j.id}`)}>{j.name}</button>
                  {running ? <LiveIndicator label="live · importing" variant="inline" /> : (
                    <span className="source-status" data-status={st}><Icon name={STATUS_ICON[st]} size={14} />{STATUS_WORD[st]}</span>
                  )}
                  <span className="source-card-last">{last}</span>
                </div>
                <div className="source-card-url">{j.url}</div>
                <div className="source-card-meta">
                  <span className="source-role" data-role={j.role}>{j.role.toUpperCase()}</span>
                  <span className="source-origin">{originLabel(j.origin)}</span>
                  <span className="mono source-kind">{j.artifactLabel}</span>
                  {j.secretName ? <span className="source-secret"><Icon name="lock" size={13} /><span className="sr-only">Secret </span><span className="mono">{j.secretName}</span></span> : null}
                  <span>{upload ? 'no schedule · one-off' : j.active ? `next scan ${formatHourMinute(schedule.nextScanAt)}` : 'scans paused'}</span>
                  <ServiceLinks importer={j} className="source-card-services" />
                </div>
                {j.error ? (
                  <div role="alert" className="source-notice" data-tone="danger">
                    <Icon name="cross" size={14} /><span className="mono source-notice-strong">{j.error.message}</span><span className="secondary">{j.error.since}</span>
                  </div>
                ) : null}
                {j.warning ? (
                  <div className="source-notice" data-tone="warning"><Icon name="warning" size={14} /><span>{j.warning}</span></div>
                ) : null}
                {confirm === j.id ? (
                  // Escape cancels, as in a dialog, and gives focus back to the card's Delete button.
                  // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
                  <div role="alertdialog" aria-label={`Confirm deletion of ${j.name}`} className="delete-confirm" onKeyDown={(e) => { if (e.key === 'Escape') { setConfirm(undefined); backToDelete(j.id); } }}>
                    <span className="delete-confirm-text">Delete this source? Services already discovered remain but will no longer be updated.</span>
                    <Button size="sm" variant="danger" confirm ref={focusOnOpen} onClick={() => void doDelete(j)}>Delete source</Button>
                    <Button size="sm" variant="secondary" className="delete-confirm-cancel" onClick={() => { setConfirm(undefined); backToDelete(j.id); }}>Cancel</Button>
                  </div>
                ) : null}
                <div className="source-card-actions">
                  {upload ? (
                    <Button asChild size="sm" variant="secondary" icon="upload"><RouterLink to="/sources/new" aria-label={`Re-upload ${j.name}`}>Re-upload</RouterLink></Button>
                  ) : (
                    <>
                      <Button size="sm" variant="secondary" icon="refresh" className="source-import" disabled={running || !j.active} title={!j.active ? 'Activate the source to import it' : undefined} onClick={() => run(j.id)}>{running ? 'Importing…' : 'Import now'}</Button>
                      <Button asChild size="sm" variant="ghost" icon="edit" className="source-edit"><RouterLink to="/sources/new" aria-label={`Edit ${j.name}`}>Edit</RouterLink></Button>
                    </>
                  )}
                  <Button size="sm" variant="ghost" icon="trash-plain" id={`source-delete-${j.id}`} className="source-delete" aria-label={`Delete ${j.name}`} onClick={() => setConfirm(j.id)}>Delete</Button>
                </div>
              </article>
            );
          })}
          {shown.length === 0 ? (
            <div className="sources-empty">
              No source matches these filters.
              <button type="button" className="sources-empty-action" onClick={() => { setStatus('all'); setOrigin('all'); setQuery(''); }}>Clear filters</button>
            </div>
          ) : null}
        </section>

        {selected ? (
          <section aria-label="Source detail" className="sources-detail source-detail">
            <div className="source-detail-head">
              <div className="source-detail-title">
                <h2>{selected.name}</h2>
                {selectedStatus === 'running' ? <LiveIndicator label="live · importing" /> : (
                  <ApiBadge label="last import" value={SHIELD[selectedStatus].word} status={SHIELD[selectedStatus].status} />
                )}
              </div>
              <div className="source-detail-url">
                <span className="source-detail-url-text">{selected.url}</span>
                <CopyButton value={selected.url} label="Copy URL" size="sm" />
              </div>
            </div>

            {selected.error ? (
              <div role="note" className="source-failure">
                <span className="source-failure-title"><Icon name="cross" size={14} />{selected.error.message.replace(' — ', ', ')}</span>
                <span>{monoTokens(selected.error.detail, [selected.secretName, selected.secretType?.split(' ').pop()])} Mocks keep serving the version imported <span className="mono">{selected.error.servedSince}</span>.</span>
                <span className="source-failure-actions">
                  <Button asChild size="sm" icon="lock" className="source-failure-link"><RouterLink to="/admin/secrets">Update secret in Administration</RouterLink></Button>
                  <span className="source-failure-help">Secrets are managed by admins; this source only references the name.</span>
                </span>
              </div>
            ) : null}

            <dl className="facts">
              {facts(selected, schedule.nextScanAt).map((f) => (
                <div key={f.term} className="facts-row">
                  <dt className="facts-term">{f.term}</dt>
                  <dd className="facts-value">
                    <span className={f.mono ? 'mono' : undefined}>{f.value}</span>
                    {f.sub ? <span className="facts-sub">{f.sub}</span> : null}
                  </dd>
                </div>
              ))}
              <div className="facts-row">
                <dt className="facts-term">{selected.producedLabel ?? (selected.workflows ? 'Workflows produced' : 'Services produced')}</dt>
                <dd className="facts-value"><ServiceLinks importer={selected} className="source-detail-services" /></dd>
              </div>
            </dl>

            <div className="source-detail-block">
              <div className="source-detail-block-head">
                <h3>Sync timeline</h3>
                <span className="muted source-detail-help">Each import, newest first. Pick a change to diff it.</span>
              </div>
              <ol className="sync-timeline" aria-label={`Imports of ${selected.name}`}>
                {selectedStatus === 'running' ? (
                  <li data-result="live" data-filled="">
                    <div className="sync-timeline-running">
                      <span className="mono sync-live">now</span>
                      <span className="secondary">Forced by MA</span>
                      <LiveIndicator label="live · fetching and parsing" variant="inline" />
                    </div>
                  </li>
                ) : null}
                {selected.timeline.map((e) =>
                  e.kind === 'group' ? (
                    <li key={e.id} data-result="group"><div className="sync-timeline-group">··· {e.text}</div></li>
                  ) : (
                    <li key={e.id} data-result={e.result} data-filled={e.revision ? '' : undefined}>
                      {e.revision ? (
                        <button type="button" className="sync-entry" aria-pressed={activeEntry?.id === e.id} onClick={() => setEntryId(e.id)}>
                          <TimelineLine entry={e} when={when(e.at)} />
                        </button>
                      ) : <div className="sync-entry"><TimelineLine entry={e} when={when(e.at)} /></div>}
                    </li>
                  ),
                )}
              </ol>
            </div>

            <div className="source-detail-block">
              <div className="source-detail-block-head">
                <h3>Contract diff</h3>
                {stats && diff.data ? (
                  <span className="diff-stats"><span data-kind="added">+{stats.adds}</span><span data-kind="removed">−{stats.dels}</span><span className="muted">lines</span></span>
                ) : null}
              </div>
              {diff.data ? (
                <div className="diff-view">
                  <div className="diff-view-head"><span className="diff-view-file">{diff.data.file ?? 'contract'}</span><span className="muted diff-view-rev">{diff.data.from} → {diff.data.to}</span></div>
                  {/* Scrolls horizontally: focusable so keyboard users can scroll it (RGAA 7.3). */}
                  {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
                  <div role="region" aria-label="Unified diff" className="diff-view-body" tabIndex={0}>
                    {diff.data.lines.map((l, i) => (
                      <div key={i} className="diff-line" data-kind={l.kind}>
                        <span className="diff-line-sign" aria-hidden="true">{DIFF_SIGN[l.kind]}</span>
                        <span className="diff-line-text">{l.kind === 'added' || l.kind === 'removed' || l.kind === 'skipped' ? <span className="sr-only">{DIFF_WORD[l.kind]} </span> : null}{l.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : activeEntry ? <p className="muted" style={{ margin: 0 }}>Loading the diff…</p> : (
                <div className="diff-empty">
                  {selected.origin === 'upload'
                    ? `Uploaded once on ${formatDay(selected.createdAt)}. Re-upload a new version of the file and the change will appear here as a diff.`
                    : `The contract has not changed since its initial import (${formatDay(selected.createdAt)}). Nothing to compare yet: the next change will appear here as a diff.`}
                </div>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function originLabel(origin: SourceOrigin): string {
  return SOURCE_ORIGINS.find((o) => o.id === origin)?.label ?? origin;
}

/** Wraps each token (secret name, header) of a sentence in a mono span. */
function monoTokens(text: string, tokens: readonly (string | undefined)[]): ReactNode {
  const list = tokens.filter((t): t is string => Boolean(t));
  if (!list.length) return text;
  const re = new RegExp(`(${list.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`);
  return text.split(re).map((part, i) => (list.includes(part) ? <span key={i} className={i === 1 ? 'mono source-failure-secret' : 'mono'}>{part}</span> : part));
}

interface Fact { term: string; value: string; sub?: string | undefined; mono?: boolean }

function facts(s: Importer, nextScanAt: Date | string): Fact[] {
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

const RESULT_ICON = { imported: 'check', warning: 'warning', failed: 'cross', paused: 'pause-narrow' } as const;

function TimelineLine({ entry, when }: { entry: Extract<SyncEntry, { kind: 'run' }>; when: string }) {
  return (
    <>
      <span className="sync-entry-line">
        <span className="mono sync-entry-clock">{formatShortClock(entry.at)}</span>
        <span className="muted sync-entry-when">{when}</span>
        <span className="secondary">{entry.trigger}</span>
        <span className="sync-entry-result" data-result={entry.result}><Icon name={RESULT_ICON[entry.result]} size={12} />{RESULT_WORD[entry.result]}</span>
      </span>
      <span className="sync-entry-change">
        {entry.changes.length ? (
          <>
            <span className="muted">contract changed:</span>
            {entry.changes.map((c) => <span key={c.sign + c.text} className="sync-part" data-sign={c.sign}>{c.sign === '!' ? '' : c.sign === '-' ? '−' : c.sign}{c.text}</span>)}
          </>
        ) : <span className="sync-entry-plain" data-result={entry.result}>{entry.note ?? 'no contract change'}</span>}
        {entry.revision ? <span className="muted sync-entry-rev">{entry.revision}</span> : null}
      </span>
    </>
  );
}
