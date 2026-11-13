<script lang="ts" module>
  /** The stepId of a select event; `{ stepId: undefined }` (the selected step pressed again) gives undefined. */
  export function stepIdOf(event: unknown): string | undefined {
    if (typeof event === 'string') return event;
    const direct = (event as { stepId?: unknown } | null)?.stepId;
    if (typeof direct === 'string') return direct;
    const detail = (event as { detail?: { stepId?: unknown } } | null)?.detail?.stepId;
    return typeof detail === 'string' ? detail : undefined;
  }

  function lensIdOf(event: unknown): string | undefined {
    const direct = event as { id?: unknown; detail?: { id?: unknown } } | null;
    const id = direct?.id ?? direct?.detail?.id;
    return typeof id === 'string' ? id : undefined;
  }
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import { LoadingBlock } from '@/ui/app/states';
  import type { LoomProps } from './loom-model';

  /**
   * The only door to the `WorkflowLoom` element wrapper, loaded with a dynamic import like the twin's lazy chunk: while
   * it loads the page shows a loading block; if it fails to load or render, the `fallback` (the accessible steps table).
   * The handlers are tolerant to receive `{ stepId }`, a bare id or a CustomEvent.
   */
  type Props = LoomProps & {
    /** Called with the selected stepId, or undefined when the selected step is pressed again. */
    onselectstep: (stepId: string | undefined) => void;
    /** Called with the traced thread id (its expression), or undefined when the lens is cleared. */
    onselectlens?: (id: string | undefined) => void;
    /** Accessible equivalent shown when the Loom is not available. */
    fallback: Snippet;
  };

  // Each loom prop is passed by name below: spreading `loom` into the awaited component did not forward later changes
  // (another run or step), so the element kept the first run's drawing.
  let { onselectstep, onselectlens, fallback, ...loom }: Props = $props();

  const loading = import('@microcks/deep-ink').then((m) => m.WorkflowLoom);

  function logFailure(error: unknown) {
    console.error('WorkflowLoom failed to render, showing the steps table instead.', error);
  }
</script>

{#await loading}<LoadingBlock label="the loom" rows={1} />{:then WorkflowLoom}<svelte:boundary onerror={logFailure}
    ><WorkflowLoom
      sources={loom.sources}
      steps={loom.steps}
      threads={loom.threads}
      inputs={loom.inputs}
      outputs={loom.outputs}
      outputNote={loom.outputNote}
      validatesSchemas={loom.validatesSchemas}
      selectedStep={loom.selectedStep}
      lens={loom.lens}
      tableToggle={loom.tableToggle}
      label={loom.label}
      onstepselect={(event) => onselectstep(stepIdOf(event))}
      onlensselect={(event) => onselectlens?.(lensIdOf(event))}
    />{#snippet failed()}{@render fallback()}{/snippet}</svelte:boundary
  >{:catch}{@render fallback()}{/await}
