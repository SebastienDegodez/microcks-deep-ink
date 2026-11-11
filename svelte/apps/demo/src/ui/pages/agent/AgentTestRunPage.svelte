<script lang="ts">
  import '@microcks/demo-styles/pages/explore-kit/explore.css';
  import '@microcks/demo-styles/pages/agent/agent-test.css';
  import { untrack } from 'svelte';
  import { agentElapsedMs, agentRunPassed, type AgentTestRunWithDetails, type AgentTestSetup as TestSetup } from '@microcks/demo-core/domain/agents';
  import { ApiBadge, Button, Callout, LiveIndicator, ProjectionPill, RunMeta, StatusBadge } from '@microcks/deep-ink';
  import { PAGE_TITLE_ID, PageHeader, RouterLink, useAnnounce, usePageTitle, useParams, useQuery, useRelativeTime, useSearchParams, useUseCases } from '@/ui/app';
  import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
  import { useReplay } from '@/ui/app/use-replay.svelte.js';
  import AgentTestResults from './AgentTestResults.svelte';
  import AgentTestSetup from './AgentTestSetup.svelte';
  import { CHECK_MS, conversationSubsOf, runMetaItems, shownRunId } from './run';

  type Phase = 'setup' | 'running' | 'done';

  /** Screen 19: configure, run and read an A2A conformance test (Agent Card, then conversations by transport). */
  const params = useParams();
  // A stable proxy that follows the URL: safe to destructure.
  const [search] = useSearchParams();
  const uc = useUseCases();
  const relative = useRelativeTime();
  const announce = useAnnounce();
  const runId = $derived(params.runId);
  const serviceId = $derived(search.get('service') ?? 'concierge');
  const defaults = useQuery(() => uc.agents.testDefaults(serviceId), () => [uc, serviceId]);
  const stored = useQuery(() => (runId ? uc.agents.getTestRun(runId) : Promise.resolve(undefined)), () => [uc, runId]);
  let phase = $state<Phase>(untrack(() => (runId ? 'done' : 'setup')));
  let run = $state.raw<AgentTestRunWithDetails | undefined>();
  let tick = $state(0);
  /** Bumped by a replay, so the results start again from a fresh selection. */
  let replays = $state(0);
  let error = $state('');
  const current = $derived(run ?? stored.data);
  const id = $derived(shownRunId(phase, current, defaults.data?.nextRunId));
  usePageTitle(() => `Agent test #${id} · Microcks`);

  /** After a phase change the old controls are gone: move the focus to the title, never to the page body. */
  const focusTitle = () => {
    requestAnimationFrame(() => document.getElementById(PAGE_TITLE_ID)?.focus());
  };

  const n = $derived(current?.checks.length ?? 0);
  // When the run finishes on its own timer, Step forward and Skip to result disappear: give the focus to the title.
  let previousPhase: Phase | undefined;
  $effect(() => {
    const was = previousPhase;
    previousPhase = phase;
    if (was === 'running' && phase === 'done') {
      requestAnimationFrame(() => {
        if (!document.activeElement || document.activeElement === document.body) document.getElementById(PAGE_TITLE_ID)?.focus();
      });
    }
  });
  function step() {
    if (tick + 1 >= n) {
      phase = 'done';
      tick = n;
    } else tick += 1;
  }
  useReplay(() => phase === 'running', step, CHECK_MS);

  async function start(setup: TestSetup) {
    try {
      const result = await uc.agents.runConformance(setup);
      run = result;
      tick = 0;
      error = '';
      phase = 'running';
      announce(`Run #${result.id} started: ${result.checks.length} checks.`);
      focusTitle();
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
  }

  const hasRun = $derived(phase !== 'setup' && Boolean(current));
  const running = $derived(phase === 'running');
  const elapsed = $derived(current ? agentElapsedMs(current.checks, running ? tick : current.checks.length) : 0);
  const passed = $derived(current ? agentRunPassed(current.checks) : true);
  const replay = () => {
    tick = 0;
    replays += 1;
    phase = 'running';
    announce(`Run #${id} replayed: ${n} checks.`);
  };
  const skip = () => {
    phase = 'done';
    focusTitle();
  };
  const cardUrl = $derived(hasRun && current ? current.setup.cardUrl : (current?.setup.cardUrl ?? defaults.data?.setup.cardUrl ?? ''));
  const metaItems = $derived(runMetaItems({ cardUrl, run: hasRun ? current : undefined, running, elapsed, launchedBy: current?.launchedBy, relative }));
  const conversationSubs = $derived(conversationSubsOf(defaults.data?.conversations ?? []));
</script>

{#snippet badges()}<span class="run-badges"
    ><RouterLink to={`/services/${serviceId}`} class="run-badge-link"><ApiBadge protocol="A2A" name="Pastry concierge 1.0" size="lg" /></RouterLink
    ><ProjectionPill title="A2A does not exist in Microcks today: this screen projects a protocol module for v2" />{#if !hasRun}<span role="status"
        ><ApiBadge label="status" value="not started" /></span
      >{:else if running}<LiveIndicator /><StatusBadge shape="bare" status="running" label={`Running · check ${Math.min(tick + 1, n)} of ${n}`} />{:else}<span
        role="status"
        ><ApiBadge label="result" value={passed ? 'passed' : 'failed'} status={passed ? 'success' : 'danger'} icon={passed ? 'check' : 'close-sm'} /></span
      >{/if}</span
  >{/snippet}
{#snippet headerActions()}<Button icon="reset" onclick={replay}>Replay run</Button>{#if running}<Button variant="primary" icon="skip" onclick={skip}
      >Skip to result</Button
    >{/if}{/snippet}
{#snippet header()}<PageHeader
    title={`Run #${id}`}
    breadcrumb={[{ label: 'Tests', to: `/tests/service/${serviceId}` }, { label: 'Pastry concierge 1.0', to: `/services/${serviceId}` }, { label: `Run #${id}` }]}
    badge={badges}
    align="start"
    actions={hasRun ? headerActions : undefined}><RunMeta items={metaItems} /></PageHeader
  >{/snippet}

{#if defaults.status === 'error' && !defaults.data}<div class="agent-test"
    >{@render header()}<ErrorBlock error={defaults.error} what="The agent" onretry={defaults.reload} /></div
  >{:else if !defaults.data}<div class="agent-test">{@render header()}<LoadingBlock label="the test form" /></div
  >{:else if runId && stored.status === 'error' && !stored.data}<div class="agent-test"
    >{@render header()}<ErrorBlock error={stored.error} what="The test run" onretry={stored.reload} /></div
  >{:else if phase !== 'setup' && !current}<div class="agent-test">{@render header()}<LoadingBlock label="the test run" /></div
  >{:else}<div class="agent-test"
    >{@render header()}{#if error}<Callout tone="danger" title="The test could not start" live="assertive"><p>{error}</p></Callout
      >{/if}{#if phase === 'setup' || !current}<AgentTestSetup
        defaults={defaults.data}
        initial={current?.setup ?? defaults.data.setup}
        onrun={start}
      />{:else}{#key `${current.id}-${replays}`}<AgentTestResults
          run={current}
          {phase}
          {tick}
          {conversationSubs}
          onstep={() => {
            if (tick + 1 >= n) focusTitle();
            step();
          }}
          onreplay={() => {
            replay();
            focusTitle();
          }}
          onedit={() => {
            phase = 'setup';
            focusTitle();
          }}
        />{/key}{/if}</div
  >{/if}
