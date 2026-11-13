<script lang="ts">
  import { ApiBadge, Field, Input, Radio } from '@microcks/deep-ink';
  import { RouterLink, useQuery, useUseCases } from '@/ui/app';
  import { baseUrlHelp } from './setup';

  interface Props {
    name: string;
    serviceId?: string;
    mixed: boolean;
    where: 'mock' | 'implementation';
    onwhere: (v: 'mock' | 'implementation') => void;
    url: string;
    onurl: (v: string) => void;
    showUrl: boolean;
    error?: string;
  }

  /** One source description of the workflow: its API badge, where its calls go (Mixed) and the base URL of its implementation. */
  let { name, serviceId, mixed, where, onwhere, url, onurl, showUrl, error }: Props = $props();
  const uc = useUseCases();
  const service = useQuery(() => (serviceId ? uc.catalog.getService(serviceId) : Promise.resolve(undefined)), () => [serviceId]);
  const s = $derived(service.data);
</script>

{#snippet urlLabel()}Base URL of the implementation <span class="wfr-label-type">required</span>{/snippet}

<div class="wfr-source"
  ><div class="wfr-source-head"
    ><span class="wfr-mono wfr-strong">{name}</span
    >{#if s}<RouterLink to={`/services/${s.id}`} class="wfr-badge-link"><ApiBadge protocol={s.protocol} name={s.name} version={s.version} /></RouterLink
      >{:else}<span class="wfr-note">not linked</span>{/if}</div
  >{#if mixed}<div role="radiogroup" aria-label={`Where ${name} calls go`} class="wfr-mix"
      ><Radio variant="compact" name={`mix-${name}`} value="mock" label="Its mocks" checked={where === 'mock'} onchange={() => onwhere('mock')} /><Radio
        variant="compact"
        name={`mix-${name}`}
        value="implementation"
        label="Its implementation"
        checked={where === 'implementation'}
        onchange={() => onwhere('implementation')}
      /></div
    >{/if}{#if showUrl}<Field label={urlLabel} {error} class="wfr-field wfr-w-520" help={baseUrlHelp(s ? `${s.name} ${s.version}` : name)}
      >{#snippet children(c)}<Input
          {...c}
          required
          class="wfr-mono-control wfr-url-control"
          type="url"
          spellcheck="false"
          autocomplete="off"
          placeholder="http://localhost:8080"
          value={url}
          oninput={(e) => onurl(e.currentTarget.value)}
        />{/snippet}</Field
    >{:else}<span class="wfr-note">Mocks of <!---->{s ? `${s.name} ${s.version}` : name}</span>{/if}</div
>
