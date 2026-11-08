<script lang="ts">
  import { RadioGroup } from '@microcks/deep-ink';
  let mode = $state('sync');
</script>

<div style="max-width:420px"><RadioGroup legend="Install mode" variant="card" value={mode} onchange={(value) => (mode = value)} options={[
            { value: 'sync', label: 'Keep in sync', description: 'Microcks re-imports the package when the Hub publishes a new version.' },
            { value: 'once', label: 'Import once', description: 'A one-time copy; later versions are not imported.' },
          ]} /></div>
