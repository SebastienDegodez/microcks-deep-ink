<script lang="ts">
  import type { ArazzoDocument, RunKindFilter, SourceDescription } from '@microcks/demo-core/domain/arazzo';
  import type { WorkflowListItem } from '@microcks/demo-core/application/arazzo';
  import { ApiBadge, Button, Icon } from '@microcks/deep-ink';
  import { RouterLink } from '@/ui/app';
  import WorkflowRow from './WorkflowRow.svelte';

  interface Props {
    document: ArazzoDocument;
    rows: WorkflowListItem[];
    docWorkflows: WorkflowListItem[];
    total: number;
    serviceName: (id: string) => { name: string; version: string } | undefined;
    relative: (date: string) => string;
    runKind: RunKindFilter;
    onlink: (source: SourceDescription) => void;
  }
  let { document: doc, rows, docWorkflows, total, serviceName, relative, runKind, onlink }: Props = $props();
  const unlinked = $derived(doc.sources.filter((s) => s.link.status === 'not-linked'));
  const linkedCount = $derived(doc.sources.length - unlinked.length);
  const synced = $derived(doc.origin.startsWith('Synced'));
  const stepsOn = (name: string) => docWorkflows.reduce((n, w) => n + w.workflow.steps.filter((s) => s.sourceName === name).length, 0);
  const blockedBy = $derived(docWorkflows
    .filter((w) => w.workflow.steps.some((s) => unlinked.some((u) => u.name === s.sourceName)))
    .map((w) => w.workflow.workflowId));
</script>

<section aria-label={`Arazzo document ${doc.file}`} class="wf-doc"
  ><div class="wf-doc-header"
    ><div class="wf-doc-title-row"
      ><div class="wf-doc-title"
        ><Icon name="file-text" size={18} stroke-width={1.8} class="wf-text2" /><h2>{doc.file}</h2><span class="wf-doc-name">{doc.title}</span><span class="wf-tag"
          >arazzo <!---->{doc.arazzoVersion}</span
        ><span class="wf-tag">version <!---->{doc.version}</span></div
      ><span class="wf-doc-origin"
        ><Icon name={synced ? 'sync' : 'upload'} size={14} />{#if synced}<span>{doc.origin}<!----> via</span><RouterLink to="/sources" class="wf-plain-link"
            >{doc.title}</RouterLink
          >{:else}<span>{doc.origin}</span>{/if}</span
      ></div
    ><p class="wf-overlay"
      >{#if doc.overlay}<Icon name="layers" size={15} stroke-width={1.8} /><span>ArazzoSources overlay</span><code>{doc.overlay}</code><span class="wf-tag" data-tone="success"
          >imported</span
        ><span class="wf-muted-text">links the sources, carries the recorded examples</span>{:else}<Icon name="layers-missing" size={15} stroke-width={1.8} class="wf-muted-text" /><span class="wf-muted-text"
          >No ArazzoSources overlay · sources linked in the import dialog</span
        >{/if}<span class="wf-linked-count" data-tone={unlinked.length ? 'warning' : 'success'}
        ><Icon name={unlinked.length ? 'warning' : 'check-circle'} size={15} stroke-width={2.2} />{linkedCount}<!----> of <!---->{doc.sources.length}<!----> linked</span
      ></p
    ><div class="wf-src-box"
      ><div role="table" aria-label={`Source descriptions of ${doc.file}`} class="wf-src-table"
        ><div role="row" class="wf-src-row wf-grid-head"
          ><span role="columnheader">Source description</span><span role="columnheader">Declared URL</span><span role="columnheader">Microcks API</span><span role="columnheader">Step operations</span></div
        >{#each doc.sources as s (s.name)}{@const svc = s.link.status === 'linked' ? serviceName(s.link.serviceId) : undefined}<div role="row" class="wf-src-row"
            ><span role="cell" class="wf-src-name"><code>{s.name}</code><span class="wf-src-type">{s.type}</span></span><!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role (A code cell in the surrounding table, not an interactive control.) --><code role="cell" class="wf-src-url">{s.url}</code><span role="cell" class="wf-src-api"
              >{#if s.link.status === 'linked'}<RouterLink
                  to={`/services/${s.link.serviceId}`}
                  class="wf-badge-link"
                  aria-label={`${s.link.protocol} ${svc?.name ?? s.link.serviceId} ${svc?.version ?? ''}: ${s.name} is linked to it, open the API`}
                  ><ApiBadge protocol={s.link.protocol} name={svc?.name ?? s.link.serviceId} version={svc?.version} size="sm" class="wf-src-badge" /></RouterLink
                ><span class="wf-linked"><Icon name="check" size={12} stroke-width={2.4} />Linked</span>{:else}<span class="wf-not-linked"
                  ><Icon name="warning" size={12} stroke-width={2.4} />Not linked</span
                >{/if}</span
            ><span role="cell" class="wf-src-ops" data-tone={s.link.status === 'linked' ? undefined : 'warning'}
              ><Icon name={s.link.status === 'linked' ? 'check-circle' : 'warning'} size={12} stroke-width={2.2} />{s.link.status === 'linked' ? s.link.operationsFound : `${stepsOn(s.name)} steps unresolved`}</span
            ></div
          >{/each}</div
      ></div
    >{#if unlinked.length > 0}<div role="status" class="wf-warn"
        ><Icon name="warning" size={18} class="wf-warn-icon" /><div class="wf-warn-text"
          ><span class="wf-warn-title"
            >{blockedBy.join(', ') || 'Its workflows'}<!----> cannot run until <!---->{unlinked.map((s) => s.name).join(', ')}<!----> <!---->{unlinked.length === 1 ? 'is' : 'are'}<!----> linked</span
          ><span class="wf-warn-hint">Beer Catalog API 1.0 is not in Microcks yet: import beer-catalog-1.0-openapi.yaml first, or pick the API to link in the dialog.</span></div
        ><Button size="sm" icon="link" class="wf-warn-btn" onclick={() => unlinked[0] && onlink(unlinked[0])}>Link sources</Button></div
      >{/if}</div
  ><div class="wf-rows-box"
    ><div role="table" aria-label={`Workflows of ${doc.file} (${rows.length} of ${total})`} class="wf-rows"
      ><div role="row" class="wf-wrow wf-grid-head"
        ><span role="columnheader">Workflow</span><span role="columnheader">Steps</span><span role="columnheader">Sources</span><span role="columnheader">Inputs</span><span role="columnheader">Last run</span><span role="columnheader">Mock URL</span><span role="columnheader"
          ><span class="sr-only">Run</span></span
        ></div
      >{#each rows as row (row.workflow.workflowId)}<WorkflowRow {row} {serviceName} {relative} {runKind} />{/each}</div
    ></div
  ></section
>
