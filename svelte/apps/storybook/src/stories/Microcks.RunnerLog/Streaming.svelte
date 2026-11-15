<script lang="ts">
import { LiveIndicator } from '@microcks/deep-ink';
import { RunnerLog } from '@microcks/deep-ink';
const LINES = [
  { time: '09:10:04', level: 'INFO' as const, text: 'Run #119 · API Pastry 2.0 · 3 operations' },
  { time: '09:10:04', level: 'SEND' as const, text: 'GET /pastries?size=M' },
  { time: '09:10:04', level: 'PASS' as const, text: '200 OK · schema valid · 41 ms' },
  { time: '09:10:05', level: 'SEND' as const, text: 'PATCH /pastries/Eclair%20Cafe' },
  { time: '09:10:05', level: 'FAIL' as const, text: 'price: expected number, got string', error: true },
  { time: '09:10:05', level: 'WAIT' as const, text: 'next step in 300 ms' },
];

</script>
<div style="max-width: 560px"><RunnerLog lines={LINES}>{#snippet status()}<LiveIndicator variant="inline" label="live · streaming" />{/snippet}</RunnerLog></div>
