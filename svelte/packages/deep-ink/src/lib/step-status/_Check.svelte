<script lang="ts">
  import Icon from '../icon/Icon.svelte';
  import type { CheckState } from './types.js';
  let { label, state }: { label: string; state: CheckState } = $props();
  const CHECK = { passed: { icon: 'check', word: 'Passed' }, failed: { icon: 'cross', word: 'Failed' }, off: { icon: 'dash', word: 'Off' }, 'not-evaluated': { icon: 'circle', word: 'Not evaluated' } } as const;
  const space = ' ';
  const check = $derived(CHECK[state]);
</script>
<li data-state={state}><span>{label}</span><span class="sr-only">:</span>{space}<span class="checks-state"><Icon name={check.icon} size={14} />{check.word}</span></li>
