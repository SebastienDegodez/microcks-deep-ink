<script lang="ts" module>
  const RUN_ID = '6543f0c2a9e1b7d4c3f20a11';

  type Tone = 'success' | 'warning' | 'danger';
  interface Answer {
    code: string;
    tone: Tone;
    title: string;
    when: string;
    head: string;
    body: unknown;
  }

  const answers = (outputs: Record<string, unknown>, failed: string, timeoutRun: number): Answer[] => [
    { code: '200', tone: 'success', title: 'The workflow outputs', when: 'The workflow passed on the mocks: the body is exactly its outputs.', head: `200 OK · X-Microcks-Arazzo-Run-Id: ${RUN_ID}`, body: outputs },
    { code: '400', tone: 'warning', title: 'Refused', when: 'The body is not a JSON object of inputs. No run is created.', head: '400 Bad Request', body: { reason: 'The inputs must be a JSON object' } },
    {
      code: '504',
      tone: 'danger',
      title: 'Timeout',
      when: 'The run did not end within 30000 ms. It goes on; open it to see how it ends.',
      head: `504 Gateway Timeout · X-Microcks-Arazzo-Run-Id: ${RUN_ID}`,
      body: { runId: RUN_ID, reason: `Run #${timeoutRun} did not end within 30000 ms` },
    },
    {
      code: '409',
      tone: 'danger',
      title: 'A step failed',
      when: 'The status the mock of the failed step answered, else 502, naming the failed step.',
      head: `409 Conflict · X-Microcks-Arazzo-Run-Id: ${RUN_ID}`,
      body: { runId: RUN_ID, failedStep: failed, reason: `Step ${failed} failed: unmet success criteria $statusCode == 200` },
    },
  ];
</script>

<script lang="ts">
  import '@microcks/demo-styles/pages/workflow/tabs/mock-url.css';
  import { callTotals, stoppedStep, type WorkflowRun } from '@microcks/demo-core/domain/arazzo';
  import { formatDuration } from '@microcks/demo-core/domain/shared';
  import type { WorkflowDetail } from '@microcks/demo-core/application/arazzo';
  import { Button, Callout, Icon, MethodTag } from '@microcks/deep-ink';
  import { ButtonRouterLink, useQuery, useRelativeTime, useUseCases } from '@/ui/app';
  import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
  import { workflowPath } from '../../workflows/paths';

  interface Props {
    detail: WorkflowDetail;
    runs: WorkflowRun[];
    onshowruns?: () => void;
  }

  let { detail, runs, onshowruns }: Props = $props();

  const uc = useUseCases();
  const relative = useRelativeTime();
  const workflow = $derived(detail.workflow);
  const document = $derived(detail.document);
  const info = useQuery(
    () => uc.arazzo.getMockUrl(document.id, workflow.workflowId),
    () => [document.id, workflow.workflowId],
  );
  const examples = useQuery(
    () => uc.arazzo.listExamples(document.id, workflow.workflowId),
    () => [document.id, workflow.workflowId],
  );
  let pick = $state('200');
  let copied = $state<string | undefined>(undefined);
  const copy = (id: string, text: string) =>
    void navigator.clipboard
      ?.writeText(text)
      .then(() => (copied = id))
      .catch(() => undefined);

  const data = $derived(info.data);
  const lastMockRun = $derived(runs.find((r) => r.number === data?.lastCall?.runNumber && r.origin.kind === 'mock-url'));
  // The 200 answer is the outputs of the last Mock URL call that passed, else of the last run with outputs.
  const sample = $derived(
    (lastMockRun?.status === 'SUCCESS' ? lastMockRun : runs.find((r) => r.status === 'SUCCESS' && Object.keys(r.outputs).length > 0))?.outputs ?? {},
  );
  const failedStep = $derived(
    runs.map(stoppedStep).find((s) => s?.status === 'failed')?.stepId ?? workflow.steps[workflow.steps.length - 1]?.stepId ?? 'step',
  );
  const list = $derived(answers(sample, failedStep, (runs[0]?.number ?? 0) + 1));
  const chosen = $derived(list.find((a) => a.code === pick) ?? (list[0] as Answer));
  const firstExample = $derived(examples.data?.[0]?.id);
  const runsLink = $derived(workflowPath(document.id, workflow.workflowId, 'runs', { filter: 'mock-url' }));
</script>

