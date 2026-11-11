<script lang="ts">
  import { AGENT_TRANSPORT_NAMES, agentCellName, agentRunnerLog, cellKey, totalsOf, type AgentTestRunWithDetails } from '@microcks/demo-core/domain/agents';
  import { ApiBadge, Button, CiPanel, ConformanceMatrix, Icon, LiveIndicator, RunProgress, RunnerLog, SectionLabel, SummaryStrip } from '@microcks/deep-ink';
  import { ButtonRouterLink, useAnnounce } from '@/ui/app';
  import AgentCellDetail from './AgentCellDetail.svelte';
  import { CLI, SEGMENT, autoSelectedKey, cardPassedCount, cellStates, matrixColumns, matrixFooter, matrixGroups, progressCounts, scoreLevelOf, transportScores } from './run';

  interface Props {
    run: AgentTestRunWithDetails;
    phase: 'running' | 'done';
    tick: number;
    /** "skill recommend-pastry · 1 turn · expects completed", by conversation id. */
    conversationSubs: Record<string, string>;
    onstep: () => void;
    onreplay: () => void;
    onedit: () => void;
  }

  /** The run: its setup, the progress or the summary, the runner log, then the conformance matrix and the selected cell. */
  let { run, phase, tick, conversationSubs, onstep, onreplay, onedit }: Props = $props();
  const announce = useAnnounce();
  const running = $derived(phase === 'running');
  const n = $derived(run.checks.length);
  const shown = $derived(running ? tick : n);
  let chosen = $state<string | null>(null);
  let ciOpen = $state(false);
  let area = $state<HTMLElement>();
  const revealed = $derived(run.checks.slice(0, shown));
  const firstFail = $derived(run.failures[0]);
  const last = $derived(revealed[revealed.length - 1]);
  const autoKey = $derived(autoSelectedKey(running, firstFail, last));
  const selectedKey = $derived(chosen === null ? autoKey : chosen);
  const selectedIndex = $derived(selectedKey ? run.checks.findIndex((c) => cellKey(c.row, c.transport) === selectedKey) : -1);
  const selectedCheck = $derived(selectedIndex >= 0 && selectedIndex < shown ? run.checks[selectedIndex] : undefined);
  const detail = $derived(selectedCheck ? run.details[selectedKey] : undefined);
  const transports = $derived(run.setup.transports);
  const conversations = $derived(run.setup.conversations);
  const columns = $derived(matrixColumns(transports));
  const groups = $derived(matrixGroups(run, shown, running, conversationSubs));
  const footer = $derived(matrixFooter(run, shown));
  const states = $derived(cellStates(run.checks, shown, running));
  const counts = $derived(progressCounts(states));
  const all = $derived(totalsOf(run.checks));
  const cardPassed = $derived(cardPassedCount(run.checks));
  const scoreLevel = $derived(scoreLevelOf(all));
  const current = $derived(running ? run.checks[tick] : undefined);
  const log = $derived(agentRunnerLog(run, shown, running));

  // While running, only failures are announced (the start and the finish are announced too), never each check.
  $effect(() => {
    if (running && last?.result === 'fail') announce(`${agentCellName(last.row, last.transport)} failed.`);
  });

  $effect(() => {
    if (!running) announce(`Test finished. ${all.conversationPassed} of ${all.conversationTotal} conversation checks passed.`);
  });

  /** Closing the detail returns the focus to the selected cell, so it never drops to the page body. */
  function closeDetail() {
    const cell = area?.querySelector<HTMLButtonElement>('button.matrix-cell[aria-pressed="true"]');
    chosen = '';
    cell?.focus();
  }
</script>

