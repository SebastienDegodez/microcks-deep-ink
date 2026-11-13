<script lang="ts" module>
  import type { WorkflowExample, WorkflowRun } from '@microcks/demo-core/domain/arazzo';
  import { originWord } from '../run-facts';

  const fmt = (v: unknown) => String(v);

  /** The last run on the mocks that played an example: it is judged against the example. */
  function lastJudged(ex: WorkflowExample, runs: WorkflowRun[]) {
    const run = runs.find((r) => r.options.example === ex.id && r.target.kind === 'mocks' && r.status !== 'RUNNING');
    if (run) return { run, number: run.number, at: run.startedAt, matched: run.status === 'SUCCESS', where: originWord(run) };
    return ex.lastJudged ? { run: undefined, number: ex.lastJudged.runNumber, at: ex.lastJudged.at, matched: ex.lastJudged.matched, where: 'Microcks mocks' } : undefined;
  }
</script>

<script lang="ts">
  import '@microcks/demo-styles/pages/workflow/tabs/examples.css';
  import type { WorkflowDetail } from '@microcks/demo-core/application/arazzo';
  import { Button, Icon } from '@microcks/deep-ink';
  import { ButtonRouterLink, RouterLink, useQuery, useRelativeTime, useUseCases } from '@/ui/app';
  import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
  import { runPath, runSetupPath } from '../../workflows/paths';

  interface Props {
    detail: WorkflowDetail;
    runs: WorkflowRun[];
    examples: WorkflowExample[];
    /** Service names by id ("pastry2" → "API Pastry 2.0"). */
    serviceLabel?: (serviceId: string) => string | undefined;
  }

  let { detail, runs, examples, serviceLabel }: Props = $props();

  const uc = useUseCases();
  const relative = useRelativeTime();
  const document = $derived(detail.document);
  const workflow = $derived(detail.workflow);
  const overlay = useQuery(
    () => uc.arazzo.getDocumentOverlay(document.id),
    () => [document.id],
  );
  let showOverlay = $state(false);

  const stepWhat = (ex: WorkflowExample, stepId: string) => {
    const exp = ex.steps.find((x) => x.stepId === stepId);
    return {
      exp,
      what: exp ? [`Passed · ${exp.status}`, ...Object.entries(exp.outputs ?? {}).map(([k, v]) => `${k} = ${v}`)].join(' · ') : 'Not run',
    };
  };
</script>

