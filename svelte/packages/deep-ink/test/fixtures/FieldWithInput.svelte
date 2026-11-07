<!-- A Field with an Input control, as written in an app: the snippet spreads the control props on the Input. -->
<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import Field from '../../src/lib/field/Field.svelte';
  import Input from '../../src/lib/input/Input.svelte';

  let props: Omit<ComponentProps<typeof Field>, 'children'> = $props();
</script>

<Field {...props}>
  {#snippet children(control)}<Input {...control} />{/snippet}
</Field>
