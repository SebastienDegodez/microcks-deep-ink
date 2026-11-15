<script lang="ts">
  import type { CreateTestForm } from '@microcks/demo-core/application/testing';
  import { summarizeSelection, type CiFormat, type TestTarget } from '@microcks/demo-core/domain/testing';
  import { Button, Callout } from '@microcks/deep-ink';
  import { ButtonRouterLink, useNavigate, useUseCases } from '@/ui/app';
  import AuthSection from './AuthSection.svelte';
  import CiAside from './CiAside.svelte';
  import { initialDraft, type Draft } from './draft';
  import { ciLines, createTestInput, draftErrors, launchBlockReason, selectedOperations, serviceLabelOf, waitSeconds } from './form';
  import HeadersSection from './HeadersSection.svelte';
  import RunnerSection from './RunnerSection.svelte';
  import ScopeSection from './ScopeSection.svelte';
  import TargetSection from './TargetSection.svelte';

  /** The test form of the chosen service: its five sections, the launch bar, and the CI snippet that mirrors them. */
  let { form, chosen, onchoose }: { form: CreateTestForm; chosen: string; onchoose: (id: string) => void } = $props();
  const uc = useUseCases();
  const navigate = useNavigate();
  const uid = $props.id();
  let draft = $state.raw<Draft | null>(null);
  let busy = $state(false);
  let submitError = $state('');
  let ciTab = $state<CiFormat>('cli');
  // The client secret message waits for a blur or a launch attempt; until then only the border is red.
  let secretTouched = $state(false);
  let endpointEl = $state<HTMLInputElement | undefined>();
  let opsEl = $state<HTMLInputElement | undefined>();
  let timeoutEl = $state<HTMLInputElement | undefined>();
  let clientSecretEl = $state<HTMLInputElement | undefined>();

  const target = $derived(form.targets.find((t) => t.serviceId === chosen) ?? (form.targets[0] as TestTarget));
  const service = $derived(form.services.find((s) => s.id === target.serviceId));
  const d = $derived(draft && draft.serviceId === target.serviceId ? draft : initialDraft(target));
  const isEvent = $derived(target.type === 'EVENT');
  const selected = $derived(selectedOperations(target, d));
  const errors = $derived(draftErrors(target, d, selected));
  const blockReason = $derived(launchBlockReason(errors));
  const waitSec = $derived(waitSeconds(d.timeout));
  const lines = $derived(ciLines(service, target, d, selected, ciTab));
  const serviceLabel = $derived(serviceLabelOf(service));

  const update = (patch: Partial<Draft>) => {
    draft = { ...d, ...patch };
  };

  const focusFirstError = () => {
    if (errors.endpoint) endpointEl?.focus();
    else if (errors.operations) opsEl?.focus();
    else if (errors.timeout) timeoutEl?.focus();
    else if (errors.clientSecret) clientSecretEl?.focus();
  };

  const onsubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    submitError = '';
    if (blockReason) {
      secretTouched = true;
      focusFirstError();
      return;
    }
    const input = createTestInput(target, d, selected);
    busy = true;
    try {
      const run = await uc.testing.create(input);
      navigate(`/tests/runner/${run.id}`);
    } catch (err) {
      submitError = err instanceof Error ? err.message : 'The test could not be launched.';
      busy = false;
    }
  };

  const pickService = (id: string) => {
    onchoose(id);
    draft = null;
    secretTouched = false;
  };

  const blockId = `${uid}-block`;
</script>

<div class="tc-layout"
  ><form class="tc-form" aria-label="Test configuration" novalidate {onsubmit}
    ><TargetSection
      {form}
      {target}
      {service}
      {d}
      {update}
      {uid}
      endpointError={errors.endpoint}
      bind:endpointEl
      onpickservice={pickService}
    /><RunnerSection {form} {target} {d} {update} /><ScopeSection
      {target}
      protocol={service?.protocol}
      {d}
      {update}
      {uid}
      {selected}
      {errors}
      bind:opsEl
      bind:timeoutEl
    /><AuthSection
      secrets={form.secrets}
      {d}
      {update}
      {uid}
      clientSecretError={errors.clientSecret}
      {secretTouched}
      onsecretblur={() => (secretTouched = true)}
      bind:clientSecretEl
    />{#if !isEvent}<HeadersSection {target} {d} {update} />{/if}{#if submitError}<div class="tc-submit-error"
        ><Callout tone="danger" live="assertive" title="The test could not be launched">{submitError}</Callout></div
      >{/if}<div class="tc-actions"
      ><span class="tc-summary">{summarizeSelection(target, selected, d.runner, waitSec)}</span><div class="tc-actions-buttons"
        ><ButtonRouterLink variant="outline" size="lg" to={`/services/${target.serviceId}`}>Cancel</ButtonRouterLink><Button
          type="submit"
          variant="primary"
          size="lg"
          icon="play"
          loading={busy}
          aria-disabled={blockReason ? true : undefined}
          aria-describedby={blockReason ? blockId : undefined}
          title={blockReason}>Launch test</Button
        >{#if blockReason}<span id={blockId} class="sr-only">{blockReason}</span>{/if}</div
      ></div
    ></form
  ><CiAside {uid} {ciTab} ontabchange={(tab) => (ciTab = tab)} {lines} {serviceLabel} oauth={d.oauth} /></div
>
