<script lang="ts">
  import { Button, ButtonLink } from '../src/lib/index.js';
  import type { ButtonProps, ButtonLinkProps } from '../src/lib/index.js';
  let { props = {}, linkProps = {}, onsubmit = () => {} }: {
    props?: ButtonProps; linkProps?: ButtonLinkProps; onsubmit?: (event: SubmitEvent) => void;
  } = $props();
  let element = $state<HTMLButtonElement>();
  let pressed = $state(false);
</script>

<form onsubmit={(event) => { event.preventDefault(); onsubmit(event); }}>
  <Button {...props} bind:element>Save <strong>changes</strong></Button>
  <Button icon="plus" aria-pressed={pressed} onclick={() => pressed = !pressed}>Toggle details</Button>
  <ButtonLink href="#destination" {...linkProps}>View <strong>details</strong></ButtonLink>
  <span id="destination">Destination</span>
  <output>{element?.tagName}</output>
</form>
