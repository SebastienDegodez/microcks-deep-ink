<script lang="ts">
  import { Chip } from '@microcks/deep-ink';
  let on = $state(false);
</script>

<Chip pressed={on} onclick={() => (on = !on)}>REST only</Chip>
