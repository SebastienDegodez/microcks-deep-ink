<!--
  Native radio inside its label (registry item checkbox). Same props as the React Radio (see Checkbox). Use RadioGroup
  to group several.
-->
<script lang="ts">
  import Choice, { type ChoiceProps } from './_Choice.svelte';

  let { element = $bindable(), ...props }: ChoiceProps = $props();
</script>

<Choice kind="radio" bind:element {...props} />
