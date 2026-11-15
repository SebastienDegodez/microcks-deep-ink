<script lang="ts">
  import type { CreateTestForm } from '@microcks/demo-core/application/testing';
  import type { TestTarget } from '@microcks/demo-core/domain/testing';
  import { Radio } from '@microcks/deep-ink';
  import type { Draft, UpdateDraft } from './draft';
  import FormSection from './FormSection.svelte';

  /** "02 Test runner": one card per runner of the target, the unavailable ones disabled with their reason. */
  let { form, target, d, update }: { form: CreateTestForm; target: TestTarget; d: Draft; update: UpdateDraft } = $props();
</script>

<FormSection step="02" title="Test runner" hint={'What "conformant" means for this run'} gap="12"
  ><div role="radiogroup" aria-label="Test runner" class="tc-runner-grid"
    >{#each target.runners as r (r.id)}{@const meta = form.runners.find((m) => m.id === r.id)}{#snippet label()}<span class="tc-runner-name"
          ><span class="tc-runner-id">{r.id}</span>{#if r.recommended}<span class="tc-bestfit">best fit</span>{/if}</span
        >{/snippet}{#snippet description()}<span class="tc-runner-desc">{meta?.description}</span>{#if r.unavailableReason}<span class="tc-reason"
            >{r.unavailableReason}</span
          >{/if}{/snippet}<Radio
        variant="card"
        name="runner"
        value={r.id}
        checked={d.runner === r.id}
        disabled={Boolean(r.unavailableReason)}
        onchange={() => update({ runner: r.id })}
        {label}
        {description}
      />{/each}</div
  ></FormSection
>
