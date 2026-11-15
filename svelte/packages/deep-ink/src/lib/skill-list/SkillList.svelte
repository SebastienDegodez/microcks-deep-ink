<script lang="ts" module>export type { SkillItem, SkillListProps } from './skill-list.js';</script>
<script lang="ts">
 import type { HTMLAttributes } from 'svelte/elements'; import Icon from '../icon/Icon.svelte'; import type { SkillItem } from './skill-list.js';
 type Props = Omit<HTMLAttributes<HTMLUListElement>, 'class' | 'children' | 'onSelect'> & { label: string; skills: SkillItem[]; selectedId?: string; onselectskill?: (id: string) => void; class?: string };
 let { label, skills, selectedId, onselectskill, class: cssClass, ...rest }: Props = $props();
</script>
<ul {...rest} aria-label={label} class={['skill-list', cssClass].filter(Boolean).join(' ')}>{#each skills as s (s.id)}
 <li class="skill-item-row" data-fallback={s.fallback ? '' : undefined}>
  {#if onselectskill}<button type="button" class="skill-item" data-variant={s.fallback ? 'fallback' : undefined} aria-pressed={selectedId === s.id} onclick={() => onselectskill?.(s.id)}>{@render item(s)}
  </button>{:else}<div class="skill-item" data-variant={s.fallback ? 'fallback' : undefined}>{@render item(s)}</div>{/if}
 </li>
{/each}</ul>
<!-- The twin renders ": " and the result note as two text nodes. -->
{#snippet textNode(text?: string)}{text}{/snippet}
{#snippet item(s: SkillItem)}
 {@const calls = s.calls !== undefined}
 {@const result = s.result !== undefined}
 {#if s.fallback}<span class="skill-item-head"><span class="skill-item-title">{s.name}</span>{#if calls}<span class="skill-item-calls">{s.calls}<span class="sr-only">{@render textNode(' calls in 24 hours')}</span></span>{/if}</span>{#if s.tags?.length || s.meta}<span class="skill-item-line">{[...(s.tags ?? []), ...(s.meta ? [s.meta] : [])].join(' · ')}</span>{/if}{#if result}<span class="skill-item-foot"><span class="skill-item-result" data-result={s.result}><Icon name={s.result === 'pass' ? 'check-circle' : 'x-circle'} size={12} />{s.result === 'pass' ? 'passed' : 'failed'}{#if s.resultNote}<span class="sr-only">{@render textNode(': ')}{s.resultNote}</span>{/if}</span></span>{/if}
 {:else}<span class="skill-item-head"><span class="skill-item-id">{s.id}</span>{#if calls}<span class="skill-item-calls">{s.calls}<span class="sr-only">{@render textNode(' calls in 24 hours')}</span></span>{/if}</span>{#if s.name}<span class="skill-item-name">{s.name}</span>{/if}{#if s.tags?.length || s.meta || result}<span class="skill-item-foot">{#each s.tags ?? [] as t (t)}<span class="skill-item-tag">{t}</span>{/each}{#if s.meta}<span class="skill-item-meta">{s.meta}</span>{/if}{#if result}<span class="skill-item-result" data-result={s.result}><Icon name={s.result === 'pass' ? 'check-circle' : 'x-circle'} size={12} />{s.result === 'pass' ? 'passed' : 'failed'}{#if s.resultNote}<span class="sr-only">{@render textNode(': ')}{s.resultNote}</span>{/if}</span>{/if}</span>{/if}{/if}
{/snippet}
