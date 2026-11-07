<!--
  The runner's log (registry item runner-log): a section named by its heading, over a focusable role="log" list (an
  implicit polite live region; newest line at the bottom). Same props as the React RunnerLog: title, status, lines,
  className plus any <section> attribute and React handler (onClick...). `status` (ReactNode in React) is a string or a
  snippet. As in React, the log does not scroll itself.
-->
<script lang="ts" module>
  export type RunnerLevel = 'INFO' | 'SEND' | 'PASS' | 'FAIL' | 'WARN' | 'WAIT';
  export interface RunnerLine {
    time: string;
    level: RunnerLevel;
    text: string;
    /** Written in the main text colour. */
    emphasis?: boolean;
    /** Written in the danger colour. */
    error?: boolean;
  }
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { reactEvents, type ReactHandlers } from '../react-events';

  type Props = Omit<HTMLAttributes<HTMLElement>, 'class' | 'title' | 'children'> &
    ReactHandlers<HTMLElement> & {
    /** Visible heading, also the name of the log. */
    title?: string;
    /** End of the header: a LiveIndicator or "12 lines · completed". */
    status?: string | Snippet;
    lines: RunnerLine[];
    className?: string;
  };

  let { title = 'Runner log', status, lines, className, ...rest }: Props = $props();

  const id = $props.id();
</script>

<section {...reactEvents(rest)} aria-labelledby={id} class={['runner-log', className].filter(Boolean).join(' ')}
  ><div class="runner-log-head"
    ><h2 class="runner-log-title" {id}>{title}</h2
    >{#if status}<span class="runner-log-status"
        >{#if typeof status === 'function'}{@render status()}{:else}{status}{/if}</span
      >{/if}</div
  ><!-- The log scrolls, so it must be keyboard reachable (WCAG 2.1.1). --><!-- svelte-ignore a11y_no_noninteractive_tabindex --><div
    class="runner-log-body"
    role="log"
    aria-labelledby={id}
    tabindex="0"
    ><ol class="runner-log-lines"
      >{#each lines as l, i (i)}<li
          class="runner-log-line"
          data-level={l.level}
          data-emphasis={l.emphasis ? '' : undefined}
          data-error={l.error ? '' : undefined}
          ><span class="runner-log-time">{l.time}</span><span class="runner-log-level">{l.level}</span><span
            class="runner-log-text">{l.text}</span
          ></li
        >{/each}</ol
    ></div
  ></section
>
