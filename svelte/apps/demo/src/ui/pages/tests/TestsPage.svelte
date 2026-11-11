<script lang="ts">
  import '@microcks/demo-styles/pages/tests/tests.css';
  import { ApiBadge } from '@microcks/deep-ink';
  import { ButtonRouterLink, PageHeader, RouterLink, useParams, usePageTitle, useQuery, useUseCases } from '@/ui/app';
  import { TEST_RESULT_WORD } from '@/ui/app/outcomes';
  import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
  import History from './History.svelte';
  import OtherServices from './OtherServices.svelte';
  import { historyDescription, LAST_TEST_TONE, latestRun, passRateOf, serviceLinkLabel } from './history';
  import { rateTone, timelineRuns } from './timeline';

  /** `/tests/service/:serviceId`: the conformance history of a service, its timeline and its runs. */
  usePageTitle(() => 'Test history · Microcks');
  const uc = useUseCases();
  const params = useParams();
  const serviceId = $derived(params.serviceId ?? '');
  const query = useQuery(
    () => Promise.all([uc.testing.listForService(serviceId, { limit: 1000 }), uc.testing.getCreateForm(serviceId)]),
    () => [serviceId],
  );
  const data = $derived(query.data);
  const service = $derived(data?.[1].services.find((s) => s.id === serviceId));
  const runs = $derived(data?.[0] ?? []);
  const latest = $derived(latestRun(runs));
  const recent = $derived(timelineRuns(runs));
  const passRate = $derived(passRateOf(recent));
  const operations = $derived(data?.[1].targets.find((t) => t.serviceId === serviceId)?.operations ?? []);
</script>

{#snippet leading()}{#if service}<RouterLink class="tests-title-badge" to={`/services/${serviceId}`} aria-label={serviceLinkLabel(service)}
      ><ApiBadge protocol={service.protocol} name={service.name} version={service.version} size="xl" /></RouterLink
    >{/if}{/snippet}

{#snippet actions()}<ButtonRouterLink variant="primary" icon="plus" to={`/tests/create?service=${serviceId}`}>New test</ButtonRouterLink>{/snippet}

<PageHeader
  title="Test history"
  variant="subtitle"
  breadcrumb={[
    { label: 'APIs & Services', to: '/services' },
    ...(service ? [{ label: `${service.name} ${service.version}`, to: `/services/${serviceId}` }] : []),
    { label: 'Test history' },
  ]}
  leading={service ? leading : undefined}
  descriptionWidth={760}
  description={service ? historyDescription(service) : undefined}
  descriptionTone="secondary"
  align="start"
  {actions}
/>{#if service}<div class="tests-head-extra"
    ><ul class="tests-kpis" aria-label="Test summary"
      >{#if service.conformance !== null}<li
          ><ApiBadge label="conformance" value={`${service.conformance}%`} status={rateTone(service.conformance)} /></li
        >{/if}{#if latest}<li
          ><ApiBadge label="last test" value={TEST_RESULT_WORD[latest.result].toLowerCase()} status={LAST_TEST_TONE[latest.result]} /></li
        >{/if}{#if passRate !== null}<li
          ><ApiBadge label={`pass rate · ${recent.length} runs`} value={`${passRate}%`} status={rateTone(passRate)} /></li
        >{/if}</ul
    >{#if service.protocol !== 'A2A'}<OtherServices />{/if}</div
  >{/if}{#if query.status === 'loading' && !data}<LoadingBlock label="the test history" />{/if}{#if query.status === 'error'}<ErrorBlock
    error={query.error}
    what="Test history"
    onretry={query.reload}
  />{/if}{#if data}{#key serviceId}<History runs={data[0]} {operations} />{/key}{/if}
