<script lang="ts">
  import { Segmented } from '@microcks/deep-ink';
  let v = $state('primary');
</script>

<Segmented label="Artifact role" variant="joined" tone="primary" value={v} onchange={(value) => (v = value)} options={[{ id: 'primary', label: 'Primary' }, { id: 'secondary', label: 'Secondary' }]} />
