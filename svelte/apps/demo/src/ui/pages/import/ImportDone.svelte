<script lang="ts">
  import type { ImportResult } from '@microcks/demo-core/domain/importing';
  import { ApiBadge, Button, CopyButton, Icon, ProjectionPill } from '@microcks/deep-ink';
  import { ButtonRouterLink, RouterLink } from '@/ui/app';
  import { doneSub, isTestable, openTarget } from './result';

  /** Step 3: the source is created and its mock is live. */
  interface Props {
    result: ImportResult;
    onreset: () => void;
    /** Minutes until the next global scan, for the Git source sentence. */
    nextScanMinutes: number;
  }

  let { result, onreset, nextScanMinutes }: Props = $props();
  const open = $derived(openTarget(result));
  const testable = $derived(isTestable(result));
</script>

<div class="step-card" data-step="done"
  ><div role="status" class="step-head"
    ><Icon name="check-circle" size={32} class="step-done-icon" /><div class="step-head-text"
      ><h2>{result.outcome === 'direct' ? 'Mock created and live' : 'Source created'}</h2><p>{doneSub(result, nextScanMinutes)}</p></div
    ></div
  >{#if result.createdSource}<div class="created-source"
      ><Icon name="database" size={16} class="created-source-icon" /><span class="created-source-text"
        ><span class="created-source-name">{result.createdSource.name}</span><span class="created-source-detail">{result.createdSource.detail}</span></span
      ><span class="created-source-origin">{result.createdSource.origin}</span><span class="created-source-schedule">{result.createdSource.schedule}</span
      ><RouterLink to="/sources">View in Sources</RouterLink></div
    >{/if}{#if result.outcome === 'arazzo' && result.arazzo}<div class="done-badges"
      ><ApiBadge arazzo name={`${result.name} ${result.version}`} /><ApiBadge label="workflows" value={String(result.arazzo.workflows)} status="success" /><ApiBadge
        label="steps"
        value={String(result.arazzo.steps)}
      /></div
    >{:else if result.outcome === 'a2a' && result.agent}<div class="done-badges"
      ><ApiBadge protocol="A2A" name={result.name} version={result.version} /><ApiBadge label="skills" value={String(result.agent.skills)} status="success" /><ApiBadge
        label="conversations"
        value={`${result.agent.conversations} · add APIExamples`}
        status="warning"
      /><ProjectionPill /></div
    ><div class="done-field"
      ><span id="mock-endpoints-label" class="done-label">Mock endpoints · the <!---->{result.endpoints?.length ?? 0}<!----> transports are served at once</span
      ><ul class="boxed-list endpoints" aria-labelledby="mock-endpoints-label"
        >{#each result.endpoints ?? [] as e (e.binding)}<li><span class="boxed-list-binding">{e.binding}</span><span class="boxed-list-url">{e.url}</span></li>{/each}</ul
      ></div
    >{:else}<div class="done-badges"
      >{#if result.protocol && result.protocol !== 'ARAZZO'}<ApiBadge protocol={result.protocol} name={result.name} version={result.version} />{/if}{#if result.mcp}<ApiBadge
          label="mcp"
          value="agent-ready"
          status="info"
        />{/if}<ApiBadge label="samples" value={result.samples ?? '0'} status="warning" /></div
    ><div class="done-field"
      ><span id="mock-url-label" class="done-label">{result.mockLabel}</span><div class="mock-url-field" role="group" aria-labelledby="mock-url-label"
        ><code>{result.mockUrl}</code><CopyButton value={result.mockUrl ?? ''} label="Copy" /></div
      ></div
    >{#if result.tryIt}<div class="done-field"
        ><span id="try-it-label" class="done-label">Try it now</span><pre class="try-it" aria-labelledby="try-it-label">{result.tryIt}</pre></div
      >{/if}{/if}<div class="step-actions"
    ><ButtonRouterLink variant="primary" to={open.to}>{open.label}<Icon name="arrow-right" size={16} /></ButtonRouterLink><ButtonRouterLink
      variant="secondary"
      to="/sources">Back to Sources</ButtonRouterLink
    ><Button variant="ghost" onclick={onreset}>Add another source</Button>{#if testable}<ButtonRouterLink
        variant="secondary"
        icon="play"
        to={`/tests/create?service=${result.serviceId}`}>Run a test</ButtonRouterLink
      >{/if}</div
  ></div
>
