<script lang="ts">
  import type { FlowCounts, TraceCall, TraceTopology } from '@microcks/demo-core/domain/observe';
  import { Icon, SectionLabel } from '@microcks/deep-ink';
  import { fmt } from '@/ui/app/format';
  import { exampleKind, graphEdges, HEIGHT, nameOf, sumFrom, sumTo, touches, type EdgeView, type GraphFilter } from './graph';

  interface Props {
    topology: TraceTopology;
    counts: FlowCounts;
    filter: GraphFilter;
    focus: string;
    onfocusnode: (id: string) => void;
    /** The latest call: its edges are drawn in the live colour for a moment. */
    flash?: TraceCall;
  }

  /** Call graph: clients → mock endpoints → dispatched examples. Nodes are toggle buttons that focus the list. */
  let { topology, counts, filter, focus, onfocusnode, flash }: Props = $props();
  const graph = $derived(graphEdges(topology, counts, filter, focus, flash));
  const edges = $derived([...graph.edges1, ...graph.edges2]);

  // The name is the visible text in order, between a hidden prefix and a hidden suffix (RGAA 6.1). A node outside the
  // filters or the focus is dimmed by its chrome only, so its text keeps a 4.5:1 contrast (RGAA 3.2).
  const nodeProps = (id: string) => ({
    type: 'button' as const,
    class: 'tr2-node',
    'aria-pressed': focus === id,
    'data-dim': focus === id || touches(edges, id) ? undefined : '',
    onclick: () => onfocusnode(id),
  });
</script>

{#snippet hidden(text: string)}<span class="sr-only">{text}</span>{/snippet}

{#snippet edgeLayer(list: EdgeView[], labelAt: string)}<div class="tr2-graph-edges" aria-hidden="true"
    >{#each list as e (e.id)}<svg viewBox="0 0 100 {HEIGHT}" preserveAspectRatio="none" style="opacity: {e.on ? 1 : 0.22}"
        ><path
          d={e.d}
          data-tone={e.flash ? 'live' : e.tone}
          style={e.flash ? undefined : `stroke-width: ${e.width.toFixed(2)}`}
          vector-effect="non-scaling-stroke"
        /></svg
      >{/each}{#each list as e (e.id)}<span
        class="tr2-edge-count"
        data-tone={e.flash ? 'live' : e.tone}
        data-dim={e.on ? undefined : ''}
        style="left: {labelAt}; top: {e.top}px">{fmt(e.count)}</span
      >{/each}</div
  >{/snippet}

<section aria-labelledby="tr2-graph-title" class="tr2-graph"
  ><div class="tr2-graph-head"
    ><h2 id="tr2-graph-title">Call graph</h2
    ><span class="tr2-muted">Edge labels count calls over the last hour. Select a node to focus on its calls.</span></div
  ><div class="tr2-graph-scroll"
    ><div class="tr2-graph-grid"
      ><SectionLabel size="sm">Clients</SectionLabel><span aria-hidden="true"></span><SectionLabel size="sm">Mock endpoints</SectionLabel
      ><span aria-hidden="true"></span><SectionLabel size="sm">Dispatched example</SectionLabel
      ><div class="tr2-graph-col" data-col="clients"
        >{#each topology.clients as c (c.id)}<button {...nodeProps(c.id)} data-kind={c.kind.toLowerCase()}
            >{@render hidden('Client')}{' '}<span class="tr2-node-text"
              ><span class="tr2-node-label demo-mono">{c.label}</span>{' '}<span class="tr2-node-sub demo-mono">{c.detail}</span></span
            >{' '}<span class="tr2-node-total">{fmt(sumFrom(graph.edges1, c.id))}</span>{' '}{@render hidden(
              'calls in the last hour. Focus on this client.',
            )}</button
          >{/each}</div
      >{@render edgeLayer(graph.edges1, '76%')}<div class="tr2-graph-col" data-col="endpoints"
        >{#each topology.endpoints as e (e.id)}{@const isEvent = e.kinds.includes('EVENT')}<button
            {...nodeProps(e.id)}
            data-kind={isEvent ? 'event' : 'rest'}
            >{@render hidden('Endpoint')}{' '}<span class="tr2-method" data-size="node" data-tone={isEvent || e.method === 'PATCH' ? 'event' : 'rest'}
              >{e.method}</span
            >{' '}<span class="tr2-node-text"
              ><span class="tr2-node-label demo-mono">{e.label}</span>{' '}<span class="tr2-node-sub">{e.detail}</span></span
            >{' '}<span class="tr2-node-total">{fmt(sumTo(graph.edges1, e.id))}</span>{' '}{@render hidden(
              'calls in the last hour. Focus on this endpoint.',
            )}</button
          >{/each}</div
      >{@render edgeLayer(graph.edges2, '50%')}<div class="tr2-graph-col" data-col="examples"
        >{#each topology.examples as x (x.id)}<button {...nodeProps(x.id)} data-kind={exampleKind(topology, x)}
            >{@render hidden('Example, status')}{' '}<span class="tr2-code" data-miss={x.ok ? undefined : ''}
              ><Icon name={x.ok ? 'check' : 'warning'} size={11} stroke-width={3} />{x.code}</span
            >{' '}<span class="tr2-node-text"
              ><span class="tr2-node-label">{x.label}</span>{' '}<span class="tr2-node-sub demo-mono">{x.detail}</span></span
            >{' '}<span class="tr2-node-total">{fmt(sumTo(graph.edges2, x.id))}</span>{' '}{@render hidden(
              'times served in the last hour. Focus on this example.',
            )}</button
          >{/each}</div
      ></div
    ></div
  ><table class="sr-only"
    ><caption>Call graph as a table: calls over the last hour on each link</caption
    ><thead><tr><th scope="col">From</th><th scope="col">To</th><th scope="col">Calls</th></tr></thead
    ><tbody
      >{#each edges as e (e.id)}<tr
          ><th scope="row">{nameOf(topology, e.from)}</th><td>{nameOf(topology, e.to)}</td><td>{fmt(e.count)}</td></tr
        >{/each}</tbody
    ></table
  ><div class="tr2-legend"
    ><span><svg width="28" height="8" viewBox="0 0 28 8" aria-hidden="true"><path d="M0 4h28" data-tone="rest" /></svg>HTTP call</span
    ><span><svg width="28" height="8" viewBox="0 0 28 8" aria-hidden="true"><path d="M0 4h28" data-tone="mcp" /></svg>MCP tool call</span
    ><span
      ><svg width="28" height="8" viewBox="0 0 28 8" aria-hidden="true"><path d="M0 4h28" data-tone="event" /></svg>Kafka message to a subscriber</span
    ><span><svg width="28" height="8" viewBox="0 0 28 8" aria-hidden="true"><path d="M0 4h28" data-tone="live" /></svg>latest call</span
    ><span class="tr2-legend-end"
      >Node borders carry the protocol: <span class="demo-mono" data-tone="rest">REST</span>{' · '}<span class="demo-mono" data-tone="event"
        >EVENT</span
      >{' ·'}<!---->{' '}<span class="demo-mono" data-tone="mcp">MCP</span></span
    ></div
  ></section
>
