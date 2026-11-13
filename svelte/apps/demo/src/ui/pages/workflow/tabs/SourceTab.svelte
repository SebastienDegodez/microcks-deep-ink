<script lang="ts" module>
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

  interface YamlValue {
    cls?: 'y-expr' | 'y-lit';
    text: string;
  }

  interface YamlParts {
    indent: string;
    mark: boolean;
    key?: string;
    gap: string;
    value?: YamlValue;
    comment: string;
  }

  const yamlValue = (v: string): YamlValue | undefined =>
    !v ? undefined : v.startsWith('$') || v.startsWith('"{$') ? { cls: 'y-expr', text: v } : /^[[>0-9^]/.test(v) ? { cls: 'y-lit', text: v } : { text: v };

  /** One YAML line cut for its syntax colours: keys, `:` and `- ` marks, runtime expressions, numbers and arrays, comments. */
  function yamlParts(text: string): YamlParts {
    const hash = text.search(/(^\s*#|\s+#\s)/);
    const body = hash >= 0 ? text.slice(0, hash) : text;
    const comment = hash >= 0 ? text.slice(hash) : '';
    const kv = /^(\s*)(- )?([A-Za-z_][\w-]*)(:)(\s?)(.*)$/.exec(body);
    if (kv) return { indent: kv[1] ?? '', mark: !!kv[2], key: kv[3], gap: kv[5] ?? '', value: yamlValue(kv[6] ?? ''), comment };
    const item = /^(\s*)(- )?(.*)$/.exec(body);
    return { indent: item?.[1] ?? '', mark: !!item?.[2], gap: '', value: yamlValue(item?.[3] ?? ''), comment };
  }

  type Row = { kind: 'fold'; i: number; block: OutlineBlock } | { kind: 'line'; i: number; selected: boolean };
</script>

<script lang="ts">
  import '@microcks/demo-styles/pages/workflow/tabs/source.css';
  import type { ImportIssue } from '@microcks/demo-core/domain/arazzo';
  import type { WorkflowDetail } from '@microcks/demo-core/application/arazzo';
  import { ApiBadge, Button, Checkbox, Icon, SplitPane, SplitPaneMain, SplitPaneSide } from '@microcks/deep-ink';
  import { ButtonRouterLink, useQuery, useUseCases } from '@/ui/app';
  import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
  import { syncedText } from '../WorkflowHeader.svelte';

  interface Props {
    detail: WorkflowDetail;
    /** Selected step: `?step=`, else the step where the shown run failed (given by the page). */
    step?: string;
    onselectstep: (stepId: string) => void;
    serviceLabel?: (serviceId: string) => string | undefined;
  }

  let { detail, step, onselectstep, serviceLabel }: Props = $props();

  const uc = useUseCases();
  const document = $derived(detail.document);
  const workflow = $derived(detail.workflow);
  const source = useQuery(
    () => uc.arazzo.getDocumentSource(document.id),
    () => [document.id],
  );
  let picked = $state<string | undefined>(undefined);
  let fold = $state(true);
  let validating = $state(false);
  let validated = $state.raw<{ issues: ImportIssue[]; at: string } | null>(null);
  let copied = $state(false);
  let error = $state.raw<Error | null>(null);

  const text = $derived(source.data ?? '');
  const lines = $derived(text.replace(/\n$/, '').split('\n'));
  const blocks = $derived(
    outlineOf(
      lines,
      workflow.workflowId,
      workflow.steps.map((s) => s.stepId),
    ),
  );
  const selected = $derived(blocks.find((b) => b.id === (picked ?? step ?? 'doc')) ?? blocks[0]);

  const validate = async () => {
    validating = true;
    error = null;
    try {
      validated = { issues: await uc.arazzo.validateDocument(document.id), at: 'just now' };
    } catch (e) {
      error = e instanceof Error ? e : new Error(String(e));
    } finally {
      validating = false;
    }
  };
  const copy = () => {
    void navigator.clipboard
      ?.writeText(text)
      .then(() => (copied = true))
      .catch(() => undefined);
  };
  const pick = (b: OutlineBlock) => {
    picked = b.id;
    if (b.step) onselectstep(b.id);
  };

  const used = $derived([...new Set(workflow.steps.map((s) => s.sourceName))]);
  const ops = $derived([...new Set(workflow.steps.map((s) => `${s.sourceName}.${s.operationId}`))]);
  const linkedTo = $derived(
    used.map((name) => {
      const src = document.sources.find((s) => s.name === name);
      return { name, label: src?.link.status === 'linked' ? (serviceLabel?.(src.link.serviceId) ?? src.link.serviceId) : undefined };
    }),
  );
  const issues = $derived(validated?.issues ?? document.importIssues);
  const when = $derived(validated ? validated.at : `at sync, ${syncedText(document)?.replace(/^Synced /, '') ?? 'at import'}`);
  const wfBlock = $derived(blocks.find((b) => b.id === 'workflow'));
  const last = $derived(blocks[blocks.length - 1]);

  // Rows: plain lines, or one folded row per folded step.
  const rows = $derived.by(() => {
    const out: Row[] = [];
    for (let i = 0; i < lines.length; ) {
      const block = blocks.find((b) => b.step && b.from === i);
      if (block && fold && block.id !== selected?.id) {
        out.push({ kind: 'fold', i, block });
        i = block.to + 1;
        continue;
      }
      out.push({ kind: 'line', i, selected: selected !== undefined && i >= selected.from && i <= selected.to });
      i += 1;
    }
    return out;
  });
</script>

{#snippet yamlLine(text: string)}{@const p = yamlParts(text)}{p.indent}{#if p.mark}<span class="y-mark">{'- '}</span>{/if}{#if p.key !== undefined}<span class="y-key"
      >{p.key}</span
    ><span class="y-mark">:</span>{p.gap}{/if}{#if p.value}<span class={p.value.cls}>{p.value.text}</span>{/if}{#if p.comment}<span class="y-comment">{p.comment}</span
    >{/if}{#if !text}{' '}{/if}{/snippet}

{#if source.status === 'loading' && !source.data}<LoadingBlock label="the Arazzo source" rows={2} />{:else if source.status === 'error'}<ErrorBlock
    error={source.error}
    onretry={source.reload}
  />{:else}<SplitPane gap="16px" sideWidth="220px" sideMax="280px" mainWidth="560px" keepSideMax
    ><SplitPaneSide as="nav" aria-labelledby="wf-outline-title" class="wf-src-outline"
      ><h2 id="wf-outline-title">Outline</h2><span class="wf-outline-file">{document.file}</span>{#each blocks as b (b.id)}<button
          type="button"
          class="wf-outline-item"
          data-nested={b.nested ? '' : undefined}
          aria-pressed={b.id === selected?.id}
          onclick={() => pick(b)}
          ><span class="wf-outline-label">{b.label}</span><span class="wf-outline-range">{b.from + 1}<!---->–<!---->{b.to + 1}</span></button
        >{/each}<div class="wf-outline-fold"><Checkbox label="Fold the other steps" bind:checked={fold} /></div></SplitPaneSide
    ><SplitPaneMain as="section" aria-label="Arazzo source" class="wf-src"
      ><div class="wf-src-toolbar"
        ><div class="wf-src-caption"
          ><ApiBadge arazzo name={document.arazzoVersion} size="sm" /><span class="wf-src-where"
            >workflow <!---->{workflow.workflowId}{#if wfBlock && last}{` · lines ${wfBlock.from + 1}–${last.to + 1}`}{/if}{#if selected}{` · selected ${selected.label}`}{/if}</span
          ></div
        ><div class="wf-src-actions"
          ><Button size="sm" icon="check" loading={validating} onclick={validate}>{validating ? 'Validating…' : 'Validate'}</Button><Button size="sm" icon="copy" onclick={copy}
            >{copied ? 'Copied' : 'Copy YAML'}</Button
          ><ButtonRouterLink size="sm" to="/sources">Edit in source</ButtonRouterLink></div
        ></div
      ><div role="status" aria-live="polite" class="wf-src-band"
        >{#if validating}<span>Validating against Arazzo <!---->{document.arazzoVersion}<!---->…</span>{:else if issues.length === 0}<span class="wf-src-band-line"
            ><span class="wf-src-valid"><Icon name="check-circle" size={15} stroke-width={2.2} />Valid Arazzo <!---->{document.arazzoVersion}</span><span
              >· inside the subset Microcks runs · <!---->{workflow.steps.length}<!----> steps · <!---->{ops.length}<!----> operations found in <!---->{linkedTo
                .map((l) => l.label ?? l.name)
                .join(', ')}</span
            ><span class="wf-src-muted">· validated <!---->{when}</span></span
          ><span class="wf-src-refs"
            >{#each ops as o, k (o)}{k === 0 ? `$sourceDescriptions.${o}` : ` · .${o.split('.').pop()}`}{/each}{' '}<!---->→ <!---->{linkedTo
              .map((l) => `${l.name} ${l.label ? `linked to ${l.label}` : 'not linked'}`)
              .join(', ')}{#if document.overlay}{` by ${document.overlay}`}{/if}</span
          >{:else}<span class="wf-src-invalid"
            ><Icon name="x-circle" size={15} stroke-width={2.2} />{issues.length}<!----> feature{#if issues.length !== 1}s{/if} outside the subset Microcks runs</span
          ><ul class="wf-src-issues">{#each issues as i (i.path)}<li><code>{i.path}</code>: <!---->{i.message}</li>{/each}</ul>{/if}</div
      >{#if error}<ErrorBlock {error} />{/if}<!-- The code scrolls sideways: keyboard users must reach it (RGAA 7.3). --><!-- svelte-ignore a11y_no_noninteractive_tabindex --><div
        class="wf-src-code"
        role="region"
        aria-label={`${document.file}, lines`}
        tabindex="0"
        ><div class="wf-src-lines"
          >{#each rows as r (`${r.kind}${r.i}`)}{#if r.kind === 'fold'}<button type="button" class="wf-yaml-row wf-src-fold" onclick={() => pick(r.block)}
                ><span class="sr-only">{`Unfold step ${r.block.id}, lines ${r.block.from + 1} to ${r.block.to + 1}: `}</span><span aria-hidden="true" class="wf-src-n"
                  >{r.i + 1}</span
                ><span class="wf-src-text">{@render yamlLine(lines[r.i] ?? '')}</span><span class="wf-src-chip"
                  ><Icon name="chevron" size={10} stroke-width={2.4} />{r.block.to - r.block.from}<!----> lines folded</span
                ></button
              >{:else}<div class="wf-yaml-row" data-selected={r.selected ? '' : undefined}
                ><span aria-hidden="true" class="wf-src-n">{r.i + 1}</span><span class="wf-src-text">{@render yamlLine(lines[r.i] ?? '')}</span></div
              >{/if}{/each}</div
        ></div
      ></SplitPaneMain
    ></SplitPane
  >{/if}
