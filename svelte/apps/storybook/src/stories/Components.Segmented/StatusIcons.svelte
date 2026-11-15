<script lang="ts">
  import { Segmented } from '@microcks/deep-ink';
  let v = $state('all');
</script>

<Segmented label="Status" value={v} onchange={(value) => (v = value)} pressedFill="selected" iconSize={13} options={[
          { id: 'all', label: 'All' },
          { id: 'imported', label: 'Imported', icon: 'check', iconTone: 'success' },
          { id: 'warnings', label: 'Warnings', icon: 'warning', iconTone: 'warning' },
          { id: 'failing', label: 'Failing', icon: 'cross', iconTone: 'danger' },
          { id: 'inactive', label: 'Inactive', icon: 'pause', iconTone: 'muted' },
        ]} />
