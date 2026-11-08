<script lang="ts">
  import StateGlyph from './_StateGlyph.svelte';
  import TaskStateTag from './TaskStateTag.svelte';
  import { TASK_TERMINAL, type TaskTimelineProps } from './types.js';
  let { label = 'Task lifecycle', nodes, selectedIndex, onselectnode, showUnreached = true, class: cssClass, ...rest }: TaskTimelineProps = $props();
  const unreached = $derived(TASK_TERMINAL.filter(state => state !== nodes[nodes.length - 1]?.state));
</script>
<ol {...rest} aria-label={label} class={['task-timeline', cssClass].filter(Boolean).join(' ')}>
  {#each nodes as node, i (i)}{@const on = selectedIndex === i}<li class="task-timeline-node" data-selected={on ? '' : undefined}>
    {#if i > 0}<span class="task-timeline-link" data-text={node.connector ? '' : undefined}>{node.connector}</span>{/if}
    {#if onselectnode}<button type="button" class="task-state" data-state={node.state} aria-pressed={on} aria-label={`${node.state} at ${node.at}, show in script`} onclick={() => onselectnode?.(on ? undefined : i)}><StateGlyph state={node.state} />{node.state}</button>{:else}<TaskStateTag state={node.state} />{/if}
    <span class="task-timeline-at">{node.at}</span>
  </li>{/each}
  {#if showUnreached && unreached.length}<li class="task-timeline-unreached"><span>other end states</span>{#each unreached as state (state)}<TaskStateTag {state} ghost />{/each}</li>{/if}
</ol>
