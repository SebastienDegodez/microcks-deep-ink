<!-- Test-only: the React spec's TileGrid with one linked Tile (body and a footer button), or a Tile whose title link is rendered by renderAction. -->
<script lang="ts">
  import Tile from '../../src/lib/tile/Tile.svelte';
  import TileGrid from '../../src/lib/tile/TileGrid.svelte';

  let { custom = false }: { custom?: boolean } = $props();
</script>

{#if custom}
  <Tile title="Open Banking" selected>
    {#snippet renderAction(p)}<a class={p.className} id={p.id} aria-current={p['aria-current']} href="/hub/banking" data-router=""
        >{typeof p.children === 'string' ? p.children : ''}</a
      >{/snippet}
  </Tile>
{:else}
  <TileGrid label="Packages">
    <Tile title="Open Banking" href="#/hub/banking" meta="maintained by community">
      {#snippet footer()}<button type="button">Install</button>{/snippet}
      <p>Accounts and payments.</p>
    </Tile>
  </TileGrid>
{/if}
