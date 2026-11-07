
<script lang="ts" module>
  export type ChipTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
  export type ChipVariant = 'solid' | 'outline' | 'dashed';
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from '../icon/Icon.svelte';
  import { PROTOCOL_ATTR } from '../contracts.js';
  import type { Protocol } from '../types.js';
  import { eventProps, type NativeHandlers } from '../event-props';

  type Props = Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> &
    NativeHandlers<HTMLElement> & {
    /** Key rendered before the text for `key=value` labels. */
    labelKey?: string;
    tone?: ChipTone;
    variant?: ChipVariant;
    /** `sm`: 11px, padding 1px 8px (row labels). `lg`: a 30px category pill in the UI font, 600 when pressed. */
    size?: 'md' | 'sm' | 'lg';
    /** Protocol filter: square corners and a colour swatch; pressed fills with the protocol colour. */
    protocol?: Protocol;
    /** Count after the text, read as "REST 4". A zero count dims the chip. */
    count?: number;
    /** When defined the chip is a toggle `<button aria-pressed>` (filters). */
    pressed?: boolean;
    /** Adds a remove button. Ignored on toggle chips. */
    onremove?: () => void;
    /** Accessible name of the remove button when the chip text is not a string. */
    removeLabel?: string;
    class?: string;
    element?: HTMLElement;
    children?: string | Snippet;
  };

  let { labelKey, tone = 'neutral', variant = 'solid', size = 'md', protocol, count, pressed, onremove, removeLabel, class: cssClass, children, onclick, element = $bindable(), ...rest }: Props = $props();

  let valueEl: HTMLElement | undefined = $state();
  let renderedText = $state('');
  $effect(() => {
    if (onremove && typeof children === 'function') renderedText = valueEl?.textContent ?? '';
  });
  const text = $derived(typeof children === 'string' ? children : renderedText);
  const name = $derived(removeLabel ?? `Remove ${[labelKey, text].filter(Boolean).join(' ')}`.trim());
  const cls = $derived(['chip', cssClass].filter(Boolean).join(' '));
  // In an expression, so that the compiler keeps the space.
  const space = ' ';
</script>

{#snippet body()}<span class="chip-label"
    >{#if labelKey}<span class="chip-key">{labelKey}</span><span class="chip-eq">=</span>{/if}<span class="chip-value" bind:this={valueEl}
      >{#if typeof children === 'function'}{@render children()}{:else}{children}{/if}</span
    ></span
  >{#if count !== undefined}{space}<span class="chip-count">{count}</span>{/if}{/snippet}

{#if pressed !== undefined}<button
    bind:this={element}
    type="button"
    {...eventProps({ ...rest, onclick })}
    class={cls}
    data-tone={tone}
    data-variant={variant}
    data-size={size}
    data-protocol={protocol ? PROTOCOL_ATTR[protocol] : undefined}
    data-empty={count === 0 ? '' : undefined}
    aria-pressed={pressed}>{@render body()}</button
  >{:else}<span
    bind:this={element}
    {...eventProps(rest)}
    class={cls}
    data-tone={tone}
    data-variant={variant}
    data-size={size}
    data-protocol={protocol ? PROTOCOL_ATTR[protocol] : undefined}
    data-empty={count === 0 ? '' : undefined}
    >{@render body()}{#if onremove}<button type="button" class="chip-remove" aria-label={name} onclick={onremove}
        ><Icon name="close" size={12} /></button
      >{/if}</span
  >{/if}
