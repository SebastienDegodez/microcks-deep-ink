<script lang="ts">
  import type { Snippet } from 'svelte';
  let { label, children }: { label: string; children: Snippet } = $props();
</script>
<div class="sb-page" style="background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:8px;padding:24px;margin:16px 0 0" role="group" aria-label={label}>{@render children()}</div>
