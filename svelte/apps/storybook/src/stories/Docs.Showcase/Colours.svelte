<script lang="ts">
  import { StatusBadge } from '@microcks/deep-ink';
  import { COLOR_GROUPS } from '@microcks-deep-ink/storybook-shared/fixtures';
  import type { Outcome } from '@microcks/deep-ink';
  import Frame from './Frame.svelte';
  import Swatch from './Swatch.svelte';
  const tokensOf = (title: string) => COLOR_GROUPS.find((group) => group.title.startsWith(title))?.tokens ?? [];
  const groups = [
    { title: 'Inks (theme grounds and text)', tokens: [...tokensOf('Ink ground'), ...tokensOf('Text')] },
    { title: 'Brand (theme-independent)', tokens: tokensOf('Brand') },
    { title: 'Protocol spectrum', tokens: tokensOf('Protocols').filter((token) => token !== 'on-proto') },
  ];
  const statuses: [Outcome, string][] = [['conformant', 'success'], ['failed', 'danger'], ['partial', 'warning'], ['running', 'running']];
</script>
<Frame label="Colours">
  {#each groups as group (group.title)}<div><h3>{group.title}</h3><ul class="sb-grid" style="list-style:none;margin:0;padding:0">{#each group.tokens as token (token)}<Swatch {token} />{/each}</ul></div>{/each}
  <div><h3>Statuses: an icon and a word, never colour alone</h3><ul class="sb-grid" style="list-style:none;margin:0;padding:0">{#each statuses as [status, token] (status)}<li class="sb-cell"><StatusBadge {status} /><Swatch as="div" {token} /></li>{/each}</ul></div>
</Frame>
