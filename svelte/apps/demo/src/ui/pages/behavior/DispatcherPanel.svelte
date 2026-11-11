<script lang="ts">
  import '@microcks/demo-styles/pages/behavior/dispatcher.css';
  import { parseJsonBodyRule, reachability, ruleNames, scriptSample, storedAs, type Behavior, type BehaviorDispatcher } from '@microcks/demo-core/domain/catalog';
  import type { Example } from '@microcks/demo-core/domain/shared';
  import { Callout, CodeBlock, Icon, Panel, Segmented } from '@microcks/deep-ink';
  import { DISPATCHER_CARDS, RULE_HINTS, SCRIPT_SCOPE, dispatcherPatch, reachSummary, toggleRuleParam } from './dispatcher';

  /** Dispatcher section: the dispatcher cards, then the rules box of the picked one, its reachability and how it is stored. */
  interface Props {
    draft: Behavior;
    /** Served examples of the operation (pending AI examples excluded). */
    examples: readonly Example[];
    /** Path parameters of the operation template, `['name']`. */
    pathParams: string[];
    /** Mono path prefix shown before the parameters, `/pastries/`. */
    pathPrefix: string;
    edit: (patch: Partial<Behavior>) => void;
  }

  let { draft, examples, pathParams, pathPrefix, edit }: Props = $props();

  const jsonCheck = $derived(draft.dispatcher === 'JSON_BODY' ? parseJsonBodyRule(draft.rule) : undefined);
  const jsonError = $derived(jsonCheck && 'error' in jsonCheck ? jsonCheck : undefined);
  const names = $derived(ruleNames(draft.rule));
  const reach = $derived(reachability(draft, examples));
  const base = $derived(draft.baseDispatcher ?? 'URI_PARTS');
  const reachLabel = $derived(reachSummary(draft, reach));
  const scriptLines = $derived((draft.script ?? '').split('\n').length);

  const pick = (id: BehaviorDispatcher) => edit(dispatcherPatch(id, draft, examples, pathParams));
</script>

