<script lang="ts">
  import type { CreateTestForm } from '@microcks/demo-core/application/testing';
  import type { TestTarget } from '@microcks/demo-core/domain/testing';
  import { ApiBadge, Chip, Field, Icon, Input } from '@microcks/deep-ink';
  import type { Draft, UpdateDraft } from './draft';
  import FormSection from './FormSection.svelte';
  import { sampleCount, targetOperationCount } from './form';

  interface Props {
    form: CreateTestForm;
    target: TestTarget;
    service: CreateTestForm['services'][number] | undefined;
    d: Draft;
    update: UpdateDraft;
    uid: string;
    endpointError: string | undefined;
    endpointEl?: HTMLInputElement;
    onpickservice: (id: string) => void;
  }

  /** "01 Target": the service under test, its endpoint and the recently tested endpoints. */
  let { form, target, service, d, update, uid, endpointError, endpointEl = $bindable(), onpickservice }: Props = $props();
  const samples = $derived(sampleCount(target));
</script>

<FormSection step="01" title="Target"
  ><Field label="Service under test"
    >{#snippet children(c)}<div class="tc-service-row"
        ><span class="tc-svc-picker"
          >{#if service}<ApiBadge protocol={service.protocol} name={service.name} version={service.version} />{/if}<span class="tc-svc-meta"
            >{target.operations.length}<!----> <!---->{target.operations.length === 1 ? 'operation' : 'operations'}<!----> · <!---->{samples}<!----> <!---->{samples === 1 ? 'sample' : 'samples'}</span
          ><Icon name="chevron-down" size={14} /><!-- The native select carries the keyboard and screen reader behaviour; the styled box above is its face. --><select
            {...c}
            aria-describedby={`${uid}-contract`}
            class="tc-svc-select"
            value={target.serviceId}
            onchange={(e) => onpickservice(e.currentTarget.value)}
            >{#each form.services as s (s.id)}<option value={s.id}
                >{s.name}<!----> <!---->{s.version}<!----> · <!---->{targetOperationCount(form.targets, s.id)}<!----> ops</option
              >{/each}</select
          ></span
        ><span class="tc-contract" id={`${uid}-contract`}>Contract: <span class="tc-contract-value">{target.artifacts}</span></span></div
      >{/snippet}</Field
  ><div class="tc-endpoint-block"
    ><Field label="Test endpoint" required help={target.endpointHelp} error={endpointError} class="tc-endpoint"
      >{#snippet children(c)}<Input
          {...c}
          bind:element={endpointEl}
          mono
          spellcheck={false}
          autocomplete="off"
          value={d.endpoint}
          oninput={(e) => update({ endpoint: e.currentTarget.value })}
        />{/snippet}</Field
    >{#if target.recentEndpoints.length > 0}<div class="tc-recent" role="group" aria-label="Recently tested endpoints"
        ><span class="tc-recent-label">Recently tested</span>{#each target.recentEndpoints as r (r.url)}<Chip
            size="sm"
            pressed={r.url === d.endpoint.trim()}
            onclick={() => update({ endpoint: r.url })}
            class="tc-recent-chip"><span class="tc-recent-env">{r.env}</span> <!---->{r.url}</Chip
          >{/each}</div
      >{/if}</div
  ></FormSection
>
