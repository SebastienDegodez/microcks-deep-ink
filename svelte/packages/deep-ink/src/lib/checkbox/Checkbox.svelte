
<script lang="ts">
  import Choice, { type ChoiceProps } from './_Choice.svelte';

  let { defaultChecked, checked = $bindable(defaultChecked), element = $bindable(), ...props }: ChoiceProps = $props();
</script>

<Choice kind="checkbox" bind:checked bind:element {...props} />
