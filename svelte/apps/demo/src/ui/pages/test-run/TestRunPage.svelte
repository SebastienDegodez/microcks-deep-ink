<script lang="ts">
  import '@microcks/demo-styles/pages/test-run/test-run.css';
  import { PageHeader, useParams, usePageTitle, useQuery, useUseCases } from '@/ui/app';
  import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
  import RunView from './RunView.svelte';

  /** Screen 09, `/tests/runner/:testRunId`: a test run replayed step by step, its verdict, its log and its results. */
  const params = useParams();
  const testRunId = $derived(params.testRunId ?? '');
  usePageTitle(() => `Test run #${testRunId} · Microcks`);
  const uc = useUseCases();
  const query = useQuery(() => uc.testing.get(testRunId), () => [testRunId]);
</script>

{#if query.data}{#key query.data.id}<RunView base={query.data} />{/key}{:else}<PageHeader
    title={`Run #${testRunId}`}
    breadcrumb={[{ label: 'Tests', to: '/tests' }, { label: `Run #${testRunId}` }]}
  />{#if query.status === 'loading'}<LoadingBlock label="the test run" />{/if}{#if query.status === 'error'}<ErrorBlock
      error={query.error}
      what="Test run"
      onretry={query.reload}
    />{/if}{/if}
