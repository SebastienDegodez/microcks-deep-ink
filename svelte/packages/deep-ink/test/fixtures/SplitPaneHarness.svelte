<!-- Test-only: a SplitPane with a nav side and a section main inside a <main>, as the React spec. -->
<script lang="ts">
  import SplitPane from '../../src/lib/split-pane/SplitPane.svelte';
  import SplitPaneMain from '../../src/lib/split-pane/SplitPaneMain.svelte';
  import SplitPaneSide from '../../src/lib/split-pane/SplitPaneSide.svelte';

  let props: Record<string, unknown> = $props();
</script>

<main>
  <SplitPane {...props}>
    <SplitPaneSide as="nav" aria-label="Operations">list</SplitPaneSide>
    <SplitPaneMain as="section" aria-label="Operation detail">detail</SplitPaneMain>
  </SplitPane>
</main>