{#if examples.length === 0}<section aria-labelledby="wf-ex-title" class="wf-ex-panel"
    ><h2 id="wf-ex-title">No recorded example</h2><p class="wf-ex-lead"
      >Examples come from an ArazzoSources overlay: they give the inputs of a run and what it must show. <!---->{#if !document.overlay}{`${document.file} has no overlay yet.`}{/if}</p
    ></section
  >{:else}<section aria-labelledby="wf-ex-title" class="wf-ex-panel"
    ><div class="wf-ex-head"
      ><div class="wf-ex-intro"
        ><h2 id="wf-ex-title">{examples.length}<!----> recorded <!---->{examples.length === 1 ? 'example' : 'examples'}</h2><p class="wf-ex-lead"
          >From the ArazzoSources overlay <span class="demo-mono">{document.overlay}</span>, identified by <!---->{document.title}<!---->{' '}<!---->{document.version}<!---->. An example gives inputs and what the run must show: step statuses, where it ends and its outputs. Running an example judges the run against it.</p
        ></div
      ><Button size="sm" aria-expanded={showOverlay} aria-controls="wf-overlay" onclick={() => (showOverlay = !showOverlay)}
        >{showOverlay ? 'Hide the overlay' : 'Show the overlay'}</Button
      ></div
    ><div id="wf-overlay" hidden={!showOverlay}
      >{#if showOverlay}{#if overlay.status === 'error'}<ErrorBlock error={overlay.error} onretry={overlay.reload} />{:else if overlay.data}<pre
            aria-label="ArazzoSources overlay"
            class="wf-ex-overlay">{overlay.data.replace(/\n$/, '')}</pre
          >{:else}<LoadingBlock label="the overlay" rows={1} />{/if}{/if}</div
    ><div class="wf-ex-list"
      >{#each examples as ex (ex.id)}{@const judged = lastJudged(ex, runs)}{@const outputs = Object.entries(ex.outputs)}<article
          aria-labelledby={`wf-ex-${ex.id}`}
          class="wf-ex-card"
          ><div class="wf-ex-card-head"
            ><div class="wf-ex-card-title"><h3 id={`wf-ex-${ex.id}`}>{ex.id}</h3><span class="wf-ex-desc">{ex.description}</span></div
            >{#if workflow.runnability.runnable}<ButtonRouterLink
                variant="primary"
                size="compact"
                icon="play"
                to={`${runSetupPath(document.id, workflow.workflowId)}?example=${ex.id}`}
                aria-label={`Run this example ${ex.id}`}>Run this example</ButtonRouterLink
              >{/if}</div
          ><dl class="wf-ex-facts"
            ><div
              ><dt>Inputs</dt><dd class="wf-ex-tags"
                >{#if Object.keys(ex.inputs).length}{#each Object.entries(ex.inputs) as [k, v] (k)}<span class="wf-ex-tag">{k}<!----> = <!---->{fmt(v)}</span
                    >{/each}{:else}none{/if}</dd
              ></div
            ><div
              ><dt>Expected steps</dt><dd class="wf-ex-steps"
                >{#each workflow.steps as s (s.stepId)}{@const e = stepWhat(ex, s.stepId)}<span class="wf-ex-step" data-run={e.exp ? undefined : 'no'}
                    ><Icon name={e.exp ? 'check-circle' : 'minus-circle'} size={12} stroke-width={2.4} class="wf-ex-step-icon" /><span class="wf-ex-step-id"
                      >{s.stepId}</span
                    ><span class="wf-ex-muted">{e.what}</span></span
                  >{/each}</dd
              ></div
            ><div
              ><dt>Expected end</dt><dd class="demo-mono">{ex.stopsAt ? `Stops at ${ex.stopsAt}` : 'Runs to its end'}</dd><dt class="wf-ex-dt-next"
                >Expected outputs</dt
              ><dd class="demo-mono" data-empty={outputs.length ? undefined : ''}
                >{outputs.length ? outputs.map(([k, v]) => `${k} = ${v}`).join(', ') : 'None expected'}</dd
              ></div
            ><div
              ><dt>Last judged</dt><dd class="wf-ex-judged"
                >{#if judged}<span class="wf-ex-verdict" data-tone={judged.matched ? 'pass' : 'fail'}
                    ><Icon name={judged.matched ? 'check-circle' : 'x-circle'} size={13} stroke-width={2.2} />{judged.matched
                      ? 'Matches the example'
                      : 'Does not match the example'}</span
                  ><span class="wf-ex-muted"
                    >{#if judged.run}<RouterLink to={runPath(judged.run.id)}>Run #<!---->{judged.number}</RouterLink>{:else}{`Run #${judged.number}`}{/if}<!---->{' · '}<!---->{relative(
                      judged.at,
                    )}<!---->{' · '}<!---->{judged.where}</span
                  >{:else}<span class="wf-ex-muted">Not run yet</span>{/if}</dd
              ></div
            ></dl
          ></article
        >{/each}</div
    >{#if document.overlay}<p class="wf-ex-foot"
        >The overlay also links the source descriptions:<!---->{' '}{#each document.sources as s, i (s.name)}<span
            >{#if i > 0}{', '}{/if}<span class="demo-mono">{s.name}</span>{s.link.status === 'linked'
              ? ` → ${serviceLabel?.(s.link.serviceId) ?? s.link.serviceId}`
              : ' (not linked)'}</span
          >{/each}<!---->. The Mock URL curl uses the inputs of the first example.</p
      >{/if}</section
  >{/if}
