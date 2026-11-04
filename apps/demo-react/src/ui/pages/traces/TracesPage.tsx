/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- scrollable code regions must be reachable by keyboard (WCAG 2.1.1) */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router';
import {
  clockTime,
  flowCounts,
  isMiss,
  matchesTraceFilter,
  parseRunParam,
  statusLabel,
  traceEvents,
  traceIds,
  type TraceCall,
  type TraceFilter,
  type TraceKind,
  type TraceTopology,
} from '@/domain/observe';
import { fmt, plural } from '@/ui/app/format';
import { PageHeader, usePageTitle, useQuery, useSubscription, useUseCases } from '@/ui/app';
import { ApiBadge } from '@/ui/components/ui/api-badge';
import { Button } from '@/ui/components/ui/button';
import { Callout } from '@/ui/components/ui/callout';
import { FactRow, Facts } from '@/ui/components/ui/facts';
import { Field } from '@/ui/components/ui/field';
import { Icon } from '@/ui/components/ui/icon';
import { LiveIndicator } from '@/ui/components/ui/live-indicator';
import { Select } from '@/ui/components/ui/select';
import { SplitPane, SplitPaneMain, SplitPaneSide } from '@/ui/components/ui/split-pane';
import { ErrorBlock, LoadingBlock } from '../tests/PageStates';
import { useThrottledAnnounce } from '../tests/useThrottledAnnounce';
import { CallGraph } from './CallGraph';
import './traces.css';

const MAX_CALLS = 60;
const MAX_ROWS = 12;
const FLASH_MS = 1400;
const REST_BASE = '/rest/API+Pastry/2.0';
const DESCRIPTION =
  'Real-time calls hitting your mocks, from REST and Kafka endpoints to MCP tool calls made by AI agents. Each call shows who called, which operation answered, which example the dispatcher picked and, for calls of an Arazzo run or session, the workflow step it belongs to.';

export default function TracesPage() {
  usePageTitle('Live traces · Microcks');
  const uc = useUseCases();
  const topology = useQuery(() => uc.observe.traceTopology(), []);
  const services = useQuery(() => uc.catalog.listServices(), []);
  const pending = topology.status === 'error' ? <ErrorBlock error={topology.error} what="Live traces" onRetry={topology.reload} /> : <LoadingBlock label="live traces" />;
  return <Live topology={topology.data} services={services.data ?? []} pending={pending} />;
}

const EMPTY: TraceTopology = {
  clients: [],
  endpoints: [],
  examples: [],
  clientEdges: [],
  exampleEdges: [],
  history: [],
};


/** Background of the method chip: events and writes in the event colour, MCP in the link colour. */
function methodTone(c: Pick<TraceCall, 'kind' | 'method'>): 'event' | 'mcp' | 'rest' {
  if (c.kind === 'EVENT') return 'event';
  if (c.kind === 'MCP') return 'mcp';
  return c.method === 'PATCH' || c.method === 'PUT' || c.method === 'POST' ? 'event' : 'rest';
}

const arazzoStep = (c: TraceCall) => (c.baggage ? /microcks-arazzo-step=([^,;\s]+)/.exec(c.baggage)?.[1] : undefined);
const arazzoWorkflow = (c: TraceCall) => (c.baggage ? /microcks-arazzo-workflow=([^,;\s]+)/.exec(c.baggage)?.[1] : undefined);
const arazzoAttempt = (c: TraceCall) => (c.baggage ? /microcks-arazzo-attempt=(\d+)/.exec(c.baggage)?.[1] : undefined);
const arazzoRunId = (c: TraceCall) => (c.baggage ? /microcks-arazzo-run=([^,;\s]+)/.exec(c.baggage)?.[1] : undefined);
const arazzoTitle = (c: TraceCall) =>
  `From workflow ${c.workflowName ?? arazzoWorkflow(c) ?? ''} · run #${c.arazzoRun ?? ''} · step ${arazzoStep(c) ?? ''} · attempt ${arazzoAttempt(c) ?? '1'}`;

type KindFilter = '' | Extract<TraceKind, 'REST' | 'MCP' | 'EVENT'>;

