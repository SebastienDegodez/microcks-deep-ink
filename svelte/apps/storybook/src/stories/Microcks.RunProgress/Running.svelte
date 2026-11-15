<script lang="ts">
import { Button } from '@microcks/deep-ink';
import { RunProgress } from '@microcks/deep-ink';


</script>
<div style="max-width: 640px"><RunProgress done={5} total={7} caption="test steps done" nowLabel="Now calling" now={'PATCH /pastries/{name}'} segments={['done', 'done', 'done', 'failed', 'done', 'current', 'queued']} counts={[{ kind: 'pass', text: '4 passed' }, { kind: 'fail', text: '1 failed' }, { kind: 'pending', text: '2 to go' }]} note="The run plays one step at a time; the log follows it.">{#snippet action()}<Button size="sm" icon="chevron">Step forward</Button>{/snippet}</RunProgress></div>
