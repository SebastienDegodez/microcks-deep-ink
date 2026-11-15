<script lang="ts">
  import { TabPanel, Tabs } from '@microcks/deep-ink';
  let v = $state('tasks');
  const items = [
      { id: 'tasks', label: 'Tasks', count: 5, live: true },
      { id: 'users', label: 'Users', count: 12, alert: 2, alertLabel: 'pending changes' },
      { id: 'secrets', label: 'Secrets', count: 3 },
    ];
</script>

<Tabs label="Sections" items={items} value={v} onchange={(value) => (v = value)}><TabPanel id={v} value={v}><p style="margin:0">Content of the {v} tab.</p></TabPanel></Tabs>
