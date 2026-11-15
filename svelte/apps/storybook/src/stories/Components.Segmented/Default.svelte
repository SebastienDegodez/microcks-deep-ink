<script lang="ts">
  import { Segmented } from '@microcks/deep-ink';
  let v = $state('all');
</script>

<Segmented label="Filter test results" value={v} onchange={(value) => (v = value)} options={[
          { id: 'all', label: 'All', count: 27 },
          { id: 'passed', label: 'Passed', count: 25 },
          { id: 'failed', label: 'Failed', count: 2 },
        ]} />
