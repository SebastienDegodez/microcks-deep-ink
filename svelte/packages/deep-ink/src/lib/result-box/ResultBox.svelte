<script lang="ts" module>export type { ResultBoxProps, ResultBoxTone } from './result-box.js';</script>
<script lang="ts">
 import type { Snippet } from 'svelte'; import type { HTMLAttributes } from 'svelte/elements'; import Icon from '../icon/Icon.svelte'; import type { IconName } from '../icon/Icon.svelte'; import type { ResultBoxTone } from './result-box.js';
 type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'title' | 'role'> & { tone?: ResultBoxTone; size?: 'sm' | 'md'; title?: string | Snippet; icon?: IconName | null; action?: Snippet; ondismiss?: () => void; dismissLabel?: string; live?: 'status' | 'off'; bordered?: boolean; surface?: 'surface' | 'raised'; density?: 'regular' | 'compact'; class?: string; children?: Snippet };
 let { tone = 'success', size = 'sm', title, icon, action, ondismiss, dismissLabel = 'Dismiss message', live = 'status', bordered = true, surface = 'surface', density = 'regular', class: cssClass, children, ...rest }: Props = $props();
 const icons: Record<ResultBoxTone, IconName | undefined> = { success: 'check', warning: 'warning', danger: 'x-circle', neutral: 'warning', info: undefined };
 const name = $derived(icon === null ? undefined : icon ?? icons[tone]);
</script>
{#snippet text(v: string | Snippet)}{#if typeof v === 'function'}{@render v()}{:else}{v}{/if}{/snippet}
<div {...rest} role={live === 'status' ? 'status' : undefined} class={['result-box', cssClass].filter(Boolean).join(' ')} data-tone={tone === 'success' ? undefined : tone} data-size={size === 'md' ? 'md' : undefined} data-bordered={bordered ? undefined : 'false'} data-surface={surface === 'surface' ? undefined : surface} data-density={density === 'regular' ? undefined : density}>
 {#if name}<span class="result-box-icon" aria-hidden="true"><Icon name={name} size={15} /></span>{/if}
 <div class="result-box-body">{#if title}<p class="result-box-title">{@render text(title)}</p>{/if}{#if children}<span>{@render children()}</span>{/if}</div>
 {#if action}<span class="result-box-action">{@render action()}</span>{/if}{#if ondismiss}<button type="button" class="result-box-dismiss" aria-label={dismissLabel} onclick={ondismiss}><Icon name="close" size={14} /></button>{/if}
</div>
