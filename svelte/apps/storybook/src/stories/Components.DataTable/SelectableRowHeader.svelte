<script lang="ts">
  import { DataTable } from '@microcks/deep-ink';
  type TaskRow = { id: string; skill: string; updated: string };
  const TASK_ROWS: TaskRow[] = [
  { id: 'task-7f3a', skill: 'restock-pastry', updated: 'now' },
  { id: 'task-41c2', skill: 'compare-prices', updated: '2 min ago' },
  { id: 'task-09be', skill: '— no match', updated: '1 h ago' },
];
  const TASK_COLUMNS = [
  { key: 'id', header: 'Task', mono: true, rowHeader: true, width: '116px' },
  { key: 'skill', header: 'Skill' },
  { key: 'updated', header: 'Updated', align: 'end' as const, width: '100px' },
];
  let selected = $state('task-7f3a');
</script>

<DataTable caption="Tasks" layout="fixed" scroll={false} columns={TASK_COLUMNS} rows={TASK_ROWS} rowKey="id" selectedKey={selected} onrowselect={(r) => (selected = r.id)} />
