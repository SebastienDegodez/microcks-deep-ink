<script lang="ts">
  import '@microcks/demo-styles/pages/workflows/workflows.css';
  import '@microcks/demo-styles/pages/workflow-run/workflow-run.css';
  import { isRunScenario } from '@microcks/demo-core/application/arazzo';
  import { PageHeader, useParams, usePageTitle, useQuery, useSearchParams, useUseCases } from '@/ui/app';
  import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
  import RunForm from './RunForm.svelte';

  const params = useParams();
  const [search] = useSearchParams();
  const docId = $derived(params.docId ?? '');
  const workflowId = $derived(params.workflowId ?? '');
  const scenario = $derived.by(() => {
    const value = search.get('scenario');
    return isRunScenario(value) ? value : undefined;
  });
  const exampleParam = $derived(search.get('example') ?? undefined);
  const uc = useUseCases();
  usePageTitle('Run a workflow · Microcks');
  // The form below is keyed so that changing workflow or preset restarts it from the defaults.
  const setup = useQuery(() => uc.arazzo.getRunSetup(docId, workflowId, scenario), () => [docId, workflowId, scenario]);
</script>

{#if setup.status === 'error'}<PageHeader title="Run workflow" /><ErrorBlock
    error={setup.error}
    onretry={setup.reload}
    title="The run form could not be loaded"
  />{:else if !setup.data}<PageHeader title="Run workflow" /><LoadingBlock label="the run form" rows={6} />{:else}{@const data = setup.data}{#key `${docId}/${workflowId}/${scenario ?? ''}/${exampleParam ?? ''}`}<RunForm setup={data} {exampleParam} />{/key}{/if}
