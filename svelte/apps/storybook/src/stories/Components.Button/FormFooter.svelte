<script lang="ts">
import { Button, ButtonLink } from '@microcks/deep-ink';
import { untrack } from 'svelte';



</script>

<div style="display:flex;flex-direction:column;gap:16px;align-items:flex-start"><div class="inline"><Button variant="outline" size="lg">Cancel</Button><Button variant="primary" size="lg" icon="play">Launch test</Button><Button variant="primary" size="lg" icon="play" disabled>Launch test</Button></div><div class="inline"><Button variant="dashed" size="compact" icon="plus">Add header</Button><Button variant="ghost" size="sm" tone="danger" icon="trash">Delete</Button><Button variant="outline" size="xs" tone="link">Undo</Button></div></div>
