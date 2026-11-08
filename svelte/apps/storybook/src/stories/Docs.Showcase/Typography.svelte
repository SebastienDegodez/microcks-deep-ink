<script lang="ts">
  import Frame from './Frame.svelte';
  const families = [
    { token: 'font-brand', role: 'Brand: display and page titles', sample: 'Microcks Deep Ink', type: 'section', name: 'Alegreya Sans SC' },
    { token: 'font-ui', role: 'Headings and text', sample: 'Returns the requested pastry.', type: 'body', name: 'IBM Plex Sans' },
    { token: 'font-mono', role: 'Data: paths, URLs, payloads', sample: 'GET /pastries/{name}', type: 'code', name: 'JetBrains Mono' },
  ];
</script>
<Frame label="Typography"><div>{#each families as f (f.token)}<div class="sb-type"><span style:font={`var(--type-${f.type})`}>{f.sample}</span><small><strong>{f.name}</strong> · {f.role} · <code>--{f.token}</code></small></div>{/each}</div></Frame>
