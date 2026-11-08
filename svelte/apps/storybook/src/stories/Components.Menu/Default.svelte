<script lang="ts">
  import { Menu } from '@microcks/deep-ink';
</script>

<Menu label="Actions" items={[
        { id: 'run', label: 'Run test', onselect: () => undefined },
        { id: 'export', label: 'Export contract', onselect: () => undefined },
        { id: 'docs', label: 'Open docs', href: '#docs' },
        { id: 'delete', label: 'Delete service', danger: true, onselect: () => undefined },
      ]} />
