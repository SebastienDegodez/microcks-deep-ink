<script lang="ts">
  import { untrack } from 'svelte';
  import { useRouter, type To } from './router.svelte.js';

  interface Props {
    to: To;
    replace?: boolean;
    state?: unknown;
  }

  let { to, replace = false, state }: Props = $props();

  const router = useRouter();

  // Navigates once mounted (and again when the target changes); renders nothing.
  $effect(() => {
    const target = to;
    const options = { replace, state };
    untrack(() => router.navigate(target, options));
  });
</script>
