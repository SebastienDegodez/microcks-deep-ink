<script lang="ts">
  import { Checkbox } from '@microcks/deep-ink';
  let sel = $state<Record<string, boolean>>({ a: true, b: true, c: false });
  const ops = [['a', 'GET /pastries'], ['b', 'GET /pastries/{name}'], ['c', 'PATCH /pastries/{name}']] as const;
</script>

<div style="display:flex;flex-direction:column;gap:6px;max-width:360px">{#each ops as [id, label]}<Checkbox variant="compact" label={label} checked={sel[id]} onchange={(e) => (sel = { ...sel, [id]: e.currentTarget.checked })} />{/each}</div>