/** One tree for the loading and the loaded page, so the h1 keeps its focus when the data arrives. */
function Live({ topology: loaded, services, pending }: { topology?: TraceTopology; services: { id: string; name: string; version: string }[]; pending: ReactNode }) {
  const topology = loaded ?? EMPTY;
  const uc = useUseCases();
  const [params] = useSearchParams();
  const [runId, setRunId] = useState(parseRunParam(params.get('run')));
  const [serviceId, setServiceId] = useState(params.get('service') ?? '');
  const [kind, setKind] = useState<KindFilter>('');
  const [status, setStatus] = useState<'' | 'ok' | 'error'>('');
  const [arazzoOnly, setArazzoOnly] = useState(Boolean(runId));
  const [focus, setFocus] = useState('');
  const [selectedId, setSelectedId] = useState<string | undefined>('call-4');
  const [clearedAt, setClearedAt] = useState('');
  const [replayed, setReplayed] = useState<TraceCall[]>([]);
  const [replayError, setReplayError] = useState('');
  const [received, setReceived] = useState(0);
  const [pausedAt, setPausedAt] = useState(0);
  const [flashId, setFlashId] = useState('');
  const throttled = useThrottledAnnounce(5000);

  // The page receives every call and filters locally: the graph counts and the buffer never depend on the filters.
  const stream = useSubscription<TraceCall, TraceCall[]>(
    (listener) =>
      uc.observe.subscribeTraces({}, (call) => {
        setReceived((n) => n + 1);
        listener(call);
      }),
    [],
    {
      initial: [],
      reduce: (current, call) => [call, ...current].slice(0, MAX_CALLS),
    },
  );
  const buffered = stream.paused ? Math.max(0, received - pausedAt) : 0;
  const togglePause = () => {
    if (!stream.paused) setPausedAt(received);
    stream.toggle();
  };

  const pool = useMemo(() => {
    const byId = new Map<string, TraceCall>();
    for (const c of [...replayed, ...stream.value, ...topology.history]) if (!byId.has(c.callId)) byId.set(c.callId, c);
    return [...byId.values()].sort((a, b) => b.at.localeCompare(a.at) || b.seq - a.seq);
  }, [replayed, stream.value, topology]);
  const replayedIds = useMemo(() => new Set(replayed.map((c) => c.callId)), [replayed]);
  const visible = pool.filter((c) => !clearedAt || c.at > clearedAt);

  const filter: TraceFilter = {
    serviceId: serviceId || undefined,
    kind: kind || undefined,
    status: status || undefined,
    arazzoOnly: arazzoOnly || undefined,
    runId,
  };
  const hasFilters = Boolean(serviceId || kind || status || arazzoOnly || runId);
  const matching = visible.filter((c) => matchesTraceFilter(c, filter) && (!focus || c.clientId === focus || c.endpointId === focus || c.exampleId === focus));
  const shown = matching.slice(0, MAX_ROWS);
  const selected = selectedId ? pool.find((c) => c.callId === selectedId) : undefined;

  const latest = stream.value[0];
  const lastSeen = useRef('');
  useEffect(() => {
    if (!latest || latest.callId === lastSeen.current) return;
    lastSeen.current = latest.callId;
    setFlashId(latest.callId);
    throttled(`Live traces: latest ${latest.method} ${latest.path}, ${statusLabel(latest)}.`);
  }, [latest, throttled]);
  useEffect(() => {
    if (!flashId) return undefined;
    const timer = setTimeout(() => setFlashId(''), FLASH_MS);
    return () => clearTimeout(timer);
  }, [flashId]);

  const streamed = useMemo(() => [...replayed, ...stream.value], [replayed, stream.value]);
  const counts = flowCounts(topology, streamed);
  const totalCalls = Object.values(counts.clientEdge).reduce((a, b) => a + b, 0);
  const noMatch = topology.exampleEdges.filter((e) => !topology.examples.find((x) => x.id === e.to)?.ok).reduce((a, e) => a + (counts.exampleEdge[`${e.from}>${e.to}`] ?? 0), 0);
  const mcpCalls = topology.clientEdges.filter((e) => e.kind === 'MCP').reduce((a, e) => a + (counts.clientEdge[`${e.from}>${e.to}`] ?? 0), 0);
  const arazzoCount = visible.filter((c) => c.baggage || c.sessionId).length;
  const flashCall = flashId ? pool.find((c) => c.callId === flashId) : undefined;

  const serviceOptions = services.filter((s) => topology.endpoints.some((e) => e.serviceId === s.id));
  const focusNode = [...topology.clients, ...topology.endpoints, ...topology.examples].find((n) => n.id === focus);
  const focusLabel = focusNode ? ('method' in focusNode ? `${focusNode.method} ${focusNode.label}` : focusNode.label) : '';

  const resetFilters = () => {
    setServiceId('');
    setKind('');
    setStatus('');
    setArazzoOnly(false);
    setRunId(undefined);
  };
  const clearList = () => {
    setClearedAt(pool[0]?.at ?? '');
    setSelectedId(undefined);
  };

  const replay = async (call: TraceCall) => {
    setReplayError('');
    try {
      const again = await uc.observe.replay(call.callId);
      setReplayed((r) => [again, ...r]);
      setSelectedId(again.callId);
      setFlashId(again.callId);
      // The visible role=status line under the actions announces the replay, once.
    } catch (e) {
      setReplayError(e instanceof Error ? e.message : 'The call could not be replayed.');
    }
  };

  const listMeta = `newest first · ${matching.length > MAX_ROWS ? `${MAX_ROWS} of ${matching.length} shown` : plural(matching.length, 'call')}`;
  const newCalls = plural(buffered, 'new call');

  return (
    <>
      <PageHeader
        title="Live traces"
        badge={<LiveIndicator label="live · ~19 calls/min" paused={stream.paused} pausedLabel={`paused · ${newCalls}`} />}
        description={DESCRIPTION}
        descriptionTone="secondary"
        descriptionWidth={780}
        align="start"
        actions={
          <>
            <Button icon={stream.paused ? 'play' : 'pause'} aria-pressed={stream.paused} onClick={togglePause}>
              {stream.paused ? 'Resume' : 'Pause'}
            </Button>
            <Button icon="trash" variant="link" className="tr2-clear" onClick={clearList}>
              Clear list
            </Button>
          </>
        }
      />
      {!loaded ? (
        pending
      ) : (
        <div className="stack tr2-page">
          <div className="tr2-filters" role="group" aria-label="Trace filters">
            <Field label="Service" className="tr2-filter-service">
              {(c) => (
                <Select {...c} value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                  <option value="">All services</option>
                  {serviceOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.version}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Protocol" className="tr2-filter-narrow">
              {(c) => (
                <Select {...c} value={kind} onChange={(e) => setKind(e.target.value as KindFilter)}>
                  <option value="">All protocols</option>
                  <option value="REST">REST (HTTP)</option>
                  <option value="MCP">MCP tool calls</option>
                  <option value="EVENT">Event (Kafka)</option>
                </Select>
              )}
            </Field>
            <Field label="Status" className="tr2-filter-narrow">
              {(c) => (
                <Select {...c} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                  <option value="">All statuses</option>
                  <option value="ok">2xx and delivered</option>
                  <option value="error">4xx no match</option>
                </Select>
              )}
            </Field>
            <button
              type="button"
              className="tr2-toggle"
              aria-pressed={arazzoOnly}
              title={runId ? `Calls of the Arazzo run ${runId}` : 'Calls carrying microcks-arazzo-* baggage entries or an x-microcks-session header'}
              onClick={() => {
                if (arazzoOnly) setRunId(undefined);
                setArazzoOnly(!arazzoOnly);
              }}
            >
              <Icon name="graph" size={14} />
              From Arazzo runs
              <span className="tr2-toggle-count">{arazzoCount}</span>
              {runId ? <span className="sr-only">, run {runId}</span> : null}
            </button>
            {focus ? (
              <span className="tr2-focus">
                Focused on <span className="demo-mono">{focusLabel}</span>
                <button type="button" aria-label="Remove node focus" onClick={() => setFocus('')}>
                  <Icon name="close" size={12} />
                </button>
              </span>
            ) : null}
            {hasFilters ? (
              <button type="button" className="tr2-reset" onClick={resetFilters}>
                Reset filters
              </button>
            ) : null}
            <div className="tr2-stats">
              <ApiBadge label="calls · 1 h" value={fmt(totalCalls)} status="action" />
              <ApiBadge label="no match" value={fmt(noMatch)} status="warning" />
              <ApiBadge label="mcp" value={fmt(mcpCalls)} status="info" />
            </div>
          </div>

          <CallGraph
            topology={topology}
            counts={counts}
            filter={{ serviceId, kind, status }}
            focus={focus}
            onFocus={(id) => setFocus((f) => (f === id ? '' : id))}
            flash={flashCall}
          />

          <SplitPane sideWidth="400px" sideMax="none" mainWidth="560px">
            <SplitPaneMain as="section" aria-labelledby="tr2-list-title" className="tr2-list">
              <div className="tr2-list-head">
                <div className="tr2-list-title">
                  <h2 id="tr2-list-title">Latest calls</h2>
                  <span className="tr2-muted">{listMeta}</span>
                </div>
                {stream.paused && buffered > 0 ? (
                  <button type="button" className="tr2-show-new" onClick={togglePause}>
                    <Icon name="arrow-down" size={12} />
                    Show {newCalls}
                  </button>
                ) : null}
              </div>
              {replayError ? (
                <Callout tone="danger" title="Replay failed" live="assertive">
                  <p>{replayError}</p>
                </Callout>
              ) : null}
              <div className="tr2-list-scroll">
                <div className="tr2-list-inner">
                  <div className="tr2-row tr2-row-head" aria-hidden="true">
                    <span>Time</span>
                    <span>Client</span>
                    <span>Request</span>
                    <span>Dispatch criteria</span>
                    <span>Matched example</span>
                    <span>Status</span>
                    <span className="tr2-end">ms</span>
                  </div>
                  {shown.length === 0 ? (
                    <div className="tr2-empty">
                      <span>{clearedAt && !hasFilters && !focus ? 'List cleared. Waiting for the next call…' : 'No call matches the current filters.'}</span>
                      <span className="tr2-muted">New calls appear here as soon as a client hits a mock.</span>
                    </div>
                  ) : (
                    <ul className="tr2-rows">
                      {shown.map((c) => (
                        <li key={c.callId}>
                          <CallRow
                            call={c}
                            selected={c.callId === selectedId}
                            flash={c.callId === flashId}
                            replay={replayedIds.has(c.callId)}
                            onPick={() => setSelectedId(c.callId)}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </SplitPaneMain>

            {selected ? (
              <CallDetail
                call={selected}
                replayNote={replayedIds.has(selected.callId) ? `Replayed at ${clockTime(selected.at)} · new call at the top of the list` : ''}
                onClose={() => setSelectedId(undefined)}
                onReplay={() => replay(selected)}
              />
            ) : (
              <SplitPaneSide as="aside" aria-label="Call detail" className="tr2-noselect">
                <span className="tr2-noselect-title">Select a call</span>
                <span>See its request and response, the dispatch criteria Microcks computed and the example it served. You can replay it from there.</span>
              </SplitPaneSide>
            )}
          </SplitPane>
        </div>
      )}
    </>
  );
}

function StatusText({ call, withLatency }: { call: TraceCall; withLatency?: boolean }) {
  const miss = isMiss(call);
  return (
    <span className="tr2-status" data-miss={miss ? '' : undefined}>
      <Icon name={miss ? 'warning' : 'check'} size={13} />
      <span className="demo-mono">
        {statusLabel(call)}
        {withLatency ? ` · ${call.ms} ms` : ''}
      </span>
    </span>
  );
}

/** The row is named by its visible text, cell by cell, plus hidden words for the units and the run (RGAA 6.1). */
function CallRow({ call: c, selected, flash, replay, onPick }: { call: TraceCall; selected: boolean; flash: boolean; replay: boolean; onPick: () => void }) {
  const step = arazzoStep(c);
  return (
    <button type="button" className="tr2-row" aria-pressed={selected} data-flash={flash ? '' : undefined} onClick={onPick}>
      <span className="tr2-time">{clockTime(c.at)}</span>{' '}
      <span className="tr2-client">
        <span className="tr2-ellipsis">{c.clientName}</span>{' '}
        <span className="tr2-ip">{c.clientIp}</span>
      </span>{' '}
      <span className="tr2-request">
        <span className="tr2-method" data-tone={methodTone(c)}>{c.method}</span>{' '}
        <span className="tr2-path">
          <span className="tr2-ellipsis">{c.path}</span>
          {c.mcpTool ? <>{' '}<span className="tr2-tool">tools/call · {c.mcpTool}</span></> : null}
        </span>
        {replay ? <>{' '}<span className="tr2-tag" data-tag="replay">replay</span></> : null}
        {step ? (
          <>
            {' '}
            <span className="tr2-arazzo" title={arazzoTitle(c)}>
              <span>ARAZZO</span>{' '}
              <span>{step}</span>
            </span>
          </>
        ) : null}
        {c.sessionId ? <>{' '}<span className="tr2-tag" data-tag="session" title={`x-microcks-session: ${c.sessionId}`}>session</span></> : null}
      </span>{' '}
      <span className="tr2-crit tr2-ellipsis">{c.criteria}</span>{' '}
      <span className="tr2-example tr2-ellipsis" data-miss={isMiss(c) ? '' : undefined}>{c.exampleName}</span>{' '}
      <StatusText call={c} />{' '}
      <span className="tr2-ms">{c.ms}</span>{' '}
      <span className="sr-only">ms{c.baggage ? `, ${arazzoTitle(c)}` : ''}{c.sessionId ? `, session ${c.sessionId}` : ''}</span>
    </button>
  );
}

function shortPath(c: TraceCall): string {
  if (c.kind === 'MCP') return `tools/call · ${c.mcpTool ?? ''}`;
  if (c.kind === 'EVENT') return 'SUBSCRIBE pastry/orders';
  return c.path.replace(REST_BASE, '');
}

function requestText(c: TraceCall): string {
  const raw = c.rawRequest ?? 'No content captured.';
  const { traceId, spanId } = traceIds(c.seq);
  return raw.replace('Accept: application/json', `Accept: application/json\ntraceparent: 00-${traceId}-${spanId}-01`);
}

function CallDetail({ call: c, replayNote, onClose, onReplay }: { call: TraceCall; replayNote: string; onClose: () => void; onReplay: () => void }) {
  const miss = isMiss(c);
  const isEvent = c.kind === 'EVENT';
  const runId = arazzoRunId(c);
  const workflowId = arazzoWorkflow(c);
  const openTo = c.operationId ? `/services/${c.serviceId}/operations/${c.operationId}` : `/services/${c.serviceId}`;
  return (
    <SplitPaneSide as="section" aria-labelledby="tr2-detail-title" className="tr2-detail">
      <div className="tr2-detail-head">
        <div className="tr2-detail-id">
          <div className="tr2-detail-title">
            <span className="tr2-method" data-size="md" data-tone={methodTone(c)}>
              {c.method}
            </span>
            <h2 id="tr2-detail-title">{shortPath(c)}</h2>
          </div>
          <span className="tr2-detail-meta">
            {c.kind === 'MCP' ? <ApiBadge label="MCP" value={c.serviceName} size="sm" /> : <ApiBadge protocol={isEvent ? 'EVENT' : 'REST'} name={c.serviceName} size="sm" />}
            <span className="tr2-time">{clockTime(c.at)}</span>
          </span>
        </div>
        <button type="button" className="tr2-close" aria-label="Close call detail" onClick={onClose}>
          <Icon name="close" size={14} />
        </button>
      </div>

      <Facts layout="columns" columns={2} boxed="surface" gap="10px 16px" size="sm" className="tr2-facts">
        <FactRow term="Client" mono>
          {c.clientName} · {c.clientIp}
        </FactRow>
        <FactRow term="Dispatcher" mono>
          {c.dispatcher ?? 'n/a'}
        </FactRow>
        <FactRow term="Dispatch criteria" mono tone="warning">
          {c.criteria ?? 'none'}
        </FactRow>
        <FactRow term="Matched example" tone={miss ? 'warning' : undefined}>
          <span className="tr2-example-name">{c.exampleName ?? 'none'}</span>
        </FactRow>
        <FactRow term="Status · latency">
          <StatusText call={c} withLatency />
        </FactRow>
        <FactRow term="Trace id" mono tone="muted">
          <span className="tr2-trace-id">{traceIds(c.seq).traceId}</span>
        </FactRow>
      </Facts>

      {c.baggage ? (
        <div role="note" aria-label="Arazzo run of this call" className="tr2-note">
          <div className="tr2-note-line">
            <span className="tr2-arazzo-tag">ARAZZO</span>
            <span>
              From workflow{' '}
              <RouterLink className="tr2-strong-link" to={`/workflows/pastry/${workflowId ?? 'restock-pastry'}/loom`}>
                {c.workflowName ?? workflowId}
              </RouterLink>
              {' · '}
              <RouterLink to={`/workflows/runs/${runId ?? ''}`}>run #{c.arazzoRun}</RouterLink> · step <span className="demo-mono">{arazzoStep(c)}</span> · attempt{' '}
              {arazzoAttempt(c) ?? '1'}
            </span>
          </div>
          <span className="tr2-note-label">W3C baggage</span>
          <code className="tr2-note-code">{c.baggage}</code>
        </div>
      ) : null}
      {c.sessionId ? (
        <div role="note" aria-label="Arazzo session of this call" className="tr2-note" data-variant="session">
          <span>
            Session <span className="demo-mono tr2-strong">{c.sessionId}</span>
          </span>
          <span className="tr2-secondary">
            verification of{' '}
            <RouterLink className="tr2-strong-link" to="/workflows/pastry/restock-pastry/loom">
              Restock a pastry
            </RouterLink>{' '}
            · the mocks answer along the workflow
          </span>
          <code className="tr2-note-code tr2-muted">x-microcks-session: {c.sessionId}</code>
        </div>
      ) : null}
      {miss ? (
        <div role="note" className="tr2-note" data-variant="miss">
          <Icon name="warning" size={14} />
          <span>
            No example of{' '}
            <span className="demo-mono">
              {c.method} {c.endpointLabel}
            </span>{' '}
            matches <span className="demo-mono">{c.criteria}</span>. Add an example or let the AI Copilot propose one.
          </span>
        </div>
      ) : null}

      <div className="tr2-raw">
        <div className="tr2-raw-head">
          <span className="tr2-raw-label">{isEvent ? 'Subscription' : c.kind === 'MCP' ? 'MCP request' : 'Request'}</span>
          <span className="demo-mono tr2-secondary">{c.clientName}</span>
        </div>
        <pre tabIndex={0} aria-label="Request">
          {requestText(c)}
        </pre>
      </div>
      <div className="tr2-raw" data-part="response">
        <div className="tr2-raw-head">
          <span className="tr2-raw-label">{isEvent ? 'Message' : 'Response'}</span>
          <span className="tr2-raw-status" data-miss={miss ? '' : undefined}>
            {statusLabel(c)}
          </span>
        </div>
        <pre tabIndex={0} aria-label="Response">
          {c.rawResponse ?? 'No content captured.'}
        </pre>
      </div>

      <div className="tr2-events">
        <h3>Span events</h3>
        {traceEvents(c).map((e, i) => (
          <div key={i} className="tr2-event">
            <span className="tr2-event-at">{e.at}</span>
            <span className="tr2-event-text">{e.text}</span>
          </div>
        ))}
      </div>

      <div className="tr2-actions">
        <Button variant="primary" icon="replay" onClick={onReplay}>
          Replay this call
        </Button>
        <Button asChild icon="external">
          <RouterLink to={openTo}>{miss ? 'Open operation' : 'Open example'}</RouterLink>
        </Button>
      </div>
      {/* Always in the DOM, so the live region announces the replay when its text appears. */}
      <p role="status" className="tr2-replayed">
        {replayNote ? (
          <>
            <Icon name="check" size={13} />
            {replayNote}
          </>
        ) : null}
      </p>
    </SplitPaneSide>
  );
}
