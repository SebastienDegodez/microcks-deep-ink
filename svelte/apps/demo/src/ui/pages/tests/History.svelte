<script lang="ts">
  import { untrack } from 'svelte';
  import { filterRuns, type TestRunSummary } from '@microcks/demo-core/domain/testing';
  import { Button, DataTable, type DataTableColumn, EmptyState, Icon, Segmented, Select } from '@microcks/deep-ink';
  import { ButtonRouterLink, useRelativeTime } from '@/ui/app';
  import { testRunHref } from '@/ui/app/format';
  import { TEST_RESULT_ICON, TEST_RESULT_WORD } from '@/ui/app/outcomes';
  import {
    bandLabel,
    bandOutcomes,
    bandTitle,
    endpointHost,
    HISTORY_LIMIT,
    historyEnvironments,
    historyRunners,
    initialRunId,
    moreRunsLabel,
    oldestRunNumber,
    relaunchHref,
    resultOptions,
    visibleRuns,
  } from './history';
  import TestTimeline from './TestTimeline.svelte';
  import { fmtDuration, shortDate, type TimelineOperation } from './timeline';

  /** Runs of a service: the conformance timeline, the filters and the table of runs. */
  let { runs, operations }: { runs: TestRunSummary[]; operations: TimelineOperation[] } = $props();
  const relative = useRelativeTime();
  let result = $state<'all' | 'passed' | 'failed'>('all');
  let runner = $state('all');
  let environment = $state('all');
  let showAll = $state(false);

  const runners = $derived(historyRunners(runs));
  const environments = $derived(historyEnvironments(runs));
  const isFiltered = $derived(result !== 'all' || runner !== 'all' || environment !== 'all');
  const filtered = $derived(filterRuns(runs, { result, runner, environment }));
  const matchIds = $derived(new Set(filtered.map((r) => r.id)));
  const matches = (r: TestRunSummary) => matchIds.has(r.id);
  const visible = $derived(visibleRuns(filtered, showAll || isFiltered));
  let sel = $state(untrack(() => initialRunId(runs)));
  const reset = () => {
    result = 'all';
    runner = 'all';
    environment = 'all';
  };
  const oldest = $derived(oldestRunNumber(runs));

  const columns: DataTableColumn<TestRunSummary>[] = [
    { key: 'id', header: 'Run', render: runCell },
    { key: 'startedAt', header: 'When', nowrap: true, render: whenCell },
    { key: 'endpoint', header: 'Endpoint', render: endpointCell },
    { key: 'runner', header: 'Runner', nowrap: true, render: runnerCell },
    { key: 'durationMs', header: 'Duration', align: 'end', nowrap: true, render: durationCell },
    { key: 'result', header: 'Result', render: resultCell },
    { key: 'operations', header: 'Operations', render: operationsCell },
    { key: 'samples', header: 'Samples', align: 'end', nowrap: true, render: samplesCell },
    { key: 'actions', header: 'Actions', align: 'end', nowrap: true, render: actionsCell },
  ];
</script>

