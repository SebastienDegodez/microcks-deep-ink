<!--
  @component
  Provides the use cases and the clock built by the composition root (`main.ts`).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { Services } from './services';
  import { provideServices } from './services';

  let { useCases, clock, children }: Services & { children: Snippet } = $props();

  provideServices({
    get useCases() {
      return useCases;
    },
    get clock() {
      return clock;
    },
  });
</script>

{@render children()}
