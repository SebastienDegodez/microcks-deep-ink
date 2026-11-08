<script lang="ts">
  import { setTheme } from '@microcks/deep-ink';
  import type { Snippet } from 'svelte';
  let { theme = 'dark', fullscreen = false, children }: { theme?: 'dark' | 'light'; fullscreen?: boolean; children?: Snippet } = $props();
  $effect(() => { setTheme(theme, false); });
</script>
<div style:background="var(--bg)" style:color="var(--text)" style:padding={fullscreen ? '0' : '24px'} style:min-height="100%">
  {@render children?.()}
</div>
