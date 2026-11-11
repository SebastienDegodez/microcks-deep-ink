<script lang="ts" module>
  export type { Protocol, ProofStatus, ProofValue } from './api-badge.js';
</script>
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { PROTOCOL_ATTR } from '../contracts.js';
  import Icon from '../icon/Icon.svelte';
  import type { IconName } from '../icon/Icon.svelte';
  import type { Protocol, ProofStatus, ProofValue } from './api-badge.js';
  type Props = Omit<HTMLAttributes<HTMLSpanElement>, 'class' | 'children'> & {
    protocol?: Protocol; arazzo?: boolean; name?: string; version?: string; label?: string; value?: string;
    status?: ProofStatus; icon?: IconName; iconLabel?: string; values?: ReadonlyArray<ProofValue>;
    versionTone?: 'muted' | 'text'; size?: 'sm' | 'compact' | 'md' | 'card' | 'lg' | 'xl'; class?: string;
  };
  let { protocol, arazzo, name, version, label, value, status = 'neutral', icon, iconLabel, values, versionTone, size = 'md', class: cssClass, ...rest }: Props = $props();
  const isProof = $derived(!arazzo && label !== undefined);
  const type = $derived(arazzo ? 'ARAZZO' : isProof ? label : (protocol ?? 'REST'));
  const dataProtocol = $derived(arazzo ? 'arazzo' : isProof ? undefined : PROTOCOL_ATTR[protocol ?? 'REST']);
  const main = $derived(isProof ? value : name);
  const proofFill = $derived(isProof && status === 'protocol' ? PROTOCOL_ATTR[protocol ?? 'REST'] : undefined);
  const word = (s?: ProofStatus) => s === 'success' ? 'success' : s === 'danger' ? 'error' : s === 'warning' ? 'warning' : undefined;
</script>
<!-- The twin renders the status word as a text node of its own, between "(" and ")". -->
{#snippet textNode(text?: string)}{text}{/snippet}
{#snippet proof(v: ProofValue)}{#if v.icon}<Icon name={v.icon} size={12} />{/if}{v.value}{#if v.iconLabel}<span class="sr-only">{v.value ? ` ${v.iconLabel}` : v.iconLabel}</span>{/if}{#if word(v.status)} <span class="sr-only">({@render textNode(word(v.status))})</span>{/if}{/snippet}
<span {...rest} class={['api-badge', cssClass].filter(Boolean).join(' ')} data-protocol={dataProtocol} data-status={isProof ? status : undefined} data-size={size} data-fill={proofFill} data-version={versionTone}>
  <span class="api-badge-type">{type}</span> 
  {#if isProof && (main || icon)}<span class="api-badge-name" data-icon-only={icon && !main ? '' : undefined}>{@render proof({ value: main, status, icon, iconLabel })}</span>
  {:else if main}<span class="api-badge-name">{main}</span>{/if} 
  {#if !isProof && version}<span class="api-badge-version">{version}</span>{/if}
  {#if isProof}{#each values ?? [] as v, i (i)}<span class="api-badge-value" data-status={v.status ?? 'neutral'} data-icon-only={v.icon && !v.value ? '' : undefined}>{@render proof(v)}</span>{/each}{/if}
</span>
