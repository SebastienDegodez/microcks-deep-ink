<script lang="ts">
  import Icon from '../icon/Icon.svelte';
  import type { RunProgressProps } from './types.js';
  let { label = 'Progress', busy = false, done, total, caption, nowLabel, now, segments, counts, action, note, gap, class: cssClass, style, ...rest }: RunProgressProps = $props();
  const COUNT_ICON = { pass: 'check', fail: 'cross', warn: 'warning', pending: 'circle' } as const;
</script>
<section {...rest} aria-label={label} class={['run-progress', cssClass].filter(Boolean).join(' ')} style={gap !== undefined ? `${style ?? ''}; --run-gap: ${gap}px` : style}>
  <div class="run-progress-top">
    <p class="run-progress-count"><span class="run-progress-done">{done}<span class="run-progress-total">/{total}</span></span><span class="run-progress-caption">{caption}</span></p>
    {#if now !== undefined}<div class="run-progress-now" aria-live="polite">{#if nowLabel}<span class="run-progress-now-label">{nowLabel}</span>{/if}<span class="run-progress-now-value">{now}</span></div>{/if}
  </div>
  <div class="run-progress-bar" role="img" aria-label={`${done} of ${total} ${caption}`} aria-busy={busy || undefined}>{#each segments as segment, i (i)}<span data-seg={segment}></span>{/each}</div>
  {#if note}<p class="run-progress-note">{#if typeof note === 'function'}{@render note()}{:else}{note}{/if}</p>{/if}
  {#if counts?.length || action}<div class="run-progress-foot">{#if counts?.length}<ul class="run-progress-counts">{#each counts as count, i (i)}<li data-kind={count.kind}><Icon name={COUNT_ICON[count.kind]} size={13} />{count.text}</li>{/each}</ul>{/if}{#if action}<span class="run-progress-action">{#if typeof action === 'function'}{@render action()}{:else}{action}{/if}</span>{/if}</div>{/if}
</section>
