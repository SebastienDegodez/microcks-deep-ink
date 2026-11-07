
<script lang="ts">
  import Choice, { type ChoiceProps } from './_Choice.svelte';

  let { element = $bindable(), ...props }: ChoiceProps = $props();
</script>

<Choice kind="radio" bind:element {...props} />