{#if !workflow.runnability.runnable}<Callout tone="warning" title="Mock URL not available"
    >{workflow.runnability.message}<!---->. Its Mock URL answers once the workflow can run.</Callout
  >{:else if info.status === 'loading' && !info.data}<LoadingBlock label="the Mock URL" rows={2} />{:else if info.status === 'error'}<ErrorBlock
    error={info.error}
    onretry={info.reload}
  />{:else if data}<div class="wf-mu-tab"
    ><section aria-labelledby="wf-mu-title" class="wf-mu-panel" data-size="wide"
      ><div class="wf-mu-intro"
        ><h2 id="wf-mu-title">Mock URL</h2><p
          >POST the inputs as JSON: Microcks plays the workflow on its mocks and answers with its outputs. An application can call one business operation instead of chaining the <!---->{workflow.steps.length}<!----> calls itself. Each call is a run of <span class="demo-mono">{workflow.workflowId}</span>{' '}with the origin Mock URL, listed in Runs.</p
        ></div
      ><div class="wf-mu-field"
        ><label for="workflow-mock-url">Mock URL</label><div class="wf-mu-row"
          ><MethodTag method={data.method} class="wf-mu-method" /><input
            id="workflow-mock-url"
            type="text"
            readonly
            value={data.url}
            defaultValue={data.url}
            class="wf-mu-input"
          /><Button size="sm" class="wf-mu-copy" aria-label={`Copy the Mock URL of ${workflow.workflowId}`} onclick={() => copy('url', data.url)}
            >{copied === 'url' ? 'Copied' : 'Copy'}</Button
          ></div
        ><span class="wf-mu-help"
          ><span class="demo-mono">/arazzo/<!---->{'{title}'}<!---->/<!---->{'{version}'}<!---->/<!---->{'{workflowId}'}</span>, encoded like the Mock URLs of APIs.</span
        ></div
      ><div class="wf-mu-boxes"
        ><div class="wf-mu-box" data-size="curl"
          ><div class="wf-mu-box-head"
            ><span class="wf-mu-box-title"
              >curl <span class="wf-mu-box-sub">· inputs of <!---->{firstExample ? `the example ${firstExample}` : 'the workflow examples'}</span></span
            ><Button
              size="sm"
              class="wf-mu-box-btn"
              aria-label={`${copied === 'curl' ? 'Copied' : 'Copy curl'} of ${workflow.workflowId}`}
              onclick={() => copy('curl', data.curl)}>{copied === 'curl' ? 'Copied' : 'Copy curl'}</Button
            ></div
          ><pre class="wf-mu-pre" data-tone="secondary">{data.curl}</pre></div
        ><div class="wf-mu-box"
          ><div class="wf-mu-box-head"><span class="wf-mu-box-title">Response</span><span class="wf-mu-code" data-tone="success">200 OK</span></div
          ><pre class="wf-mu-pre">{JSON.stringify(sample, null, 2)}</pre></div
        ></div
      ><div class="wf-mu-last"
        >{#if data.lastCall}<span class="wf-mu-last-text">Last call: run #<!---->{data.lastCall.runNumber}<!----> · <!---->{relative(data.lastCall.at)}</span
          >{#if lastMockRun}<span class="wf-mu-verdict" data-tone={lastMockRun.status === 'SUCCESS' ? 'success' : 'danger'}
              ><Icon name={lastMockRun.status === 'SUCCESS' ? 'check-circle' : 'x-circle'} size={13} stroke-width={2.2} />{lastMockRun.status === 'SUCCESS'
                ? 'Passed'
                : 'Failed'}</span
            >{/if}{#if lastMockRun}<span class="wf-mu-muted"
              >answered <!---->{lastMockRun.status === 'SUCCESS' ? 200 : 409}<!----> in <!---->{formatDuration(callTotals(lastMockRun).ms)}</span
            >{/if}{:else}<span class="wf-mu-muted">Never called.</span>{/if}{#if onshowruns}<Button size="sm" class="wf-mu-runs" onclick={onshowruns}
            >Show the Mock URL runs</Button
          >{:else}<ButtonRouterLink size="sm" class="wf-mu-runs" to={runsLink}>Show the Mock URL runs</ButtonRouterLink>{/if}</div
      ></section
    ><section aria-labelledby="wf-ans-title" class="wf-mu-panel" data-size="narrow"
      ><h2 id="wf-ans-title">Possible answers</h2><div role="group" aria-label="Choose an answer" class="wf-mu-answers"
        >{#each list as a (a.code)}<button type="button" class="wf-mu-answer" aria-pressed={a.code === chosen.code} onclick={() => (pick = a.code)}
            ><span class="wf-mu-code" data-tone={a.tone}>{a.code}</span><span class="wf-mu-answer-text"
              ><span class="wf-mu-answer-title">{a.title}</span><span class="wf-mu-answer-when">{a.when}</span></span
            ></button
          >{/each}</div
      ><div class="wf-mu-box"><div class="wf-mu-box-head" data-kind="mono">{chosen.head}</div><pre class="wf-mu-pre">{JSON.stringify(chosen.body, null, 2)}</pre></div
      ><span class="wf-mu-note"
        >Every answer but a refusal carries the header <span class="demo-mono">X-Microcks-Arazzo-Run-Id</span>, so the caller can open the run.</span
      ></section
    ></div
  >{/if}
