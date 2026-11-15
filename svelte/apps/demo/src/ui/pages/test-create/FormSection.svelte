<script lang="ts">
  import type { Snippet } from 'svelte';

  /** One numbered fieldset of the test form: "01 Target", "02 Test runner"… */
  let { step, title, hint, gap, children }: { step: string; title: string; hint?: string; gap?: '12'; children: Snippet } = $props();
</script>

<fieldset class="tc-section" data-gap={gap}
  ><legend><span class="tc-step">{step}</span>{title}{#if hint}<span class="tc-legend-hint">{hint}</span>{/if}</legend
  >{@render children()}</fieldset
>
