<!-- Test-only: the React spec's Chart, a BarChart whose selection follows onSelect. -->
<script lang="ts">
  import BarChart, { type BarChartBar } from '../../src/lib/bar-chart/BarChart.svelte';

  const BARS: BarChartBar[] = [
    { id: '116', value: 900, description: 'Run #116, passed, 900 ms', label: '116', tone: 'success' },
    { id: '117', value: 1500, description: 'Run #117, failed, 1.5 s', tone: 'danger', faded: true },
    { id: '118', value: 2700, description: 'Run #118, timed out, 12 s', label: '118', tone: 'warning', cap: '12 s' },
    { id: 'next', value: 0, description: 'Not run yet', future: true },
  ];

  let id = $state('117');
</script>

<BarChart
  label="Runs, oldest to newest. Use the arrow keys to move between bars."
  bars={BARS}
  max={3000}
  selectedId={id}
  onSelect={(next) => (id = next)}
  ticks={['3 s', '1.5 s', '0']}
  table={{ caption: 'Last 3 runs', columns: ['Run', 'Result'], rows: [['#116', 'Passed'], ['#117', 'Failed'], ['#118', 'Timed out']] }}
/>
