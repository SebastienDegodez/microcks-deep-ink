<script lang="ts">
import { Button } from '@microcks/deep-ink';
import { RunProgress } from '@microcks/deep-ink';


</script>
<div style="max-width: 640px"><RunProgress done={2} total={4} caption="steps ended" nowLabel="Now calling" now="GET /pastries/Eclair%20Cafe" segments={['done', 'done', 'current', 'queued']} note="Paused: the replay waits. Step forward shows the next step.">{#snippet action()}<Button size="sm" icon="chevron">Step forward</Button>{/snippet}</RunProgress></div>
