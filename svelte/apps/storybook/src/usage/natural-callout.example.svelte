<script lang="ts">import { Button, Callout } from '@microcks/deep-ink';</script>
<Callout tone="warning" title="Unsaved dispatcher rules">
  {#snippet actions()}<Button variant="primary" size="sm">Save rules</Button><Button variant="ghost" size="sm">Discard</Button>{/snippet}
  Your edits to the dispatcher of GET /pastries are not saved yet.
</Callout>
