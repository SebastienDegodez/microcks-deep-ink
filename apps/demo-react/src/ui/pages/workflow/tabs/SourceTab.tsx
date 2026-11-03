import { useMemo, useState } from 'react';
import type { ImportIssue } from '@/domain/arazzo';
import type { WorkflowDetail } from '@/application/arazzo';
import { useQuery, useUseCases } from '@/ui/app';
import { Button } from '@/ui/components/ui/button';
import { Callout } from '@/ui/components/ui/callout';
import { Checkbox } from '@/ui/components/ui/checkbox';
import { CodeBlock, type CodeLine } from '@/ui/components/ui/code-block';
import { CopyButton } from '@/ui/components/ui/copy-button';
import { Disclosure } from '@/ui/components/ui/disclosure';
import { ButtonRouterLink, ErrorBlock, LoadingBlock } from '../../workflows/shared';

interface Block {
  id: string;
  from: number;
  to: number;
}

/** Line ranges of each step (`- stepId: x`) of the workflow in the YAML, 0-based, `to` exclusive. */
export function stepBlocks(lines: readonly string[], stepIds: readonly string[]): Block[] {
  const starts = lines
    .map((text, i) => ({ text, i }))
    .filter(({ text }) => /^\s*- stepId: /.test(text))
    .map(({ text, i }) => ({ id: text.replace(/^\s*- stepId: /, '').trim(), i }))
    .filter((s) => stepIds.includes(s.id));
  return starts.map((s, k) => {
    const next = starts[k + 1];
    let to = next ? next.i : lines.length;
    // The last step ends where the workflow-level keys start (`    outputs:` at 4 spaces).
    for (let i = s.i + 1; i < to; i++) {
      if (/^ {0,4}\S/.test(lines[i] ?? '') && !/^\s*- /.test(lines[i] ?? '')) {
        to = i;
        break;
      }
    }
    return { id: s.id, from: s.i, to };
  });
}

/** The YAML with every step but `keep` replaced by one "folded" line. */
export function foldedLines(lines: readonly string[], blocks: readonly Block[], keep: string | undefined): CodeLine[] {
  if (!keep) return lines.map((text) => ({ text }));
  const out: CodeLine[] = [];
  let i = 0;
  while (i < lines.length) {
    const block = blocks.find((b) => b.from === i && b.id !== keep);
    if (block) {
      out.push({ text: `${(lines[i] ?? '').match(/^\s*/)?.[0] ?? ''}… ${block.id}: ${block.to - block.from} lines folded` });
      i = block.to;
    } else {
      out.push({ text: lines[i] ?? '' });
      i += 1;
    }
  }
  return out;
}

const REFUSED = [
  'goto actions (only retry and end exist)',
  'JSONPath and XPath criteria (simple and regex criteria only)',
  'steps by workflowId or operationPath (steps use an operationId)',
  'workflow-level dependsOn, successActions and failureActions',
  'actions referenced in $components',
  'cookie parameters (path, query and header only)',
];

export function SourceTab({ detail }: { detail: WorkflowDetail }) {
  const uc = useUseCases();
  const { document, workflow } = detail;
  const source = useQuery(() => uc.arazzo.getDocumentSource(document.id), [document.id]);
  const [selected, setSelected] = useState<string | undefined>(undefined);
  const [fold, setFold] = useState(true);
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState<{ issues: ImportIssue[] } | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const text = source.data ?? '';
  const lines = useMemo(() => text.split('\n'), [text]);
  const idsKey = workflow.steps.map((s) => s.stepId).join(',');
  const blocks = useMemo(() => stepBlocks(lines, idsKey.split(',')), [lines, idsKey]);
  const shown = foldedLines(lines, blocks, fold ? selected : undefined);

  const validate = async () => {
    setValidating(true);
    setError(null);
    try {
      setValidated({ issues: await uc.arazzo.validateDocument(document.id) });
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setValidating(false);
    }
  };

  if (source.status === 'loading' && !source.data) return <LoadingBlock label="Loading the Arazzo source" rows={2} />;
  if (source.status === 'error') return <ErrorBlock error={source.error} onRetry={source.reload} />;

  return (
    <div className="wf-section">
      <div className="wf-row-between">
        <h2 className="wf-h2">{document.file}</h2>
        <div className="wf-row">
          <Button icon="check" loading={validating} onClick={validate}>
            {validating ? 'Validating…' : 'Validate the document'}
          </Button>
          <CopyButton value={text} label="Copy YAML" />
          <ButtonRouterLink to="/sources">Edit in source</ButtonRouterLink>
        </div>
      </div>

      <div role="status" aria-live="polite">
        {validating ? <p className="wf-muted">Validating against Arazzo {document.arazzoVersion}…</p> : null}
        {validated && !validating ? (
          validated.issues.length === 0 ? (
            <Callout tone="success" title={`Valid Arazzo ${document.arazzoVersion} · validated just now`}>
              Inside the subset Microcks runs · {workflow.steps.length} steps · {[...new Set(workflow.steps.map((s) => s.operationId))].length} operations found in{' '}
              {[...new Set(workflow.steps.map((s) => s.sourceName))].join(', ')}.
            </Callout>
          ) : (
            <Callout tone="danger" title={`${validated.issues.length} feature${validated.issues.length === 1 ? '' : 's'} outside the subset`}>
              <ul className="wf-plain-list">
                {validated.issues.map((i) => (
                  <li key={i.path}>
                    <code>{i.path}</code>: {i.message}
                  </li>
                ))}
              </ul>
            </Callout>
          )
        ) : null}
      </div>
      {error ? <ErrorBlock error={error} /> : null}

      <section aria-labelledby="wf-outline-title" className="wf-section">
        <h3 id="wf-outline-title" className="wf-h3">
          Outline
        </h3>
        <div className="wf-outline" role="group" aria-label="Steps of the document">
          {idsKey.split(",").map((id) => (
            <Button key={id} size="sm" aria-pressed={selected === id} onClick={() => setSelected(selected === id ? undefined : id)}>
              {id}
            </Button>
          ))}
        </div>
        <Checkbox label="Fold the other steps" description="When a step is selected in the outline, the others collapse into one line." checked={fold} onChange={(e) => setFold(e.target.checked)} />
      </section>

      <CodeBlock caption={`${document.file} · arazzo ${document.arazzoVersion}`} language="yaml" lines={shown} copy={false} maxHeight={520} />

      <Disclosure summary="What Microcks refuses at import">
        <p>Microcks runs a subset of Arazzo ({document.arazzoVersion.startsWith('1.1') ? '1.0 and 1.1' : '1.0'}, openapi and asyncapi sources). It refuses at import:</p>
        <ul className="wf-plain-list">
          {REFUSED.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <p>
          {document.importIssues.length === 0
            ? 'This document uses none of them.'
            : `${document.importIssues.length} issue${document.importIssues.length === 1 ? '' : 's'} found in this document.`}
        </p>
      </Disclosure>
    </div>
  );
}
