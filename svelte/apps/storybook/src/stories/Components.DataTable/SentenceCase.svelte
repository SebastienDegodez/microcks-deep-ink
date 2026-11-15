<script lang="ts">
  import { DataTable } from '@microcks/deep-ink';
  type RunRow = { id: string; run: string; result: string; duration: string };
  const RUN_ROWS: RunRow[] = [
  { id: '16', run: '#16', result: 'Failed · step updatePrice', duration: '1.42 s' },
  { id: '15', run: '#15', result: 'Passed', duration: '0.98 s' },
  { id: '14', run: '#14', result: 'Idle · never run against implementations', duration: '—' },
];
</script>

<DataTable caption="Workflow runs" headerCase="sentence" columns={[{ key: 'run', header: 'Run', mono: true, rowHeader: true }, { key: 'result', header: 'Result' }, { key: 'duration', header: 'Duration', align: 'end' }]} rows={RUN_ROWS} rowKey="id" rowTone={(r) => (r.result.startsWith('Failed') ? 'danger' : r.result.startsWith('Idle') ? 'idle' : undefined)} />
