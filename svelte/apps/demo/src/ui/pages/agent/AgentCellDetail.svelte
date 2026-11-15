<script lang="ts">
  import type { AgentCheck, AgentCheckDetail, DetailVerdict } from '@microcks/demo-core/domain/agents';
  import { ApiBadge, Button, FactRow, Facts, Icon, ResultBox, SectionLabel, TaskLanes } from '@microcks/deep-ink';
  import { CARD_ROWS, FACT_TONE, RESULT_WORD, TONE_WORD, resultStatus } from './run';

  /** Detail of a finished matrix cell: the Agent Card facts, the task lifecycle with the raw exchange, or the received stream. */
  let { detail, check, onclose }: { detail: AgentCheckDetail; check: AgentCheck; onclose: () => void } = $props();
  const card = $derived(CARD_ROWS.some((r) => r.id === check.row));
  const result = $derived(check.result);
  const status = $derived(resultStatus(result));
  // `coded` renders text with `code` segments between backticks.
</script>

{#snippet coded(text: string)}{#each text.split('`') as part, i (i)}{#if i % 2 === 1}<code class="demo-mono">{part}</code>{:else if part}{part}{/if}{/each}{/snippet}

{#snippet verdictBox(verdict: DetailVerdict)}{#snippet title()}{@render coded(verdict.title)}{/snippet}<ResultBox
    tone="danger"
    icon="cross"
    bordered={false}
    surface="raised"
    live="off"
    {title}>{@render coded(verdict.body)}</ResultBox
  >{/snippet}

<section class="cell-detail" data-result={result} aria-label={`Detail of ${detail.title}`}
  ><div class="cell-detail-head"
    ><div class="cell-detail-title"><h3>{detail.title}</h3><span class="cell-detail-sub">{detail.sub}</span></div
    ><div class="cell-detail-actions"
      ><ApiBadge label={card ? 'agent card' : 'conversation'} value={RESULT_WORD[result]} {status} /><Button
        size="sm"
        iconOnly
        icon="close"
        aria-label="Close cell detail"
        class="cell-detail-close"
        onclick={onclose}
      /></div
    ></div
  >{#if detail.kind === 'summary'}<Facts layout="inline" boxed termWidth="120px" values="secondary" lineHeight="relaxed"
      >{#each detail.rows as r (r.label)}<FactRow term={r.label} mono tone={FACT_TONE[r.tone]}
          >{r.value}{#if TONE_WORD[r.tone]}<span class="sr-only">{' ('}<!---->{TONE_WORD[r.tone]}<!---->)</span>{/if}</FactRow
        >{/each}</Facts
    >{#if detail.note}<p class="cell-detail-note">{detail.note}</p>{/if}{/if}{#if detail.kind === 'lanes'}<div class="detail-block"
      ><SectionLabel as="h4" lineHeight="normal">Task lifecycle · expected versus actual</SectionLabel><div class="lifecycle-box"
        ><TaskLanes lanes={detail.lanes} />{#if detail.note}<p class="lifecycle-note"
            ><Icon name="arrow-up" size={13} class="lifecycle-icon" />{detail.note}</p
          >{/if}</div
      ></div
    >{#if detail.verdict}{@render verdictBox(detail.verdict)}{/if}<div class="detail-block"
      ><SectionLabel as="h4" lineHeight="normal">Raw HTTP exchange · <!---->{detail.exchanges.length}<!----> calls</SectionLabel
      >{#each detail.exchanges as x, i (i)}<div class="exchange" data-highlight={x.highlight ? '' : undefined}
          ><div class="exchange-head"
            ><span class="exchange-call">{x.head}</span><span class="exchange-status" data-tone={x.statusTone}>{x.status}</span></div
          ><div class="exchange-cols"
            >{#each [{ label: 'Request', lines: x.request }, { label: 'Response', lines: x.response }] as side (side.label)}<!-- Scrollable code regions must be reachable by keyboard (WCAG 2.1.1). --><!-- svelte-ignore a11y_no_noninteractive_tabindex --><div
                class="exchange-side"
                tabindex="0"
                role="group"
                aria-label={`${side.label} of ${x.head}`}
                ><div class="exchange-side-inner"
                  ><span class="exchange-label">{side.label}</span
                  >{#each side.lines as l, j (j)}<div class="exchange-line" data-kind={l.kind}
                      ><span class="exchange-mark" aria-hidden="true"
                        >{#if l.kind === 'ok'}✓{:else if l.kind === 'bad'}✕{/if}</span
                      ><span>{l.text}</span
                      >{#if l.kind === 'ok' || l.kind === 'bad'}<span class="sr-only"
                          >{' ('}<!---->{l.kind === 'ok' ? 'expected' : 'wrong'}<!---->)</span
                        >{/if}</div
                    >{/each}</div
                ></div
              >{/each}</div
          ></div
        >{/each}</div
    >{/if}{#if detail.kind === 'stream'}<div class="detail-block"
      ><SectionLabel as="h4" lineHeight="normal">Received stream · a2a.v1.A2AService/SendStreamingMessage</SectionLabel><ol class="stream-events"
        >{#each detail.events as e, i (i)}<li
            data-expected={e.expected ? '' : undefined}
            data-bad={e.mark === 'x' ? '' : undefined}
            data-kind={e.kind === 'request' ? 'request' : e.kind === 'stream closed' ? 'closed' : undefined}
            ><span class="stream-at">{e.at}</span><span class="stream-mark" aria-hidden="true"
              >{#if e.mark === 'x'}✕{:else if e.mark === '+'}+{/if}</span
            >{#if e.mark}<span class="sr-only">{e.mark === 'x' ? 'Wrong: ' : 'Missing: '}</span>{/if}<span class="stream-kind">{e.kind}</span><span
              class="stream-detail">{e.detail}</span
            ><span class="stream-flags"
              >{#each e.flags as f (f.text)}<span class="stream-flag" data-tone={f.tone}>{f.text}</span>{/each}</span
            ></li
          >{/each}</ol
      ></div
    >{#if detail.verdict}{@render verdictBox(detail.verdict)}{/if}{/if}</section
>
