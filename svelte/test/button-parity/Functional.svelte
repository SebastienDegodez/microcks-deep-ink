<script lang="ts">
  import { Button, ButtonLink } from '@microcks/deep-ink';
  let clicks = $state(0);
  let saves = $state(0);
  let disabled = $state(false);
  let loading = $state(false);
  let element = $state<HTMLButtonElement>();
  let linkElement = $state<HTMLAnchorElement>();
</script>

<main>
  <h1>Native Button browser verification</h1>
  <form onsubmit={(event) => { event.preventDefault(); saves++; }}>
    <Button id="action" icon="plus" {disabled} {loading} onclick={() => clicks++} bind:element>Save <strong>changes</strong></Button>
    <Button id="submit" type="submit">Submit form</Button>
    <ButtonLink id="navigation" href="#destination" {disabled} {loading} bind:element={linkElement}>View details</ButtonLink>
    <Button id="icon-only" icon="plus" iconOnly aria-label="Add API" />
    <Button id="disable" onclick={() => disabled = !disabled}>Toggle disabled</Button>
    <Button id="busy" onclick={() => loading = !loading}>Toggle loading</Button>
    <output id="counts">{clicks}/{saves}</output>
    <output id="bindings">{element?.tagName}/{linkElement?.tagName}</output>
  </form>
  <p id="destination">Destination</p>
</main>