{#snippet reference()}<a href="https://microcks.io/documentation/explanations/dispatching/" target="_blank" rel="noreferrer">Dispatching reference</a>{/snippet}

{#snippet firstTry()}<div class="rules-step"
    ><span class="section-label">1 · First try</span
    ><span class="rules-readonly">{base}<!---->{' '}<span class="rules-muted">· <!---->{draft.rule || '(none)'}</span></span
  ></div>{/snippet}

<Panel padding="lg" title="Dispatcher" id="sec-dispatcher" class="dispatcher" actions={reference}
  ><p class="panel-lead">Turns an incoming request into dispatch criteria, then into the example to return.</p
  ><fieldset class="ex-fieldset"
    ><legend class="sr-only">Dispatcher type</legend
    ><div class="ex-radio-cards"
      >{#each DISPATCHER_CARDS as c (c.id)}<label class="ex-radio-card" aria-disabled={c.disabled || undefined}
          ><input type="radio" name="dispatcher" value={c.id} checked={draft.dispatcher === c.id} disabled={c.disabled} onchange={() => pick(c.id)} /><span
            class="ex-radio-card-title ex-row"
            >{c.id}{#if draft.dispatcher === c.id}<Icon name="check" size={14} class="ex-radio-card-check" />{/if}</span
          ><span class="ex-small ex-secondary">{c.desc}</span
          >{#if c.tag}<span class="ex-radio-card-tag">{c.tag}</span>{/if}</label
        >{/each}</div
    ></fieldset
  ><p class="dispatcher-raw">Also available as raw rules: <span class="demo-mono">URI_ELEMENTS · QUERY_HEADER · QUERY_MATCH · PROXY · SEQUENCE</span></p
  ><div class="rules"
    ><div class="rules-head"
      ><h3 class="rules-title">Rules</h3
      ><span class="rules-hint">{RULE_HINTS[draft.dispatcher]}</span></div
    >{#if draft.dispatcher === 'URI_PARTS'}<div class="rules-block"
        ><span id="parts-label" class="section-label">Path parameters used as criteria</span
        ><div class="rules-path" role="group" aria-labelledby="parts-label"
          ><span class="rules-path-prefix">{pathPrefix}</span
          >{#each pathParams as p (p)}{@const on = names.includes(p)}<button
              type="button"
              class="rules-param"
              aria-pressed={on}
              aria-label={`Use path parameter ${p} as dispatch criteria`}
              onclick={() => edit({ rule: toggleRuleParam(names, p) })}
              >{#if on}<Icon name="check" size={12} />{/if}{`{${p}}`}</button
            >{/each}</div
        ><span class="rules-help"
          >Click a path parameter to include or exclude it. Several parameters are joined with <span class="demo-mono">&amp;&amp;</span>.</span
        ></div
      >{/if}{#if draft.dispatcher === 'URI_PARAMS'}<div class="rules-block"
        ><label for="params-rule" class="section-label">Query parameters used as criteria</label
        ><input id="params-rule" class="rules-input" type="text" spellcheck={false} value={draft.rule} oninput={(e) => edit({ rule: e.currentTarget.value })} /><Callout
          tone="warning"
          variant="outline"
          >The contract declares no query parameter on this operation. The <!---->{examples.length}<!----> imported examples carry no query criteria, so every call returns 404 until you add examples that do.</Callout
        ></div
      >{/if}{#if draft.dispatcher === 'JSON_BODY'}<div class="rules-block"
        ><label for="json-rule" class="section-label">Expression, operator and cases</label
        ><!-- `defaultValue` keeps a text child equal to the value, as in the reference demo. --><textarea
          id="json-rule"
          class="rules-textarea"
          rows={9}
          spellcheck={false}
          value={draft.rule}
          defaultValue={draft.rule}
          aria-invalid={jsonError ? true : undefined}
          aria-describedby={jsonError ? 'json-error' : undefined}
          oninput={(e) => edit({ rule: e.currentTarget.value })}
        ></textarea
        >{#if jsonError}<span id="json-error" class="rules-error"><Icon name="cross" size={13} />{jsonError.error}</span>{/if}<span class="rules-help"
          >Operators: <span class="demo-mono">equals · range · size · regexp · presence</span>. A <span class="demo-mono">default</span> case is required. GET requests carry no body here, so only the default case can apply.</span
        ></div
      >{/if}{#if draft.dispatcher === 'SCRIPT'}<div class="rules-block"
        ><div class="rules-script-bar"
          ><Segmented
            variant="joined"
            size="sm"
            label="Script language"
            value={draft.scriptLanguage ?? 'GROOVY'}
            onchange={(id) => edit({ scriptLanguage: id as 'GROOVY' | 'JS', script: scriptSample(id as 'GROOVY' | 'JS', draft.stateful) })}
            options={[{ id: 'GROOVY', label: 'Groovy' }, { id: 'JS', label: 'JavaScript' }]}
          /><span class="rules-scope">In scope {#each SCRIPT_SCOPE as s (s)}<code>{s}</code>{/each}</span></div
        ><div class="rules-editor"
          ><CodeBlock
            frame="none"
            variant="bare"
            focusable="never"
            class="rules-gutter"
            aria-hidden="true"
            code={Array.from({ length: scriptLines }, (_, i) => i + 1).join('\n')}
          /><label for="script-editor" class="sr-only">Dispatcher script</label
          ><textarea
            id="script-editor"
            class="rules-code"
            rows={scriptLines + 1}
            spellcheck={false}
            wrap="off"
            value={draft.script ?? ''}
            defaultValue={draft.script ?? ''}
            oninput={(e) => edit({ script: e.currentTarget.value })}
          ></textarea></div
        ><span class="rules-help"
          >The script returns the name of the example to serve. Use <span class="demo-mono">log.info()</span> to trace it in the mock logs.</span
        ></div
      >{/if}{#if draft.dispatcher === 'FALLBACK'}<div class="rules-block"
        ><div class="rules-chain"
          >{@render firstTry()}<span aria-hidden="true" class="rules-arrow">→</span
          ><div class="rules-step"
            ><label for="fallback-ex" class="section-label">2 · If nothing matches, serve</label
            ><select id="fallback-ex" class="rules-select" value={draft.fallback ?? ''} onchange={(e) => edit({ fallback: e.currentTarget.value })}
              >{#each examples as e (e.id)}<option value={e.name}>{e.name}</option>{/each}</select
            ></div
          ></div
        ><span class="rules-help">Without a fallback, an unknown pastry name returns 404.</span></div
      >{/if}{#if draft.dispatcher === 'PROXY_FALLBACK'}<div class="rules-block"
        ><div class="rules-chain"
          >{@render firstTry()}<span aria-hidden="true" class="rules-arrow">→</span
          ><div class="rules-step rules-step-wide"
            ><label for="proxy-url" class="section-label">2 · Else forward to (proxyUrl)</label
            ><input
              id="proxy-url"
              class="rules-input rules-url"
              type="url"
              spellcheck={false}
              value={draft.proxyUrl ?? ''}
              oninput={(e) => edit({ proxyUrl: e.currentTarget.value })}
            /></div
          ></div
        ><span class="rules-help">Microcks keeps the path and query, swaps the base URL, and returns the real backend's response.</span></div
      >{/if}{#if reach.length}<div class="reach"
        ><div class="section-label reach-head"
          ><h4 class="reach-title">Examples and their dispatch criteria</h4
          ><span class="reach-count">{reachLabel}</span></div
        ><ul class="reach-list"
          >{#each reach as r (r.name)}<li class="reach-row" data-ok={r.reachable || undefined}
              ><span class="reach-name">{r.name}</span
              ><span class="reach-criteria">{r.criteria}</span
              ><span class="reach-state"><Icon name={r.reachable ? 'check' : 'warning'} size={13} />{r.reachable ? 'reachable' : 'unreachable'}</span></li
            >{/each}</ul
        ></div
      >{/if}<div class="rules-stored"
      ><span class="section-label" aria-hidden="true">Stored as</span
      ><CodeBlock variant="plain" caption="Stored as" code={storedAs(draft)} /></div
    ></div
  ></Panel
>
