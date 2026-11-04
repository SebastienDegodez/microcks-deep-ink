import type { FlowCounts, TopologyEdge, TraceCall, TraceTopology } from '@/domain/observe';
import { Icon } from '@/ui/components/ui/icon';

/** Graph geometry of the prototype: 56px nodes on a 72px slot, six slots per 416px column. */
const SLOT = 72;
const NODE = 56;
const HEIGHT = 416;
const yOf = (len: number, idx: number) => ((6 - len) * SLOT) / 2 + idx * SLOT + NODE / 2;
const fmt = (n: number) => n.toLocaleString('en-US');

export interface GraphFilter {
  serviceId: string;
  kind: string;
  status: '' | 'ok' | 'error';
}

interface Props {
  topology: TraceTopology;
  counts: FlowCounts;
  filter: GraphFilter;
  focus: string;
  onFocus: (id: string) => void;
  /** The latest call: its edges are drawn in the live colour for a moment. */
  flash?: TraceCall;
}

type EdgeTone = 'rest' | 'mcp' | 'event' | 'miss';

interface EdgeView {
  id: string;
  from: string;
  to: string;
  d: string;
  top: number;
  tone: EdgeTone;
  width: number;
  flash: boolean;
  on: boolean;
  count: number;
}

/** Call graph: clients → mock endpoints → dispatched examples. Nodes are toggle buttons that focus the list. */
export function CallGraph({ topology, counts, filter, focus, onFocus, flash }: Props) {
  const { clients, endpoints, examples, clientEdges, exampleEdges } = topology;
  const endpoint = (id: string) => endpoints.find((e) => e.id === id);
  const example = (id: string) => examples.find((e) => e.id === id);

  // Which edges stay lit under the filters and the node focus (prototype `active1` / `active2`).
  const svcOk = (epId: string) => !filter.serviceId || endpoint(epId)?.serviceId === filter.serviceId;
  const kindOk = (e: TopologyEdge) => !filter.kind || e.kind === filter.kind;
  const exStatusOk = (exId: string) => !filter.status || (filter.status === 'ok' ? Boolean(example(exId)?.ok) : !example(exId)?.ok);
  const epHasStatus = (epId: string) => exampleEdges.some((e) => e.from === epId && exStatusOk(e.to));
  const f = focus;
  const focusOk1 = (e: TopologyEdge) => !f || f === e.from || f === e.to || exampleEdges.some((x) => x.from === e.to && x.to === f);
  const focusOk2 = (e: TopologyEdge) => !f || f === e.from || f === e.to || clientEdges.some((x) => x.to === e.from && x.from === f && kindOk(x));
  const active1 = (e: TopologyEdge) => svcOk(e.to) && kindOk(e) && epHasStatus(e.to) && focusOk1(e);
  const active2 = (e: TopologyEdge) => svcOk(e.from) && exStatusOk(e.to) && clientEdges.some((x) => x.to === e.from && kindOk(x)) && focusOk2(e);

  const count1 = (e: TopologyEdge) => counts.clientEdge[`${e.from}>${e.to}`] ?? 0;
  const count2 = (e: TopologyEdge) => counts.exampleEdge[`${e.from}>${e.to}`] ?? 0;
  const max1 = Math.max(1, ...clientEdges.map(count1));
  const max2 = Math.max(1, ...exampleEdges.map(count2));

  const edges1: EdgeView[] = clientEdges.map((e) => {
    const y1 = yOf(clients.length, clients.findIndex((c) => c.id === e.from));
    const y2 = yOf(endpoints.length, endpoints.findIndex((x) => x.id === e.to));
    const n = count1(e);
    return {
      id: e.id, from: e.from, to: e.to, d: `M0 ${y1} L100 ${y2}`, top: y1 + (y2 - y1) * 0.76,
      tone: e.kind === 'MCP' ? 'mcp' : e.kind === 'EVENT' ? 'event' : 'rest',
      width: 1.2 + (2.6 * n) / max1, flash: Boolean(flash && flash.clientId === e.from && flash.endpointId === e.to), on: active1(e), count: n,
    };
  });
  const edges2: EdgeView[] = exampleEdges.map((e) => {
    const y1 = yOf(endpoints.length, endpoints.findIndex((x) => x.id === e.from));
    const y2 = yOf(examples.length, examples.findIndex((x) => x.id === e.to));
    const n = count2(e);
    const isEvent = endpoint(e.from)?.kinds.includes('EVENT');
    return {
      id: e.id, from: e.from, to: e.to, d: `M0 ${y1} L100 ${y2}`, top: (y1 + y2) / 2,
      tone: !example(e.to)?.ok ? 'miss' : isEvent ? 'event' : 'rest',
      width: 1.2 + (2.6 * n) / max2, flash: Boolean(flash && flash.endpointId === e.from && flash.exampleId === e.to), on: active2(e), count: n,
    };
  });

  const touches = (id: string) => [...edges1, ...edges2].some((e) => (e.from === id || e.to === id) && e.on);
  const sumFrom = (id: string) => edges1.reduce((a, e) => a + (e.from === id ? e.count : 0), 0);
  const sumTo1 = (id: string) => edges1.reduce((a, e) => a + (e.to === id ? e.count : 0), 0);
  const sumTo2 = (id: string) => edges2.reduce((a, e) => a + (e.to === id ? e.count : 0), 0);
  // The name is the visible text in order, between a hidden prefix and a hidden suffix (RGAA 6.1). A node outside the
  // filters or the focus is dimmed by its chrome only, so its text keeps a 4.5:1 contrast (RGAA 3.2).
  const nodeProps = (id: string) => ({
    type: 'button' as const,
    className: 'tr2-node',
    'aria-pressed': focus === id,
    'data-dim': focus === id || touches(id) ? undefined : '',
    onClick: () => onFocus(id),
  });
  const hidden = (text: string) => <span className="sr-only">{text}</span>;

  const nameOf = (id: string) => {
    const c = clients.find((x) => x.id === id);
    if (c) return c.label;
    const e = endpoint(id);
    if (e) return `${e.method} ${e.label}`;
    return example(id)?.label ?? id;
  };

  return (
    <section aria-labelledby="tr2-graph-title" className="tr2-graph">
      <div className="tr2-graph-head">
        <h2 id="tr2-graph-title">Call graph</h2>
        <span className="tr2-muted">Edge labels count calls over the last hour. Select a node to focus on its calls.</span>
      </div>
      <div className="tr2-graph-scroll">
        <div className="tr2-graph-grid">
          <span className="tr2-graph-caption">Clients</span>
          <span aria-hidden="true" />
          <span className="tr2-graph-caption">Mock endpoints</span>
          <span aria-hidden="true" />
          <span className="tr2-graph-caption">Dispatched example</span>

          <div className="tr2-graph-col" data-col="clients">
            {clients.map((c) => (
              <button key={c.id} {...nodeProps(c.id)} data-kind={c.kind.toLowerCase()}>
                {hidden('Client')}{' '}
                <span className="tr2-node-text">
                  <span className="tr2-node-label demo-mono">{c.label}</span>{' '}
                  <span className="tr2-node-sub demo-mono">{c.detail}</span>
                </span>{' '}
                <span className="tr2-node-total">{fmt(sumFrom(c.id))}</span>
                {' '}
                {hidden('calls in the last hour. Focus on this client.')}
              </button>
            ))}
          </div>
          <Edges edges={edges1} labelAt="76%" />
          <div className="tr2-graph-col" data-col="endpoints">
            {endpoints.map((e) => {
              const isEvent = e.kinds.includes('EVENT');
              return (
                <button key={e.id} {...nodeProps(e.id)} data-kind={isEvent ? 'event' : 'rest'}>
                  {hidden('Endpoint')}{' '}
                  <span className="tr2-method" data-size="node" data-tone={isEvent || e.method === 'PATCH' ? 'event' : 'rest'}>{e.method}</span>{' '}
                  <span className="tr2-node-text">
                    <span className="tr2-node-label demo-mono">{e.label}</span>{' '}
                    <span className="tr2-node-sub">{e.detail}</span>
                  </span>{' '}
                  <span className="tr2-node-total">{fmt(sumTo1(e.id))}</span>
                  {' '}
                {hidden('calls in the last hour. Focus on this endpoint.')}
                </button>
              );
            })}
          </div>
          <Edges edges={edges2} labelAt="50%" />
          <div className="tr2-graph-col" data-col="examples">
            {examples.map((x) => {
              const event = exampleEdges.some((e) => e.to === x.id && endpoint(e.from)?.kinds.includes('EVENT'));
              return (
                <button key={x.id} {...nodeProps(x.id)} data-kind={!x.ok ? 'miss' : event ? 'event' : 'rest'}>
                  {hidden('Example, status')}{' '}
                  <span className="tr2-code" data-miss={x.ok ? undefined : ''}>
                    <Icon name={x.ok ? 'check' : 'warning'} size={11} />
                    {x.code}
                  </span>{' '}
                  <span className="tr2-node-text">
                    <span className="tr2-node-label">{x.label}</span>{' '}
                    <span className="tr2-node-sub demo-mono">{x.detail}</span>
                  </span>{' '}
                  <span className="tr2-node-total">{fmt(sumTo2(x.id))}</span>
                  {' '}
                {hidden('times served in the last hour. Focus on this example.')}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <table className="sr-only">
        <caption>Call graph as a table: calls over the last hour on each link</caption>
        <thead>
          <tr><th scope="col">From</th><th scope="col">To</th><th scope="col">Calls</th></tr>
        </thead>
        <tbody>
          {[...edges1, ...edges2].map((e) => (
            <tr key={e.id}>
              <th scope="row">{nameOf(e.from)}</th>
              <td>{nameOf(e.to)}</td>
              <td>{fmt(e.count)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="tr2-legend">
        <span><svg width="28" height="8" viewBox="0 0 28 8" aria-hidden="true"><path d="M0 4h28" data-tone="rest" /></svg>HTTP call</span>
        <span><svg width="28" height="8" viewBox="0 0 28 8" aria-hidden="true"><path d="M0 4h28" data-tone="mcp" /></svg>MCP tool call</span>
        <span><svg width="28" height="8" viewBox="0 0 28 8" aria-hidden="true"><path d="M0 4h28" data-tone="event" /></svg>Kafka message to a subscriber</span>
        <span><svg width="28" height="8" viewBox="0 0 28 8" aria-hidden="true"><path d="M0 4h28" data-tone="live" /></svg>latest call</span>
        <span className="tr2-legend-end">
          Node borders carry the protocol: <span className="demo-mono" data-tone="rest">REST</span> · <span className="demo-mono" data-tone="event">EVENT</span> ·{' '}
          <span className="demo-mono" data-tone="mcp">MCP</span>
        </span>
      </div>
    </section>
  );
}

function Edges({ edges, labelAt }: { edges: EdgeView[]; labelAt: string }) {
  return (
    <div className="tr2-graph-edges" aria-hidden="true">
      {edges.map((e) => (
        <svg key={e.id} viewBox={`0 0 100 ${HEIGHT}`} preserveAspectRatio="none" style={{ opacity: e.on ? 1 : 0.22 }}>
          <path d={e.d} data-tone={e.flash ? 'live' : e.tone} style={e.flash ? undefined : { strokeWidth: e.width.toFixed(2) }} vectorEffect="non-scaling-stroke" />
        </svg>
      ))}
      {edges.map((e) => (
        <span key={e.id} className="tr2-edge-count" data-tone={e.flash ? 'live' : e.tone} data-dim={e.on ? undefined : ''} style={{ left: labelAt, top: `${e.top}px` }}>
          {fmt(e.count)}
        </span>
      ))}
    </div>
  );
}
