<script lang="ts">
  import { RadioGroup } from '@microcks/deep-ink';
  const OPTIONS = [
  { value: 'mocks', label: 'Mocks', description: 'Call the Microcks mock endpoints.' },
  { value: 'implementations', label: 'Implementations', description: 'Call the real services.' },
  { value: 'mixed', label: 'Mixed', description: 'Proposed, beyond the POC.' },
];
  let v = $state<string | undefined>(undefined);
</script>

<RadioGroup legend="Run against" required options={OPTIONS} value={v} onchange={(value) => (v = value)} error="Choose what the workflow runs against." />
