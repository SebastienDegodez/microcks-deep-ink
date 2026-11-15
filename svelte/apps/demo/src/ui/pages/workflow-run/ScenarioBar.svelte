<script lang="ts">
  import type { WorkflowRun } from '@microcks/demo-core/domain/arazzo';
  import { RUN_SCENARIOS, type RunScenario } from '@microcks/demo-core/application/arazzo';
  import { RouterLink } from '@/ui/app';
  import { runPath } from '@/ui/pages/workflows/paths';

  interface Props {
    run: WorkflowRun;
  }

  /** The three prototype scenarios, each opening on its run (#14, #15, #16). */
  let { run }: Props = $props();
  const SCENARIO_DOT: Record<RunScenario, 'danger' | 'success' | 'warning'> = { impl14: 'danger', mocksEnd: 'success', mocksMissing: 'warning' };
  const keys = Object.keys(RUN_SCENARIOS) as RunScenario[];
</script>

<div class="wfr-scenarios"
  ><span id="wfr-scn-label" class="wfr-scenarios-label">Scenario</span
  ><ul aria-labelledby="wfr-scn-label" class="wfr-scenarios-list"
    >{#each keys as key (key)}<li
        ><RouterLink to={runPath(RUN_SCENARIOS[key].runId)} class="wfr-scenario" aria-current={RUN_SCENARIOS[key].runId === run.id ? 'page' : undefined}
          ><span class="wfr-scenario-dot" data-tone={SCENARIO_DOT[key]} aria-hidden="true"></span>{RUN_SCENARIOS[key].label}</RouterLink
        ></li
      >{/each}</ul
  ><span class="wfr-scenarios-note">Three runs of restock-pastry for review: each opens on its result; Replay live plays it step by step.</span
  ></div
>
