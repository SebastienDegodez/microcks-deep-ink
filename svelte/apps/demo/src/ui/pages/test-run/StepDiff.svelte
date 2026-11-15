<script lang="ts">
  import { buildContractDiff, type TestRun, type TestStepResult } from '@microcks/demo-core/domain/testing';
  import { ApiBadge, Icon } from '@microcks/deep-ink';
  import { RouterLink } from '@/ui/app';
  import CodeCard from './CodeCard.svelte';
  import { conformantSentence, hostOf, newEnumValue, schemaBadgeValue, stepOperationText, stepSchemaName } from './run';

  interface Props {
    id: string;
    step: TestStepResult;
    run: TestRun;
    serviceId: string;
  }

  /** The open step: the request sent, the contract next to the actual response, then the violations or the all-clear. */
  let { id, step, run, serviceId }: Props = $props();

  const diff = $derived(buildContractDiff(step));
  const ko = $derived(step.result === 'failed');
  const isArray = $derived(Array.isArray(step.payload));
  const code = $derived(step.httpStatus ?? 200);
  const schema = $derived(stepSchemaName(step));
  const newEnum = $derived(newEnumValue(step));
  const opText = $derived(stepOperationText(run, step));
  const count = $derived(step.violations.length);
</script>

<div {id} role="region" aria-label={`Contract versus actual response for ${step.name}`} class="tr-diff"
  ><div class="tr-diff-head"
    ><div class="tr-diff-heading"
      ><h4 class="tr-diff-title">Contract <span aria-hidden="true" class="tr-diff-swap">⇄</span> Actual response</h4
      >{#if step.schemaRef}<span class="tr-diff-ref"
          >{#if isArray}{'array of '}{/if}{step.schemaRef}<!----> · <!---->{code}<!----> application/json</span
        >{/if}</div
    ><ApiBadge label="schema" value={schemaBadgeValue(step)} status={ko ? 'danger' : 'success'} /></div
  ><div class="tr-request"
    ><span
      ><span class="tr-request-key">sent{' '}</span><span>{step.method}<!---->{' '}<!---->{run.endpoint}<!---->{step.path}</span></span
    >{#if step.requestBody}<span
        ><span class="tr-request-key">body{' '}</span><span class="tr-request-body">{step.requestBody}</span></span
      >{/if}<span
      ><span class="tr-request-key">got{' '}</span><span>{code}<!----> OK · application/json · <!---->{step.ms}<!----> ms</span></span
    ></div
  >{#if step.contract}<div class="tr-code-pair"
      ><CodeCard title="Contract · expected" source={run.contractFile ?? 'contract'} rows={diff.left} label="Contract schema" /><div
        aria-hidden="true"
        class="tr-code-swap">⇄</div
      ><CodeCard title="Actual response" source={hostOf(run.endpoint)} rows={diff.right} label="Actual response" bad={ko} /></div
    >{/if}{#if ko}<div class="tr-violations"
      ><ul class="tr-violation-list"
        >{#each step.violations as v (v.path)}<li class="tr-violation"
            ><span aria-hidden="true" class="tr-violation-mark">✕</span><span class="tr-violation-body"
              ><span class="tr-violation-text"><span class="tr-violation-path">{v.path}</span>{' '}<!---->{v.message}</span
              >{#if v.raw}<span class="tr-violation-raw">validator: <!---->{v.raw}</span>{/if}</span
            ></li
          >{/each}</ul
      ><p class="tr-diff-note"
        >The endpoint answered <span class="demo-mono">{code}</span> as the contract declares, but its body breaks the <span
          class="demo-mono">{schema}</span
        >{' '}<!---->schema on <!---->{count}<!---->{' '}<!---->{count === 1 ? 'property' : 'properties'}<!---->. Fix the implementation{#if newEnum}, or if <span
            class="demo-mono">{newEnum}</span
          > is an intended new status, add it to the contract and re-import{/if}<!---->.<!---->{' '}<RouterLink
          to={`/services/${serviceId}/operations/${step.operationId}`}
          class="tr-diff-link">Open <!---->{opText}</RouterLink
        ></p
      ></div
    >{:else}<p class="tr-diff-ok"><Icon name="check" size={14} class="tr-diff-ok-icon" /><span>{conformantSentence(step)}</span></p>{/if}</div
>
