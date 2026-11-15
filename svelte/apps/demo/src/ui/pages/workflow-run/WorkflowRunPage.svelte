<script lang="ts">
  import '@microcks/demo-styles/pages/workflows/workflows.css';
  import '@microcks/demo-styles/pages/workflow-run/workflow-run.css';
  import type { WorkflowRun } from '@microcks/demo-core/domain/arazzo';
  import { PageHeader, useParams, usePageTitle, useQuery, useSearchParams, useSubscription, useUseCases } from '@/ui/app';
  import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
  import RunView from './RunView.svelte';
  import { REPLAY_TICK_MS } from './run';

  const params = useParams();
  const [search] = useSearchParams();
  const runId = $derived(params.runId ?? '');
  const live = $derived(search.has('live'));
  const uc = useUseCases();
  usePageTitle('Workflow run · Microcks');

  const stored = useQuery(() => uc.arazzo.getRun(runId), () => [runId, live]);
  const stream = useSubscription<WorkflowRun, WorkflowRun[]>(
    (listener) => (live ? uc.arazzo.watchRun(runId, listener) : undefined),
    () => [runId, live],
    { initial: [], reduce: (frames, frame) => [...frames, frame] },
  );

  // Plays the buffered frames of a live run one by one. Pause stops the replay clock where it is (WCAG 2.2.2):
  // Resume continues from that frame, one frame per tick, and Step forward shows the next frame while paused.
  let index = $state(0);
  let paused = $state(false);
  // Set by a pause, cleared once the replay has caught up with the stream.
  let behind = $state(false);
  const frames = $derived(stream.value);
  const last = $derived(frames.length - 1);
  $effect(() => {
    const at = index;
    const end = last;
    const late = behind;
    if (paused || at >= end) return undefined;
    // Caught up: show a new frame as soon as it arrives. Behind (after a pause): one frame per tick.
    const timer = setTimeout(
      () => {
        index = Math.min(index + 1, end);
        if (at + 1 >= end) behind = false;
      },
      late || end - at > 1 ? REPLAY_TICK_MS : 0,
    );
    return () => clearTimeout(timer);
  });
  const frame = $derived(frames[Math.min(index, Math.max(last, 0))]);
  const canStep = $derived(paused && index < last);
  const toggle = () => {
    paused = !paused;
    behind = true;
  };
  const step = () => {
    index = Math.min(index + 1, last);
  };

  const run = $derived(live ? frame : stored.data);
  const detail = useQuery(
    () => (run ? uc.arazzo.getWorkflow(run.documentId, run.workflowId) : Promise.resolve(undefined)),
    () => [run?.documentId, run?.workflowId],
  );
  const examples = useQuery(
    () => (run ? uc.arazzo.listExamples(run.documentId, run.workflowId) : Promise.resolve([])),
    () => [run?.documentId, run?.workflowId],
  );
  const example = $derived(run ? examples.data?.find((e) => e.id === run.options.example) : undefined);
</script>

{#if !live && stored.status === 'error'}<PageHeader title="Workflow run" /><ErrorBlock
    error={stored.error}
    onretry={stored.reload}
    title="This run could not be loaded"
  />{:else if !run}<PageHeader title="Workflow run" /><LoadingBlock label="the run" rows={5} />{:else}<RunView
    {run}
    {paused}
    ontogglepause={toggle}
    onstepforward={canStep ? step : undefined}
    detail={detail.data}
    {example}
  />{/if}
