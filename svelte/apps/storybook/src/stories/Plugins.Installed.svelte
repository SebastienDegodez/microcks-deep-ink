<script lang="ts">
 import { ApiBadge, CodeBlock, Panel, getPluginHost, type Protocol } from '@microcks/deep-ink';
 import { SAMPLE_MANIFEST } from '@microcks-deep-ink/storybook-shared/fixtures';
 import type { MicrocksPluginManifest } from '@microcks-deep-ink/plugin-sdk';
 const read = () => getPluginHost().list() as unknown as MicrocksPluginManifest[];
 let list = $state(read());
 $effect(() => getPluginHost().subscribe(() => { list = read(); }));
</script>
<div class="sb-col" style="max-width: 640px">{#each list as m (m.id)}<Panel title={m.name}><div class="sb-col"><span class="sb-note">{m.id} · {m.version} · Microcks {m.microcks}</span><span>{m.description}</span><div class="inline">{#each m.protocols ?? [] as p}<ApiBadge protocol={p as Protocol} name={m.name} version={m.version} />{/each}{#if m.backend}<ApiBadge label="backend" value={m.backend.extensions.map(e => e.point).join(', ')} />{/if}{#if m.frontend}<ApiBadge label="frontend" value={m.frontend.contributes.join(', ')} />{/if}</div></div></Panel>{/each}<CodeBlock caption="Manifest" language="json" code={JSON.stringify(SAMPLE_MANIFEST, null, 2)} /></div>
