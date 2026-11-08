<script lang="ts">
  import { Segmented } from '@microcks/deep-ink';
  let v = $state('groovy');
</script>

<Segmented label="Script language" variant="joined" value={v} onchange={(value) => (v = value)} options={[
          { id: 'groovy', label: 'Groovy' },
          { id: 'js', label: 'JavaScript' },
        ]} />
