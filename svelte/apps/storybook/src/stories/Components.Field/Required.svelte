<script lang="ts">
  import { Field } from '@microcks/deep-ink';
  import { Input } from '@microcks/deep-ink';
</script>

<div style="max-width:420px"><Field label="Contract URL" required help="HTTPS URL of an OpenAPI or AsyncAPI file.">{#snippet children(c)}<Input {...c} type="url" mono placeholder="https://example.org/openapi.yaml" />{/snippet}</Field></div>
