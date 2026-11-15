<script lang="ts" module>
  import { SplitPaneSide, SplitPaneMain, Panel } from '@microcks/deep-ink';
  export { defaultChildren };
</script>
<script lang="ts">
  import { SplitPane, type SplitPaneProps } from '@microcks/deep-ink';
  let args: SplitPaneProps = $props();
</script>
{#snippet defaultChildren()}<SplitPaneSide as="nav"><Panel title="Services"><p>List</p></Panel></SplitPaneSide><SplitPaneMain><Panel title="Detail"><p>Detail of the selected item.</p></Panel></SplitPaneMain>{/snippet}
<SplitPane {...args}/>
