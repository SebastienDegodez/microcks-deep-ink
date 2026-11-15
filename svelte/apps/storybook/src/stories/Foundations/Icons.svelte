<script lang="ts">
  import { ICON_NAMES, Icon } from '@microcks/deep-ink';
  let { meaningful = false }: { meaningful?: boolean } = $props();
</script>
{#if meaningful}
  <div class="sb-stack"><Icon name="check" size={24} label="Passed" /><Icon name="warning" size={24} label="Warning" /><span class="sb-note">Icons with a label get <code>role=&quot;img&quot;</code> and <code>aria-label</code>.</span></div>
{:else}
  <ul class="sb-grid" style:list-style="none" style:margin="0" style:padding="0">
    {#each ICON_NAMES as n (n)}<li class="sb-swatch" style:padding="12px" style:display="flex" style:gap="10px" style:align-items="center"><Icon name={n} size={20} /><code>{n}</code></li>{/each}
  </ul>
{/if}
