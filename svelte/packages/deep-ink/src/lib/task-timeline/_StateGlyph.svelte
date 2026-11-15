<script lang="ts">
  import type { TaskState } from './types.js';
  let { state, size = 14 }: { state: TaskState; size?: number } = $props();
const CIRCLE = 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0';
/** One glyph per state, so the shape (not only the color) tells states apart. */
const STATE_PATHS: Record<TaskState, string[]> = {
  submitted: [CIRCLE, 'M12 7.5V12l3 2'],
  working: ['M20 12a8 8 0 1 1-2.34-5.66', 'M20 4v4h-4'],
  'input-required': ['M4 5h16v11H9l-5 4z', 'M10 9.2a2 2 0 1 1 2.8 1.8c-.5.3-.8.7-.8 1.3', 'M12 14h.01'],
  'auth-required': ['M6 11h12v9H6z', 'M8.5 11V8a3.5 3.5 0 0 1 7 0v3'],
  completed: [CIRCLE, 'M8 12.5l2.5 2.5L16 9.5'],
  failed: [CIRCLE, 'M9 9l6 6M15 9l-6 6'],
  rejected: [CIRCLE, 'M5.6 5.6l12.8 12.8'],
  canceled: [CIRCLE, 'M9.5 9.5h5v5h-5z'],
};

</script>
<svg class="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={2} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">{#each STATE_PATHS[state] as d (d)}<path {d} />{/each}</svg>
