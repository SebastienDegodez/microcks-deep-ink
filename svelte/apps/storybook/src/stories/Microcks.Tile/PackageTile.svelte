<script lang="ts">
import { ApiBadge, Button, Tile, type Protocol } from '@microcks/deep-ink';
interface Pkg { id: string; name: string; category: string; meta: string; description: string; apis: Array<[Protocol, string, string]>; totals: string }
let { p, selected, onselect }: { p: Pkg; selected: boolean; onselect: () => void } = $props();
</script>
<Tile title={p.name} {onselect} {selected}>
{#snippet meta()}maintained by <strong>community</strong> · {p.meta}{/snippet}
{#snippet aside()}<span class="tile-tag">{p.category}</span>{/snippet}
{#snippet footer()}<Button variant="primary" size="sm" icon="download">Install <span class="sr-only">{p.name}</span></Button><span class="tile-footer-end">{p.totals}</span>{/snippet}
<p>{p.description}</p><div class="tile-badges">{#each p.apis as [proto, name, version] (name)}<ApiBadge size="sm" protocol={proto} {name} {version}/>{/each}</div>
</Tile>
