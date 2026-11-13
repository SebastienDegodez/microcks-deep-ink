<script lang="ts" module>
  import type { WorkflowLoomElement } from '@microcks/deep-ink';

  /** Back to a step's node once the route change has rendered: the node lives in the loom's shadow root, so only `focusStep()` can focus it. */
  function focusNode(stepId: string, tries = 10) {
    requestAnimationFrame(() => {
      const loom = window.document.querySelector<WorkflowLoomElement>('workflow-loom');
      void (loom?.focusStep(stepId) ?? Promise.resolve(false)).then((ok) => {
        if (!ok && tries > 0) focusNode(stepId, tries - 1);
      });
    });
  }

  /** The focused element, looking inside shadow roots (the loom's inputs, outputs and thread labels). */
  function deepActive(): HTMLElement | null {
    let el = window.document.activeElement as HTMLElement | null;
    while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement as HTMLElement;
    return el;
  }

  /**
   * Focuses `target()` once the route change has rendered (the step lives in the URL, so it renders after the
   * handler), retrying for a few frames.
   */
  function afterRender(target: () => HTMLElement | null | undefined, tries = 10) {
    requestAnimationFrame(() => {
      const el = target();
      if (el?.isConnected) el.focus();
      else if (tries > 0) afterRender(target, tries - 1);
    });
  }
</script>

<script lang="ts">
  import '@microcks/demo-styles/pages/workflow/tabs/loom.css';
  import { stoppedStep, type Session, type WorkflowRun } from '@microcks/demo-core/domain/arazzo';
  import type { WorkflowDetail } from '@microcks/demo-core/application/arazzo';
  import { Button, Callout, Icon, SplitPane, SplitPaneMain } from '@microcks/deep-ink';
  import { RouterLink, useQuery, useRelativeTime, useReturnFocus, useUseCases } from '@/ui/app';
  import { workflowPath } from '../../workflows/paths';
  import LoomHost from '../LoomHost.svelte';
  import RunPicker from '../RunPicker.svelte';
  import StepInspector from '../StepInspector.svelte';
  import StepsTable from '../StepsTable.svelte';
  import { buildLoomProps, lensOf } from '../loom-model';
  import { runSummary } from '../run-facts';

  interface Props {
    detail: WorkflowDetail;
    runs: WorkflowRun[];
    run?: WorkflowRun;
    step?: string;
    sessions?: Session[];
    serviceLabel?: (serviceId: string) => string | undefined;
    onpickrun: (number: number) => void;
    onselectstep: (stepId: string | undefined) => void;
    inspectLink: (stepId: string) => string;
  }

  let { detail, runs, run, step, sessions, serviceLabel, onpickrun, onselectstep, inspectLink }: Props = $props();

  const workflow = $derived(detail.workflow);
  const document = $derived(detail.document);
  const uc = useUseCases();
  const ago = useRelativeTime();
  const returnFocus = useReturnFocus();
  let lensId = $state<string | undefined>(undefined);
  // The control that turned the lens on (in the page or inside the loom's shadow root), to return focus on Clear.
  let lensTrigger: HTMLElement | null = null;
  const setLensId = (id: string | undefined) => {
    if (id) lensTrigger = deepActive();
    lensId = id;
  };
  const others = useQuery(() => uc.arazzo.listWorkflows(), () => []);
  const loomProps = $derived(buildLoomProps(workflow, document, run, step, serviceLabel));
  const lens = $derived(lensId ? lensOf(lensId, workflow, run) : undefined);
  const selected = $derived(workflow.steps.find((s) => s.stepId === step));
  const stopped = $derived(run ? stoppedStep(run) : undefined);
  const failedStepId = $derived(run?.status === 'FAILURE' ? stopped?.stepId : undefined);
  const summary = $derived(run ? runSummary(run, workflow, ago(run.startedAt), sessions) : undefined);
  const used = $derived([...new Set(workflow.steps.map((s) => s.sourceName))]);
  const usedBy = $derived(
    (others.data ?? []).filter(
      (i) => i.document.id === document.id && i.workflow.workflowId !== workflow.workflowId && i.workflow.steps.some((s) => !used.includes(s.sourceName)),
    ),
  );
  // The other sources, in the order of the workflows that use them.
  const unused = $derived([
    ...new Set([...usedBy.flatMap((i) => i.workflow.steps.map((s) => s.sourceName)), ...document.sources.map((s) => s.name)].filter((n) => !used.includes(n))),
  ]);
  const trace = (id: string | undefined) => setLensId(id && id === lensId ? undefined : id);
  const sourceNames = $derived(loomProps.sources.map((s) => s.name).join(', '));

  const clearLens = () => {
    const back = lensTrigger;
    lensId = undefined;
    returnFocus.focusLater(() => (back?.isConnected ? back : window.document.querySelector<HTMLElement>('workflow-loom')));
  };
</script>

