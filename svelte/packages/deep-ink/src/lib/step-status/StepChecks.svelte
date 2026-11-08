<script lang="ts">
  import Check from './_Check.svelte';
  import type { StepChecksProps } from './types.js';
  let { successCriteria, schemaValidation, class: cssClass, ...rest }: StepChecksProps = $props();
</script>
<ul {...rest} class={['checks', cssClass].filter(Boolean).join(' ')}><Check label="Success criteria" state={successCriteria} />{#if schemaValidation}<Check label="Schema validation" state={schemaValidation} />{/if}</ul>
