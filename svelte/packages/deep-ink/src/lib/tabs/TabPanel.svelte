<!--
  Panel of one tab (registry item tabs). Same props as the React TabPanel: id, value, idPrefix, children (a snippet),
  className. Like React, no other attribute is forwarded. Only the selected panel renders its children.
-->
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
    className?: string;
  };

  let { id, value, idPrefix, children, className }: Props = $props();

  const inherited = getContext<(() => string) | undefined>(PREFIX);
  const prefix = $derived(idPrefix ?? inherited?.() ?? 'di');
  const active = $derived(id === value);
</script>

<div
  role="tabpanel"
  id={panelId(prefix, id)}
  aria-labelledby={tabId(prefix, id)}
  class={['tabpanel', className].filter(Boolean).join(' ')}
  tabindex={0}
  hidden={!active}>{#if active}{@render children?.()}{/if}</div
>
