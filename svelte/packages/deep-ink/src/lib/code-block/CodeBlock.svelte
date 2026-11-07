
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from '../icon/Icon.svelte';
  import { eventProps, type NativeHandlers } from '../event-props';
  import CopyButton from '../copy-button/CopyButton.svelte';
  import type { CodeLine, CodeTab } from './code-block';

  type Props = Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> &
    NativeHandlers<HTMLElement> & {
    /** Plain text. Use `lines` for per-line markers. */
    code?: string;
    lines?: CodeLine[];
    language?: string;
    caption?: string;
    /** Accessible name of the code region when the caption alone is not unique; it must contain the caption. */
    label?: string;
    /** Show the copy button. */
    copy?: boolean;
    /** `plain`: bordered code, no header. `bare`: no frame, header nor padding. */
    variant?: 'framed' | 'plain' | 'bare';
    /** Source written at the end of the header (mono). */
    source?: string;
    headerTone?: 'raised';
    /** `always` (default), `overflow` (a named region only while it scrolls) or `never`. */
    focusable?: 'always' | 'overflow' | 'never';
    /** `none`: only the `<pre class="code-pre">`, no figure, header or copy button; the props go on the `<pre>`. */
    frame?: 'figure' | 'none';
    tabs?: CodeTab[];
    tab?: string;
    ontabchange?: (id: string) => void;
    tabsLabel?: string;
    lineNumbers?: boolean;
    startLine?: number;
    gutter?: 'wide' | 'narrow';
    tone?: 'danger';
    maxHeight?: string | number;
    class?: string;
    style?: string;
  };

  let {
    code,
    lines,
    language,
    caption,
    label: regionLabel,
    copy = true,
    variant = 'framed',
    tabs,
    tab,
    ontabchange,
    tabsLabel = 'Format',
    lineNumbers,
    startLine = 1,
    gutter = 'wide',
    tone,
    maxHeight,
    source,
    headerTone,
    focusable = 'always',
    frame = 'figure',
    class: cssClass,
    style,
    ...rest
  }: Props = $props();

  const scrolls = (el: HTMLElement) => el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight;
  // In expressions, so that the compiler keeps their trailing space.
  const changedWord = 'Changed: ';
  const problemWord = 'Problem: ';
  const captionId = $props.id();
  const rows = $derived(lines ?? (lineNumbers && code !== undefined ? code.split('\n').map((text) => ({ text }) as CodeLine) : undefined));
  const value = $derived(code ?? (lines ?? []).map((l) => l.text).join('\n'));
  const tabLabel = $derived(tabs?.find((t) => t.id === tab)?.label);
  const label = $derived(regionLabel ?? caption ?? (tabLabel ? `${tabLabel} code` : language ? `${language} code` : 'Code'));
  const diff = $derived(rows?.some((l) => l.changed) ?? false);
  const preOnly = $derived(frame === 'none');
  const header = $derived(!preOnly && variant === 'framed' && Boolean(caption || copy || tabs?.length || source));
  const maxHeightCss = $derived(maxHeight === undefined ? undefined : `max-height:${typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight}`);

  let pre: HTMLPreElement | undefined = $state();
  let overflows = $state(true);
  // Remeasure on every rendered-content change: notes, markers and the gutter change the width without changing the text.
  $effect(() => {
    void [frame, code, lines, lineNumbers, startLine, gutter, variant, maxHeight];
    if (focusable === 'overflow' && pre) overflows = scrolls(pre);
  });
  // ...and when the box itself is resized (container width, max height).
  $effect(() => {
    const el = pre;
    if (focusable !== 'overflow' || !el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => (overflows = scrolls(el)));
    ro.observe(el);
    return () => ro.disconnect();
  });

  const region = $derived(focusable === 'always' || (focusable === 'overflow' && overflows));
  // The scroll container must be keyboard reachable (WCAG 2.1.1), so it is focusable and named.
  const regionProps = $derived(region ? { tabindex: 0, role: 'region', 'aria-label': label } : {});
  const data = $derived({
    'data-language': language,
    'data-variant': variant,
    'data-numbered': lineNumbers ? '' : undefined,
    'data-gutter': lineNumbers && gutter === 'narrow' ? 'narrow' : undefined,
    'data-tone': tone,
    'data-diff': diff ? '' : undefined,
  });
</script>

<!-- No whitespace between the nodes below: everything inside <pre> is rendered. -->
{#snippet body()}<code class={language ? `language-${language}` : undefined}
    >{#if rows}{#each rows as line, i (i)}<span
          class="code-line"
          data-bad={line.bad ? '' : undefined}
          data-selected={line.selected ? '' : undefined}
          data-changed={line.changed ? '' : undefined}
          >{#if lineNumbers}<span class="code-ln" aria-hidden="true">{startLine + i}</span>{/if}{#if diff}<span
              class="code-mark"
              data-kind="changed"
              aria-hidden="true">{line.changed ? '+' : ''}</span
            >{#if line.changed}<span class="sr-only">{changedWord}</span>{/if}{/if}{#if line.bad}<span
              class="code-mark"
              aria-hidden="true"><Icon name="close" size={11} /></span
            ><span class="sr-only">{problemWord}</span>{/if}<span class="code-text">{line.text}</span
          >{#if line.note}<span class="code-note">{line.note}</span>{/if}</span
        >{/each}{:else}{code}{/if}</code
  >{/snippet}

{#if preOnly}
  <pre
    {...eventProps(rest)}
    {...data}
    bind:this={pre}
    {...regionProps}
    class={['code-pre', cssClass].filter(Boolean).join(' ')}
    style={[style, maxHeightCss].filter(Boolean).join(';') || undefined}>{@render body()}</pre>
{:else}
  <figure
    {...eventProps(rest)}
    {style}
    class={['code', cssClass].filter(Boolean).join(' ')}
    {...data}
    data-header-tone={header && headerTone ? headerTone : undefined}
  >
    {#if header}
      <figcaption>
        {#if tabs?.length}<span class="code-tabs" role="group" aria-label={tabsLabel}
            >{#each tabs as t (t.id)}<button type="button" aria-pressed={t.id === tab} onclick={() => ontabchange?.(t.id)}>{t.label}</button
              >{/each}</span
          >{/if}<span class="code-caption" id={captionId} data-title={source ? '' : undefined}>{caption ?? ''}</span
        >{#if source}<span class="code-source">{source}</span>{/if}{#if copy}<CopyButton {value} variant="link" class="code-copy" />{/if}
      </figcaption>
    {/if}
    <pre bind:this={pre} {...regionProps} style={maxHeightCss}>{@render body()}</pre>
  </figure>
{/if}
