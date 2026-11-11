<script lang="ts">
  import '@microcks/demo-styles/pages/explore-kit/explore.css';
  import '@microcks/demo-styles/pages/service/service.css';
  import { PageHeader, useParams, useQuery, useUseCases } from '@/ui/app';
  import { LoadingBlock } from '@/ui/app/states';
  import AgentPage from '../agent/AgentPage.svelte';
  import ApiServicePage from './ApiServicePage.svelte';

  /** One route for every service: an A2A agent gets its own screen (18), the others the service screen (05). */
  const params = useParams();
  const uc = useUseCases();
  const serviceId = $derived(params.serviceId ?? '');
  const service = useQuery(() => uc.catalog.getService(serviceId), () => [uc, serviceId]);
</script>

{#if service.data?.protocol === 'A2A'}<AgentPage />{:else if !service.data && service.status === 'loading'}<PageHeader
    title="Service"
  /><LoadingBlock label="the service" />{:else}<ApiServicePage />{/if}
