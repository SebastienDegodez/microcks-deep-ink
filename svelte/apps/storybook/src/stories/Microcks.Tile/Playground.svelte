<script lang="ts" module>
  import { ApiBadge } from '@microcks/deep-ink';
  export { defaultAside };
</script>
<script lang="ts">
  import { Tile, type TileProps } from '@microcks/deep-ink';
  let args: TileProps = $props();
</script>
{#snippet defaultAside()}<ApiBadge protocol="REST"/>{/snippet}
<div style="max-width:360px"><Tile {...args}/></div>
