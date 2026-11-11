<script lang="ts">
  import '@microcks/demo-styles/pages/explore-kit/explore.css';
  import '@microcks/demo-styles/pages/sources/sources.css';
  import { untrack } from 'svelte';
  import {
    defaultDiffEntry, diffStats, filterImporters, formatHourMinute, formatShortClock, importerStatus, originCounts, splitRevision, statusCounts,
    type Importer, type SourceOrigin, type SourceStatus, type SyncEntry,
  } from '@microcks/demo-core/domain/importing';
  import { ApiBadge, Button, CopyButton, Icon, FilterRow, FilterSearch, LiveIndicator, ResultBox, FactRow, Facts, Segmented, SummaryStrip, SummaryStripSep, Switch } from '@microcks/deep-ink';
  import {
    ButtonRouterLink, PageHeader, RouterLink, useAnnounce, useClock, useNavigate, useParams, usePageTitle, useQuery, useRelativeTime, useReturnFocus, useUseCases,
  } from '@/ui/app';
  import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
  import {
    DIFF_SIGN, DIFF_WORD, RESULT_ICON, RESULT_WORD, SHIELD, STATUS_ICON, STATUS_WORD,
    changeSign, emptyDiffText, facts, lastImportText, monoParts, originLabel, originOptions, scheduleText, statusOptions,
  } from './listing';

  type RunEntry = Extract<SyncEntry, { kind: 'run' }>;

  /** `/sources/:importerId?`: every source Microcks imports, filtered by status, origin and text, and the selected one in detail. */
  usePageTitle('Sources · Microcks');
  const params = useParams();
  const importerId = $derived(params.importerId);
  const navigate = useNavigate();
  const uc = useUseCases();
  const announce = useAnnounce();
  const relative = useRelativeTime();
  const clock = useClock();
  const list = useQuery(() => uc.importing.listImporters(), () => [uc]);
  const schedule = uc.importing.getScanSchedule();
  let status = $state<SourceStatus | 'all'>('all');
  let origin = $state<SourceOrigin | 'all'>('all');
  let query = $state('');
  let progress = $state.raw<Record<string, number>>({});
  let confirm = $state<string | undefined>();
  let undoing = $state.raw<{ importer: Importer; wasSelected: boolean } | undefined>();
  /** Card whose name takes focus once the list has reloaded (after an undo). */
  let focusId: string | undefined;
  let undoButton = $state<HTMLButtonElement | undefined>();
  let confirmButton = $state<HTMLButtonElement | undefined>();
  const { focusLater } = useReturnFocus();
  /** Closing the inline confirmation gives focus back to the card's Delete button. */
  const backToDelete = (id: string) => focusLater(() => document.getElementById(`source-delete-${id}`));
  const autoRuns = new Map<string, () => void>();
  let entryId = $state<string | undefined>();
  // The inline confirmation takes focus once, when it opens.
  $effect(() => {
    confirmButton?.focus();
  });

  // Importers that are mid-import when the page opens finish on their own, once: a later reload
  // (after a delete or an undo) must not restart them nor announce "Import started." again.
  $effect(() => {
    const data = list.data;
    if (!data) return;
    untrack(() => {
      for (const i of data) {
        if (i.state === 'running' && !autoRuns.has(i.id)) autoRuns.set(i.id, run(i.id));
      }
    });
  });
  $effect(() => () => autoRuns.forEach((u) => u()));

  // After an undo, focus moves to the restored card's name once the list has reloaded.
  $effect(() => {
    const data = list.data;
    const id = focusId;
    if (!id || !data?.some((i) => i.id === id)) return;
    document.getElementById(`source-name-${id}`)?.focus();
    focusId = undefined;
  });

  function run(id: string) {
    progress = { ...progress, [id]: 0 };
    announce('Import started.');
    return uc.importing.runImporter(id, (value) => {
      progress = { ...progress, [id]: value };
      if (value >= 100) {
        const { [id]: _done, ...rest } = progress;
        progress = rest;
        list.reload();
        announce('Import finished.');
      }
    });
  }

  const all = $derived(list.data ?? []);
  const importers = $derived(all.map((i) => (progress[i.id] !== undefined ? { ...i, state: 'running' as const } : i)));
  const counts = $derived(statusCounts(importers));
  const originTotals = $derived(originCounts(importers));
  const shown = $derived(filterImporters(importers, { status, origin, query }));
  const selected = $derived(shown.find((i) => i.id === importerId) ?? shown[0]);
  const defaultEntry = $derived(selected ? defaultDiffEntry(selected.timeline) : undefined);
  const activeEntry = $derived(
    (selected?.timeline.find((e) => e.kind === 'run' && e.id === entryId && e.revision) ?? selected?.timeline.find((e) => e.id === defaultEntry)) as RunEntry | undefined,
  );
  const revisions = $derived(activeEntry?.revision ? splitRevision(activeEntry.revision) : undefined);
  const diff = useQuery(
    () => (selected && revisions ? uc.importing.getImporterDiff(selected.id, revisions.from, revisions.to) : Promise.resolve(undefined)),
    () => [uc, selected?.id, revisions?.from, revisions?.to],
  );

  const toggleActive = async (i: Importer, active: boolean) => {
    await uc.importing.setImporterActive(i.id, active);
    list.reload();
    announce(`${i.name} ${active ? 'will be scanned on schedule' : 'is paused'}.`);
  };
  const doDelete = async (gone: Importer) => {
    const wasSelected = selected?.id === gone.id;
    const routeId = importerId;
    await uc.importing.deleteImporter(gone.id);
    confirm = undefined;
    undoing = { importer: gone, wasSelected };
    // The card and its confirmation are gone: focus moves to Undo.
    focusLater(() => undoButton);
    list.reload();
    if (routeId === gone.id) navigate('/sources', { replace: true });
    announce(`${gone.name} deleted. Undo is available.`);
  };
  const undo = async () => {
    if (!undoing) return;
    const { importer: back, wasSelected } = undoing;
    await uc.importing.undoDeleteImporter(back.id);
    announce(`${back.name} restored.`);
    undoing = undefined;
    if (wasSelected) navigate(`/sources/${back.id}`, { replace: true });
    focusId = back.id;
    list.reload();
  };
  const cancelDelete = (id: string) => {
    confirm = undefined;
    backToDelete(id);
  };
  const clearFilters = () => {
    status = 'all';
    origin = 'all';
    query = '';
  };

  const stats = $derived(diff.data ? diffStats(diff.data.lines) : undefined);
  const failing = $derived(counts.failed);
  const selectedStatus = $derived(selected ? importerStatus(selected) : 'imported');
  /** Relative time for the last week, the day after that ("Jul 14"). */
  const when = (at: string) => (clock.now().getTime() - new Date(at).getTime() > 7 * 86_400_000 ? formatShortClock(at).split(' · ')[0] ?? '' : relative(at));
