import '../explore-kit/explore.css';
import './sources.css';
import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router';
import {
  defaultDiffEntry, diffStats, filterImporters, formatHourMinute, formatShortClock, importerStatus, originCounts, splitRevision, statusCounts, SOURCE_ORIGINS,
  type Importer, type SourceOrigin, type SourceStatus, type SyncEntry,
} from '@/domain/importing';
import { PageHeader, useAnnounce, useQuery, useRelativeTime, useUseCases, usePageTitle } from '@/ui/app';
import { ApiBadge } from '@/ui/components/ui/api-badge';
import { Button } from '@/ui/components/ui/button';
import { Callout } from '@/ui/components/ui/callout';
import { Chip } from '@/ui/components/ui/chip';
import { CodeBlock, type CodeLine } from '@/ui/components/ui/code-block';
import { CopyButton } from '@/ui/components/ui/copy-button';
import { Icon } from '@/ui/components/ui/icon';
import { Input } from '@/ui/components/ui/input';
import { LiveIndicator } from '@/ui/components/ui/live-indicator';
import { Panel } from '@/ui/components/ui/panel';
import { Segmented } from '@/ui/components/ui/segmented';
import { Switch } from '@/ui/components/ui/switch';
import { ErrorBlock, LoadingBlock } from '../explore-kit/states';

