<script lang="ts" module>
  import { stoppedStep, verdictExplanation, type ArazzoDocument, type Workflow, type WorkflowRun } from '@microcks/demo-core/domain/arazzo';

  /** "PatchPastry · 200 · application/json · Pastry" → "Pastry". */
  function schemaName(ref: string): string | undefined {
    const parts = ref.split(' · ');
    return parts.length > 3 ? parts[parts.length - 1] : undefined;
  }

  type Failure =
    | { kind: 'text'; text: string }
    | { kind: 'schema'; criteria: string; field?: { name: string; value: string; who: string; schema?: string; expected: string }; message: string; end: string };

  /** Why the last run failed, in one or two sentences (the note under the header). */
  function failureOf(run: WorkflowRun, workflow: Workflow): Failure {
    const stopped = stoppedStep(run);
    if (!stopped) return { kind: 'text', text: verdictExplanation(run) };
    const notRun = run.steps.filter((s) => s.status === 'not-run').map((s) => s.stepId);
    const tail = [
      stopped.attempts.length > 1 ? 'The retry did not help' : undefined,
      notRun.length ? `${notRun.join(' and ')} ${notRun.length === 1 ? 'was' : 'were'} not run` : undefined,
      Object.keys(run.outputs).length === 0 ? 'the workflow produced no outputs' : undefined,
    ].filter(Boolean);
    const end = tail.length ? ` ${(tail as string[]).join(', ').replace(/, ([^,]*)$/, ' and $1')}.` : '';
    const bad = stopped.response?.lines.find((l) => l.bad);
    const field = bad ? /"([^"]+)":\s*(.+?),?$/.exec(bad.text.trim()) : null;
    if (stopped.schema.state === 'fail' && stopped.criteria.every((c) => c.held)) {
      const base = run.target.kind === 'implementations' ? Object.values(run.target.baseUrls)[0] : undefined;
      const who = base?.includes('staging') ? 'staging' : run.target.kind === 'implementations' ? 'the implementation' : 'the mock';
      const expected = bad?.note?.replace(/^schema:\s*/, '');
      const step = workflow.steps.find((s) => s.stepId === stopped.stepId);
      return {
        kind: 'schema',
        criteria: stopped.criteria.map((c) => c.condition).join(', '),
        field:
          field && expected
            ? { name: field[1] ?? '', value: field[2] ?? '', who, schema: schemaName(stopped.schema.ref) ?? step?.operationId, expected }
            : undefined,
        message: stopped.schema.message,
        end,
      };
    }
    return { kind: 'text', text: `${verdictExplanation(run).replace(/ The workflow stopped there and produced no outputs\.$/, '')}${end}` };
  }
</script>

<script lang="ts">
  import { Button, Icon } from '@microcks/deep-ink';
  import { RouterLink, useNavigate } from '@/ui/app';
  import { runPath, workflowPath } from '../workflows/paths';

  /** One-line note on the last run when it failed: what failed, why, and the ways to look closer. */
  let { document, workflow, run }: { document: ArazzoDocument; workflow: Workflow; run: WorkflowRun } = $props();

  const navigate = useNavigate();
  const stopped = $derived(stoppedStep(run));
  const index = $derived(stopped ? workflow.steps.findIndex((s) => s.stepId === stopped.stepId) + 1 : 0);
  const attempts = $derived(stopped?.attempts.length ?? 0);
  const failure = $derived(failureOf(run, workflow));
</script>

{#if run.status === 'FAILURE' && stopped}<div role="note" class="wf-last-note"
    ><span class="wf-last-note-title"
      ><Icon name="x-circle" size={16} />Run #<!---->{run.number}<!----> · step <!---->{index}<!---->, <!---->{stopped.stepId}<!---->, failed<!---->{#if attempts > 1}{` after ${attempts} attempts`}{/if}</span
    ><span class="wf-last-note-text"
      >{#if failure.kind === 'text'}{failure.text}{:else}Its success criteria held (<span class="demo-mono">{failure.criteria}</span>), but schema validation failed<!---->{#if failure.field}:
          <!---->{failure.field.who}<!----> answers <span class="demo-mono">{failure.field.name}</span> as the string <!---->{failure.field.value}<!----> where the <!---->{failure
            .field.schema}<!----> schema expects a <!---->{failure.field.expected}<!---->.{:else}: <!---->{failure.message}<!---->.{/if}{#if failure.end}{failure.end}{/if}{/if}</span
    ><span class="wf-last-note-actions"
      ><Button
        size="sm"
        onclick={() => navigate(workflowPath(document.id, workflow.workflowId, 'loom', { run: String(run.number), step: stopped.stepId }))}
        >Inspect step <!---->{index}</Button
      ><RouterLink to={runPath(run.id)} class="wf-note-link">Open run #<!---->{run.number}</RouterLink></span
    ></div
  >{/if}
