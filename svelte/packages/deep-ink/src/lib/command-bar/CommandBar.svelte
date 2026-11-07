
<script lang="ts" module>
  import type { CommandItem, CommandProtocol } from './command-bar';

  const KINDS: CommandItem['kind'][] = ['action', 'service', 'operation', 'test'];
  const KIND_LABEL: Record<CommandItem['kind'], string> = { action: 'Actions', service: 'Services', operation: 'Operations', test: 'Tests' };
  const PROTOCOL_TOKEN: Record<CommandProtocol, string> = {
    REST: 'proto-rest', SOAP: 'proto-soap', EVENT: 'proto-event', gRPC: 'proto-grpc', GRAPHQL: 'proto-graphql', DIRECT: 'proto-direct', A2A: 'proto-a2a',
  };

  /** Results grouped by kind, in display order. Flat index = position in this array. */
  function filterItems(items: CommandItem[], query: string): CommandItem[] {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const filtered = items.filter((i) => {
      const hay = [i.label, ...(i.keywords ?? [])].join(' ').toLowerCase();
      return words.every((w) => hay.includes(w));
    });
    return KINDS.flatMap((k) => filtered.filter((i) => i.kind === k));
  }

  /** Active element, looking through shadow roots, so focus can return to the real opener. */
  function deepActiveElement(): HTMLElement | null {
    let el = document.activeElement as HTMLElement | null;
    while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement as HTMLElement;
    return el;
  }
</script>

