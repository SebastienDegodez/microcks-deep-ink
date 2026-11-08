<script lang="ts">
  import { Meter, Progress } from '@microcks/deep-ink';
</script>

<div class="sb-col" style="max-width:420px"><Progress label="Operations tested" value={8} max={12} /><Meter label="Latency" value={140} min={50} max={500} low={200} high={350} optimum={80} valueText="140 ms" /></div>
