<!--
  Icon + word + color (registry item status-badge). Same props as the React StatusBadge: status, label, size, shape,
  className plus any <span> attribute and React handler (onClick...). `label` (ReactNode in React) is a string, a number,
  a snippet or an array of them. The word is never optional: an empty label (null, undefined, a boolean, a blank
  string, or an array holding only those, like React's empty fragment) falls back to the status word; `0` is shown.
  A snippet always counts as content (as any React element other than a fragment).
-->
<script lang="ts" module>
  import type { Snippet } from 'svelte';

  export type Outcome = 'conformant' | 'failed' | 'partial' | 'running' | 'never';
  type LabelAtom = string | number | boolean | null | undefined;
  export type StatusBadgeLabel = LabelAtom | Snippet | LabelAtom[];

  const WORD: Record<Outcome, string> = {
    conformant: 'Conformant',
    failed: 'Failed',
    partial: 'Partial',
    running: 'Running',
    never: 'Never tested',
  };

  const ICON = {
    circled: { conformant: 'check-circle', failed: 'x-circle', partial: 'warning', running: 'running', never: 'never-tested' },
    bare: { conformant: 'check', failed: 'cross', partial: 'warning', running: 'running', never: 'circle' },
  } as const;

  function isEmptyLabel(node: StatusBadgeLabel): boolean {
    if (node == null || typeof node === 'boolean') return true;
    if (typeof node === 'string') return node.trim() === '';
    if (Array.isArray(node)) return node.every(isEmptyLabel);
    return false;
  }
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from '../icon/Icon.svelte';
  import { reactEvents, type ReactHandlers } from '../react-events';

  type Props = Omit<HTMLAttributes<HTMLSpanElement>, 'class' | 'children'> &
    ReactHandlers<HTMLSpanElement> & {
    status: Outcome;
    /** Overrides the default word, e.g. "Retrying · attempt 2 of 3". An empty label falls back to the word. */
    label?: StatusBadgeLabel;
    /** `lg`: page-level status (14px word, 15px icon, 2.6 stroke, normal line height). */
    size?: 'md' | 'sm' | 'lg';
    /** `circled` (default): ringed icons for a summary; "never" is a dashed ring. `bare`: plain check and cross. */
    shape?: 'circled' | 'bare';
    className?: string;
  };

  let { status, label, size = 'md', shape = 'circled', className, ...rest }: Props = $props();

  const known: Outcome = $derived(status in WORD ? status : 'never');
  const iconSize = $derived(size === 'lg' ? 15 : shape === 'circled' ? (size === 'sm' ? 14 : 15) : size === 'sm' ? 13 : 14);
</script>

<span
  {...reactEvents(rest)}
  class={['status', className].filter(Boolean).join(' ')}
  data-status={status}
  data-size={size}
  data-shape={shape}
  ><Icon name={ICON[shape][known]} size={iconSize} /><span
    >{#if isEmptyLabel(label)}{WORD[known]}{:else if typeof label === 'function'}{@render label()}{:else if Array.isArray(label)}{#each label as part, i (i)}{#if typeof part === 'string' || typeof part === 'number'}{part}{/if}{/each}{:else}{label}{/if}</span
  ></span
>
