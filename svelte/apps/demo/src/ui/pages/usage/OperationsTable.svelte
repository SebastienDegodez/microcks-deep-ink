<script lang="ts">
  import '@microcks/demo-styles/pages/usage/table.css';
  import { formatCount, formatTrend, type UsageTableRow, type UsageView } from '@microcks/demo-core/domain/observe';
  import { ApiBadge, LiveIndicator, MethodTag, Panel } from '@microcks/deep-ink';
  import { RouterLink } from '@/ui/app';
  import { splitVersion, trendDir } from './figures';

  /** Invocations per operation (one service) or per service (all), with share bars and trends. */
  let { view }: { view: UsageView } = $props();
  const titleId = $props.id();
  const table = $derived(view.table);
  const one = $derived(view.scope !== 'all');
  const max = $derived(Math.max(1, ...table.rows.map((r) => r.calls)));
</script>

{#snippet firstCell(row: UsageTableRow)}{#if one}<RouterLink class="us-ops-op" to={`/services/${view.scope}/operations/${row.id}`}
      >{#if row.method}<MethodTag method={row.method} protocol={row.protocol ?? 'REST'} />{/if}<span class="us-ops-path">{row.name}</span></RouterLink
    >{:else}{@const [name, version] = splitVersion(row.name)}<RouterLink class="us-ops-svc" to={`/services/${row.id}`}
      ><ApiBadge protocol={row.protocol ?? 'REST'} {name} {version} size="sm" /></RouterLink
    >{/if}{/snippet}

<Panel class="us-table-card" padding="lg" aria-labelledby={titleId}
  ><div class="us-table-head"><h2 id={titleId}>{table.title}</h2><span>{table.subtitle}</span></div
  ><div class="table-wrap us-table-wrap"
    ><table class="table us-ops" aria-labelledby={titleId}
      ><thead
        ><tr
          ><th scope="col">{table.firstColumn}</th><th scope="col">{table.secondColumn}</th><th scope="col" data-align="end">Invocations</th><th scope="col"
            >Share</th
          ><th scope="col" data-align="end">vs previous</th><th scope="col">Last call</th></tr
        ></thead
      ><tbody
        >{#each table.rows as r (r.id)}<tr
            ><th scope="row">{@render firstCell(r)}</th><td class="us-ops-detail">{r.detail}</td><td class="us-ops-calls" data-align="end"
              >{formatCount(r.calls)}</td
            ><td
              ><span class="us-ops-share"
                ><span class="us-ops-share-track" aria-hidden="true"
                  ><span data-max={r.calls === max ? '' : undefined} style="width: {r.width}%"></span></span
                ><span class="us-ops-share-pct">{r.share}<!---->%</span></span
              ></td
            ><td class="us-ops-trend" data-align="end" data-direction={trendDir(r.trend)}>{formatTrend(r.trend)}</td><td
              class="us-ops-last"
              data-live={r.live ? '' : undefined}
              >{#if r.live}<LiveIndicator class="us-ops-live" variant="dot" aria-hidden="true" />{/if}{r.last}{#if r.live}<span class="sr-only"
                  >{', live'}</span
                >{/if}</td
            ></tr
          >{/each}</tbody
      ><tfoot
        ><tr
          ><th scope="row">Total</th><td></td><td class="us-ops-calls" data-align="end">{formatCount(table.total)}</td><td class="us-ops-share-pct">100%</td><td
            class="us-ops-trend"
            data-align="end"
            data-direction={trendDir(table.trend)}>{formatTrend(table.trend)}</td
          ><td></td></tr
        ></tfoot
      ></table
    ></div
  >{#if table.note}<p class="us-table-note">{table.note}</p>{/if}</Panel
>
