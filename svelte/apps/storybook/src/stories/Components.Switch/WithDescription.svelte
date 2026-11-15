<script lang="ts">
  import { Switch } from '@microcks/deep-ink';
  let on = $state(false);
</script>

<Switch label="Record traffic" description="Keeps the last 1,000 calls for replay." checked={on} oncheckedchange={(value) => (on = value)} />
