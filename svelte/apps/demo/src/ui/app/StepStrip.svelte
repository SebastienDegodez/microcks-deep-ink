<script lang="ts" module>
  import '@microcks/demo-styles/app/StepStrip.css';
  import type { StepStatus } from '@microcks/demo-core/domain/arazzo';

  const GLYPH: Record<StepStatus, string> = { passed: '✓', failed: '✕', 'not-run': '–' };
</script>

<script lang="ts">
  import { stepStripAlt } from '@microcks/demo-core/domain/arazzo';

  /**
   * Mini strip of the steps of a run: one cell per step with a glyph, so the status is never color only.
   * The whole strip is one image with a text alternative ("4 steps: passed, passed, failed, not run").
   */
  interface Props {
    statuses?: readonly StepStatus[];
    count: number;
    never?: boolean;
  }

  let { statuses, count, never }: Props = $props();

  const list = $derived(statuses ?? Array.from({ length: count }, (): StepStatus => 'not-run'));
  const alt = $derived(never ? `${count} ${count === 1 ? 'step' : 'steps'}, never run` : stepStripAlt(list));
</script>

<span role="img" aria-label={alt} class="wf-strip" data-never={never ? '' : undefined}
  >{#each list as status, i (i)}<span class="wf-strip-cell" data-status={never ? 'never' : status} aria-hidden="true"
      >{never ? '' : GLYPH[status]}</span
    >{/each}</span
>
