<script lang="ts">
import type { ComponentProps } from 'svelte';
import { untrack } from 'svelte';
import { TaskTimeline } from '@microcks/deep-ink';

let args: ComponentProps<typeof TaskTimeline> = $props();
let i = $state(untrack(() => args.selectedIndex));
</script>
<TaskTimeline {...args} selectedIndex={i} onselectnode={(value) => i = value} />
