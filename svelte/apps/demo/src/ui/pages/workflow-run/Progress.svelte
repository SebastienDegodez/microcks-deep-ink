<script lang="ts">
  import type { Workflow, WorkflowRun } from '@microcks/demo-core/domain/arazzo';
  import { Button, RunProgress } from '@microcks/deep-ink';
  import { progressOf } from './run';

  interface Props {
    run: WorkflowRun;
    workflow?: Workflow;
    currentIndex: number;
    validated: boolean;
    paused: boolean;
    onstepforward?: () => void;
  }

  let { run, workflow, currentIndex, validated, paused, onstepforward }: Props = $props();
  const progress = $derived(progressOf(run, workflow, currentIndex));
</script>

{#snippet stepForward()}<Button size="sm" icon="chevron" onclick={onstepforward} aria-disabled={onstepforward ? undefined : true}>Step forward</Button>{/snippet}

{#snippet note()}Steps run in list order. Each step resolves its runtime expressions, calls its operation, then checks its success criteria<!---->{#if validated}{' and validates its response against its OpenAPI schema'}{/if}<!---->.{/snippet}

<RunProgress
  aria-busy="true"
  done={progress.done}
  total={progress.total}
  caption="steps ended"
  nowLabel={progress.nowTitle}
  now={progress.now}
  segments={progress.segments}
  action={paused ? stepForward : undefined}
  {note}
/>
