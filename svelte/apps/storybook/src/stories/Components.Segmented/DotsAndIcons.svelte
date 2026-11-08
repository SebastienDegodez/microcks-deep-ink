<script lang="ts">
  import { Segmented } from '@microcks/deep-ink';
  let r = $state('all');
  let view = $state('table');
</script>

<div class="inline"><Segmented label="Last test" value={r} onchange={(value) => (r = value)} options={[
            { id: 'all', label: 'All', count: 11, dot: 'neutral' },
            { id: 'ok', label: 'Conformant', count: 3, dot: 'success' },
            { id: 'ko', label: 'Failing', count: 5, dot: 'danger' },
            { id: 'never', label: 'Never tested', count: 3, dot: 'muted' },
          ]} /><Segmented label="View" value={view} onchange={(value) => (view = value)} options={[
            { id: 'table', label: 'Table', icon: 'list' },
            { id: 'wall', label: 'Badge wall', icon: 'badge-wall' },
          ]} /></div>
