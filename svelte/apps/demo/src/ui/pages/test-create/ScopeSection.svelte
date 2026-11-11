<script lang="ts">
  import { timeoutHelp, type TestFormErrors, type TestTarget } from '@microcks/demo-core/domain/testing';
  import { Button, Checkbox, Field, Icon, Input, MethodTag, Radio, type Protocol } from '@microcks/deep-ink';
  import type { Draft, UpdateDraft } from './draft';
  import FormSection from './FormSection.svelte';
  import { allOperationsSelected, checkOperation, operationsLabel, toggleAllOperations } from './form';

  interface Props {
    target: TestTarget;
    protocol: Protocol | undefined;
    d: Draft;
    update: UpdateDraft;
    uid: string;
    selected: string[];
    errors: Pick<TestFormErrors, 'operations' | 'timeout'>;
    opsEl?: HTMLInputElement;
    timeoutEl?: HTMLInputElement;
  }

  /** "03 Scope": the operations to replay (the one to listen to for an event API) and the timeout. */
  let { target, protocol, d, update, uid, selected, errors, opsEl = $bindable(), timeoutEl = $bindable() }: Props = $props();
  const isEvent = $derived(target.type === 'EVENT');
  const allSelected = $derived(allOperationsSelected(target, selected));
  const opsError = $derived(errors.operations);
  const opsErrorId = $derived(`${uid}-ops-error`);
</script>

{#snippet operationLabel(verb: string, path: string, samples: number)}<span class="tc-op-label"
    ><MethodTag method={verb} {protocol} class="tc-op-method" /><span class="tc-op-path">{path}</span><span class="tc-op-samples"
      >{samples}<!----> <!---->{samples === 1 ? 'sample' : 'samples'}</span
    ></span
  >{/snippet}

<FormSection step="03" title="Scope"
  ><div class="tc-scope"
    ><div class="tc-ops" role={isEvent ? 'radiogroup' : 'group'} aria-labelledby={`${uid}-ops-label`} aria-describedby={opsError ? opsErrorId : undefined}
      ><div class="tc-ops-head"
        ><span id={`${uid}-ops-label`} class="tc-ops-label">{operationsLabel(target, selected)}</span
        >{#if !isEvent}<Button variant="link" size="sm" class="tc-ops-toggle" onclick={() => update(toggleAllOperations(target, selected))}
            >{allSelected ? 'Clear all' : 'Select all'}</Button
          >{/if}</div
      >{#each target.operations as o, i (o.id)}{@const on = selected.includes(o.id)}{#snippet label()}{@render operationLabel(o.verb, o.path, o.samples)}{/snippet}{#if isEvent}<Radio
            bind:element={() => (i === 0 ? opsEl : undefined), (el) => {
              if (i === 0) opsEl = el;
            }}
            variant="card"
            class="tc-op"
            name="operation"
            checked={on}
            onchange={() => update({ ops: [o.id] })}
            {label}
          />{:else}<Checkbox
            bind:element={() => (i === 0 ? opsEl : undefined), (el) => {
              if (i === 0) opsEl = el;
            }}
            variant="card"
            class="tc-op"
            checked={on}
            onchange={(e) => update(checkOperation(selected, o.id, e.currentTarget.checked))}
            {label}
          />{/if}{/each}{#if opsError}<p class="error" id={opsErrorId}
          ><Icon name="cross" size={13} /><span><span class="sr-only">{'Error: '}</span>{opsError}</span></p
        >{/if}</div
    ><Field label="Timeout" help={timeoutHelp(d.timeout, isEvent)} error={errors.timeout} class="tc-timeout-field"
      >{#snippet children(c)}<div class="tc-timeout"
          ><Input
            {...c}
            bind:element={timeoutEl}
            type="number"
            mono
            min={1000}
            max={30000}
            step={1000}
            value={d.timeout}
            oninput={(e) => update({ timeout: e.currentTarget.value })}
          /><span class="tc-unit" aria-hidden="true">ms</span></div
        >{/snippet}</Field
    ></div
  ></FormSection
>
