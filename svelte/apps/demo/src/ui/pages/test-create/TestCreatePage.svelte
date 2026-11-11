<script lang="ts">
  import '@microcks/demo-styles/pages/test-create/test-create.css';
  import { ApiBadge } from '@microcks/deep-ink';
  import { PageHeader, useQuery, useSearchParams, useUseCases, usePageTitle } from '@/ui/app';
  import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
  import { lastTestStatus, serviceLabelOf } from './form';
  import TestForm from './TestForm.svelte';

  /** `/tests/create`: run a conformance test of a service against a deployed implementation, with its CI snippet. */
  usePageTitle(() => 'Run a test · Microcks');
  const uc = useUseCases();
  const [params] = useSearchParams();
  const serviceParam = $derived(params.get('service') ?? undefined);
  const query = useQuery(() => uc.testing.getCreateForm(serviceParam), () => [serviceParam]);
  let chosen = $state<string | undefined>(undefined);
  const form = $derived(query.data);
  const serviceId = $derived(chosen ?? form?.defaults.serviceId);
  const service = $derived(form?.services.find((s) => s.id === serviceId));
  const target = $derived(form?.targets.find((t) => t.serviceId === serviceId));
  const serviceLabel = $derived(serviceLabelOf(service, 'Service'));
</script>

{#snippet lastTest()}{#if target}<ApiBadge label="last test" value={target.lastTest.text} status={lastTestStatus(target.lastTest)} />{/if}{/snippet}

<PageHeader
  title="Run a test"
  breadcrumb={[{ label: 'APIs & Services', to: '/services' }, { label: serviceLabel, to: service ? `/services/${service.id}` : '/services' }, { label: 'New test' }]}
  description="Replay the contract's examples against a deployed implementation and check that it conforms. Every choice below is mirrored, line by line, in the CI snippet on the right."
  descriptionTone="secondary"
  actions={target ? lastTest : undefined}
/>{#if query.status === 'loading' && !form}<LoadingBlock label="the test form" />{/if}{#if query.status === 'error'}<ErrorBlock
    error={query.error}
    what="The test form"
    onretry={query.reload}
  />{/if}{#if form && serviceId}{#key serviceParam ?? 'default'}<TestForm {form} chosen={serviceId} onchoose={(id) => (chosen = id)} />{/key}{/if}
