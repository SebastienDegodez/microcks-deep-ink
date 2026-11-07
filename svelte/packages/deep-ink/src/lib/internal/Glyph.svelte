<script lang="ts">
  type Name = 'check-circle' | 'x-circle' | 'warning' | 'running' | 'never-tested' | 'check' | 'cross' | 'circle' | 'pause';
  let { name, size }: { name: Name; size: number } = $props();
  const ring = 'M21 12a9 9 0 1 1-18 0a9 9 0 1 1 18 0';
  const paths: Record<Name, { d: string; dash?: string }[]> = {
    'check-circle': [{ d: ring }, { d: 'M8 12.5l2.5 2.5L16 9.5' }],
    'x-circle': [{ d: ring }, { d: 'M9 9l6 6M15 9l-6 6' }],
    warning: [{ d: 'M12 4l9 16H3z' }, { d: 'M12 10v4' }, { d: 'M12 17v.5' }],
    running: [{ d: 'M12 3a9 9 0 1 0 9 9' }],
    'never-tested': [{ d: ring, dash: '3 3' }, { d: 'M8 12h8' }],
    check: [{ d: 'M5 12l5 5 9-11' }],
    cross: [{ d: 'M6 6l12 12M18 6L6 18' }],
    circle: [{ d: 'M12 4a8 8 0 1 1 0 16a8 8 0 1 1 0-16' }],
    pause: [{ d: 'M8 5v14M16 5v14' }],
  };
</script>

<svg class="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
  {#each paths[name] as path}
    <path d={path.d} stroke-dasharray={path.dash} />
  {/each}
</svg>
