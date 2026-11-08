<script lang="ts">
  import Icon from '../icon/Icon.svelte';
  import type { StepStatusProps } from './types.js';
  let { status, attempts, class: cssClass, ...rest }: StepStatusProps = $props();
  const STEP = { passed: { icon: 'check', word: 'Passed' }, failed: { icon: 'cross', word: 'Failed' }, 'not-run': { icon: 'dash', word: 'Not run' } } as const;
  const state = $derived(STEP[status]);
  const showAttempts = $derived(attempts !== undefined && attempts > 0 && (attempts > 1 || status === 'failed'));
</script>
<span {...rest} class={['step-status', cssClass].filter(Boolean).join(' ')} data-status={status}><Icon name={state.icon} size={14} /><span>{state.word}</span>{#if showAttempts}<span class="step-status-attempts">· {attempts} {attempts === 1 ? 'attempt' : 'attempts'}</span>{/if}</span>
