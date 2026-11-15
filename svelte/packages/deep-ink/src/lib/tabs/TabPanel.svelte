
<script lang="ts">
  import { getContext, type Snippet } from 'svelte';
  import { PREFIX, panelId, tabId } from './Tabs.svelte';

  type Props = {
    /** Id of the tab this panel belongs to. */
    id: string;
    /** Id of the selected tab. The panel is hidden unless it matches `id`. */
    value: string;
    idPrefix?: string;
    children?: Snippet;
    class?: string;
  };

  let { id, value, idPrefix, children, class: cssClass }: Props = $props();

  const inherited = getContext<(() => string) | undefined>(PREFIX);
  const prefix = $derived(idPrefix ?? inherited?.() ?? 'di');
  const active = $derived(id === value);
</script>

<div
  role="tabpanel"
  id={panelId(prefix, id)}
  aria-labelledby={tabId(prefix, id)}
  class={['tabpanel', cssClass].filter(Boolean).join(' ')}
  tabindex={0}
  hidden={!active}>{#if active}{@render children?.()}{/if}</div
>