<script lang="ts">
  import { tick } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from '../icon/Icon.svelte';
  import { eventProps, type NativeHandlers } from '../event-props';

  type Props = Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'onselect'> &
    Omit<NativeHandlers<HTMLElement>, 'onselect' | 'onselectcapture'> & {
    items: CommandItem[];
    /** Modal mode: controls the dialog. Update it from `onclose`. */
    open?: boolean;
    /** Render in place instead of in a dialog (docs, embedding). */
    inline?: boolean;
    placeholder?: string;
    /** Ctrl/⌘K opens the bar from anywhere. Default true. */
    globalShortcut?: boolean;
    /** Accessible name of the dialog and the search field. Default "Command bar". */
    label?: string;
    oncommand?: (item: CommandItem) => void;
    /** Called when the modal closes (Escape, backdrop, close button, or after a command ran). */
    onclose?: () => void;
    class?: string;
    /** The root element: the <dialog>, or the inline <div>. */
    element?: HTMLElement;
  };

  let {
    items,
    open,
    inline = false,
    placeholder = 'Jump to a service, or type an action…',
    globalShortcut = true,
    label = 'Command bar',
    oncommand,
    onclose,
    class: cssClass,
    element = $bindable(),
    ...rest
  }: Props = $props();

  const id = $props.id();
  let input = $state<HTMLInputElement>();
  let listEl = $state<HTMLDivElement>();
  let opener: HTMLElement | null = null;

  // `open` drives the modal; Ctrl/⌘K and the close paths change it locally and report through onclose.
  // svelte-ignore state_referenced_locally
  let shown = $state(Boolean(open));
  // svelte-ignore state_referenced_locally
  let prevOpen = open;
  let query = $state('');
  let active = $state(0);
  // svelte-ignore state_referenced_locally
  let prevItems = items;
  $effect.pre(() => {
    if (open !== prevOpen) {
      prevOpen = open;
      if (open !== undefined) shown = open;
    }
    if (items !== prevItems) {
      prevItems = items;
      active = 0;
    }
  });

  const list = $derived(filterItems(items, query));
  const cur = $derived(Math.max(0, Math.min(active, list.length - 1)));
  const groups = $derived(
    KINDS.map((k) => list.map((item, idx) => ({ item, idx })).filter(({ item }) => item.kind === k)).filter((g) => g.length > 0),
  );
  const optionId = (i: number) => `${id}-o${i}`;
  const listId = `${id}-list`;
  const inputId = `${id}-input`;
  const announce = $derived(list.length === 0 ? 'No results' : `${list.length} ${list.length === 1 ? 'result' : 'results'}`);

  function close() {
    query = '';
    active = 0;
    if (inline) return;
    // A second close in the same event (Escape, then cancel) is a no-op.
    const wasOpen = shown;
    shown = false;
    if (wasOpen) onclose?.();
  }
  function choose(item?: CommandItem) {
    if (!item) return;
    oncommand?.(item);
    if (!inline) close();
  }

  // Open and close the native dialog; focus goes to the search field, then back to the opener.
  $effect(() => {
    const dialog = element as HTMLDialogElement | undefined;
    if (inline || !dialog) return;
    if (shown && !dialog.open) {
      opener = deepActiveElement();
      dialog.showModal();
      // The field is bound after this effect on the first open.
      if (input) input.focus();
      else void tick().then(() => input?.focus());
    } else if (!shown && dialog.open) {
      dialog.close();
      const o = opener;
      opener = null;
      if (o && o.isConnected) o.focus();
    }
  });

  // Keep the active option visible while moving with the arrow keys.
  $effect(() => {
    listEl?.querySelector(`[id="${optionId(cur)}"]`)?.scrollIntoView?.({ block: 'nearest' });
  });

  // Ctrl/⌘K from anywhere.
  $effect(() => {
    const onkey = (e: KeyboardEvent) => {
      if (!globalShortcut || !(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'k') return;
      e.preventDefault();
      if (inline) input?.focus();
      else if (shown) close();
      else shown = true;
    };
    document.addEventListener('keydown', onkey);
    return () => document.removeEventListener('keydown', onkey);
  });

  // Dialog: Escape (cancel), a native close and a click on the backdrop all close the bar.
  $effect(() => {
    const dialog = element as HTMLDialogElement | undefined;
    if (inline || !dialog) return;
    const oncancel = (e: Event) => {
      e.preventDefault();
      close();
    };
    const onnativeclose = () => {
      if (shown) close();
    };
    const onclick = (e: MouseEvent) => {
      if (e.target === dialog) close();
    };
    dialog.addEventListener('cancel', oncancel);
    dialog.addEventListener('close', onnativeclose);
    dialog.addEventListener('click', onclick);
    return () => {
      dialog.removeEventListener('cancel', oncancel);
      dialog.removeEventListener('close', onnativeclose);
      dialog.removeEventListener('click', onclick);
      if (dialog.open) dialog.close();
    };
  });

  function onkeydown(e: KeyboardEvent) {
    const last = list.length - 1;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (last >= 0) active = cur >= last ? 0 : cur + 1;
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (last >= 0) active = cur <= 0 ? last : cur - 1;
        break;
      case 'Home':
      case 'End':
        if (last >= 0) {
          e.preventDefault();
          active = e.key === 'Home' ? 0 : last;
        }
        break;
      case 'Enter':
        if (list[cur]) {
          e.preventDefault();
          choose(list[cur]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        close();
        break;
    }
  }

  const classes = $derived(['command-bar', cssClass].filter(Boolean).join(' '));
</script>

{#snippet tag(item: CommandItem)}{#if item.kind === 'action'}<span class="command-bar-tag" data-kind="action">RUN</span
  >{:else if item.protocol}<span class="command-bar-tag" style="background: var(--{PROTOCOL_TOKEN[item.protocol]})">{item.protocol}</span
  >{:else}<span class="command-bar-tag" data-kind="nav">{item.kind.toUpperCase()}</span>{/if}{/snippet}

{#snippet panel()}
  <div class="command-bar-panel">
    <div class="command-bar-search">
      <Icon name="search" size={18} /><label class="sr-only" for={inputId}>{label}</label><input
        id={inputId}
        bind:this={input}
        class="command-bar-input"
        type="text"
        role="combobox"
        autocomplete="off"
        aria-autocomplete="list"
        aria-expanded={list.length > 0}
        aria-controls={list.length > 0 ? listId : undefined}
        aria-activedescendant={list[cur] ? optionId(cur) : undefined}
        aria-keyshortcuts={globalShortcut ? 'Control+K Meta+K' : undefined}
        {placeholder}
        value={query}
        oninput={(e) => {
          query = e.currentTarget.value;
          active = 0;
        }}
        {onkeydown}
      />{#if globalShortcut}<kbd class="command-bar-kbd" aria-hidden="true">Ctrl K</kbd>{/if}{#if !inline}<button type="button" class="command-bar-close" aria-label="Close" onclick={close}><Icon name="close" size={18} /></button>{/if}
    </div>
    {#if list.length > 0}
      <div class="command-bar-list" id={listId} bind:this={listEl} role="listbox" aria-label={`${label} results`}>
        {#each groups as group (group[0]!.item.kind)}
          {@const kind = group[0]!.item.kind}
          <div class="command-bar-group" role="group" aria-label={KIND_LABEL[kind]}>
            <div class="command-bar-group-title" aria-hidden="true">{KIND_LABEL[kind]}</div>
            {#each group as { item, idx } (item.id)}
              <!-- Keyboard: the combobox owns it (aria-activedescendant); the pointer can pick an option too. -->
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <div
                id={optionId(idx)}
                class="command-bar-option"
                role="option"
                tabindex="-1"
                aria-selected={idx === cur}
                onmousemove={() => active !== idx && (active = idx)}
                onmousedown={(e) => e.preventDefault()}
                onclick={() => choose(item)}
              >
                {@render tag(item)}<span>{item.label}</span><span class="command-bar-hint" aria-hidden="true">{idx === cur ? 'Enter' : (item.hint ?? item.kind)}</span>
              </div>
            {/each}
          </div>
        {/each}
      </div>
    {:else}
      <div class="command-bar-empty">No match. Try a service name or "test".</div>
    {/if}
    <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">{shown || inline ? announce : ''}</div>
  </div>
{/snippet}

{#if inline}
  <div {...eventProps(rest)} bind:this={element} class={classes} data-inline="" role="group" aria-label={label}>{@render panel()}</div>
{:else}
  <dialog {...eventProps(rest)} bind:this={element} class={classes} aria-label={label}>{#if shown}{@render panel()}{/if}</dialog>
{/if}
