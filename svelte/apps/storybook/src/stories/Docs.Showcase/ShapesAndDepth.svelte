<script lang="ts">
  import { Button } from '@microcks/deep-ink';
  import Frame from './Frame.svelte';
  import TokenValue from './TokenValue.svelte';
  const radii = [['radius-control', 'Controls'], ['radius-panel', 'Panels'], ['radius-node', 'Nodes and cards']];
  const depth = ['bg', 'canvas', 'surface', 'raised'];
</script>
<Frame label="Shapes and depth">
  <div><h3>Radii: 4, 8, 12</h3><div class="sb-stack">{#each radii as [token, note] (token)}<div class="sb-cell"><span class="sb-box" style:border-radius={`var(--${token})`} aria-hidden="true"></span><span class="sb-caption"><code>--{token}</code> · <TokenValue {token} /> · {note}</span></div>{/each}</div></div>
  <div><h3>Depth through light: elevation lightens the ink</h3><div class="sb-stack">{#each depth as token, i (token)}<div class="sb-cell"><span class="sb-box" style:background={`var(--${token})`} style="border:1px solid var(--border-strong);border-radius:var(--radius-panel)" aria-hidden="true"></span><span class="sb-caption"><code>--{token}</code> · <TokenValue {token} /> · level {i}</span></div>{/each}</div></div>
  <div><h3>Blue halo = focus</h3><div class="sb-stack"><div class="sb-cell"><span class="sb-box" style="box-shadow:var(--shadow-focus);outline:2px solid var(--action);border-radius:var(--radius-control)" aria-hidden="true"></span><span class="sb-caption"><code>--shadow-focus</code> · <TokenValue token="shadow-focus" /> · the only non-overlay shadow</span></div><Button>Press Tab to see the halo</Button></div></div>
</Frame>
