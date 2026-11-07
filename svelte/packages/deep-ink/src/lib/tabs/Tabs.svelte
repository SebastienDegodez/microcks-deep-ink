
<script lang="ts" module>
  import type { IconName } from '../icon/Icon.svelte';

  export interface TabItem {
    id: string;
    label: string;
    /** Shown after the label. Read as "Operations, 4". */
    count?: number;
    /** Warning pill after the count. Read as "Users, 2 pending changes" with `alertLabel`. */
    alert?: number;
    /** Words read after the alert number (default "need attention"). */
    alertLabel?: string;
    /** Live dot before the label. Read as "Tasks, live". */
    live?: boolean;
    /** Decorative 16px icon before the label (Import source types). */
    icon?: IconName;
    /** 12px muted text after the label, read as "Upload, one-off file". */
    hint?: string;
    disabled?: boolean;
  }

  /** Context key of the id prefix, read by the TabPanels rendered in `children`. */
  export const PREFIX = Symbol('deep-ink tabs prefix');
  export const tabId = (prefix: string, id: string) => `${prefix}-tab-${id}`;
  export const panelId = (prefix: string, id: string) => `${prefix}-panel-${id}`;
</script>

<script lang="ts">
  import { setContext, type Snippet } from 'svelte';
  import Icon from '../icon/Icon.svelte';

  type Props = {
    /** Accessible name of the tab list. */
    label: string;
    items: TabItem[];
    /** Id of the selected tab. */
    value: string;
    onchange?: (id: string) => void;
    /** `automatic`: arrows select. `manual`: arrows move focus, Enter or Space selects. */
    activation?: 'automatic' | 'manual';
    /** Prefix of the generated ids. Only needed when a `TabPanel` is rendered outside `Tabs`. */
    idPrefix?: string;
    /** `line` (default): the strip under a page header. `card`: at the top of a card (padding 0 8px, taller tabs that wrap). */
    variant?: 'line' | 'card';
    /** Panels, rendered after the tab list. */
    children?: Snippet;
    class?: string;
  };

  let { label, items, value = $bindable(), onchange, activation = 'automatic', idPrefix, variant = 'line', children, class: cssClass }: Props = $props();

  const generated = $props.id();
  const prefix = $derived(idPrefix ?? generated);
  setContext(PREFIX, () => prefix);

  const refs: Array<HTMLButtonElement | null> = $state([]);
  const enabled = $derived(items.map((t, i) => (t.disabled ? -1 : i)).filter((i) => i >= 0));
  const selectedIndex = $derived(items.findIndex((t) => t.id === value && !t.disabled));
  // Roving tabindex: the selected tab, or the first enabled one when nothing valid is selected.
  const tabStop = $derived(selectedIndex >= 0 ? selectedIndex : (enabled[0] ?? -1));

  // In expressions, so that the compiler keeps their spaces.
  const comma = ', ';
  const space = ' ';

  function select(id: string) {
    value = id;
    onchange?.(id);
  }

  function move(to: number) {
    refs[to]?.focus();
    const item = items[to];
    if (activation === 'automatic' && item) select(item.id);
  }

  function onkeydown(e: KeyboardEvent, index: number) {
    if (enabled.length === 0) return;
    const pos = enabled.indexOf(index);
    let next: number | undefined;
    switch (e.key) {
      case 'ArrowRight':
        next = enabled[(pos + 1) % enabled.length];
        break;
      case 'ArrowLeft':
        next = enabled[(pos - 1 + enabled.length) % enabled.length];
        break;
      case 'Home':
        next = enabled[0];
        break;
      case 'End':
        next = enabled[enabled.length - 1];
        break;
      default:
        return;
    }
    if (next === undefined) return;
    e.preventDefault();
    move(next);
  }
</script>

<div class={['tabs', cssClass].filter(Boolean).join(' ')} data-variant={variant === 'card' ? 'card' : undefined}
  ><div role="tablist" class="tablist" aria-label={label}
    >{#each items as t, i (t.id)}<button
        bind:this={refs[i]}
        type="button"
        role="tab"
        class="tab"
        id={tabId(prefix, t.id)}
        aria-selected={i === selectedIndex}
        aria-controls={panelId(prefix, t.id)}
        tabindex={i === tabStop ? 0 : -1}
        disabled={t.disabled}
        onclick={() => select(t.id)}
        onkeydown={(e) => onkeydown(e, i)}
        >{#if t.live}<span class="tab-live" aria-hidden="true"></span>{/if}{#if t.icon}<Icon
            name={t.icon}
            size={16}
          />{/if}{t.label}{#if t.hint}<span class="tab-hint"><span class="sr-only">,</span>{space}{t.hint}</span
          >{/if}{#if t.live}<span class="sr-only">, live</span>{/if}{#if t.count !== undefined}<span class="tab-count"
            ><span class="sr-only">{comma}</span>{t.count}</span
          >{/if}{#if t.alert}<span class="tab-alert"
            ><span class="sr-only">{comma}</span>{t.alert}<span class="sr-only">{space}{t.alertLabel ?? 'need attention'}</span
            ></span
          >{/if}</button
      >{/each}</div
  >{@render children?.()}</div
>
