<script lang="ts">
  import { untrack } from 'svelte';
  import { setupSummary, validateSetup, type AgentTestDefaults, type AgentTestSetup } from '@microcks/demo-core/domain/agents';
  import { Button, Checkbox, Field, Input, Radio, Select } from '@microcks/deep-ink';
  import { TEXT_MODES, isCardUrl, isTimeoutOk, toggle } from './run';

  /** The test form: the Agent Card URL, the transports and conversations to replay, the secret, the timeout and the text matching. */
  let { defaults, initial, onrun }: { defaults: AgentTestDefaults; initial: AgentTestSetup; onrun: (setup: AgentTestSetup) => void } = $props();
  let setup = $state.raw<AgentTestSetup>(untrack(() => initial));
  let timeout = $state(untrack(() => String(initial.timeoutMs)));
  const merged: AgentTestSetup = $derived({ ...setup, timeoutMs: Number.parseInt(timeout, 10) });
  const problem = $derived(validateSetup(merged));
  const urlOk = $derived(isCardUrl(setup.cardUrl));
  const timeoutOk = $derived(isTimeoutOk(timeout, merged.timeoutMs));
  const secret = $derived(defaults.secrets.find((s) => s.name === setup.secret));
</script>

{#snippet timeoutLabel()}Timeout per message <span class="muted setup-unit">(ms)</span>{/snippet}
{#snippet schemaLabel()}Validate <span class="demo-mono">data</span> parts with JSON Schema{/snippet}
{#snippet schemaDescription()}Structured answers such as <span class="demo-mono">{'{name, price, reason}'}</span> are checked for shape, not for exact values.{/snippet}

<section aria-labelledby="setup-title" class="setup-card"
  ><div class="setup-card-head"
    ><h2 id="setup-title">Test a real agent against its card</h2><p
      >Microcks reads the Agent Card, checks it, then replays each conversation of the <span class="demo-mono">APIExamples</span> artifact on every selected
      transport. The transport result and the task state are judged separately: a <span class="demo-mono">200 OK</span> carrying a <span class="demo-mono"
        >failed</span
      > task is still a failure.</p
    ></div
  ><form
    class="setup-grid"
    novalidate
    onsubmit={(e) => {
      e.preventDefault();
      if (!problem) onrun(merged);
    }}
    ><div class="setup-col" data-col="main"
      ><Field
        label="Agent Card URL"
        error={urlOk ? undefined : 'Enter an http(s) URL, usually ending in /.well-known/agent-card.json.'}
        help={urlOk ? 'Microcks reads the card, then calls each interface listed in supportedInterfaces.' : undefined}
        class="setup-url"
        >{#snippet children(c)}<Input
            {...c}
            class="setup-url-input"
            required
            type="url"
            spellcheck={false}
            autocomplete="off"
            mono
            value={setup.cardUrl}
            oninput={(e) => (setup = { ...setup, cardUrl: e.currentTarget.value })}
          />{/snippet}</Field
      ><fieldset class="setup-fieldset"
        ><legend>Transports to test <span class="setup-legend-hint">· read from <span class="demo-mono">supportedInterfaces</span></span></legend
        ><div class="transport-choices"
          >{#each defaults.transports as t (t.id)}{#snippet label()}<span class="transport-choice-name"
                >{t.label}{#if t.preferred}<span class="preferred-chip">preferred</span>{/if}</span
              >{/snippet}{#snippet description()}<span>{t.sub}</span><span class="transport-choice-url">{t.url}</span>{/snippet}<Checkbox
              variant="card"
              class="transport-choice-input"
              {label}
              {description}
              checked={setup.transports.includes(t.id)}
              onchange={() => (setup = { ...setup, transports: toggle(setup.transports, t.id) })}
            />{/each}</div
        ></fieldset
      ><fieldset class="setup-fieldset"
        ><legend
          >Conversations to replay<!---->{' '}<span class="setup-legend-hint"
            >· <!---->{setup.conversations.length}<!----> of <!---->{defaults.conversations.length}<!----> selected · from <span class="demo-mono"
              >pastry-concierge-1.0-examples.yaml</span
            ></span
          ></legend
        ><div class="conversation-list"
          >{#each defaults.conversations as c (c.id)}<label class="conversation-option"
              ><input
                type="checkbox"
                class="checkbox"
                checked={setup.conversations.includes(c.id)}
                onchange={() => (setup = { ...setup, conversations: toggle(setup.conversations, c.id) })}
              /><span class="conversation-option-id">{c.id}</span><span class="conversation-option-skill"
                ><span class="muted">skill</span><span class="demo-mono" data-none={c.skillId === '(none)' ? '' : undefined}>{c.skillId}</span></span
              ><span class="conversation-option-turns">{c.turns}</span><span class="conversation-option-expect"
                ><span class="muted">expects</span><span class="demo-mono">{c.expect}</span></span
              ></label
            >{/each}</div
        ></fieldset
      ></div
    ><div class="setup-col" data-col="side"
      ><Field label="Secret" help={secret?.help} class={secret?.matches ? 'setup-secret' : 'setup-secret setup-secret-warn'}
        >{#snippet children(c)}<Select
            {...c}
            class="setup-secret-select"
            value={setup.secret}
            onchange={(e) => (setup = { ...setup, secret: e.currentTarget.value })}
            >{#each defaults.secrets as s (s.name)}<option value={s.name}>{s.name || 'No secret'}</option>{/each}</Select
          >{/snippet}</Field
      ><Field
        label={timeoutLabel}
        error={timeoutOk ? undefined : 'Enter a number of milliseconds greater than 0.'}
        help={timeoutOk ? 'Per agent message, not per conversation. LLM agents can take several seconds to answer.' : undefined}
        class="setup-timeout"
        >{#snippet children(c)}<Input
            {...c}
            class="setup-timeout-input"
            required
            mono
            inputmode="numeric"
            value={timeout}
            oninput={(e) => (timeout = e.currentTarget.value)}
          />{/snippet}</Field
      ><fieldset class="setup-compare"
        ><legend>Compare agent text loosely</legend><p
          >LLM agents rephrase their answers from one call to the next, so Microcks never checks agent text for strict equality. Choose how the
          expected text of each conversation is matched.</p
        ><div class="setup-modes"
          >{#each TEXT_MODES as m (m.value)}{#snippet description()}<span class="demo-mono">{m.example}</span>{/snippet}<Radio
              variant="card"
              name="text-mode"
              value={m.value}
              label={m.label}
              {description}
              checked={setup.textMode === m.value}
              onchange={() => (setup = { ...setup, textMode: m.value })}
            />{/each}</div
        ><Checkbox
          variant="card"
          label={schemaLabel}
          description={schemaDescription}
          checked={setup.dataSchema}
          onchange={(e) => (setup = { ...setup, dataSchema: e.currentTarget.checked })}
        /></fieldset
      ><div class="setup-run"
        ><Button type="submit" variant="primary" icon="play" disabled={Boolean(problem)} aria-describedby="setup-run-help">Run test</Button><span
          id="setup-run-help"
          class="setup-run-help"
          data-problem={problem ? '' : undefined}>{problem ?? setupSummary(merged)}</span
        ></div
      ></div
    ></form
  ></section
>
