<!--
  Small uppercase muted label (registry item section-label). Same props as the React SectionLabel: as, size, weight,
  split, lineHeight, htmlFor, className plus any attribute and React handler (onClick...) of the element. The text stays
  in normal case in the DOM; CSS sets the case.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { reactEvents, type ReactHandlers } from '../react-events';

  type Props = Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> &
    ReactHandlers<HTMLElement> & {
    /** Element to render: a heading for a section, `label` for a field, `span` (default) for a caption. */
    as?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label' | 'span' | 'p' | 'div';
    /** `md` (default): 12px, tracking .04em. `sm`: 11px, tracking .06em. */
    size?: 'md' | 'sm';
    /** `regular`: weight 400 instead of 600. */
    weight?: 'semibold' | 'regular';
    /** Spreads the children to both ends of the line. */
    split?: boolean;
    /** `fixed` (default): 16px. `normal`: the font's own line height. `snug`: 1.4. */
    lineHeight?: 'fixed' | 'normal' | 'snug';
    /** With `as="label"`: id of the field. */
    htmlFor?: string;
    className?: string;
    children?: Snippet;
  };

  let { as = 'span', size = 'md', weight = 'semibold', split, lineHeight = 'fixed', htmlFor, className, children, ...rest }: Props = $props();
</script>

<svelte:element
  this={as}
  {...reactEvents(rest)}
  for={htmlFor}
  class={['section-label', className].filter(Boolean).join(' ')}
  data-size={size === 'md' ? undefined : size}
  data-weight={weight === 'semibold' ? undefined : weight}
  data-split={split ? '' : undefined}
  data-line-height={lineHeight === 'fixed' ? undefined : lineHeight}>{@render children?.()}</svelte:element
>
