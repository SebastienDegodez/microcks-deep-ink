<script lang="ts">
  import type { ArazzoDocument, SourceDescription } from '@microcks/demo-core/domain/arazzo';
  import type { ServiceSummary } from '@microcks/demo-core/domain/shared';
  import { ApiBadge, Button, Callout, Dialog, RadioGroup, Skeleton } from '@microcks/deep-ink';
  import { useAnnounce, useQuery, useUseCases } from '@/ui/app';

  interface Props {
    open: boolean;
    onclose: () => void;
    document: ArazzoDocument;
    source: SourceDescription;
    onlinked: (service: ServiceSummary) => void;
  }
  let { open, onclose, document, source, onlinked }: Props = $props();
  const uc = useUseCases();
  const announce = useAnnounce();
  const services = useQuery(() => uc.catalog.listServices());
  let choice = $state('');
  let busy = $state(false);
  let error = $state<string | null>(null);

  const wanted = $derived(source.type === 'asyncapi' ? 'EVENT' : 'REST');
  const candidates = $derived((services.data ?? []).filter((s) => s.protocol === wanted || (source.type === 'openapi' && s.protocol === 'DIRECT')));
  const file = $derived(source.link.status === 'not-linked' ? source.link.expectedFile : source.url);
  const hint = $derived(candidates.find((s) => s.name.toLowerCase().replace(/\s+/g, '').includes(source.name.toLowerCase().replace(/catalog$/, ''))));
  const selected = $derived(choice || hint?.id || '');
  const options = $derived(candidates.map((service) => ({
    value: service.id,
    label: service.name,
    description: `${service.operationCount} ${service.operationCount === 1 ? 'operation' : 'operations'} · ${service.format}`,
    service,
  })));

  async function link() {
    const service = candidates.find((s) => s.id === selected);
    if (!service) { error = 'Pick an API to link.'; return; }
    const docId = document.id;
    const sourceName = source.name;
    const linked = onlinked;
    busy = true;
    error = null;
    try {
      await uc.arazzo.linkSource(docId, sourceName, service.id);
      announce(`${sourceName} is now linked to ${service.name} ${service.version}.`);
      linked(service);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      busy = false;
    }
  }
</script>

{#snippet footer()}<Button variant="ghost" onclick={onclose}>Cancel</Button><Button variant="primary" loading={busy} onclick={link}>Link this API</Button>{/snippet}

<Dialog
  {open}
  {onclose}
  title={`Link ${source.name}`}
  description={`${document.file} declares ${source.name} as ${source.url}. The API for ${file} may not be in Microcks yet: import it first, or pick the API to link here.`}
  {footer}
  >{#if services.status === 'loading' && !services.data}<div aria-busy="true"><Skeleton lines={3} /></div>{:else}<RadioGroup
      legend="Microcks API"
      value={selected}
      onchange={(value) => choice = value}
      error={error ?? undefined}
      {options}
      >{#snippet renderLabel(option)}<ApiBadge protocol={option.service.protocol} name={option.service.name} version={option.service.version} size="sm" />{/snippet}</RadioGroup
    >{/if}{#if candidates.length === 0 && services.status === 'success'}<Callout tone="warning" title="No matching API in the catalogue"
      >Import <!---->{file}<!----> first, then come back.</Callout
    >{/if}</Dialog
>
