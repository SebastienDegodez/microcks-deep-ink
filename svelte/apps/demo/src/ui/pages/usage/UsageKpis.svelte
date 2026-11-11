<script lang="ts">
  import '@microcks/demo-styles/pages/usage/kpis.css';
  import { formatCount, type UsageView } from '@microcks/demo-core/domain/observe';
  import { Icon, LiveIndicator, StatCard, StatGrid } from '@microcks/deep-ink';
  import { RouterLink } from '@/ui/app';
  import { conformanceValue, scoreTone, trendDir } from './figures';

  /** The four key figures of the Usage page: invocations, peak, last request and conformance. */
  let { view }: { view: UsageView } = $props();
  const kpis = $derived(view.kpis);
  const conformance = $derived(view.conformance);
  const direction = $derived(trendDir(kpis.growth));
</script>

{#snippet live()}<LiveIndicator size="sm" variant="inline" />{/snippet}

<StatGrid label="Key figures"
  ><StatCard title={`Mock invocations · ${view.periodLabel}`} value={formatCount(kpis.total)}
    ><p class="kpi-trend" data-direction={direction}><Icon name={`trend-${direction}`} size={14} />{kpis.trendText}</p></StatCard
  ><StatCard title={kpis.peakTitle} value={formatCount(kpis.peak)}><p>{kpis.peakWhen}</p></StatCard
  ><StatCard title="Last request" action={live} value={kpis.lastCallAgo}
    ><RouterLink class="kpi-path" to={view.scope === 'all' ? '/traces' : `/traces?service=${view.scope}`}>{kpis.lastCall}</RouterLink></StatCard
  ><StatCard title={conformance.title} value={conformanceValue(conformance.score)} tone={scoreTone(conformance.score)}
    ><p>{conformance.subtitle}</p></StatCard
  ></StatGrid
>
