<!--
  Text link (registry item link). Same props as the React Link: external, className plus any <a> attribute, and the
  React handlers onClick, onFocus, onBlur. `external` opens in a new tab and adds an icon, a hidden notice and
  rel="noopener noreferrer".
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { FocusEventHandler, HTMLAnchorAttributes, MouseEventHandler } from 'svelte/elements';
  import Icon from '../icon/Icon.svelte';

  type Props = Omit<HTMLAnchorAttributes, 'class' | 'children'> & {
    /** Opens in a new tab: adds an icon, a hidden notice and rel="noopener noreferrer". */
    external?: boolean;
    className?: string;
    onClick?: MouseEventHandler<HTMLAnchorElement>;
    onFocus?: FocusEventHandler<HTMLAnchorElement>;
    onBlur?: FocusEventHandler<HTMLAnchorElement>;
    children?: Snippet;
  };

  let { external, className, rel, target, onClick, onFocus, onBlur, onclick, onfocus, onblur, children, ...rest }: Props = $props();

  // In an expression, so that the compiler keeps it.
  const space = ' ';
</script>

<a
  {...rest}
  onclick={(e) => {
    onclick?.(e);
    onClick?.(e);
  }}
  onfocus={(e) => {
    onfocus?.(e);
    onFocus?.(e);
  }}
  onblur={(e) => {
    onblur?.(e);
    onBlur?.(e);
  }}
  class={['link', className].filter(Boolean).join(' ')}
  data-external={external ? '' : undefined}
  target={external ? '_blank' : target}
  rel={external ? 'noopener noreferrer' : rel}
>{@render children?.()}{#if external}<Icon name="external" size={14} />{space}<span class="sr-only">(opens in a new tab)</span>{/if}</a
>
