/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- scrollable code and log regions must be reachable by keyboard (WCAG 2.1.1) */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router';
import type { Protocol } from '@/domain/shared';
import {
  clockTime,
  flowCounts,
  hasFilter,
  isMiss,
  matchesTraceFilter,
  parseRunParam,
  statusLabel,
  traceEvents,
  traceIds,
  type TraceCall,
  type TraceFilter,
  type TraceTopology,
} from '@/domain/observe';
import { PageHeader, usePageTitle, useQuery, useSubscription, useUseCases } from '@/ui/app';
import { Button } from '@/ui/components/ui/button';
import { Callout } from '@/ui/components/ui/callout';
import { DescriptionList } from '@/ui/components/ui/description-list';
import { Disclosure } from '@/ui/components/ui/disclosure';
import { EmptyState } from '@/ui/components/ui/empty-state';
import { Field } from '@/ui/components/ui/field';
import { Icon } from '@/ui/components/ui/icon';
import { LiveIndicator } from '@/ui/components/ui/live-indicator';
import { MethodTag } from '@/ui/components/ui/method-tag';
import { Panel } from '@/ui/components/ui/panel';
import { Select } from '@/ui/components/ui/select';
import { Switch } from '@/ui/components/ui/switch';
import { ErrorBlock, LoadingBlock } from '../tests/PageStates';
import { useThrottledAnnounce } from '../tests/useThrottledAnnounce';
import './traces.css';

const MAX_CALLS = 50;

export default function TracesPage() {
  usePageTitle('Live traces · Microcks');
  const uc = useUseCases();
  const topology = useQuery(() => uc.observe.traceTopology(), []);
  const services = useQuery(() => uc.catalog.listServices(), []);
  return (
    <>
      <PageHeader title="Live traces" eyebrow="Observe" />
      {topology.status === 'loading' && !topology.data ? <LoadingBlock label="live traces" /> : null}
      {topology.status === 'error' ? <ErrorBlock error={topology.error} what="Live traces" onRetry={topology.reload} /> : null}
      {topology.data ? <Live topology={topology.data} services={services.data ?? []} /> : null}
    </>
  );
}

