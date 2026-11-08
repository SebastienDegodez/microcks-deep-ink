<script lang="ts">
 import { WorkflowLoom } from '@microcks/deep-ink';
 import { LOOM_RESTOCK_RUN14, LOOM_SESSION_RUN13, LOOM_CHECK_MENU, type LoomScenario } from '@microcks-deep-ink/storybook-shared/fixtures';
 let { variant }: { variant: string } = $props();
 const design: LoomScenario = { ...LOOM_RESTOCK_RUN14, label: 'restock-pastry, definition', validatesSchemas: false, outputNote: undefined, inputs: LOOM_RESTOCK_RUN14.inputs?.map(i => typeof i === 'string' ? i : { name: i.name }), threads: LOOM_RESTOCK_RUN14.threads.map(({ value: _v, missing: _m, drops, ...t }) => ({ ...t, drops: drops?.map(({ idle: _i, ...d }) => d) })), steps: LOOM_RESTOCK_RUN14.steps.map(({ status: _s, attempts: _a, checks: _c, result: _r, actions, ...step }) => ({ ...step, actions: actions?.map(a => a.type === 'retry' ? { ...a, applied: undefined } : { ...a, taken: undefined }) })) };
 let scenario = $derived(variant === 'SessionChecks' ? LOOM_SESSION_RUN13 : variant === 'CheckMenu' ? LOOM_CHECK_MENU : variant === 'DesignTime' ? design : variant === 'NotLinked' ? { ...LOOM_CHECK_MENU, label: 'check-menu, bakeryApi not linked', sources: LOOM_CHECK_MENU.sources.map(s => s.name === 'bakeryApi' ? { ...s, linked: false } : s) } : LOOM_RESTOCK_RUN14);
 // The story starts with the selected step and then allows interaction.
 // svelte-ignore state_referenced_locally
 let step = $state<string | undefined>(['Default', 'SessionChecks', 'WithoutTableToggle', 'Run14'].includes(variant) ? 'patchPastry' : undefined);
 let lens = $state<string | undefined>();
</script>
<div class="sb-col"><WorkflowLoom {...scenario} tableToggle={variant === 'WithoutTableToggle' ? false : undefined} selectedStep={step} {lens} onStepSelect={e => step = e.stepId} onLensSelect={e => lens = e.id} /><p class="sb-note" role="status">{step ? `Selected step: ${step}` : 'No step selected. Focus a step and press Enter or Space.'}{lens ? ` Lens: ${lens}.` : ' Press an input, an output or a thread label to trace it.'}</p></div>