const STATUS_WORD: Record<SourceStatus, string> = { imported: 'Imported', warning: 'Imported · 1 warning', failed: 'Failed', inactive: 'Inactive', running: 'Importing' };
const STATUS_ICON: Record<SourceStatus, 'check' | 'warning' | 'cross' | 'pause' | 'running'> = { imported: 'check', warning: 'warning', failed: 'cross', inactive: 'pause', running: 'running' };
const RESULT_WORD = { imported: 'Imported', warning: 'Warning', failed: 'Failed', paused: 'Paused' } as const;

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
  const list = useQuery(() => uc.importing.listImporters(), [uc]);
  const schedule = uc.importing.getScanSchedule();
  const [status, setStatus] = useState<SourceStatus | 'all'>('all');
  const [origin, setOrigin] = useState<SourceOrigin | 'all'>('all');
  const [query, setQuery] = useState('');
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [confirm, setConfirm] = useState<string | undefined>();
  const [undoing, setUndoing] = useState<Importer | undefined>();
  const [entryId, setEntryId] = useState<string | undefined>();
  // The inline confirmation takes focus once, when it opens.
  const focusOnOpen = useCallback((el: HTMLButtonElement | null) => el?.focus(), []);

  // Importers that are mid-import when the page opens finish on their own.
  useEffect(() => {
    if (!list.data) return;
    const unsubs = list.data.filter((i) => i.state === 'running').map((i) => run(i.id));
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setUndoing(gone);
    list.reload();
    if (importerId === gone.id) navigate('/sources', { replace: true });
    announce(`${gone.name} deleted. Undo is available.`);
  };
  const undo = async () => {
    if (!undoing) return;
    await uc.importing.undoDeleteImporter(undoing.id);
    announce(`${undoing.name} restored.`);
    setUndoing(undefined);
    list.reload();
  };

  const diffLines: CodeLine[] = (diff.data?.lines ?? []).map((l) =>
    l.kind === 'added' ? { text: `+ ${l.text}` }
    : l.kind === 'removed' ? { text: `− ${l.text}`, bad: true, note: 'removed' }
    : l.kind === 'skipped' ? { text: `! ${l.text}`, bad: true, note: 'skipped' }
    : l.kind === 'hunk' ? { text: l.text }
    : { text: `  ${l.text}` },
  );
  const stats = diff.data ? diffStats(diff.data.lines) : undefined;
  const failing = counts.failed;

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

      <section aria-label="Filter sources" className="ex-row">
        <Input type="search" aria-label="Filter sources by name, URL, secret or Service" autoComplete="off" placeholder="Filter by name, URL, secret, Service…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Segmented
          label="Status"
          value={status}
          onChange={(id) => setStatus(id as SourceStatus | 'all')}
          options={[
            { id: 'all', label: 'All', count: counts.all },
            { id: 'imported', label: 'Imported', count: counts.imported },
            { id: 'warning', label: 'Warning', count: counts.warning },
            { id: 'failed', label: 'Failed', count: counts.failed },
            { id: 'inactive', label: 'Inactive', count: counts.inactive },
          ]}
        />
        <Segmented
          label="Origin"
          value={origin}
          onChange={(id) => setOrigin(id as SourceOrigin | 'all')}
          options={[{ id: 'all', label: 'All', count: originTotals.all }, ...SOURCE_ORIGINS.map((o) => ({ id: o.id, label: o.label, count: originTotals[o.id] }))]}
        />
        <span role="status" className="ex-small ex-secondary">{shown.length} of {counts.all} sources</span>
      </section>

      <div className="sources-split">
        <section aria-label="Sources" className="sources-list">
          {undoing ? (
            <div role="status" className="undo-banner">
              <span className="undo-banner-text"><strong>{undoing.name}</strong> deleted. Services already discovered remain but are no longer updated.</span>
              <button type="button" className="undo-banner-action" onClick={() => void undo()}>Undo</button>
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
                  <button type="button" className="source-card-name" aria-pressed={isSel} onClick={() => navigate(`/sources/${j.id}`)}>{j.name}</button>
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
                  <div role="alertdialog" aria-label={`Confirm deletion of ${j.name}`} className="delete-confirm">
                    <span className="delete-confirm-text">Delete this source? Services already discovered remain but will no longer be updated.</span>
                    <Button size="sm" variant="danger" confirm ref={focusOnOpen} onClick={() => void doDelete(j)}>Delete source</Button>
                    <Button size="sm" variant="secondary" className="delete-confirm-cancel" onClick={() => setConfirm(undefined)}>Cancel</Button>
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
                  <Button size="sm" variant="ghost" icon="trash" className="source-delete" aria-label={`Delete ${j.name}`} onClick={() => setConfirm(j.id)}>Delete</Button>
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
          <section aria-label="Source detail" className="sources-detail ex-stack">
            <Panel
              title={selected.name}
              actions={importerStatus(selected) === 'running' ? <LiveIndicator label="live · importing" /> : <span className="ex-row"><span className="ex-small ex-secondary">last import</span><Chip tone={selected.health === 'failed' ? 'danger' : selected.health === 'warning' ? 'warning' : 'success'}>{STATUS_WORD[importerStatus(selected)]}</Chip></span>}
            >
              <p className="ex-row"><code className="ex-url-line">{selected.url}</code><CopyButton value={selected.url} label="Copy URL" /></p>
              {selected.error ? (
                <Callout tone="danger" title={selected.error.message}>
                  <p style={{ margin: 0 }}>{selected.error.detail} Mocks keep serving the version imported {selected.error.servedSince}.</p>
                  <p style={{ marginBottom: 0 }}><RouterLink to="/admin/secrets">Update secret in Administration</RouterLink> <span className="ex-small ex-secondary">Secrets are managed by admins; this source only references the name.</span></p>
                </Callout>
              ) : null}
              <dl className="ex-stack" style={{ margin: 0 }}>
                {[
                  ['Origin', SOURCE_ORIGINS.find((o) => o.id === selected.origin)?.fact ?? selected.origin, undefined],
                  ['Role', selected.role === 'primary' ? 'Primary artifact' : 'Secondary artifact', selected.artifactNote],
                  ['Artifact type', selected.artifactLabel, undefined],
                  ['Secret', selected.secretName ? selected.secretName : 'None', selected.secretType],
                  ['SSL validation', selected.sslValidation ? 'On' : 'Off', undefined],
                  ['Labels', selected.labels.map((l) => `${l.key}=${l.value}`).join(' · ') || 'None', undefined],
                  ['Created', `${formatShortClock(selected.createdAt)} by ${selected.createdBy}`, undefined],
                ].map(([k, v, sub]) => (
                  <div key={k as string}><dt className="ex-small ex-secondary">{k}</dt><dd style={{ margin: 0 }}>{v}{sub ? <><br /><span className="ex-small ex-secondary">{sub}</span></> : null}</dd></div>
                ))}
                <div><dt className="ex-small ex-secondary">{selected.producedLabel ?? 'Services produced'}</dt><dd style={{ margin: 0 }}><ServiceLinks importer={selected} /></dd></div>
              </dl>
            </Panel>

            <Panel title="Sync timeline" headingLevel={3}>
              <p className="ex-small ex-secondary" style={{ marginTop: 0 }}>Each import, newest first. Pick a change to diff it.</p>
              <ol className="ex-timeline" aria-label={`Imports of ${selected.name}`}>
                {importerStatus(selected) === 'running' ? <li><span className="ex-row"><strong>now</strong> Forced by MA <LiveIndicator label="live · fetching and parsing" /></span></li> : null}
                {selected.timeline.map((e) =>
                  e.kind === 'group' ? (
                    <li key={e.id} className="ex-small ex-muted">{e.text}</li>
                  ) : (
                    <li key={e.id}>
                      {e.revision ? (
                        <Button variant={activeEntry?.id === e.id ? 'secondary' : 'ghost'} aria-pressed={activeEntry?.id === e.id} onClick={() => setEntryId(e.id)} style={{ height: 'auto', justifyContent: 'flex-start', textAlign: 'start' }}>
                          <TimelineLine entry={e} />
                        </Button>
                      ) : <TimelineLine entry={e} />}
                    </li>
                  ),
                )}
              </ol>
            </Panel>

            <Panel title="Contract diff" headingLevel={3} actions={stats ? <span className="ex-small"><span>+{stats.adds}</span> <span>−{stats.dels}</span> lines</span> : undefined}>
              {diff.data ? (
                <div role="region" aria-label="Unified diff">
                  <CodeBlock lines={diffLines} caption={`${diff.data.file ?? 'contract'} · ${diff.data.from} → ${diff.data.to}`} maxHeight={320} />
                </div>
              ) : <p className="ex-muted" style={{ margin: 0 }}>{activeEntry ? 'Loading the diff…' : 'No contract change to diff: every scan found the same revision.'}</p>}
            </Panel>
          </section>
        ) : null}
      </div>

    </div>
  );
}

function originLabel(origin: SourceOrigin): string {
  return SOURCE_ORIGINS.find((o) => o.id === origin)?.label ?? origin;
}

function TimelineLine({ entry }: { entry: Extract<SyncEntry, { kind: 'run' }> }) {
  return (
    <span className="ex-stack" style={{ gap: 2 }}>
      <span className="ex-row ex-small">
        <strong>{formatShortClock(entry.at)}</strong> <span className="ex-secondary">{entry.trigger}</span>
        <Chip tone={entry.result === 'failed' ? 'danger' : entry.result === 'warning' ? 'warning' : entry.result === 'paused' ? 'neutral' : 'success'}>
          <Icon name={entry.result === 'failed' ? 'cross' : entry.result === 'warning' ? 'warning' : entry.result === 'paused' ? 'dash' : 'check'} size={12} /> {RESULT_WORD[entry.result]}
        </Chip>
      </span>
      <span className="ex-small ex-secondary">
        {entry.changes.length ? entry.changes.map((c) => `${c.sign} ${c.text}`).join(' · ') : entry.note ?? 'no contract change'}
        {entry.revision ? <> · <code>{entry.revision}</code></> : null}
      </span>
    </span>
  );
}
