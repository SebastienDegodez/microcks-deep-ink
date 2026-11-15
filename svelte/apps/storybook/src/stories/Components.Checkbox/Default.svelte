<script lang="ts">
  import { Checkbox } from '@microcks/deep-ink';
  let on = $state(true);
</script>

<Checkbox label="Validate responses against the schema" checked={on} onchange={(e) => (on = e.currentTarget.checked)} />
