<script lang="ts">
  import Chip from '../chip/Chip.svelte';
  import type { RunTargetProps } from './types.js';
  let { target, class: cssClass, ...rest }: RunTargetProps = $props();
  const WORD = { mocks: 'Mocks', implementations: 'Implementations', mixed: 'Mixed' } as const;
</script>
<span {...rest} class={['run-target', cssClass].filter(Boolean).join(' ')} data-target={target}>{WORD[target]}{#if target === 'mixed'}<Chip tone="warning" variant="dashed">Proposed · beyond POC</Chip>{/if}</span>
