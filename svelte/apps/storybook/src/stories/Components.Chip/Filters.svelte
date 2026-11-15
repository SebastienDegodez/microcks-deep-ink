<script lang="ts">
  import { Chip, type Protocol } from '@microcks/deep-ink';
  let label = $state('domain=pastry');
  let proto = $state<string | null>('REST');
  const protos: Array<[Protocol, number]> = [['REST', 4], ['SOAP', 1], ['EVENT', 2], ['GRAPHQL', 0]];
</script>

<div class="stack"><div class="inline">{#each protos as [p, n]}<Chip protocol={p} count={n} pressed={proto === p} onclick={() => (proto = proto === p ? null : p)}>{p}</Chip>{/each}</div><div class="inline">{#each [['domain', 'pastry', 4], ['domain', 'movies', 1], ['status', 'GA', 4]] as [k, v, n]}<Chip labelKey={String(k)} count={Number(n)} pressed={label === `${k}=${v}`} onclick={() => (label = `${k}=${v}`)}>{v}</Chip>{/each}</div><div class="inline" role="group" aria-label="Categories">{#each [['All', 8], ['Samples', 3], ['Banking', 1]] as [c, n]}<Chip size="lg" count={Number(n)} pressed={c === 'All'}>{c}</Chip>{/each}</div><div class="inline"><Chip size="sm" labelKey="domain">pastry</Chip><Chip size="sm" labelKey="team">bakery</Chip></div></div>