{#snippet runCell(r: TestRunSummary)}<button type="button" class="tests-run-id" aria-label={`Show run #${r.id} in the timeline`} onclick={() => (sel = r.id)}
    >#<!---->{r.id}</button
  >{/snippet}

{#snippet whenCell(r: TestRunSummary)}<span class="tests-when"><span>{relative(r.startedAt)}</span><span class="tests-when-date">{shortDate(r.startedAt)}</span></span
  >{/snippet}

{#snippet endpointCell(r: TestRunSummary)}<span class="tests-endpoint"
    ><span class="tests-env" data-env={r.environment}>{r.environment}</span><span class="tests-endpoint-url">{r.endpoint}</span></span
  >{/snippet}

{#snippet runnerCell(r: TestRunSummary)}<span class="tests-runner">{r.runner}</span>{/snippet}

{#snippet durationCell(r: TestRunSummary)}<span class="tests-duration" data-result={r.result}>{fmtDuration(r.durationMs)}</span>{/snippet}

{#snippet resultCell(r: TestRunSummary)}<span class="tests-result" data-result={r.result}
    ><span class="tests-result-word"
      ><Icon name={TEST_RESULT_ICON[r.result]} size={14} stroke-width={r.result === 'timeout' ? 2.2 : 2.6} />{TEST_RESULT_WORD[r.result]}</span
    >{#if r.reason}<span class="tests-result-reason">{r.reason}</span>{/if}</span
  >{/snippet}

{#snippet operationsCell(r: TestRunSummary)}{@const outcomes = bandOutcomes(operations, r)}<span
    class="tests-band"
    role="img"
    aria-label={bandLabel(operations, outcomes)}
    >{#each outcomes as o, i (operations[i]?.id ?? i)}<span data-outcome={o} title={bandTitle(operations[i], o)}></span>{/each}</span
  >{/snippet}

{#snippet samplesCell(r: TestRunSummary)}<span class="tests-samples">{r.passed}<!---->/<!---->{r.total}</span>{/snippet}

{#snippet actionsCell(r: TestRunSummary)}<span class="tests-actions"
    ><ButtonRouterLink size="sm" variant="secondary" to={testRunHref(r)} aria-label={`Open run #${r.id}`}>Open</ButtonRouterLink><ButtonRouterLink
      size="sm"
      variant="ghost"
      icon="reset"
      iconOnly
      aria-label={`Relaunch run #${r.id}`}
      title="Relaunch with the same configuration"
      to={relaunchHref(r)}
    /></span
  >{/snippet}

{#if runs.length === 0}<EmptyState title="No test yet" headingLevel={2}><p>Run a first test to start the conformance history of this service.</p></EmptyState
  >{:else}<div class="stack tests-history"
    ><TestTimeline {runs} {operations} selectedId={sel} onselect={(id) => (sel = id)} {matches} filtered={isFiltered} {relative} /><div
      class="tests-filters"
      role="search"
      aria-label="Filter runs"
      ><Segmented
        label="Result"
        variant="joined"
        value={result}
        onchange={(id) => {
          result = id as typeof result;
          showAll = false;
        }}
        options={resultOptions(runs)}
      /><span class="tests-filter"
        ><label for="tests-runner">Runner</label><Select
          id="tests-runner"
          class="tests-filter-select"
          size="sm"
          value={runner}
          onchange={(e) => {
            runner = e.currentTarget.value;
            showAll = false;
          }}
          ><option value="all">All runners</option>{#each runners as r (r)}<option value={r}>{r}</option>{/each}</Select
        ></span
      ><span class="tests-filter"
        ><label for="tests-endpoint">Endpoint</label><Select
          id="tests-endpoint"
          class="tests-filter-select"
          size="sm"
          value={environment}
          onchange={(e) => {
            environment = e.currentTarget.value;
            showAll = false;
          }}
          ><option value="all">All endpoints</option>{#each environments as [env, url] (env)}<option value={env}
              >{env}<!---->{' · '}<!---->{endpointHost(url)}</option
            >{/each}</Select
        ></span
      >{#if isFiltered}<Button variant="link" onclick={reset}>Reset filters</Button>{/if}<p role="status" class="tests-count"
        >Showing <!---->{visible.length}<!----> of <!---->{runs.length}<!----> runs<!---->{isFiltered ? ` · ${filtered.length} match the filters` : ''}</p
      ></div
    ><section class="tests-table" aria-label="Test runs"
      ><DataTable
        caption="Test runs"
        captionHidden
        {columns}
        rows={visible}
        rowKey="id"
        selectedKey={sel}
        emptyText="No run matches these filters."
      />{#if visible.length === 0}<p class="tests-table-empty"><Button variant="link" onclick={reset}>Reset filters</Button></p>{/if}{#if !isFiltered && filtered.length > HISTORY_LIMIT}<div
          class="tests-table-more"
          ><Button size="sm" variant="secondary" onclick={() => (showAll = !showAll)} aria-expanded={showAll}>{moreRunsLabel(showAll, filtered.length)}</Button
          ></div
        >{/if}</section
    >{#if Number.isFinite(oldest) && oldest > 1}<p class="tests-footnote"
        >Runs are kept with their results and request/response exchanges. Test #1 to #<!---->{oldest - 1}<!----> are older than the <!---->{runs.length}<!----> runs listed here.</p
      >{/if}</div
  >{/if}
