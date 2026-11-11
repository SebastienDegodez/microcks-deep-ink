<script lang="ts">
  import { conformanceBand, gapList, type DomainConformance, type UsageView } from '@microcks/demo-core/domain/observe';
  import { Icon, Panel } from '@microcks/deep-ink';
  import { RouterLink } from '@/ui/app';
  import { PROTO_ATTR, TREND_ICON, indexBarLabel } from './conformance';

  interface Props {
    view: UsageView;
    domains: DomainConformance[];
    selected: string;
  }

  /** Conformance index vs current score of the selection, then the gap of each service. Part of `ConformanceSection`. */
  let { view, domains, selected }: Props = $props();
  const titleId = $props.id();
  const c = $derived(view.conformance);
  const band = $derived(conformanceBand(c.score));
  const index = $derived(c.index ?? 0);
  const gaps = $derived(gapList(domains));
</script>

<Panel class="index-card" padding="lg" aria-labelledby={titleId}
  ><div class="card-head"><h3 id={titleId}>Conformance index vs current score</h3><p>{c.subject}</p></div
  ><dl class="index-figures"
    ><div><dt>Current score</dt><dd class="index-figure" data-band={band}>{c.score === null ? '—' : `${c.score}%`}</dd></div
    ><div><dt>Conformance index</dt><dd class="index-figure">{index}<!---->%</dd></div
    >{#if c.trend}<div
        ><dt>Trend</dt><dd class="index-trend" data-direction={c.direction ?? 'stable'}
          ><Icon name={TREND_ICON[c.direction ?? 'stable']} size={14} />{c.trend}</dd
        ></div
      >{/if}</dl
  ><div class="index-bar" role="img" aria-label={indexBarLabel(view.scope, c.score, index)}
    ><div class="index-bar-track"
      ><span class="index-bar-index" style="width: {index}%"></span><span class="index-bar-score" data-band={band} style="width: {c.score ?? 0}%"
      ></span></div
    ><div class="index-bar-axis" aria-hidden="true"><span>0%</span><span>50%</span><span>100%</span></div></div
  ><dl class="index-defs"
    ><div
      ><dt><span class="index-swatch" data-kind="index" aria-hidden="true"></span>Conformance index:</dt>{' '}<dd
        >the maximum score your tests can reach with the examples attached to the contract. It grows with the number of examples per operation and the coverage of dispatching rules.</dd
      ></div
    ><div
      ><dt><span class="index-swatch" data-band={band} aria-hidden="true"></span>Current score:</dt>{' '}<dd>the score of the latest test. It equals the index only when every operation passes.</dd></div
    ></dl
  >{#if c.advice}<div class="index-note" role="note"><Icon name="info" size={16} /><span>{c.advice}</span></div>{/if}<div class="gap-list"
    ><h4>Gap per service</h4><ul
      >{#each gaps as g (g.serviceId)}{@const b = conformanceBand(g.score)}<li
          ><RouterLink class="gap-row" to={`/services/${g.serviceId}`} aria-current={g.serviceId === selected ? 'true' : undefined}
            ><span class="gap-proto" data-protocol={PROTO_ATTR[g.protocol]}>{g.protocol}</span><span class="sr-only">{' '}</span><span class="gap-name"
              >{g.name}</span
            ><span class="gap-bar" aria-hidden="true"
              ><span class="index-bar-index" style="width: {g.index}%"></span><span class="index-bar-score" data-band={b} style="width: {g.score ?? 0}%"
              ></span></span
            ><span class="gap-pair" data-band={b}
              ><span class="sr-only">{': score '}</span>{#if g.score === null}<span aria-hidden="true">—</span><span class="sr-only">never tested</span
                >{:else}{g.score}{/if}<span aria-hidden="true">{' / '}</span><span class="sr-only">{', index '}</span>{g.index}<!---->%</span
            ></RouterLink
          ></li
        >{/each}</ul
    ></div
  ></Panel
>
