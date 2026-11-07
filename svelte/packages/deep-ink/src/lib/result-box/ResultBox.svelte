<!--
  A framed result line in a role="status" box (registry item result-box). Same props as the React ResultBox: tone,
  size, title, icon, action, onDismiss, dismissLabel, live, bordered, surface, className plus any <div> attribute and
  React handler (onClick...). `title` and `action` (ReactNode in React) are strings or snippets; the message is the
  children. Keep it mounted before the result arrives.
-->
<script lang="ts" module>
  import type { IconName } from '../icon/icon';

  export type ResultBoxTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

  const TONE_ICON: Record<ResultBoxTone, IconName | undefined> = {
    success: 'check',
    warning: 'warning',
    danger: 'x-circle',
    neutral: 'warning',
    info: undefined,
  };
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from '../icon/Icon.svelte';
  import { reactEvents, type ReactHandlers } from '../react-events';

  type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'title' | 'role' | 'children'> &
    ReactHandlers<HTMLDivElement> & {
    /** `success` (default), `warning`, `danger`, `neutral` (thin frame on --bg), `info` (strong frame on --raised). */
    tone?: ResultBoxTone;
    /** `md`: 14px text in --text (toast). Default 13px in --text-secondary. */
    size?: 'sm' | 'md';
    /** Bold 14px first line. */
    title?: string | Snippet;
    /** Leading decorative icon. Defaults to the tone's icon; `null` hides it. */
    icon?: IconName | null;
    /** Buttons or links at the end ("Undo", "Link source"). */
    action?: string | Snippet;
    /** Shows a 28px dismiss button. */
    onDismiss?: () => void;
    dismissLabel?: string;
    /** `status` (default) is a polite live region; `off` for static content. */
    live?: 'status' | 'off';
    /** Default `true`. `false`: no frame, a top-aligned note layout (Agent test verdict). */
    bordered?: boolean;
    /** Default `surface`. `raised`: the --raised fill instead of --surface. */
    surface?: 'surface' | 'raised';
    className?: string;
    children?: Snippet;
  };

  let {
    tone = 'success',
    size = 'sm',
    title,
    icon,
    action,
    onDismiss,
    dismissLabel = 'Dismiss message',
    live = 'status',
    bordered = true,
    surface = 'surface',
    className,
    children,
    ...rest
  }: Props = $props();

  const name = $derived(icon === null ? undefined : (icon ?? TONE_ICON[tone]));
</script>

{#snippet content(c: string | Snippet)}{#if typeof c === 'function'}{@render c()}{:else}{c}{/if}{/snippet}

<div
  {...reactEvents(rest)}
  role={live === 'status' ? 'status' : undefined}
  class={['result-box', className].filter(Boolean).join(' ')}
  data-tone={tone === 'success' ? undefined : tone}
  data-size={size === 'md' ? 'md' : undefined}
  data-bordered={bordered ? undefined : 'false'}
  data-surface={surface === 'surface' ? undefined : surface}
  >{#if name}<span class="result-box-icon" aria-hidden="true"><Icon {name} size={15} /></span>{/if}<div class="result-box-body"
    >{#if title}<p class="result-box-title">{@render content(title)}</p>{/if}{#if children}<span>{@render children()}</span>{/if}</div
  >{#if action}<span class="result-box-action">{@render content(action)}</span>{/if}{#if onDismiss}<button
      type="button"
      class="result-box-dismiss"
      aria-label={dismissLabel}
      onclick={() => onDismiss()}><Icon name="close" size={14} /></button
    >{/if}</div
>
