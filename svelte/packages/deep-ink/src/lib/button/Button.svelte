<script lang="ts">
  import Button from '../Button.svelte';
  import type { ButtonProps } from '../types.js';
  let { element = $bindable(), ...props }: ButtonProps = $props();
</script>

<Button {...props} bind:element />
