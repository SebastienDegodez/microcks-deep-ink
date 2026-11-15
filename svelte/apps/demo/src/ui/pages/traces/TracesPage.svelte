<script lang="ts">
  import '@microcks/demo-styles/pages/traces/traces.css';
  import { untrack } from 'svelte';
  import { flowCounts, matchesTraceFilter, parseRunParam, statusLabel, type TraceCall, type TraceFilter } from '@microcks/demo-core/domain/observe';
  import { ApiBadge, Button, Callout, Field, Icon, LiveIndicator, Select, SplitPane, SplitPaneMain, SplitPaneSide } from '@microcks/deep-ink';
  import { PageHeader, usePageTitle, useQuery, useSearchParams, useSubscription, useUseCases } from '@/ui/app';
  import { fmt, plural } from '@/ui/app/format';
  import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
  import { useThrottledAnnounce } from '../tests/throttled-announce';
  import CallDetail from './CallDetail.svelte';
  import CallGraph from './CallGraph.svelte';
  import CallRow from './CallRow.svelte';
  import {
    callListMeta,
    callPool,
    EMPTY_TOPOLOGY,
    FLASH_MS,
    focusedNodeLabel,
    matchesNodeFocus,
    MAX_CALLS,
    MAX_ROWS,
    replayNoteText,
    servicesWithEndpoints,
    traceStats,
    TRACES_DESCRIPTION,
    type KindFilter,
    type StatusFilter,
  } from './calls';

  /** One tree for the loading and the loaded page, so the h1 keeps its focus when the data arrives. */
  usePageTitle('Live traces · Microcks');
  const uc = useUseCases();
  const [search] = useSearchParams();
  const throttled = useThrottledAnnounce(5000);
  const topologyQuery = useQuery(() => uc.observe.traceTopology(), () => []);
  const services = useQuery(() => uc.catalog.listServices(), () => []);
  const topology = $derived(topologyQuery.data ?? EMPTY_TOPOLOGY);

  // Read once from the URL, as initial values.
  const initialRun = untrack(() => parseRunParam(search.get('run')));
  let runId = $state(initialRun);
  let serviceId = $state(untrack(() => search.get('service') ?? ''));
  let kind = $state<KindFilter>('');
  let status = $state<StatusFilter>('');
  let arazzoOnly = $state(Boolean(initialRun));
  let focus = $state('');
  let selectedId = $state<string | undefined>('call-4');
  let clearedAt = $state('');
  let replayed = $state.raw<TraceCall[]>([]);
  let replayError = $state('');
  let received = $state(0);
  let pausedAt = $state(0);
  let flashId = $state('');

  // The page receives every call and filters locally: the graph counts and the buffer never depend on the filters.
  const stream = useSubscription<TraceCall, TraceCall[]>(
    (listener) =>
      uc.observe.subscribeTraces({}, (call) => {
        received += 1;
        listener(call);
      }),
    () => [],
    {
      initial: [],
      reduce: (current, call) => [call, ...current].slice(0, MAX_CALLS),
    },
  );
  const buffered = $derived(stream.paused ? Math.max(0, received - pausedAt) : 0);
  function togglePause() {
    if (!stream.paused) pausedAt = received;
    stream.toggle();
  }

  const pool = $derived(callPool(replayed, stream.value, topology.history));
  const replayedIds = $derived(new Set(replayed.map((c) => c.callId)));
  const visible = $derived(pool.filter((c) => !clearedAt || c.at > clearedAt));

  const filter: TraceFilter = $derived({
    serviceId: serviceId || undefined,
    kind: kind || undefined,
    status: status || undefined,
    arazzoOnly: arazzoOnly || undefined,
    runId,
  });
  const hasFilters = $derived(Boolean(serviceId || kind || status || arazzoOnly || runId));
  const matching = $derived(visible.filter((c) => matchesTraceFilter(c, filter) && matchesNodeFocus(c, focus)));
  const shown = $derived(matching.slice(0, MAX_ROWS));
  const selected = $derived(selectedId ? pool.find((c) => c.callId === selectedId) : undefined);

  const latest = $derived(stream.value[0]);
  let lastSeen = '';
  $effect(() => {
    if (!latest || latest.callId === lastSeen) return;
    lastSeen = latest.callId;
    flashId = latest.callId;
    throttled(`Live traces: latest ${latest.method} ${latest.path}, ${statusLabel(latest)}.`);
  });
  $effect(() => {
    if (!flashId) return;
    const timer = setTimeout(() => (flashId = ''), FLASH_MS);
    return () => clearTimeout(timer);
  });

  const streamed = $derived([...replayed, ...stream.value]);
  const counts = $derived(flowCounts(topology, streamed));
  const stats = $derived(traceStats(topology, counts));
  const arazzoCount = $derived(visible.filter((c) => c.baggage || c.sessionId).length);
  const flashCall = $derived(flashId ? pool.find((c) => c.callId === flashId) : undefined);

  const serviceOptions = $derived(servicesWithEndpoints(services.data ?? [], topology));
  const focusLabel = $derived(focusedNodeLabel(topology, focus));

  function resetFilters() {
    serviceId = '';
    kind = '';
    status = '';
    arazzoOnly = false;
    runId = undefined;
  }
  function clearList() {
    clearedAt = pool[0]?.at ?? '';
    selectedId = undefined;
  }

  async function replay(call: TraceCall) {
    replayError = '';
    try {
      const again = await uc.observe.replay(call.callId);
      replayed = [again, ...replayed];
      selectedId = again.callId;
      flashId = again.callId;
      // The visible role=status line under the actions announces the replay, once.
    } catch (e) {
      replayError = e instanceof Error ? e.message : 'The call could not be replayed.';
    }
  }

  const listMeta = $derived(callListMeta(matching.length));
  const newCalls = $derived(plural(buffered, 'new call'));
