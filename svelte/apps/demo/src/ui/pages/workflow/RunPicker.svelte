<script lang="ts">
  import type { WorkflowRun } from '@microcks/demo-core/domain/arazzo';
  import { Icon } from '@microcks/deep-ink';
  import { RUN_STATUS_ICON, RUN_STATUS_WORD } from '@/ui/app/outcomes';
  import { runPick } from './loom-model';

  /** "Results & values from" run picker shared by the Loom and Steps tabs: the last four runs, as pressed buttons. */
  let { runs, run, onpick, label, caption }: { runs: WorkflowRun[]; run?: WorkflowRun; onpick: (n: number) => void; label: string; caption?: string } = $props();

  const shown = $derived.by(() => {
    const list = runs.slice(0, 4);
    if (run && !list.some((r) => r.number === run.number)) list.push(run);
    return list;
  });
</script>

{#if runs.length > 0}<div role="group" aria-label={label} class="wf-run-picker"
    >{#if caption}<span class="wf-run-picker-caption" aria-hidden="true">{caption}</span>{/if}{#each shown as r (r.number)}{@const pick = runPick(r)}<button
        type="button"
        class="wf-run-pick"
        aria-pressed={r.number === run?.number}
        data-status={r.status}
        onclick={() => onpick(r.number)}
        ><Icon name={RUN_STATUS_ICON[r.status]} size={13} stroke-width={2.2} class="wf-run-pick-icon" />{pick.label}<span class="wf-run-pick-target"
          ><span class="sr-only">{' '}</span>{pick.target}</span
        ><span class="sr-only">{', '}<!---->{RUN_STATUS_WORD[r.status].toLowerCase()}</span></button
      >{/each}</div
  >{/if}
