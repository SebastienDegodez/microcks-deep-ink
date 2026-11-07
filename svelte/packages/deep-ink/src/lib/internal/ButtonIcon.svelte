<script lang="ts">
  import { ICON_PATHS, type IconName } from './icon-data.js';
  let { name, size }: { name: IconName; size: number } = $props();
  let paths = $derived(ICON_PATHS[name] ?? ICON_PATHS.circle);
</script>

<svg class="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">{#each paths as path, i (i)}<path d={typeof path === 'string' ? path : path.d} stroke-dasharray={typeof path === 'string' ? undefined : path.dash} />{/each}</svg>
