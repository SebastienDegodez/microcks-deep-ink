<script lang="ts">
  import { Switch } from '@microcks/deep-ink';
  let on = $state(true);
</script>

<Switch label="Schema validation" checked={on} oncheckedchange={(value) => (on = value)} />
