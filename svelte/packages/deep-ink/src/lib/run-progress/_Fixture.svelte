<script lang="ts">
  import RunProgress from './RunProgress.svelte';
</script>
<RunProgress done={5} total={7} caption="test steps done" nowLabel="Now calling" now={'PATCH /pastries/{name}'} segments={['done', 'done', 'done', 'failed', 'done', 'current', 'queued']} counts={[{ kind: 'pass', text: '4 passed' }, { kind: 'fail', text: '1 failed' }]} note="Paused: the run waits for Step forward.">
  {#snippet action()}<button type="button">Step forward</button>{/snippet}
</RunProgress>
