<script lang="ts">
  import '@microcks/demo-styles/pages/admin/snapshots.css';
  import { SplitPane, SplitPaneSide } from '@microcks/deep-ink';
  import ExportCard from './ExportCard.svelte';
  import ImportCard from './ImportCard.svelte';
  import type { Notify } from './notify';

  let { notify }: { notify: Notify } = $props();
</script>

<div class="ad-tab"
  ><p class="ad-intro">A Snapshot holds Services &amp; APIs definitions: operations, examples, contracts and their resources. Test runs and usage metrics are not included.</p
  ><SplitPane mainWidth="520px" sideWidth="380px" sideMax="none"><ExportCard /><SplitPaneSide><ImportCard {notify} /></SplitPaneSide></SplitPane
  ></div
>
