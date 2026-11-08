<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import type { LoomSource, LoomStep, LoomThread, LoomInput, LoomOutput } from '../contracts.js';
  import type { WorkflowLoomElement, LoomLensDetail } from './workflow-loom.js';
  import '../internal/elements/workflow-loom.js';
  type Props = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
    sources: LoomSource[]; steps: LoomStep[]; threads: LoomThread[]; inputs?: (string | LoomInput)[];
    outputs?: (string | LoomOutput)[]; outputNote?: string; validatesSchemas?: boolean; selectedStep?: string;
    lens?: string; tableToggle?: boolean; label: string; onStepSelect?: (detail: { stepId?: string }) => void;
    onLensSelect?: (detail: LoomLensDetail) => void; onstepselect?: (detail: { stepId?: string }) => void; onlensselect?: (detail: LoomLensDetail) => void; element?: WorkflowLoomElement;
  };
  let { sources, steps, threads, inputs, outputs, outputNote, validatesSchemas, selectedStep, lens, tableToggle, label, onStepSelect, onLensSelect, onstepselect, onlensselect, element = $bindable(), ...rest }: Props = $props();
  $effect(() => { if (element) Object.assign(element, { sources, steps, threads, inputs: inputs ?? [], outputs: outputs ?? [], outputNote, validatesSchemas: validatesSchemas ?? false, selectedStep, lens, tableToggle: tableToggle ?? true, label }); });
  $effect(() => {
    if (!element) return;
    const node = element;
    const step = (e: Event) => (onstepselect ?? onStepSelect)?.((e as CustomEvent<{ stepId?: string }>).detail);
    const selectLens = (e: Event) => (onlensselect ?? onLensSelect)?.((e as CustomEvent<LoomLensDetail>).detail);
    node.addEventListener('mkStepSelect', step); node.addEventListener('mkLensSelect', selectLens);
    return () => { node.removeEventListener('mkStepSelect', step); node.removeEventListener('mkLensSelect', selectLens); };
  });
</script>
<workflow-loom bind:this={element} {...rest}></workflow-loom>
