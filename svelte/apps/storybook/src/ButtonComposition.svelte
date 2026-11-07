<script lang="ts">
  import { Button, ButtonLink } from '@microcks/deep-ink';
  import type { ButtonProps } from '@microcks/deep-ink';
  let props: ButtonProps = $props();
  let saves = $state(0);
  let pressed = $state(false);
  let element = $state<HTMLButtonElement>();
</script>

<form onsubmit={(event) => { event.preventDefault(); saves++; }}>
  <Button {...props} type="submit" variant="primary" icon="check" bind:element>Save <strong>changes</strong></Button>
  <Button icon="plus" aria-pressed={pressed} onclick={() => pressed = !pressed}>Toggle details</Button>
  <ButtonLink href="#saved" icon="external">View details</ButtonLink>
  <p id="saved" aria-live="polite">Saved {saves} times. Details {pressed ? 'shown' : 'hidden'}. Native element: {element?.tagName}.</p>
</form>
