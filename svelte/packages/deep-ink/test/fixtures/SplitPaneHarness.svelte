<script lang="ts">
import SplitPane from '../../src/lib/split-pane/SplitPane.svelte';
import SplitPaneSide from '../../src/lib/split-pane/SplitPaneSide.svelte';
import SplitPaneMain from '../../src/lib/split-pane/SplitPaneMain.svelte';
import type { SplitPaneProps } from '../../src/lib/split-pane/types.js';
let args: SplitPaneProps = $props();
</script>
<main><SplitPane {...args}><SplitPaneSide as="nav" aria-label="Operations">list</SplitPaneSide><SplitPaneMain as="section" aria-label="Operation detail">detail</SplitPaneMain></SplitPane></main>
