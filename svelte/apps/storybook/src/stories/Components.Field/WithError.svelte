<script lang="ts">
  import { Field } from '@microcks/deep-ink';
  import { Input } from '@microcks/deep-ink';
</script>

<div style="max-width:420px"><Field label="Version" required error="Enter a version such as 2.0.">{#snippet children(c)}<Input {...c} defaultValue="" />{/snippet}</Field></div>
