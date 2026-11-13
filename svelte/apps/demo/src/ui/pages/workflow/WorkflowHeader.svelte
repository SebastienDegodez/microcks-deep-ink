<script lang="ts" module>
  import type { ArazzoDocument, Workflow, WorkflowRun } from '@microcks/demo-core/domain/arazzo';

  const WEEK = 7 * 24 * 3600_000;

  /** "Synced 12 min ago" from the document origin "Synced 12 min ago from GitHub". */
  export function syncedText(document: Pick<ArazzoDocument, 'origin'>): string | undefined {
    return document.origin.startsWith('Synced') ? document.origin.replace(/ from .*$/, '') : undefined;
  }

  /** "Implementations · schema validation", "Microcks mocks", "Mock URL", "Session". */
  export function runHow(run: WorkflowRun): string {
    if (run.origin.kind === 'session') return 'Session';
    if (run.origin.kind === 'mock-url') return 'Mock URL';
    if (run.target.kind === 'implementations') return `Implementations${run.options.validateSchemas ? ' · schema validation' : ''}`;
    return run.target.kind === 'mixed' ? 'Mixed' : 'Microcks mocks';
  }

  function download(file: string, text: string) {
    try {
      const url = URL.createObjectURL(new Blob([text], { type: 'application/yaml' }));
      const a = window.document.createElement('a');
      a.href = url;
      a.download = file;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* jsdom or a blocked download: nothing to do. */
    }
  }

  export interface WorkflowHeaderProps {
    document: ArazzoDocument;
    workflow: Workflow;
    runs: WorkflowRun[];
    /** Service names of the linked sources, by service id ("pastry2" → "API Pastry 2.0"). */
    serviceLabel: (serviceId: string) => string | undefined;
    onmockurl: () => void;
  }
</script>

<script lang="ts">
  import { ApiBadge, Button, Menu } from '@microcks/deep-ink';
  import { ButtonRouterLink, PageHeader, RouterLink, useClock, useUseCases } from '@/ui/app';
  import { useRouter } from '@/ui/app/router.svelte.js';
  import { runPath, runSetupPath } from '../workflows/paths';

  /** Header of the Workflow page: breadcrumb, ARAZZO title badge, facts, description, proof strip and actions. */
  let { document, workflow, runs, serviceLabel, onmockurl }: WorkflowHeaderProps = $props();

  const uc = useUseCases();
  const clock = useClock();
  const router = useRouter();
  const sourcesHref = router.href('/sources');
  const importHref = router.href('/import');
  const canRun = $derived(workflow.runnability.runnable);
  const lastRun = $derived(runs[0]);
  const used = $derived([...new Set(workflow.steps.map((s) => s.sourceName))]);
  const synced = $derived(syncedText(document));
  const week = $derived.by(() => {
    const now = clock.now().getTime();
    return runs.filter((r) => r.status !== 'RUNNING' && now - new Date(r.startedAt).getTime() < WEEK);
  });
  const passed = $derived(week.filter((r) => r.status === 'SUCCESS').length);
  const lastWord = $derived(lastRun ? (lastRun.status === 'SUCCESS' ? 'passed' : lastRun.status === 'FAILURE' ? 'failed' : 'running') : undefined);
  const lastHow = $derived(lastRun ? runHow(lastRun) : '');

  const linkOf = (name: string) => {
    const src = document.sources.find((s) => s.name === name);
    const link = src?.link.status === 'linked' ? src.link : undefined;
    return { link, label: link ? serviceLabel(link.serviceId) : undefined };
  };

  const items = $derived([
    { id: 'copy', label: 'Copy workflowId', onselect: () => void navigator.clipboard?.writeText(workflow.workflowId).catch(() => undefined) },
    { id: 'download', label: 'Download Arazzo document', onselect: () => void uc.arazzo.getDocumentSource(document.id).then((y) => download(document.file, y)) },
    ...(document.overlay
      ? [
          {
            id: 'overlay',
            label: 'Download ArazzoSources overlay',
            onselect: () => void uc.arazzo.getDocumentOverlay(document.id).then((y) => y && download(document.overlay ?? 'overlay.yaml', y)),
          },
        ]
      : []),
    { id: 'job', label: `Open source job ${document.title}`, href: sourcesHref },
    { id: 'reimport', label: 'Re-import the Arazzo document', href: importHref },
    { id: 'delete', label: 'Delete workflow', disabled: true, separatorBefore: true, description: 'Workflows are removed with their Arazzo document.' },
  ]);
</script>

{#snippet title()}<ApiBadge arazzo name={workflow.summary} version={document.version} size="xl" />{/snippet}
{#snippet actions()}{#if canRun}<ButtonRouterLink variant="primary" icon="play" to={runSetupPath(document.id, workflow.workflowId)}>Run workflow</ButtonRouterLink
  >{:else}<Button variant="primary" icon="play" disabled aria-describedby="wf-run-why">Run workflow</Button>{/if}<ButtonRouterLink icon="pencil" to="/sources"
    >Edit in source</ButtonRouterLink
  ><Menu label="More workflow actions" iconOnly icon="more-vertical" align="end" {items} />{/snippet}
<PageHeader
  variant="badge"
  align="start"
  breadcrumbSeparator="chevron"
  breadcrumb={[{ label: 'Workflows', to: '/workflows' }, { label: `${document.title} ${document.version}`, to: '/workflows' }, { label: workflow.summary }]}
  {title}
  {actions}
  ><div class="wf-facts"
    ><span>workflowId <span class="wf-facts-strong">{workflow.workflowId}</span></span><span class="demo-mono"
      >{document.file}<!----> · arazzo <!---->{document.arazzoVersion}</span
    >{#if document.overlay}<span>overlay <span class="demo-mono">{document.overlay}</span></span>{/if}{#if synced}<span
        >{synced}<!----> by source job <RouterLink to="/sources">{document.title}</RouterLink></span
      >{:else}<span>{document.origin}</span>{/if}</div
  ><p class="wf-description">{workflow.description ?? workflow.summary}</p><div class="wf-proof"
    >{#each used as name (name)}{@const l = linkOf(name)}<span class="wf-proof-source"
        ><span class="wf-proof-name">{name}</span>{#if l.link && l.label}<RouterLink
            to={`/services/${l.link.serviceId}`}
            class="wf-badge-link"
            aria-label={`Source description ${name}, linked to ${l.link.protocol} ${l.label}`}
            ><ApiBadge protocol={l.link.protocol} name={l.label} /></RouterLink
          >{:else}<ApiBadge label="not linked" value={name} status="warning" />{/if}</span
      >{/each}<span aria-hidden="true" class="wf-proof-divider"></span>{#if lastRun && lastWord}<RouterLink to={runPath(lastRun.id)} class="wf-badge-link"
        ><ApiBadge
          label="last run"
          value={`${lastWord} #${lastRun.number}`}
          status={lastRun.status === 'SUCCESS' ? 'success' : lastRun.status === 'FAILURE' ? 'danger' : 'info'}
          values={[{ value: lastHow }]}
        /></RouterLink
      >{/if}{#if week.length}<ApiBadge label="runs · 7 d" value={`${passed}/${week.length} passed`} />{/if}<button
      type="button"
      class="wf-badge-button"
      onclick={onmockurl}
      aria-label="Mock URL ready: open the Mock URL tab"><ApiBadge label="mock url" value="ready" status="success" /></button
    ></div
  ></PageHeader
>
