<script lang="ts">
  import { Field } from '@microcks/deep-ink';
  import { Input } from '@microcks/deep-ink';
</script>

<div style="max-width:420px"><Field label="Service name" help="As written in the contract title.">{#snippet children(c)}<Input {...c} defaultValue="API Pastry" />{/snippet}</Field></div>
