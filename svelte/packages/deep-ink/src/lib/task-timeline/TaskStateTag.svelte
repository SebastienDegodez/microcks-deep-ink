<script lang="ts">
  import StateGlyph from './_StateGlyph.svelte';
  import type { TaskStateTagProps } from './types.js';
  let { state, ghost, class: cssClass, ...rest }: TaskStateTagProps = $props();
</script>
<span {...rest} class={['task-state', cssClass].filter(Boolean).join(' ')} data-state={state} data-ghost={ghost ? '' : undefined}><StateGlyph {state} />{state}</span>
