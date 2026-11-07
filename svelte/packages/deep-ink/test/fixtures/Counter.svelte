<!-- Test-only component proving the harness (runes, events, Testing Library, axe). Not part of the package. -->
<script lang="ts">
  let { label = 'Count' }: { label?: string } = $props();
  let count = $state(0);
</script>

<button type="button" class="btn" aria-pressed={count > 0} onclick={() => count++}>{label}: {count}</button>
