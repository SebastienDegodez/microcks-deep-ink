<script lang="ts">
  import '@microcks/demo-styles/pages/agent/agent-card.css';
  import { CARD_SECTIONS, cardLines, diffCards, missingCardFields, sectionRanges, serveCardFromMock, type AgentProfile } from '@microcks/demo-core/domain/agents';
  import { CopyButton, Icon, Input, SectionLabel, Segmented, SplitPane, SplitPaneMain, SplitPaneSide } from '@microcks/deep-ink';
  import { tokenize } from './card';

  /** The Agent Card as published and as the mock serves it, with an outline of its sections. */
  let { agent }: { agent: AgentProfile } = $props();
  let variant = $state<'published' | 'mock'>('published');
  let section = $state('supportedInterfaces');
  const published = $derived(cardLines(agent.card));
  const mock = $derived(cardLines(serveCardFromMock(agent)));
  const isMock = $derived(variant === 'mock');
  const diff = $derived(isMock ? diffCards(published, mock) : published.map((text, i) => ({ number: i + 1, mark: ' ' as const, text })));
  const changed = $derived(diffCards(published, mock).filter((l) => l.mark === '+').length);
  const ranges = $derived(sectionRanges(published));
  const range = $derived(section ? ranges[section] : undefined);
  const url = $derived(isMock ? agent.mockCardUrl : agent.publishedCardUrl);
  const missing = $derived(missingCardFields(agent.card));
</script>

<SplitPane sideWidth="240px" sideMax="320px" keepSideMax
  ><SplitPaneSide as="aside" class="agent-outline" aria-label="Card outline"
    ><SectionLabel as="h2" size="sm" weight="regular" class="agent-outline-title">Outline</SectionLabel><ul
      class="agent-outline-list"
      aria-label="Sections of the Agent Card"
      >{#each CARD_SECTIONS as s (s.key)}{@const r = ranges[s.key]}{@const on = section === s.key}<li
          ><button type="button" class="agent-outline-item" aria-pressed={on} onclick={() => (section = on ? '' : s.key)}
            ><span class="agent-outline-row"
              ><span class="agent-outline-key">{s.key}</span><span class="agent-outline-range">{#if r}{`L${r[0]}–${r[1]}`}{/if}</span></span
            ><span class="agent-outline-summary">{s.summary}</span></button
          ></li
        >{/each}</ul
    ><div class="agent-card-checks"
      >{#if missing.length}<span class="agent-card-check" data-tone="danger"><Icon name="x-circle" size={13} />Required fields missing</span
        >{:else}<span class="agent-card-check" data-tone="success"><Icon name="check-circle" size={13} />Required fields present</span
        >{/if}<span
        >{missing.length
          ? missing.join(', ')
          : 'name, description, version, supportedInterfaces, capabilities, defaultInputModes, defaultOutputModes, skills'}</span
      ><span class="agent-card-check" data-tone="warning"><Icon name="warning" size={13} />No signatures</span><span
        >Optional JWS. The card cannot be verified, reported as a warning by the last test.</span
      ></div
    ></SplitPaneSide
  ><SplitPaneMain as="section" class="agent-card-json" aria-label="Agent Card JSON"
    ><div class="agent-card-bar"
      ><Segmented
        label="Card version"
        value={variant}
        onchange={(v) => (variant = v as 'published' | 'mock')}
        options={[{ id: 'published', label: 'As published' }, { id: 'mock', label: 'Served by the mock' }]}
      /><span class="agent-card-note"
        >{isMock
          ? `+${changed} −${changed} lines · supportedInterfaces rewritten to the mock`
          : `${published.length} lines · fetched Nov 3, 2026 at 08:41 · unsigned`}</span
      ></div
    ><div class="agent-card-url"
      ><label for="agent-card-url" class="sr-only">Agent Card URL</label><Input
        id="agent-card-url"
        mono
        readonly
        value={url}
        class="agent-card-url-input"
      /><CopyButton value={url} label="Copy URL" size="md" class="agent-copy-plain" /><CopyButton
        value={(isMock ? mock : published).join('\n')}
        label="Copy JSON"
        size="md"
        class="agent-copy-plain"
      /></div
    >{#if isMock}<p class="agent-card-mock-note"
        >Microcks serves this copy of the card. Only <span class="demo-mono">supportedInterfaces</span> changes: every transport points at the
        mock, in the same order, so JSON-RPC stays preferred.<!---->{' '}<span class="demo-mono">securitySchemes</span> is kept as declared; the
        mock accepts any bearer token.</p
      >{/if}<!--
      The scroll container must be keyboard reachable (WCAG 2.1.1), so it is focusable and named, as in CodeBlock.
    --><!-- svelte-ignore a11y_no_noninteractive_tabindex --><div
      class="agent-json"
      tabindex="0"
      role="region"
      aria-label="agent-card.json"
      ><ol class="agent-json-lines" aria-label={isMock ? 'Lines of the mock copy, changed lines marked' : 'Lines of the published card'}
        >{#each diff as l, i (i)}{@const n = l.number ?? 0}{@const inSection = !!range && l.mark !== '-' && n >= range[0] && n <= range[1]}<li
            class="agent-json-line"
            data-mark={l.mark === ' ' ? undefined : l.mark}
            data-selected={inSection ? '' : undefined}
            ><span class="agent-json-num" aria-hidden="true">{#if l.mark !== '-'}{l.number}{/if}</span><span
              class="agent-json-mark"
              aria-hidden="true">{#if l.mark === '-'}{'−'}{:else if l.mark === '+'}{'+'}{/if}</span
            >{#if l.mark !== ' '}<span class="sr-only">{l.mark === '-' ? 'removed: ' : 'added: '}</span>{/if}<span class="agent-json-text"
              >{#each tokenize(l.text) as t, j (j)}<span data-tok={t.k}>{t.v}</span>{/each}</span
            ></li
          >{/each}</ol
      ></div
    ></SplitPaneMain
  ></SplitPane
>