</script>

{#snippet actions()}<ButtonRouterLink variant="primary" icon="plus" to="/sources/new">Add source</ButtonRouterLink>{/snippet}

{#snippet undoAction()}<Button bind:element={undoButton} variant="outline" size="xs" tone="link" onclick={() => void undo()}>Undo</Button>{/snippet}

{#snippet serviceLinks(importer: Importer, cssClass: string)}<span class={cssClass}
    >{#each importer.produces as p}{#if p.id}<RouterLink to={`/services/${p.id}`}
          ><ApiBadge protocol={p.protocol} name={p.name} version={p.version} size="sm" /></RouterLink
        >{:else}<ApiBadge protocol={p.protocol} name={p.name} version={p.version} size="sm" />{/if}{/each}{#if importer.workflows}<RouterLink to="/workflows"
        ><ApiBadge arazzo name={importer.workflows} size="sm" /></RouterLink
      >{/if}</span
  >{/snippet}

{#snippet timelineLine(entry: RunEntry, at: string)}<span class="sync-entry-line"
    ><span class="demo-mono sync-entry-clock">{formatShortClock(entry.at)}</span><span class="muted sync-entry-when">{at}</span><span class="secondary"
      >{entry.trigger}</span
    ><span class="sync-entry-result" data-result={entry.result}
      ><Icon name={RESULT_ICON[entry.result]} size={12} stroke-width={2.6} />{RESULT_WORD[entry.result]}</span
    ></span
  ><span class="sync-entry-change"
    >{#if entry.changes.length}<span class="muted">contract changed:</span>{#each entry.changes as c}<span class="sync-part" data-sign={c.sign}
          >{changeSign(c.sign)}<!---->{c.text}</span
        >{/each}{:else}<span class="sync-entry-plain" data-result={entry.result}>{entry.note ?? 'no contract change'}</span>{/if}{#if entry.revision}<span
        class="muted sync-entry-rev">{entry.revision}</span
      >{/if}</span
  >{/snippet}

{#if list.status === 'error' && !list.data}<PageHeader title="Sources" /><ErrorBlock
    error={list.error}
    what="The sources"
    onretry={list.reload}
  />{:else if !list.data}<PageHeader title="Sources" /><LoadingBlock label="the sources" />{:else}
  <div class="sources-page"
    ><div class="sources-head"
      ><PageHeader
        title="Sources"
        description="Everything Microcks imports is a source: files you upload once and URLs or repositories it keeps in sync."
        descriptionTone="secondary"
        descriptionWidth={760}
        {actions}
      /><SummaryStrip variant="canvas" class="scan-strip" role="group" aria-label="Scan schedule"
        ><span class="scan-strip-group"
          ><Icon name="clock" size={15} class="scan-strip-icon" /><span class="muted">Scan schedule</span><span class="scan-strip-cron">{schedule.cron}</span><span
            class="secondary">{schedule.description}</span
          ><span class="scan-strip-env">{schedule.envVar}</span></span
        ><SummaryStripSep /><span class="scan-strip-pair"
          ><span class="muted">Last scan</span><span class="demo-mono">{formatHourMinute(schedule.lastScanAt)}</span><span class="muted"
            >{schedule.minutesSinceLast}<!----> min ago</span
          ></span
        ><span class="scan-strip-pair"
          ><span class="muted">Next scan</span><span class="demo-mono">{formatHourMinute(schedule.nextScanAt)}</span><span class="muted"
            >in <!---->{schedule.minutesUntilNext}<!----> min</span
          ></span
        ><span class="scan-strip-counts"
          ><ApiBadge label="sources" value={String(counts.all)} />{#if failing}<ApiBadge label="failing" value={String(failing)} status="danger" />{/if}</span
        ></SummaryStrip
      ></div
    ><section aria-label="Filter sources"
      ><FilterRow
        ><FilterSearch
          label="Filter sources by name, URL, secret or Service"
          placeholder="Filter by name, URL, secret, Service…"
          autocomplete="off"
          value={query}
          oninput={(e) => (query = e.currentTarget.value)}
        /><Segmented
          label="Status"
          pressedFill="selected"
          iconSize={13}
          value={status}
          onchange={(id) => (status = id as SourceStatus | 'all')}
          options={statusOptions(counts)}
        /><Segmented
          label="Origin"
          pressedFill="selected"
          value={origin}
          onchange={(id) => (origin = id as SourceOrigin | 'all')}
          options={originOptions(originTotals)}
        /><span role="status" class="filter-bar-end sources-shown">{shown.length}<!----> of <!---->{counts.all}<!----> sources</span></FilterRow
      ></section
    ><div class="sources-split"
      ><section aria-label="Sources" class="sources-list"
        >{#if undoing}<ResultBox tone="info" density="compact" action={undoAction}
            ><strong>{undoing.importer.name}</strong> deleted. Services already discovered remain but are no longer updated.</ResultBox
          >{/if}{#each shown as j (j.id)}{@const st = importerStatus(j)}{@const running = st === 'running'}{@const upload = j.origin === 'upload'}{@const isSel =
            selected?.id === j.id}{@const last = lastImportText(j, st, relative)}{#snippet switchLabel()}<span class="sr-only">{`Scan ${j.name} on schedule`}</span
            >{/snippet}<article aria-label={j.name} class="source-card" data-selected={isSel ? '' : undefined}
            ><div class="source-card-head"
              >{#if upload}<span class="source-card-upload" aria-hidden="true" title="Uploaded file, no schedule"><Icon name="upload" size={16} /></span
                >{:else}<Switch label={switchLabel} checked={j.active} oncheckedchange={(v) => void toggleActive(j, v)} />{/if}<button
                type="button"
                id={`source-name-${j.id}`}
                class="source-card-name"
                aria-pressed={isSel}
                onclick={() => navigate(`/sources/${j.id}`)}>{j.name}</button
              >{#if running}<LiveIndicator label="live · importing" variant="inline" />{:else}<span class="source-status" data-status={st}
                  ><Icon name={STATUS_ICON[st]} size={14} stroke-width={2.4} />{STATUS_WORD[st]}</span
                >{/if}<span class="source-card-last">{last}</span></div
            ><div class="source-card-url">{j.url}</div
            ><div class="source-card-meta"
              ><span class="source-role" data-role={j.role}>{j.role.toUpperCase()}</span><span class="source-origin">{originLabel(j.origin)}</span><span
                class="demo-mono source-kind">{j.artifactLabel}</span
              >{#if j.secretName}<span class="source-secret"
                  ><Icon name="lock" size={13} /><span class="sr-only">Secret{' '}</span><span class="demo-mono">{j.secretName}</span></span
                >{/if}<span>{scheduleText(j, schedule.nextScanAt)}</span>{@render serviceLinks(j, 'source-card-services')}</div
            >{#if j.error}<div role="alert" class="source-notice" data-tone="danger"
                ><Icon name="cross" size={14} /><span class="demo-mono source-notice-strong">{j.error.message}</span><span class="secondary"
                  >{j.error.since}</span
                ></div
              >{/if}{#if j.warning}<div class="source-notice" data-tone="warning"><Icon name="warning" size={14} /><span>{j.warning}</span></div
              >{/if}{#if confirm === j.id}<!-- Escape cancels, as in a dialog, and gives focus back to the card's Delete button. --><!-- svelte-ignore a11y_interactive_supports_focus --><div
                role="alertdialog"
                aria-label={`Confirm deletion of ${j.name}`}
                class="delete-confirm"
                onkeydown={(e) => {
                  if (e.key === 'Escape') cancelDelete(j.id);
                }}
                ><span class="delete-confirm-text">Delete this source? Services already discovered remain but will no longer be updated.</span><Button
                  size="sm"
                  variant="danger"
                  confirm
                  bind:element={confirmButton}
                  onclick={() => void doDelete(j)}>Delete source</Button
                ><Button size="sm" variant="secondary" class="delete-confirm-cancel" onclick={() => cancelDelete(j.id)}>Cancel</Button></div
              >{/if}<div class="source-card-actions"
              >{#if upload}<ButtonRouterLink size="sm" variant="secondary" icon="upload" to="/sources/new" aria-label={`Re-upload ${j.name}`}
                  >Re-upload</ButtonRouterLink
                >{:else}<Button
                  size="sm"
                  variant="secondary"
                  icon="refresh"
                  class="source-import"
                  disabled={running || !j.active}
                  title={!j.active ? 'Activate the source to import it' : undefined}
                  onclick={() => run(j.id)}>{running ? 'Importing…' : 'Import now'}</Button
                ><ButtonRouterLink size="sm" variant="ghost" icon="edit" class="source-edit" to="/sources/new" aria-label={`Edit ${j.name}`}
                  >Edit</ButtonRouterLink
                >{/if}<Button
                size="sm"
                variant="ghost"
                icon="trash-plain"
                id={`source-delete-${j.id}`}
                class="source-delete"
                aria-label={`Delete ${j.name}`}
                onclick={() => (confirm = j.id)}>Delete</Button
              ></div
            ></article
          >{/each}{#if shown.length === 0}<div class="sources-empty"
            >No source matches these filters.<button type="button" class="sources-empty-action" onclick={clearFilters}>Clear filters</button></div
          >{/if}</section
      >{#if selected}<section aria-label="Source detail" class="sources-detail source-detail"
          ><div class="source-detail-head"
            ><div class="source-detail-title"
              ><h2>{selected.name}</h2>{#if selectedStatus === 'running'}<LiveIndicator label="live · importing" />{:else}<ApiBadge
                  label="last import"
                  value={SHIELD[selectedStatus].word}
                  status={SHIELD[selectedStatus].status}
                />{/if}</div
            ><div class="source-detail-url"
              ><span class="source-detail-url-text">{selected.url}</span><CopyButton value={selected.url} label="Copy URL" size="sm" /></div
            ></div
          >{#if selected.error}<div role="note" class="source-failure"
              ><span class="source-failure-title"><Icon name="cross" size={14} />{selected.error.message.replace(' — ', ', ')}</span><span
                >{#each monoParts(selected.error.detail, [selected.secretName, selected.secretType?.split(' ').pop()]) as part}{#if part.className}<span
                      class={part.className}>{part.text}</span
                    >{:else}{part.text}{/if}{/each} Mocks keep serving the version imported <span class="demo-mono">{selected.error.servedSince}</span>.</span
              ><span class="source-failure-actions"
                ><ButtonRouterLink size="sm" icon="lock" class="source-failure-link" to="/admin/secrets">Update secret in Administration</ButtonRouterLink
                ><span class="source-failure-help">Secrets are managed by admins; this source only references the name.</span></span
              ></div
            >{/if}<Facts class="source-facts" items={facts(selected, schedule.nextScanAt)}
            ><FactRow term={selected.producedLabel ?? (selected.workflows ? 'Workflows produced' : 'Services produced')}
              >{@render serviceLinks(selected, 'source-detail-services')}</FactRow
            ></Facts
          ><div class="source-detail-block"
            ><div class="source-detail-block-head"
              ><h3>Sync timeline</h3><span class="muted source-detail-help">Each import, newest first. Pick a change to diff it.</span></div
            ><ol class="sync-timeline" aria-label={`Imports of ${selected.name}`}
              >{#if selectedStatus === 'running'}<li data-result="live" data-filled=""
                  ><div class="sync-timeline-running"
                    ><span class="demo-mono sync-live">now</span><span class="secondary">Forced by MA</span><LiveIndicator
                      label="live · fetching and parsing"
                      variant="inline"
                    /></div
                  ></li
                >{/if}{#each selected.timeline as e (e.id)}{#if e.kind === 'group'}<li data-result="group"
                    ><div class="sync-timeline-group">··· <!---->{e.text}</div></li
                  >{:else}<li data-result={e.result} data-filled={e.revision ? '' : undefined}
                    >{#if e.revision}<button type="button" class="sync-entry" aria-pressed={activeEntry?.id === e.id} onclick={() => (entryId = e.id)}
                        >{@render timelineLine(e, when(e.at))}</button
                      >{:else}<div class="sync-entry">{@render timelineLine(e, when(e.at))}</div>{/if}</li
                  >{/if}{/each}</ol
            ></div
          ><div class="source-detail-block"
            ><div class="source-detail-block-head"
              ><h3>Contract diff</h3>{#if stats && diff.data}<span class="diff-stats"
                  ><span data-kind="added">+<!---->{stats.adds}</span><span data-kind="removed">−<!---->{stats.dels}</span><span class="muted">lines</span></span
                >{/if}</div
            >{#if diff.data}<div class="diff-view"
                ><div class="diff-view-head"
                  ><span class="diff-view-file">{diff.data.file ?? 'contract'}</span><span class="muted diff-view-rev"
                    >{diff.data.from}<!----> → <!---->{diff.data.to}</span
                  ></div
                ><!-- Scrolls horizontally: focusable so keyboard users can scroll it (RGAA 7.3). --><!-- svelte-ignore a11y_no_noninteractive_tabindex --><div
                  role="region"
                  aria-label="Unified diff"
                  class="diff-view-body"
                  tabindex="0"
                  >{#each diff.data.lines as l}<div class="diff-line" data-kind={l.kind}
                      ><span class="diff-line-sign" aria-hidden="true">{DIFF_SIGN[l.kind]}</span><span class="diff-line-text"
                        >{#if l.kind === 'added' || l.kind === 'removed' || l.kind === 'skipped'}<span class="sr-only">{DIFF_WORD[l.kind]}<!---->{' '}</span
                          >{/if}{l.text}</span
                      ></div
                    >{/each}</div
                ></div
              >{:else if activeEntry}<p class="muted" style="margin: 0px">Loading the diff…</p>{:else}<div class="diff-empty">{emptyDiffText(selected)}</div
              >{/if}</div
          ></section
        >{/if}</div
    ></div
  >
{/if}
