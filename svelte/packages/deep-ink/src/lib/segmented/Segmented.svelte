<!--
  Filter buttons that behave like one choice (registry item segmented): a role="group" of buttons with aria-pressed.
  Same props as the React Segmented: label, options, value, onChange (called with the pressed id), variant, tone,
  pressedFill, iconSize, size, spacing, className. `value` is also bindable. Like React, no other attribute is forwarded.
  Announce the result count of the filtered list in a live region.
-->
<script lang="ts" module>
  import type { IconName } from '../icon/Icon.svelte';

  export type SegmentedDot = 'neutral' | 'success' | 'danger' | 'warning' | 'muted' | 'ring';

  export interface SegmentedOption {
    id: string;
    label: string;
    /** Result count, read as "Failed, 2". */
    count?: number;
    /** Leading 8px dot (decorative: the label carries the meaning). `ring` is an empty muted ring. */
    dot?: SegmentedDot;
    /** Leading icon (decorative). */
    icon?: IconName;
    /** Colour of the icon (Sources status filter). The label still carries the meaning. */
    iconTone?: 'success' | 'warning' | 'danger' | 'muted';
  }
</script>

<script lang="ts">
  import Icon from '../icon/Icon.svelte';

  type Props = {
    /** Accessible name of the group ("Result"). */
    label: string;
    options: SegmentedOption[];
    /** Id of the pressed option. */
    value: string;
    onChange?: (id: string) => void;
    /** `track` (default): padded track, the pressed option raised. `joined`: bordered cells side by side. */
    variant?: 'track' | 'joined';
    /** `primary` (joined only): the pressed option is filled with the action colour. */
    tone?: 'neutral' | 'primary';
    /** Track only. Fill of the pressed option: `raised` (default) or `selected` (Sources). */
    pressedFill?: 'raised' | 'selected';
    /** Icon size in px: 15 (default) or 13 (Sources status icons). */
    iconSize?: 13 | 15;
    /** `sm` (joined): 28px, mono 12px 600, no separators (Behavior, Admin, Copilot). */
    size?: 'md' | 'sm';
    /** `wide`: 0 12px button padding instead of 0 10px (Usage period). */
    spacing?: 'normal' | 'wide';
    className?: string;
  };

  let {
    label,
    options,
    value = $bindable(),
    onChange,
    variant = 'track',
    tone = 'neutral',
    pressedFill = 'raised',
    iconSize = 15,
    size = 'md',
    spacing = 'normal',
    className,
  }: Props = $props();

  // In an expression, so that the compiler keeps the space.
  const comma = ', ';

  function press(id: string) {
    value = id;
    onChange?.(id);
  }
</script>

<div
  role="group"
  aria-label={label}
  class={['segmented', className].filter(Boolean).join(' ')}
  data-variant={variant}
  data-tone={tone}
  data-pressed-fill={pressedFill === 'selected' ? 'selected' : undefined}
  data-size={size === 'sm' ? 'sm' : undefined}
  data-spacing={spacing === 'wide' ? 'wide' : undefined}
  >{#each options as o (o.id)}<button type="button" aria-pressed={o.id === value} onclick={() => press(o.id)}
      >{#if o.dot}<span class="segmented-dot" data-dot={o.dot} aria-hidden="true"></span>{/if}{#if o.icon}<Icon
          name={o.icon}
          size={iconSize}
          data-tone={o.iconTone}
        />{/if}{o.label}{#if o.count !== undefined}<span class="segmented-count"
          ><span class="sr-only">{comma}</span>{o.count}</span
        >{/if}</button
    >{/each}</div
>
