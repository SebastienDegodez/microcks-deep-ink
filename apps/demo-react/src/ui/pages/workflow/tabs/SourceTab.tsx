import { Fragment, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import type { ImportIssue } from '@/domain/arazzo';
import type { WorkflowDetail } from '@/application/arazzo';
import { useQuery, useUseCases } from '@/ui/app';
import { ApiBadge, Button, Checkbox, Icon, SplitPane, SplitPaneMain, SplitPaneSide } from '@microcks/deep-ink';
import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
import { syncedText } from '../WorkflowHeader';
import '@microcks/demo-styles/pages/workflow/tabs/source.css';

/** A block of the outline: 0-based line range, `to` inclusive. */
export interface OutlineBlock {
  id: string;
  label: string;
  from: number;
  to: number;
  /** A step block (it can fold). */
  step?: boolean;
  /** Indented in the outline. */
  nested?: boolean;
}

/** The outline of one workflow in the document: document head, workflow, inputs, each step, outputs. */
export function outlineOf(lines: readonly string[], workflowId: string, stepIds: readonly string[]): OutlineBlock[] {
  const at = (re: RegExp, from = 0) => {
    for (let i = from; i < lines.length; i++) if (re.test(lines[i] ?? '')) return i;
    return -1;
  };
  const wfs = at(/^workflows:/);
  const wf = at(new RegExp(`^\\s*- workflowId: ${workflowId}\\s*$`));
  if (wfs < 0 || wf < 0) return [];
  const inputs = at(/^ {4}inputs:/, wf);
  const steps = at(/^ {4}steps:/, wf);
  const outputs = at(/^ {4}outputs:/, steps < 0 ? wf : steps);
  // The workflow ends at the next workflow, a comment at its level, or the end of the file.
  let end = at(/^ {2}(- workflowId:|#)/, wf + 1);
  if (end < 0) end = lines.length;
  while (end > 0 && (lines[end - 1] ?? '').trim() === '') end--;
  const blocks: OutlineBlock[] = [{ id: 'doc', label: 'arazzo · info · sources', from: 0, to: wf - 1 }];
  blocks.push({ id: 'workflow', label: workflowId, from: wf, to: (inputs > 0 ? inputs : steps) - 1 });
  if (inputs > 0) blocks.push({ id: 'inputs', label: 'inputs', from: inputs, to: steps - 1, nested: true });
  const starts = stepIds.map((id) => at(new RegExp(`^\\s*- stepId: ${id}\\s*$`), steps)).filter((i) => i >= 0);
  stepIds.forEach((id, k) => {
    const from = starts[k];
    if (from === undefined) return;
    const next = starts[k + 1] ?? (outputs > 0 ? outputs : end);
    blocks.push({ id, label: `${k + 1} · ${id}`, from, to: next - 1, step: true, nested: true });
  });
  if (outputs > 0) blocks.push({ id: 'outputs', label: 'outputs', from: outputs, to: end - 1, nested: true });
  return blocks;
}

/** One YAML line with syntax colours: keys, `:` and `- ` marks, runtime expressions, numbers and arrays, comments. */
function YamlLine({ text }: { text: string }) {
  const hash = text.search(/(^\s*#|\s+#\s)/);
  const body = hash >= 0 ? text.slice(0, hash) : text;
  const comment = hash >= 0 ? text.slice(hash) : '';
  const value = (v: string): ReactNode =>
    !v ? null : v.startsWith('$') || v.startsWith('"{$') ? <span className="y-expr">{v}</span> : /^[[>0-9^]/.test(v) ? <span className="y-lit">{v}</span> : <span>{v}</span>;
  const kv = /^(\s*)(- )?([A-Za-z_][\w-]*)(:)(\s?)(.*)$/.exec(body);
  const item = kv ? null : /^(\s*)(- )?(.*)$/.exec(body);
  return (
    <>
      {kv ? (
        <>
          {kv[1]}
          {kv[2] ? <span className="y-mark">- </span> : null}
          <span className="y-key">{kv[3]}</span>
          <span className="y-mark">:</span>
          {kv[5]}
          {value(kv[6] ?? '')}
        </>
      ) : item ? (
        <>
          {item[1]}
          {item[2] ? <span className="y-mark">- </span> : null}
          {value(item[3] ?? '')}
        </>
      ) : null}
      {comment ? <span className="y-comment">{comment}</span> : null}
      {!text ? ' ' : null}
    </>
  );
}

export interface SourceTabProps {
  detail: WorkflowDetail;
  /** Selected step: `?step=`, else the step where the shown run failed (given by the page). */
  step?: string;
  onSelectStep: (stepId: string) => void;
  serviceLabel?: (serviceId: string) => string | undefined;
}

export function SourceTab({ detail, step, onSelectStep, serviceLabel }: SourceTabProps) {
  const uc = useUseCases();
  const { document, workflow } = detail;
  const source = useQuery(() => uc.arazzo.getDocumentSource(document.id), [document.id]);
  const [picked, setPicked] = useState<string | undefined>(undefined);
  const [fold, setFold] = useState(true);
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState<{ issues: ImportIssue[]; at: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const text = source.data ?? '';
  const lines = useMemo(() => text.replace(/\n$/, '').split('\n'), [text]);
  const idsKey = workflow.steps.map((s) => s.stepId).join(',');
  const blocks = useMemo(() => outlineOf(lines, workflow.workflowId, idsKey.split(',')), [lines, workflow.workflowId, idsKey]);
  const selectedId = picked ?? step ?? 'doc';
  const selected = blocks.find((b) => b.id === selectedId) ?? blocks[0];

  const validate = async () => {
    setValidating(true);
    setError(null);
    try {
      setValidated({ issues: await uc.arazzo.validateDocument(document.id), at: 'just now' });
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setValidating(false);
    }
  };
  const copy = () => {
    void navigator.clipboard
      ?.writeText(text)
      .then(() => setCopied(true))
      .catch(() => undefined);
  };
  const pick = (b: OutlineBlock) => {
    setPicked(b.id);
    if (b.step) onSelectStep(b.id);
  };

  if (source.status === 'loading' && !source.data) return <LoadingBlock label="the Arazzo source" rows={2} />;
  if (source.status === 'error') return <ErrorBlock error={source.error} onRetry={source.reload} />;

  const used = [...new Set(workflow.steps.map((s) => s.sourceName))];
  const ops = [...new Set(workflow.steps.map((s) => `${s.sourceName}.${s.operationId}`))];
  const linkedTo = used.map((name) => {
    const src = document.sources.find((s) => s.name === name);
    return { name, label: src?.link.status === 'linked' ? (serviceLabel?.(src.link.serviceId) ?? src.link.serviceId) : undefined };
  });
  const issues = validated?.issues ?? document.importIssues;
  const when = validated ? validated.at : `at sync, ${syncedText(document)?.replace(/^Synced /, '') ?? 'at import'}`;
  const wfBlock = blocks.find((b) => b.id === 'workflow');
  const last = blocks[blocks.length - 1];

  // Rows: plain lines, or one folded row per folded step.
  const rows: ReactNode[] = [];
  for (let i = 0; i < lines.length; ) {
    const block = blocks.find((b) => b.step && b.from === i);
    if (block && fold && block.id !== selected?.id) {
      const n = block.to - block.from;
      rows.push(
        <button key={`f${i}`} type="button" className="wf-yaml-row wf-src-fold" onClick={() => pick(block)}>
          <span className="sr-only">{`Unfold step ${block.id}, lines ${block.from + 1} to ${block.to + 1}: `}</span>
          <span aria-hidden="true" className="wf-src-n">
            {i + 1}
          </span>
          <span className="wf-src-text">
            <YamlLine text={lines[i] ?? ''} />
          </span>
          <span className="wf-src-chip">
            <Icon name="chevron" size={10} strokeWidth={2.4} />
            {n} lines folded
          </span>
        </button>,
      );
      i = block.to + 1;
      continue;
    }
    const inSel = selected !== undefined && i >= selected.from && i <= selected.to;
    rows.push(
      <div key={`l${i}`} className="wf-yaml-row" data-selected={inSel ? '' : undefined}>
        <span aria-hidden="true" className="wf-src-n">
          {i + 1}
        </span>
        <span className="wf-src-text">
          <YamlLine text={lines[i] ?? ''} />
        </span>
      </div>,
    );
    i += 1;
  }

  return (
    <SplitPane gap="16px" sideWidth="220px" sideMax="280px" mainWidth="560px" keepSideMax>
      <SplitPaneSide as="nav" aria-labelledby="wf-outline-title" className="wf-src-outline">
        <h2 id="wf-outline-title">Outline</h2>
        <span className="wf-outline-file">{document.file}</span>
        {blocks.map((b) => (
          <button key={b.id} type="button" className="wf-outline-item" data-nested={b.nested ? '' : undefined} aria-pressed={b.id === selected?.id} onClick={() => pick(b)}>
            <span className="wf-outline-label">{b.label}</span>
            <span className="wf-outline-range">
              {b.from + 1}–{b.to + 1}
            </span>
          </button>
        ))}
        <div className="wf-outline-fold">
          <Checkbox label="Fold the other steps" checked={fold} onChange={(e) => setFold(e.target.checked)} />
        </div>
      </SplitPaneSide>

      <SplitPaneMain as="section" aria-label="Arazzo source" className="wf-src">
        <div className="wf-src-toolbar">
          <div className="wf-src-caption">
            <ApiBadge arazzo name={document.arazzoVersion} size="sm" />
            <span className="wf-src-where">
              workflow {workflow.workflowId}
              {wfBlock && last ? ` · lines ${wfBlock.from + 1}–${last.to + 1}` : ''}
              {selected ? ` · selected ${selected.label}` : ''}
            </span>
          </div>
          <div className="wf-src-actions">
            <Button size="sm" icon="check" loading={validating} onClick={validate}>
              {validating ? 'Validating…' : 'Validate'}
            </Button>
            <Button size="sm" icon="copy" onClick={copy}>
              {copied ? 'Copied' : 'Copy YAML'}
            </Button>
            <Button asChild size="sm">
              <Link to="/sources">Edit in source</Link>
            </Button>
          </div>
        </div>

        <div role="status" aria-live="polite" className="wf-src-band">
          {validating ? (
            <span>Validating against Arazzo {document.arazzoVersion}…</span>
          ) : issues.length === 0 ? (
            <>
              <span className="wf-src-band-line">
                <span className="wf-src-valid">
                  <Icon name="check-circle" size={15} strokeWidth={2.2} />
                  Valid Arazzo {document.arazzoVersion}
                </span>
                <span>
                  · inside the subset Microcks runs · {workflow.steps.length} steps · {ops.length} operations found in {linkedTo.map((l) => l.label ?? l.name).join(', ')}
                </span>
                <span className="wf-src-muted">· validated {when}</span>
              </span>
              <span className="wf-src-refs">
                {ops.map((o, k) => (
                  <Fragment key={o}>
                    {k === 0 ? `$sourceDescriptions.${o}` : ` · .${o.split('.').pop()}`}
                  </Fragment>
                ))}{' '}
                → {linkedTo.map((l) => `${l.name} ${l.label ? `linked to ${l.label}` : 'not linked'}`).join(', ')}
                {document.overlay ? ` by ${document.overlay}` : ''}
              </span>
            </>
          ) : (
            <>
              <span className="wf-src-invalid">
                <Icon name="x-circle" size={15} strokeWidth={2.2} />
                {issues.length} feature{issues.length === 1 ? '' : 's'} outside the subset Microcks runs
              </span>
              <ul className="wf-src-issues">
                {issues.map((i) => (
                  <li key={i.path}>
                    <code>{i.path}</code>: {i.message}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        {error ? <ErrorBlock error={error} /> : null}

        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the code scrolls sideways: keyboard users must reach it (RGAA 7.3) */}
        <div className="wf-src-code" role="region" aria-label={`${document.file}, lines`} tabIndex={0}>
          <div className="wf-src-lines">{rows}</div>
        </div>
      </SplitPaneMain>
    </SplitPane>
  );
}
