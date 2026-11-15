<script lang="ts">
  import { Button, Field, Input, Panel } from '@microcks/deep-ink';
  let url = $state('');
  let error = $state<string>();
  let imported = $state<string>();
</script>
<Panel title="Import from a URL" headingLevel={4} style="max-width:520px">
  <form novalidate style="display:flex;flex-direction:column;gap:12px" onsubmit={(event) => {
    event.preventDefault();
    const ok = url.startsWith('https://');
    error = ok ? undefined : 'Enter a URL that starts with https://.';
    imported = ok ? url : undefined;
  }}>
    <Field label="Artifact URL" help="An OpenAPI, AsyncAPI or Postman file." {error} required>
      {#snippet children(control)}<Input {...control} type="url" mono bind:value={url} />{/snippet}
    </Field>
    <div><Button type="submit" variant="primary" icon="upload">Import</Button></div>
    <p role="status" style="margin:0">{imported ? `Queued: ${imported}` : ''}</p>
  </form>
</Panel>
