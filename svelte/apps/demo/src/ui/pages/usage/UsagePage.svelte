<script lang="ts">
  import '@microcks/demo-styles/pages/usage/usage.css';
  import { USAGE_PERIODS, type UsagePeriod } from '@microcks/demo-core/domain/observe';
  import { ApiBadge, SectionLabel, Segmented, Select, SplitPane, SplitPaneMain, SplitPaneSide } from '@microcks/deep-ink';
  import { PageHeader, RouterLink, useNavigate, usePageTitle, useParams, useQuery, useUseCases } from '@/ui/app';
  import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
  import ConformanceSection from './ConformanceSection.svelte';
  import HourlyChart from './HourlyChart.svelte';
  import OperationsTable from './OperationsTable.svelte';
  import UsageHeatmap from './UsageHeatmap.svelte';
  import UsageKpis from './UsageKpis.svelte';

  /** `/metrics/:serviceId?`: mock usage of one service or of all, and the conformance of every service. */
  const params = useParams();
  const scope = $derived(params.serviceId ?? 'all');
  usePageTitle(() => 'Usage & conformance · Microcks');
  const uc = useUseCases();
  const navigate = useNavigate();
  const selectId = $props.id();
  let period = $state<UsagePeriod>('today');
  const services = useQuery(() => uc.catalog.listServices(), () => []);
  const scopes = useQuery(() => uc.observe.usageScopes(), () => []);
  const usage = useQuery(() => uc.observe.usage(scope, period), () => [scope, period]);
  const domains = useQuery(() => uc.observe.conformanceByDomain(), () => []);
  const view = $derived(usage.data);
  const service = $derived((services.data ?? []).find((s) => s.id === scope));
</script>

{#snippet description()}<span class="us-scope"
    >{#if service}<RouterLink class="us-scope-badge" to={`/services/${service.id}`}
        ><ApiBadge protocol={service.protocol} name={service.name} version={service.version} size="sm" /></RouterLink
      >{/if}<span>{view?.scopeLine}</span></span
  >{/snippet}

{#snippet actions()}<div class="us-controls"
    ><div class="us-control"
      ><SectionLabel as="label" htmlFor={selectId}>Service</SectionLabel><Select
        id={selectId}
        class="us-select"
        value={scope}
        onchange={(e) => navigate(e.currentTarget.value === 'all' ? '/metrics' : `/metrics/${e.currentTarget.value}`)}
        >{#each scopes.data ?? [{ id: 'all', label: 'All services' }] as o (o.id)}<option value={o.id}>{o.label}</option>{/each}</Select
      ></div
    ><div class="us-control"
      ><SectionLabel aria-hidden="true">Period</SectionLabel><Segmented
        spacing="wide"
        label="Period"
        options={USAGE_PERIODS}
        value={period}
        onchange={(id) => (period = id as UsagePeriod)}
      /></div
    ></div
  >{/snippet}

<PageHeader title="Usage & conformance" size="lg" description={view ? description : undefined} {actions} /><div class="us-page"
  >{#if usage.status === 'loading' && !view}<LoadingBlock label="usage" />{/if}{#if usage.status === 'error'}<ErrorBlock
      error={usage.error}
      what="Usage"
      onretry={usage.reload}
    />{/if}{#if view}<div class="us-page" aria-busy={usage.status === 'loading'}
      ><UsageKpis {view} />{#key `${view.scope}-${view.period}`}<HourlyChart {view} />{/key}<SplitPane
        sideWidth="380px"
        sideMax="560px"
        mainWidth="480px"
        gap="16px"
        keepSideMax
        ><SplitPaneSide>{#key `h-${view.scope}`}<UsageHeatmap {view} />{/key}</SplitPaneSide><SplitPaneMain><OperationsTable {view} /></SplitPaneMain
        ></SplitPane
      ></div
    >{/if}{#if domains.data}<ConformanceSection domains={domains.data} {view} selected={scope} />{/if}</div
>
