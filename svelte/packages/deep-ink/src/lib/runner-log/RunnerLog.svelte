
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
  import { eventProps, type NativeHandlers } from '../event-props';

  type Props = Omit<HTMLAttributes<HTMLElement>, 'class' | 'title' | 'children'> &
    NativeHandlers<HTMLElement> & {
    /** Visible heading, also the name of the log. */
    title?: string;
    /** End of the header: a LiveIndicator or "12 lines · completed". */
    status?: string | Snippet;
    lines: RunnerLine[];
    class?: string;
  };

  let { title = 'Runner log', status, lines, class: cssClass, ...rest }: Props = $props();

  const id = $props.id();
</script>

<section {...eventProps(rest)} aria-labelledby={id} class={['runner-log', cssClass].filter(Boolean).join(' ')}
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
