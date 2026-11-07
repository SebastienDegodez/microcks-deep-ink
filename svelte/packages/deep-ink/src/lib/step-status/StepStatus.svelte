<!--
  "✓ Passed", "✕ Failed · 3 attempts", "– Not run" (registry item step-status). Same props as the React StepStatus:
  status, attempts, className plus any <span> attribute and React handler (onClick...).
-->
<script lang="ts" module>
  export type StepOutcome = 'passed' | 'failed' | 'not-run';

  const STEP = {
    passed: { icon: 'check', word: 'Passed' },
    failed: { icon: 'cross', word: 'Failed' },
    'not-run': { icon: 'dash', word: 'Not run' },
  } as const;
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from '../icon/Icon.svelte';
  import { reactEvents, type ReactHandlers } from '../react-events';

  type Props = Omit<HTMLAttributes<HTMLSpanElement>, 'class' | 'children'> &
    ReactHandlers<HTMLSpanElement> & {
    status: StepOutcome;
    attempts?: number;
    className?: string;
  };

  let { status, attempts, className, ...rest }: Props = $props();

  const s = $derived(STEP[status]);
  const showAttempts = $derived(attempts !== undefined && attempts > 0 && (attempts > 1 || status === 'failed'));
</script>

<span {...reactEvents(rest)} class={['step-status', className].filter(Boolean).join(' ')} data-status={status}
  ><Icon name={s.icon} size={14} /><span>{s.word}</span
  >{#if showAttempts}<span class="step-status-attempts">· {attempts} {attempts === 1 ? 'attempt' : 'attempts'}</span>{/if}</span
>
