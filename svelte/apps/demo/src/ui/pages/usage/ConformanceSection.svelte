<script lang="ts">
  import '@microcks/demo-styles/pages/usage/conformance.css';
  import { BAND_TEXT, conformanceBand, treemapRows, type ConformanceItem, type DomainConformance, type UsageView } from '@microcks/demo-core/domain/observe';
  import { Icon, Panel, SplitPane, SplitPaneMain, SplitPaneSide } from '@microcks/deep-ink';
  import { RouterLink } from '@/ui/app';
  import IndexCard from './IndexCard.svelte';
  import { BAND_ICON, ops, rectSize } from './conformance';

  interface Props {
    domains: DomainConformance[];
    view: UsageView | undefined;
    selected: string;
  }

  /** "Conformance" section: risk treemap by domain and index vs current score. Always over all services. */
  let { domains, view, selected }: Props = $props();
  const treemapTitleId = $props.id();
  const rows = $derived(treemapRows(domains));
</script>

{#snippet serviceRect(item: ConformanceItem)}{@const band = conformanceBand(item.score)}{@const icon = BAND_ICON[band]}<RouterLink
    class="treemap-rect"
    data-band={band}
    data-narrow={item.operations === 1 ? '' : undefined}
    aria-current={item.serviceId === selected ? 'true' : undefined}
    to={`/services/${item.serviceId}`}
    ><span class="treemap-rect-text"
      ><span class="treemap-rect-name">{item.name}</span><span class="sr-only">{', '}</span><span class="treemap-rect-meta"
        >{ops(item.operations)}<!----> · <!---->{item.protocol}</span
      ></span
    ><span class="treemap-rect-score" data-size={rectSize(item)}
      >{#if icon}<Icon name={icon} size={13} />{/if}{#if item.score === null}<span class="sr-only">{', '}</span>untested{:else}<span class="sr-only"
          >{', conformance '}</span
        >{item.score}<!---->%<span class="sr-only">{', '}<!---->{BAND_TEXT[band]}</span>{/if}</span
    ></RouterLink
  >{/snippet}

{#snippet treemap()}<Panel class="treemap-card" padding="lg" aria-labelledby={treemapTitleId}
    ><div class="card-head"
      ><h3 id={treemapTitleId}>Conformance risk by domain</h3><p>Grouped by the <code>domain</code> label · area = number of operations · the lower the score, the higher the risk</p></div
    ><div class="treemap"
      >{#each rows as row, r (r)}<div class="treemap-row" style="flex: {row.operations} 1 0px"
          >{#each row.domains as d (d.domain)}{@const band = conformanceBand(d.score)}<section
              class="treemap-domain"
              style="flex: {d.operations} 1 0px"
              aria-label={d.label}
              ><div class="treemap-domain-head"
                ><span class="treemap-domain-label">{d.label}</span><span class="treemap-domain-avg" data-band={band}
                  >{d.score === null ? 'untested' : `avg ${d.score}%`}<!----> · <!---->{ops(d.operations)}</span
                ></div
              ><ul class="treemap-services"
                >{#each d.items ?? [] as it (it.serviceId)}<li style="flex: {it.operations} 1 0px">{@render serviceRect(it)}</li>{/each}</ul
              ></section
            >{/each}</div
        >{/each}</div
    ><div class="treemap-legend"
      ><span><span class="treemap-swatch" data-band="ok" aria-hidden="true"></span>≥ 80% conformant</span><span
        ><span class="treemap-swatch" data-band="partial" aria-hidden="true"></span>50–79% partial</span
      ><span><span class="treemap-swatch" data-band="risk" aria-hidden="true"></span>&lt; 50% at risk</span><span
        ><span class="treemap-swatch" data-band="untested" aria-hidden="true"></span>never tested</span
      ><span class="treemap-legend-end">Group by <code>domain</code> · set in Administration</span></div
    ></Panel
  >{/snippet}

<!-- A plain div: the "Conformance" key figure is already a region with that name (RGAA 9.2, unique landmarks). --><div class="conf-section"
  ><div class="conf-section-head"
    ><h2>Conformance</h2><p
      >How far your implementations follow their contracts, from the latest test of each service. Always computed over all services, whatever the selection above.</p
    ></div
  ><SplitPane sideWidth="360px" sideMax="none" mainWidth="560px" gap="16px"
    ><SplitPaneMain>{@render treemap()}</SplitPaneMain>{#if view}<SplitPaneSide><IndexCard {view} {domains} {selected} /></SplitPaneSide>{/if}</SplitPane
  ></div
>