</script>

{#snippet badge()}<LiveIndicator label="live · ~19 calls/min" paused={stream.paused} pausedLabel={`paused · ${newCalls}`} />{/snippet}

{#snippet actions()}<Button icon={stream.paused ? 'play' : 'pause'} aria-pressed={stream.paused} onclick={togglePause}
    >{stream.paused ? 'Resume' : 'Pause'}</Button
  ><Button icon="trash" variant="link" class="tr2-clear" onclick={clearList}>Clear list</Button>{/snippet}

<PageHeader
  title="Live traces"
  {badge}
  description={TRACES_DESCRIPTION}
  descriptionTone="secondary"
  descriptionWidth={780}
  align="start"
  {actions}
/>{#if !topologyQuery.data}{#if topologyQuery.status === 'error'}<ErrorBlock
      error={topologyQuery.error}
      what="Live traces"
      onretry={topologyQuery.reload}
    />{:else}<LoadingBlock label="live traces" />{/if}{:else}<div class="stack tr2-page"
    ><div class="tr2-filters" role="group" aria-label="Trace filters"
      ><Field label="Service" class="tr2-filter-service"
        >{#snippet children(c)}<Select {...c} class="tr2-select" value={serviceId} onchange={(e) => (serviceId = e.currentTarget.value)}
            ><option value="">All services</option>{#each serviceOptions as s (s.id)}<option value={s.id}
                >{s.name}<!---->{' '}<!---->{s.version}</option
              >{/each}</Select
          >{/snippet}</Field
      ><Field label="Protocol" class="tr2-filter-narrow"
        >{#snippet children(c)}<Select {...c} class="tr2-select" value={kind} onchange={(e) => (kind = e.currentTarget.value as KindFilter)}
            ><option value="">All protocols</option><option value="REST">REST (HTTP)</option><option value="MCP">MCP tool calls</option><option
              value="EVENT">Event (Kafka)</option
            ></Select
          >{/snippet}</Field
      ><Field label="Status" class="tr2-filter-narrow"
        >{#snippet children(c)}<Select {...c} class="tr2-select" value={status} onchange={(e) => (status = e.currentTarget.value as StatusFilter)}
            ><option value="">All statuses</option><option value="ok">2xx and delivered</option><option value="error">4xx no match</option></Select
          >{/snippet}</Field
      ><button
        type="button"
        class="tr2-toggle"
        aria-pressed={arazzoOnly}
        title={runId ? `Calls of the Arazzo run ${runId}` : 'Calls carrying microcks-arazzo-* baggage entries or an x-microcks-session header'}
        onclick={() => {
          if (arazzoOnly) runId = undefined;
          arazzoOnly = !arazzoOnly;
        }}
        ><Icon name="graph" size={14} />From Arazzo runs<span class="tr2-toggle-count">{arazzoCount}</span>{#if runId}<span class="sr-only"
            >{', run '}<!---->{runId}</span
          >{/if}</button
      >{#if focus}<span class="tr2-focus"
          >Focused on <span class="demo-mono">{focusLabel}</span><button type="button" aria-label="Remove node focus" onclick={() => (focus = '')}
            ><Icon name="close" size={12} /></button
          ></span
        >{/if}{#if hasFilters}<button type="button" class="tr2-reset" onclick={resetFilters}>Reset filters</button>{/if}<div class="tr2-stats"
        ><ApiBadge label="calls · 1 h" value={fmt(stats.totalCalls)} status="action" /><ApiBadge
          label="no match"
          value={fmt(stats.noMatch)}
          status="warning"
        /><ApiBadge label="mcp" value={fmt(stats.mcpCalls)} status="info" /></div
      ></div
    ><CallGraph
      {topology}
      {counts}
      filter={{ serviceId, kind, status }}
      {focus}
      onfocusnode={(id) => (focus = focus === id ? '' : id)}
      flash={flashCall}
    /><SplitPane sideWidth="400px" sideMax="none" mainWidth="560px"
      ><SplitPaneMain as="section" aria-labelledby="tr2-list-title" class="tr2-list"
        ><div class="tr2-list-head"
          ><div class="tr2-list-title"><h2 id="tr2-list-title">Latest calls</h2><span class="tr2-muted">{listMeta}</span></div
          >{#if stream.paused && buffered > 0}<button type="button" class="tr2-show-new" onclick={togglePause}
              ><Icon name="arrow-down" size={12} />Show <!---->{newCalls}</button
            >{/if}</div
        >{#if replayError}<Callout tone="danger" title="Replay failed" live="assertive"><p>{replayError}</p></Callout>{/if}<div
          class="tr2-list-scroll"
          ><div class="tr2-list-inner"
            ><div class="tr2-row tr2-row-head" aria-hidden="true"
              ><span>Time</span><span>Client</span><span>Request</span><span>Dispatch criteria</span><span>Matched example</span><span
                >Status</span
              ><span class="tr2-end">ms</span></div
            >{#if shown.length === 0}<div class="tr2-empty"
                ><span
                  >{clearedAt && !hasFilters && !focus ? 'List cleared. Waiting for the next call…' : 'No call matches the current filters.'}</span
                ><span class="tr2-muted">New calls appear here as soon as a client hits a mock.</span></div
              >{:else}<ul class="tr2-rows"
                >{#each shown as c (c.callId)}<li
                    ><CallRow
                      call={c}
                      selected={c.callId === selectedId}
                      flash={c.callId === flashId}
                      replay={replayedIds.has(c.callId)}
                      onpick={() => (selectedId = c.callId)}
                    /></li
                  >{/each}</ul
              >{/if}</div
          ></div
        ></SplitPaneMain
      >{#if selected}<CallDetail
          call={selected}
          replayNote={replayedIds.has(selected.callId) ? replayNoteText(selected) : ''}
          onclose={() => (selectedId = undefined)}
          onreplay={() => replay(selected)}
        />{:else}<SplitPaneSide as="aside" aria-label="Call detail" class="tr2-noselect"
          ><span class="tr2-noselect-title">Select a call</span><span
            >See its request and response, the dispatch criteria Microcks computed and the example it served. You can replay it from there.</span
          ></SplitPaneSide
        >{/if}</SplitPane
    ></div
  >{/if}