{#snippet stepForward()}<Button size="sm" icon="chevron" class="step-forward" onclick={onstep}>Step forward</Button>{/snippet}
{#snippet progressNote()}Agent Card checks run first. Each conversation then runs once per transport, with a fresh <span class="demo-mono">contextId</span> per run
  and the OAuth2 token from the secret.{/snippet}
{#snippet logStatus()}<LiveIndicator variant="inline" label="live · streaming" />{/snippet}
{#snippet ciPill()}<ApiBadge label="cli" value="proposed" status="warning" size="sm" />{/snippet}
{#snippet ciHint()}Proposed, not available today: the existing <span class="demo-mono">microcks test</span> command, unchanged, with the new runner name<!---->{' '}<span
    class="demo-mono">A2A_CONFORMANCE</span
  > that the A2A module would register. It exits non-zero when a check fails.{/snippet}
{#snippet ciFootnote()}Add <span class="demo-mono">--keycloakClientId</span> and <span class="demo-mono">--keycloakClientSecret</span> when your Microcks instance has
  authentication on. The agent's OAuth2 token comes from the secret bound to the test, as in this run.{/snippet}

<SummaryStrip variant="canvas" class="setup-strip"
  ><SectionLabel lineHeight="normal">Setup</SectionLabel><span class="setup-strip-text">{transports.map((t) => AGENT_TRANSPORT_NAMES[t]).join(' · ')}</span
  ><span class="setup-strip-text">{conversations.length}<!---->{' '}<!---->{conversations.length === 1 ? 'conversation' : 'conversations'}</span
  ><span><span class="muted">secret</span> <span class="demo-mono">{run.setup.secret || 'none'}</span></span
  ><span><span class="muted">timeout</span> <span class="demo-mono">{run.setup.timeoutMs}<!----> ms</span></span
  ><span><span class="muted">text</span> <span class="demo-mono">{run.setup.textMode}{#if run.setup.dataSchema}{' + JSON Schema'}{/if}</span></span
  >{#if !running}<Button size="sm" icon="pencil" class="edit-setup" onclick={onedit}>Edit setup</Button>{/if}</SummaryStrip
><div class="run-top"
  >{#if running}<RunProgress
      class="run-top-main"
      done={tick}
      total={n}
      caption="matrix cells filled"
      nowLabel="Now checking"
      now={current ? agentCellName(current.row, current.transport) : 'Computing the conformance score…'}
      segments={states.map((s) => SEGMENT[s])}
      gap={3}
      {counts}
      action={stepForward}
      note={progressNote}
    />{:else}<section aria-label="Summary" class="run-summary run-top-main"
      ><div class="run-summary-head"
        ><div class="run-score"
          ><span class="run-score-value" data-level={scoreLevel}
            >{all.conversationPassed}<span class="run-score-total">/<!---->{all.conversationTotal}</span></span
          ><span class="run-score-caption"
            >conversation checks passed · <!---->{conversations.length}<!----> conversations × <!---->{transports.length}<!----> transports</span
          ></div
        ><div class="run-summary-text"
          ><span class="run-summary-line"
            >{all.conversationPassed}<!----> of <!---->{all.conversationTotal}<!----> checks passed<!---->{all.conversationFailed
              ? ` · ${all.conversationFailed} failed on the task contract, each on a single transport`
              : ' on every transport'}</span
          ><span class="run-summary-card"
            ><span class="muted">Agent Card</span><span data-tone="success"><Icon name="check" size={12} />{cardPassed}<!----> passed</span
            >{#if all.warn}<span data-tone="warning"><Icon name="warning" size={12} />{all.warn}<!----> warning · signature absent</span>{/if}</span
          >{#each run.failures as f (`${f.row}|${f.transport}`)}<button type="button" class="failure-link" onclick={() => (chosen = cellKey(f.row, f.transport))}
              ><Icon name="cross" size={13} class="failure-link-icon" /><span
                ><span class="failure-link-cell">{AGENT_TRANSPORT_NAMES[f.transport]}<!----> × <!---->{f.row}</span> · <!---->{f.cause}</span
              ></button
            >{/each}</div
        ></div
      ><div class="transport-scores"
        ><span class="transport-scores-caption">Score per transport · one segment per conversation</span><div class="transport-scores-row"
          >{#each transportScores(run) as score (score.transport)}<div class="transport-score"
              ><div class="transport-score-head"
                ><span class="transport-score-name">{AGENT_TRANSPORT_NAMES[score.transport]}</span><span
                  class="transport-score-value"
                  data-tone={score.ok === conversations.length ? 'success' : 'danger'}>{score.ok}<!---->/<!---->{conversations.length}</span
                ></div
              ><div class="transport-score-segs" aria-hidden="true">{#each score.results as r, i (i)}<span data-result={r}></span>{/each}</div></div
            >{/each}</div
        ></div
      ><div class="run-actions"
        ><ButtonRouterLink variant="primary" to={`/services/${run.setup.serviceId}`}>Open agent</ButtonRouterLink><Button icon="play" onclick={onreplay}
          >Run again</Button
        ><ButtonRouterLink to={`/tests/service/${run.setup.serviceId}`}>All runs</ButtonRouterLink><Button
          icon="code"
          class="ci-panel-toggle"
          aria-expanded={ciOpen}
          aria-controls="ci-panel"
          onclick={() => (ciOpen = !ciOpen)}>Run it from CI</Button
        ></div
      >{#if ciOpen}<CiPanel
          id="ci-panel"
          dashed
          copyLabel="Copy command"
          title="Run this test in your pipeline"
          pill={ciPill}
          hint={ciHint}
          command={CLI}
          footnote={ciFootnote}
        />{/if}</section
    >{/if}<RunnerLog
    class="run-top-log"
    status={running ? logStatus : `${log.length} lines · completed`}
    lines={log.map((l) => ({ time: l.time, level: l.level, text: l.text, emphasis: l.tone === 'emphasis', error: l.tone === 'error' }))}
  /></div
><section aria-labelledby="matrix-title" class="matrix-section" bind:this={area}
  ><div class="matrix-section-head"
    ><h2 id="matrix-title">Conformance matrix</h2><span class="matrix-section-hint">checks × transports · select a finished cell to see the exchange</span
    >{#if running}<LiveIndicator variant="inline" label="live · filling" />{/if}</div
  ><ConformanceMatrix
    caption={`Checks of run #${run.id}: Agent Card, then conversations, by transport`}
    {columns}
    {groups}
    {footer}
    selectedKey={detail ? selectedKey : undefined}
    onselectcell={(k) => (chosen = k ?? '')}
  />{#if detail && selectedCheck}<AgentCellDetail {detail} check={selectedCheck} onclose={closeDetail} />{:else}<p class="cell-detail-empty"
      >Cells fill as checks finish. Select a finished cell to see what Microcks sent, what the agent answered, and why the check passed or failed.</p
    >{/if}</section
>