{#snippet fallback()}<div class="wf-loom-fallback"
    ><Callout tone="info" title="The loom component is not copied into this demo build"
      >The steps below carry the same information as the loom: order, dependencies, status, checks and actions.</Callout
    ><StepsTable {workflow} {document} {run} loomLink={inspectLink} /></div
  >{/snippet}

<SplitPane gap="16px" mainWidth="760px" sideWidth={selected ? '320px' : '260px'} sideMax={selected ? '460px' : '320px'} keepSideMax
  ><SplitPaneMain as="section" aria-label="Workflow loom" class="wf-loom"
    ><div class="wf-loom-toolbar"
      ><RunPicker {runs} {run} onpick={onpickrun} label="Show results and resolved values from a run" caption="Results & values from" /><div
        aria-label="Legend"
        role="group"
        class="wf-loom-legend"
        ><span><span aria-hidden="true" class="wf-loom-legend-warp"></span>warp: <!---->{sourceNames}</span><span
          ><span aria-hidden="true" class="wf-loom-legend-thread"></span>data thread</span
        ><span><Icon name="end" size={14} />early end</span><span><Icon name="loop" size={14} />retry</span></div
      ></div
    >{#if summary}<div class="wf-run-summary" data-tone={summary.tone}
        ><span class="wf-run-summary-title"
          ><Icon name={summary.tone === 'success' ? 'check-circle' : summary.tone === 'danger' ? 'x-circle' : 'running'} size={14} stroke-width={2.2} />{summary.title}</span
        ><span class="wf-run-summary-text">{summary.text}</span><span class="wf-run-summary-end">{summary.end}</span></div
      >{:else}<div class="wf-run-summary" data-tone="info"
        ><span class="wf-run-summary-text">No run yet: the loom shows the definition of the workflow. Run it to see the results on its steps.</span></div
      >{/if}<LoomHost {...loomProps} lens={lensId} {onselectstep} onselectlens={setLensId} {fallback} />{#if lens}<div
        role="region"
        aria-label="Expression lens"
        class="wf-lens-on"
        ><div class="wf-lens-head"
          ><span class="wf-lens-name"><Icon name="search" size={15} />Expression lens</span><span class="wf-lens-expr">{lens.expression}</span><span
            class="wf-lens-value"
            data-tone={lens.missing ? 'bad' : undefined}>{'= '}<!---->{lens.value}</span
          >{#if run}<span class="wf-lens-run">in run #<!---->{run.number}</span>{/if}<Button size="sm" class="wf-lens-clear" onclick={clearLens}>Clear lens</Button
          ></div
        >{#if lens.warn}<span class="wf-lens-warn"><Icon name="warning" size={14} />{lens.warn}</span>{/if}<div class="wf-lens-produced"
          ><span class="wf-lens-muted">Produced by</span><span class="wf-lens-mono">{lens.producedBy}</span></div
        ><div class="wf-lens-uses"
          ><span class="wf-lens-muted">Consumed by <!---->{lens.uses.length}<!---->{' '}<!---->{lens.uses.length === 1 ? 'place' : 'places'}</span><ul
            >{#each lens.uses as u (`${u.who}-${u.what}`)}<li
                ><span class="wf-lens-who">{u.who}</span><span class="wf-lens-what">{u.what}</span><span class="wf-lens-val" data-tone={u.tone}>{u.value}</span></li
              >{/each}</ul
          ></div
        ></div
      >{:else}<p class="wf-lens-off"
        ><Icon name="search" size={14} />Expression lens: select an input, an output or a thread label to trace where its value is produced and consumed.</p
      >{/if}{#if unused.length}<p class="wf-loom-foot"
        >This workflow weaves <!---->{used.length}<!----> of the <!---->{document.sources.length}<!----> sourceDescriptions of <span class="demo-mono"
          >{document.file}</span
        >.<!---->{' '}{#each unused as n, i (n)}<span>{#if i > 0}{i === unused.length - 1 ? ' and ' : ', '}{/if}<span class="demo-mono">{n}</span></span>{/each}{' '}<!---->{unused.length ===
        1
          ? 'is'
          : 'are'}<!----> used by<!---->{' '}{#if usedBy.length}{#each usedBy as i, k (i.workflow.workflowId)}<span
              >{#if k > 0}{k === usedBy.length - 1 ? ' and ' : ', '}{/if}<RouterLink to={workflowPath(document.id, i.workflow.workflowId, 'loom')}
                >{i.workflow.workflowId}</RouterLink
              ></span
            >{/each}{:else}the other workflows{/if}<!---->.</p
      >{/if}</SplitPaneMain
  ><StepInspector
    {workflow}
    {document}
    {run}
    step={selected}
    {failedStepId}
    {serviceLabel}
    lens={lensId}
    ontrace={trace}
    onselectfailed={() => {
      if (!failedStepId) return;
      onselectstep(failedStepId);
      afterRender(() => window.document.getElementById('wf-ins-title'));
    }}
    onclose={() => {
      // Focus the node before closing: the inspector is still laid out when the node scrolls into view, as in the
      // reference demo, whose router commits the new URL only after the next frame.
      const closed = step;
      if (!closed) return onselectstep(undefined);
      const loom = window.document.querySelector<WorkflowLoomElement>('workflow-loom');
      void Promise.resolve(loom?.focusStep?.(closed))
        .catch(() => false)
        .then((ok) => {
          onselectstep(undefined);
          if (!ok) focusNode(closed);
        });
    }}
  /></SplitPane
>
