<script lang="ts">
  import ButtonLink from '../ButtonLink.svelte';
  import type { ButtonLinkProps } from '../types.js';
  let { element = $bindable(), ...props }: ButtonLinkProps = $props();
</script>

<ButtonLink {...props} bind:element />
