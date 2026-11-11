<script lang="ts">
  import { BarChart, Icon, MethodTag } from '@microcks/deep-ink';
  import type { TestRunSummary } from '@microcks/demo-core/domain/testing';
  import { RouterLink } from '@/ui/app';
  import { testRunHref } from '@/ui/app/format';
  import { TEST_RESULT_ICON, TEST_RESULT_WORD } from '@/ui/app/outcomes';
  import {
    CAP_MS,
    conformanceLine,
    fmtDuration,
    operationStats,
    runSamples,
    shortDate,
    timelineBars,
    timelineRuns,
    timelineSelection,
    timelineSubtitle,
    timelineTable,
    type TimelineOperation,
  } from './timeline';

  interface Props {
    /** Runs of the service, any order. */
    runs: TestRunSummary[];
    /** Operations of the service, in the order of `run.operations`. */
    operations: TimelineOperation[];
    selectedId?: string;
    onselect: (id: string) => void;
    /** False for a run hidden by the filters of the table: its bar fades. */
    matches: (run: TestRunSummary) => boolean;
    filtered: boolean;
    relative: (iso: string) => string;
  }

  /** Conformance timeline: one bar per run (height = duration, colour = result), the samples-passed line, the selected run and per-operation cards. */
  let { runs, operations, selectedId, onselect, matches, filtered, relative }: Props = $props();
  const chrono = $derived(timelineRuns(runs));
  const n = $derived(chrono.length);
  const selected = $derived(timelineSelection(runs, chrono, selectedId));
  const subtitle = $derived(timelineSubtitle(chrono));
  const line = $derived(conformanceLine(chrono));
  const opStats = $derived(operationStats(operations, chrono));
  const bars = $derived(timelineBars(chrono, selected?.id, (r) => filtered && !matches(r)));
  const table = $derived(timelineTable(chrono, operations));
</script>

{#snippet overlay()}<svg viewBox="0 0 200 100" preserveAspectRatio="none"><polyline points={line} vector-effect="non-scaling-stroke" /></svg>{/snippet}

{#if n > 0}<section class="test-timeline" aria-labelledby="test-timeline-title"
    ><div class="test-timeline-head"
      ><div class="test-timeline-heading"><h2 id="test-timeline-title">Conformance timeline</h2><span class="test-timeline-sub">{subtitle}</span></div
      ><div class="test-timeline-legend" aria-hidden="true"
        ><span><i data-tone="passed"></i>Passed</span><span><i data-tone="failed"></i>Failed</span><span><i data-tone="timeout"></i>Timed out</span><span
          ><i data-tone="line"></i>Conformance, %</span
        ><span class="test-timeline-muted">Bar height = duration</span></div
      ></div
    ><BarChart
      label="Runs, oldest to newest. Use the arrow keys to move between bars."
      max={CAP_MS}
      minHeight={4}
      selectedId={selected?.id}
      {onselect}
      ticks={['3 s', '1.5 s', '0']}
      ticksEnd={['100%', '75%', '50%']}
      {bars}
      {overlay}
      {table}
    />{#if selected}<div class="test-timeline-strip" aria-live="polite" data-tone={selected.result}
        ><span class="test-timeline-id">#<!---->{selected.id}</span><span class="test-timeline-result"
          ><Icon name={TEST_RESULT_ICON[selected.result]} size={14} stroke-width={selected.result === 'timeout' ? 2.2 : 2.6} />{TEST_RESULT_WORD[selected.result]}</span
        ><span class="test-timeline-when"
          >{relative(selected.startedAt)}<!---->{' · '}<!---->{shortDate(selected.startedAt)}<!---->{', '}<!---->{new Date(selected.startedAt).getUTCFullYear()}</span
        ><span class="test-timeline-endpoint">{selected.endpoint}</span><span class="test-timeline-meta"
          >{selected.runner}<!---->{' · '}<!---->{fmtDuration(selected.durationMs)}<!---->{' · '}<!---->{runSamples(selected)}</span
        >{#if selected.reason}<span class="test-timeline-reason">{selected.reason}</span>{/if}<RouterLink
          class="test-timeline-open"
          to={testRunHref(selected)}
          aria-label={`Open run #${selected.id}`}>Open run<Icon name="chevron" size={13} /></RouterLink
        ></div
      >{/if}{#if opStats.length > 0}<ul class="test-op-cards"
        >{#each opStats as s (s.op.id)}<li class="test-op-card"
            ><div class="test-op-card-head"
              ><MethodTag method={s.op.verb} class="test-op-method" /><span class="test-op-card-path" title={s.op.path}>{s.op.path}</span><span
                class="test-op-card-rate"
                data-tone={s.tone}>{s.rate}<!---->%</span
              ></div
            ><div class="test-op-card-strip" role="img" aria-label={s.aria} style={`grid-template-columns: repeat(${n}, minmax(0, 1fr))`}
              >{#each s.cells as c (c.id)}<span data-outcome={c.outcome}></span>{/each}</div
            ><span class="test-op-card-note">{s.note}</span></li
          >{/each}</ul
      >{/if}</section
  >{/if}
