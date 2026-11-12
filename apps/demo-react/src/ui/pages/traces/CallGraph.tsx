import type { FlowCounts, TraceCall, TraceTopology } from '@/domain/observe';
import { fmt } from '@/ui/app/format';
import { Icon, SectionLabel } from '@microcks/deep-ink';
import { exampleKind, graphEdges, HEIGHT, nameOf, sumFrom, sumTo, touches, type EdgeView, type GraphFilter } from './graph';

interface Props {
  topology: TraceTopology;
  counts: FlowCounts;
  filter: GraphFilter;
  focus: string;
  onFocus: (id: string) => void;
  /** The latest call: its edges are drawn in the live colour for a moment. */
  flash?: TraceCall;
}

/** Call graph: clients → mock endpoints → dispatched examples. Nodes are toggle buttons that focus the list. */
export function CallGraph({ topology, counts, filter, focus, onFocus, flash }: Props) {
  const { clients, endpoints, examples } = topology;
  const { edges1, edges2 } = graphEdges(topology, counts, filter, focus, flash);
  const edges = [...edges1, ...edges2];

  // The name is the visible text in order, between a hidden prefix and a hidden suffix (RGAA 6.1). A node outside the
  // filters or the focus is dimmed by its chrome only, so its text keeps a 4.5:1 contrast (RGAA 3.2).
  const nodeProps = (id: string) => ({
    type: 'button' as const,
    className: 'tr2-node',
    'aria-pressed': focus === id,
    'data-dim': focus === id || touches(edges, id) ? undefined : '',
    onClick: () => onFocus(id),
  });
  const hidden = (text: string) => <span className="sr-only">{text}</span>;

  return (
    <section aria-labelledby="tr2-graph-title" className="tr2-graph">
      <div className="tr2-graph-head">
        <h2 id="tr2-graph-title">Call graph</h2>
        <span className="tr2-muted">Edge labels count calls over the last hour. Select a node to focus on its calls.</span>
      </div>
      <div className="tr2-graph-scroll">
        <div className="tr2-graph-grid">
          <SectionLabel size="sm">Clients</SectionLabel>
          <span aria-hidden="true" />
          <SectionLabel size="sm">Mock endpoints</SectionLabel>
          <span aria-hidden="true" />
          <SectionLabel size="sm">Dispatched example</SectionLabel>

          <div className="tr2-graph-col" data-col="clients">
            {clients.map((c) => (
              <button key={c.id} {...nodeProps(c.id)} data-kind={c.kind.toLowerCase()}>
                {hidden('Client')}{' '}
                <span className="tr2-node-text">
                  <span className="tr2-node-label demo-mono">{c.label}</span>{' '}
                  <span className="tr2-node-sub demo-mono">{c.detail}</span>
                </span>{' '}
                <span className="tr2-node-total">{fmt(sumFrom(edges1, c.id))}</span>
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
                  <span className="tr2-node-total">{fmt(sumTo(edges1, e.id))}</span>
                  {' '}
                {hidden('calls in the last hour. Focus on this endpoint.')}
                </button>
              );
            })}
          </div>
          <Edges edges={edges2} labelAt="50%" />
          <div className="tr2-graph-col" data-col="examples">
            {examples.map((x) => {
              return (
                <button key={x.id} {...nodeProps(x.id)} data-kind={exampleKind(topology, x)}>
                  {hidden('Example, status')}{' '}
                  <span className="tr2-code" data-miss={x.ok ? undefined : ''}>
                    <Icon name={x.ok ? 'check' : 'warning'} size={11} strokeWidth={3} />
                    {x.code}
                  </span>{' '}
                  <span className="tr2-node-text">
                    <span className="tr2-node-label">{x.label}</span>{' '}
                    <span className="tr2-node-sub demo-mono">{x.detail}</span>
                  </span>{' '}
                  <span className="tr2-node-total">{fmt(sumTo(edges2, x.id))}</span>
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
          {edges.map((e) => (
            <tr key={e.id}>
              <th scope="row">{nameOf(topology, e.from)}</th>
              <td>{nameOf(topology, e.to)}</td>
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
