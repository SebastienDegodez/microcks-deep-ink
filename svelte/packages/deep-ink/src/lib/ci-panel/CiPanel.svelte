<script lang="ts">
  import CopyButton from '../copy-button/CopyButton.svelte';
  import type { CiPanelProps } from './types.js';
  let { title, pill, hint, command, footnote, dashed, copyLabel = 'Copy', class: cssClass, ...rest }: CiPanelProps = $props();
  const titleId = $props.id();
</script>
<section {...rest} aria-labelledby={titleId} class={['ci-panel', cssClass].filter(Boolean).join(' ')} data-dashed={dashed ? '' : undefined}>
  <div class="ci-panel-head"><div class="ci-panel-text"><p class="ci-panel-title"><span id={titleId}>{#if typeof title === 'function'}{@render title()}{:else}{title}{/if}</span>{#if typeof pill === 'function'}{@render pill()}{:else}{pill}{/if}</p>{#if hint}<p class="ci-panel-hint">{#if typeof hint === 'function'}{@render hint()}{:else}{hint}{/if}</p>{/if}</div><CopyButton value={command} label={copyLabel} variant="outline" size="sm" /></div>
  <pre class="ci-panel-code"><code>{command}</code></pre>
  {#if footnote}<p class="ci-panel-foot">{#if typeof footnote === 'function'}{@render footnote()}{:else}{footnote}{/if}</p>{/if}
</section>
