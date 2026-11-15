<script lang="ts">
  import RadioGroup from './RadioGroup.svelte';
  let { options, onchange }: {
    options: { value: string; label: string; version: string; disabled?: boolean }[];
    onchange: (value: string) => void;
  } = $props();
  let value = $state<string>();
</script>
<RadioGroup legend="API" {options} bind:value {onchange}>
  {#snippet renderLabel(option)}<strong>{option.label}</strong> {option.version}{/snippet}
</RadioGroup>