function Live({ topology, services }: { topology: TraceTopology; services: { id: string; name: string; version: string }[] }) {
  const uc = useUseCases();
  const [params] = useSearchParams();
  const runId = parseRunParam(params.get('run'));
  const [serviceId, setServiceId] = useState(params.get('service') ?? '');
  const [protocol, setProtocol] = useState('');
  const [status, setStatus] = useState<'' | 'ok' | 'error'>('');
  const [arazzoOnly, setArazzoOnly] = useState(Boolean(runId));
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [clearedBefore, setClearedBefore] = useState(0);
  const [replayed, setReplayed] = useState<TraceCall[]>([]);
  const [replayError, setReplayError] = useState('');
  const throttled = useThrottledAnnounce(5000);

  const filter: TraceFilter = useMemo(
    () => ({
      serviceId: serviceId || undefined,
      protocol: (protocol || undefined) as Protocol | undefined,
      status: status || undefined,
      arazzoOnly: arazzoOnly || undefined,
      runId,
    }),
    [serviceId, protocol, status, arazzoOnly, runId],
  );
  const initial = useMemo(() => topology.history.filter((c) => matchesTraceFilter(c, filter)).sort((a, b) => b.seq - a.seq), [topology, filter]);

  const stream = useSubscription<TraceCall, TraceCall[]>((listener) => uc.observe.subscribeTraces(filter, listener), [filter], {
    initial,
    reduce: (current, call) => [call, ...current].slice(0, MAX_CALLS),
  });
  const calls = [...replayed.filter((c) => matchesTraceFilter(c, filter)), ...stream.value].filter((c) => c.seq > clearedBefore || c.seq > 1000);
  const shown = calls.sort((a, b) => b.seq - a.seq);
  const selected = shown.find((c) => c.callId === selectedId) ?? shown[0];

  const latest = stream.value[0];
  const lastSeq = useRef(0);
  useEffect(() => {
    if (!latest || latest.seq === lastSeq.current) return;
    lastSeq.current = latest.seq;
    throttled(`Live traces: ${shown.length} calls. Latest ${latest.method} ${latest.path}, ${statusLabel(latest)}.`);
  }, [latest, shown.length, throttled]);

  const counts = flowCounts(topology, stream.value);
  const protocols = [...new Set(topology.history.map((c) => c.protocol))];

  const replay = async (call: TraceCall) => {
    setReplayError('');
    try {
      const again = await uc.observe.replay(call.callId);
      setReplayed((r) => [again, ...r]);
      setSelectedId(again.callId);
      throttled(`Replayed ${call.method} ${call.path}: ${statusLabel(again)}.`, true);
    } catch (e) {
      setReplayError(e instanceof Error ? e.message : 'The call could not be replayed.');
    }
  };

  return (
    <div className="di-stack">
      <Panel
        title="Calls"
        actions={
          <div className="demo-actions-row">
            <LiveIndicator paused={stream.paused} />
            <Button icon={stream.paused ? 'play' : 'pause'} onClick={stream.toggle}>
              {stream.paused ? 'Resume' : 'Pause'}
            </Button>
            <Button icon="trash" onClick={() => setClearedBefore(Math.max(0, ...shown.filter((c) => c.seq < 1000).map((c) => c.seq)))}>
              Clear
            </Button>
          </div>
        }
      >
        <div className="di-stack">
          <div className="tr2-filters" role="group" aria-label="Filter calls">
            <Field label="Service">
              {(c) => (
                <Select {...c} value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                  <option value="">All services</option>
                  {services.map((s) => <option key={s.id} value={s.id}>{s.name} {s.version}</option>)}
                </Select>
              )}
            </Field>
            <Field label="Protocol">
              {(c) => (
                <Select {...c} value={protocol} onChange={(e) => setProtocol(e.target.value)}>
                  <option value="">All protocols</option>
                  {protocols.map((p) => <option key={p} value={p}>{p}</option>)}
                </Select>
              )}
            </Field>
            <Field label="Status">
              {(c) => (
                <Select {...c} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                  <option value="">All statuses</option>
                  <option value="ok">Answered (2xx)</option>
                  <option value="error">Misses and errors (4xx, 5xx)</option>
                </Select>
              )}
            </Field>
            <Switch label="Arazzo only" description={runId ? `Run ${runId}` : 'Calls that belong to a workflow run'} checked={arazzoOnly} onChange={setArazzoOnly} />
          </div>
          <p className="demo-muted" role="status">
            {shown.length} {shown.length === 1 ? 'call' : 'calls'}{hasFilter(filter) ? ' match the filters' : ''}
            {stream.paused ? ' · paused: new calls keep arriving, resume to see them' : ''}
          </p>
          {replayError ? <Callout tone="danger" title="Replay failed" live="assertive"><p>{replayError}</p></Callout> : null}
          {shown.length === 0 ? (
            <EmptyState title="No call yet" headingLevel={3}>
              <p>{hasFilter(filter) ? 'No call matches these filters. Calls arrive every second or so.' : 'Waiting for the first call.'}</p>
            </EmptyState>
          ) : (
            <div className="demo-scroll">
              <table className="tr2-list">
                <caption className="di-sr-only">Calls received by the mocks, newest first</caption>
                <thead>
                  <tr><th scope="col">Time</th><th scope="col">Call</th><th scope="col">Service</th><th scope="col">Status</th><th scope="col">Duration</th><th scope="col">Origin</th></tr>
                </thead>
                <tbody>
                  {shown.map((c) => (
                    <tr key={c.callId} data-selected={c.callId === selected?.callId ? '' : undefined}>
                      <td className="demo-mono">{clockTime(c.at)}</td>
                      <th scope="row">
                        <button type="button" className="tr2-pick" aria-pressed={c.callId === selected?.callId} onClick={() => setSelectedId(c.callId)}>
                          {c.method} {c.path}
                        </button>
                      </th>
                      <td>{c.serviceName}</td>
                      <td>
                        <span className="tr2-status"><Icon name={isMiss(c) ? 'cross' : 'check'} size={14} />{statusLabel(c)}</span>
                      </td>
                      <td>{c.ms} ms</td>
                      <td>{c.baggage || c.sessionId ? 'Arazzo' : c.kind === 'MCP' ? 'MCP' : 'Direct'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Panel>

      {selected ? (
        <Panel title="Call detail" aria-live="off">
          <div className="di-stack">
            <p style={{ margin: 0 }}>
              <MethodTag method={selected.method} /> <span className="demo-mono">{selected.path}</span> · {statusLabel(selected)} · {selected.ms} ms
            </p>
            <div className="demo-actions-row">
              <Button icon="retry" onClick={() => replay(selected)}>Replay this call</Button>
              {selected.baggage ? (
                <Button asChild variant="ghost">
                  <RouterLink to={`/workflows/runs/${selected.baggage.match(/microcks-arazzo-run=([^,;\s]+)/)?.[1] ?? ''}`}>Open the workflow run</RouterLink>
                </Button>
              ) : null}
            </div>
            <DescriptionList
              items={[
                { term: 'Answering example', value: selected.exampleName ?? 'None: no example matched', mono: true },
                { term: 'Dispatcher', value: selected.dispatcher ?? 'n/a', mono: true },
                { term: 'Criteria', value: selected.criteria ?? 'n/a', mono: true },
                { term: 'Client', value: selected.clientName ?? 'Unknown' },
                { term: 'Trace id', value: traceIds(selected.seq).traceId, mono: true },
                { term: 'Span id', value: traceIds(selected.seq).spanId, mono: true },
                ...(selected.baggage ? [{ term: 'Baggage', value: selected.baggage, mono: true }] : []),
                ...(selected.sessionId ? [{ term: 'Session', value: selected.sessionId, mono: true }] : []),
              ]}
            />
            <div>
              <h3 style={{ margin: '0 0 6px', fontSize: '0.9375rem' }}>What Microcks did</h3>
              <ol className="tr2-events">
                {traceEvents(selected).map((e, i) => <li key={i}>{e.at} · {e.text}</li>)}
              </ol>
            </div>
            <Disclosure summary="Request" defaultOpen>
              <pre className="tr2-raw" tabIndex={0}>{formatMessage(selected.request, selected.rawRequest)}</pre>
            </Disclosure>
            <Disclosure summary="Response" defaultOpen>
              <pre className="tr2-raw" tabIndex={0}>{formatMessage(selected.response, selected.rawResponse)}</pre>
            </Disclosure>
          </div>
        </Panel>
      ) : null}

      <Panel title="Who calls what">
        <p className="demo-muted">Calls in the last hour, from the clients to the endpoints and the examples that answered.</p>
        <div className="demo-scroll">
          <table className="tr2-list">
            <caption className="di-sr-only">Calls by client, endpoint and answering example</caption>
            <thead><tr><th scope="col">Client</th><th scope="col">Endpoint</th><th scope="col">Calls</th></tr></thead>
            <tbody>
              {topology.clientEdges.map((e) => {
                const client = topology.clients.find((c) => c.id === e.from);
                const endpoint = topology.endpoints.find((c) => c.id === e.to);
                return (
                  <tr key={e.id}>
                    <th scope="row">{client?.label ?? e.from}</th>
                    <td>{endpoint ? `${endpoint.method} ${endpoint.label}` : e.to}</td>
                    <td>{counts.clientEdge[`${e.from}>${e.to}`] ?? 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <table className="tr2-list">
            <caption className="di-sr-only">Calls by endpoint and answering example</caption>
            <thead><tr><th scope="col">Endpoint</th><th scope="col">Answering example</th><th scope="col">Calls</th></tr></thead>
            <tbody>
              {topology.exampleEdges.map((e) => {
                const endpoint = topology.endpoints.find((c) => c.id === e.from);
                const example = topology.examples.find((c) => c.id === e.to);
                return (
                  <tr key={e.id}>
                    <th scope="row">{endpoint ? `${endpoint.method} ${endpoint.label}` : e.from}</th>
                    <td>{example ? `${example.label} (${example.code})` : e.to}</td>
                    <td>{counts.exampleEdge[`${e.from}>${e.to}`] ?? 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function formatMessage(part: { headers: Record<string, string>; body?: string } | undefined, raw?: string): string {
  if (raw) return raw;
  if (!part) return 'No content captured.';
  const headers = Object.entries(part.headers).map(([k, v]) => `${k}: ${v}`).join('\n');
  return part.body ? `${headers}\n\n${part.body}` : headers;
}
