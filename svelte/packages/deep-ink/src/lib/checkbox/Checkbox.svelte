<!--
  Native checkbox inside its label (registry item checkbox). Same props as the React Checkbox: label, description,
  variant, className, checked, defaultChecked plus any <input> attribute and React handler
  (onChange, onFocus, onKeyDown...). `label` and `description` (ReactNode in React) take a string or a snippet. `checked` is bindable and starts
  at `defaultChecked`; React's `ref` is `bind:element` here.
-->
<script lang="ts">
  import Choice, { type ChoiceProps } from './_Choice.svelte';

  let { defaultChecked, checked = $bindable(defaultChecked), element = $bindable(), ...props }: ChoiceProps = $props();
</script>

<Choice kind="checkbox" bind:checked bind:element {...props} />
