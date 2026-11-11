import '@microcks/demo-styles/pages/behavior/dispatcher.css';
import { useMemo } from 'react';
import { parseJsonBodyRule, reachability, ruleNames, scriptSample, storedAs, type Behavior, type BehaviorDispatcher } from '@/domain/catalog';
import type { Example } from '@/domain/shared';
import { Callout, CodeBlock, Icon, Panel, Segmented } from '@microcks/deep-ink';
import { DISPATCHER_CARDS, RULE_HINTS, SCRIPT_SCOPE, dispatcherPatch, reachSummary, toggleRuleParam } from './dispatcher';

export interface DispatcherPanelProps {
  draft: Behavior;
  /** Served examples of the operation (pending AI examples excluded). */
  examples: readonly Example[];
  /** Path parameters of the operation template, `['name']`. */
  pathParams: string[];
  /** Mono path prefix shown before the parameters, `/pastries/`. */
  pathPrefix: string;
  edit: (patch: Partial<Behavior>) => void;
}

/** Dispatcher section: the dispatcher cards, then the rules box of the picked one, its reachability and how it is stored. */
export function DispatcherPanel({ draft, examples, pathParams, pathPrefix, edit }: DispatcherPanelProps) {
  const jsonCheck = useMemo(() => (draft.dispatcher === 'JSON_BODY' ? parseJsonBodyRule(draft.rule) : undefined), [draft]);
  const names = ruleNames(draft.rule);
  const reach = reachability(draft, examples);
  const base = draft.baseDispatcher ?? 'URI_PARTS';
  const reachLabel = reachSummary(draft, reach);

  const pick = (id: BehaviorDispatcher) => edit(dispatcherPatch(id, draft, examples, pathParams));

  const scriptLines = (draft.script ?? '').split('\n').length;
  const firstTry = (
    <div className="rules-step">
      <span className="section-label">1 · First try</span>
      <span className="rules-readonly">{base} <span className="rules-muted">· {draft.rule || '(none)'}</span></span>
    </div>
  );

  return (
    <Panel
      padding="lg"
      title="Dispatcher"
      id="sec-dispatcher"
      className="dispatcher"
      actions={<a href="https://microcks.io/documentation/explanations/dispatching/" target="_blank" rel="noreferrer">Dispatching reference</a>}
    >
      <p className="panel-lead">Turns an incoming request into dispatch criteria, then into the example to return.</p>
      <fieldset className="ex-fieldset">
        <legend className="sr-only">Dispatcher type</legend>
        <div className="ex-radio-cards">
          {DISPATCHER_CARDS.map((c) => (
            <label key={c.id} className="ex-radio-card" aria-disabled={c.disabled || undefined}>
              <input type="radio" name="dispatcher" value={c.id} checked={draft.dispatcher === c.id} disabled={c.disabled} onChange={() => pick(c.id)} />
              <span className="ex-radio-card-title ex-row">{c.id}{draft.dispatcher === c.id ? <Icon name="check" size={14} className="ex-radio-card-check" /> : null}</span>
              <span className="ex-small ex-secondary">{c.desc}</span>
              {c.tag ? <span className="ex-radio-card-tag">{c.tag}</span> : null}
            </label>
          ))}
        </div>
      </fieldset>
      <p className="dispatcher-raw">Also available as raw rules: <span className="demo-mono">URI_ELEMENTS · QUERY_HEADER · QUERY_MATCH · PROXY · SEQUENCE</span></p>

      <div className="rules">
        <div className="rules-head">
          <h3 className="rules-title">Rules</h3>
          <span className="rules-hint">{RULE_HINTS[draft.dispatcher]}</span>
        </div>

        {draft.dispatcher === 'URI_PARTS' ? (
          <div className="rules-block">
            <span id="parts-label" className="section-label">Path parameters used as criteria</span>
            <div className="rules-path" role="group" aria-labelledby="parts-label">
              <span className="rules-path-prefix">{pathPrefix}</span>
              {pathParams.map((p) => {
                const on = names.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    className="rules-param"
                    aria-pressed={on}
                    aria-label={`Use path parameter ${p} as dispatch criteria`}
                    onClick={() => edit({ rule: toggleRuleParam(names, p) })}
                  >
                    {on ? <Icon name="check" size={12} /> : null}
                    {`{${p}}`}
                  </button>
                );
              })}
            </div>
            <span className="rules-help">Click a path parameter to include or exclude it. Several parameters are joined with <span className="demo-mono">&amp;&amp;</span>.</span>
          </div>
        ) : null}

        {draft.dispatcher === 'URI_PARAMS' ? (
          <div className="rules-block">
            <label htmlFor="params-rule" className="section-label">Query parameters used as criteria</label>
            <input id="params-rule" className="rules-input" type="text" spellCheck={false} value={draft.rule} onChange={(e) => edit({ rule: e.target.value })} />
            <Callout tone="warning" variant="outline">
              The contract declares no query parameter on this operation. The {examples.length} imported examples carry no query criteria, so every call returns 404 until you add examples that do.
            </Callout>
          </div>
        ) : null}

        {draft.dispatcher === 'JSON_BODY' ? (
          <div className="rules-block">
            <label htmlFor="json-rule" className="section-label">Expression, operator and cases</label>
            <textarea
              id="json-rule"
              className="rules-textarea"
              rows={9}
              spellCheck={false}
              value={draft.rule}
              aria-invalid={jsonCheck && 'error' in jsonCheck ? true : undefined}
              aria-describedby={jsonCheck && 'error' in jsonCheck ? 'json-error' : undefined}
              onChange={(e) => edit({ rule: e.target.value })}
            />
            {jsonCheck && 'error' in jsonCheck ? <span id="json-error" className="rules-error"><Icon name="cross" size={13} />{jsonCheck.error}</span> : null}
            <span className="rules-help">Operators: <span className="demo-mono">equals · range · size · regexp · presence</span>. A <span className="demo-mono">default</span> case is required. GET requests carry no body here, so only the default case can apply.</span>
          </div>
        ) : null}

        {draft.dispatcher === 'SCRIPT' ? (
          <div className="rules-block">
            <div className="rules-script-bar">
              <Segmented
                variant="joined" size="sm"
                label="Script language"
                value={draft.scriptLanguage ?? 'GROOVY'}
                onChange={(id) => edit({ scriptLanguage: id as 'GROOVY' | 'JS', script: scriptSample(id as 'GROOVY' | 'JS', draft.stateful) })}
                options={[{ id: 'GROOVY', label: 'Groovy' }, { id: 'JS', label: 'JavaScript' }]}
              />
              <span className="rules-scope">In scope {SCRIPT_SCOPE.map((s) => <code key={s}>{s}</code>)}</span>
            </div>
            <div className="rules-editor">
              <CodeBlock frame="none" variant="bare" focusable="never" className="rules-gutter" aria-hidden="true" code={Array.from({ length: scriptLines }, (_, i) => i + 1).join('\n')} />
              <label htmlFor="script-editor" className="sr-only">Dispatcher script</label>
              <textarea
                id="script-editor"
                className="rules-code"
                rows={scriptLines + 1}
                spellCheck={false}
                wrap="off"
                value={draft.script ?? ''}
                onChange={(e) => edit({ script: e.target.value })}
              />
            </div>
            <span className="rules-help">The script returns the name of the example to serve. Use <span className="demo-mono">log.info()</span> to trace it in the mock logs.</span>
          </div>
        ) : null}

        {draft.dispatcher === 'FALLBACK' ? (
          <div className="rules-block">
            <div className="rules-chain">
              {firstTry}
              <span aria-hidden="true" className="rules-arrow">→</span>
              <div className="rules-step">
                <label htmlFor="fallback-ex" className="section-label">2 · If nothing matches, serve</label>
                <select id="fallback-ex" className="rules-select" value={draft.fallback ?? ''} onChange={(e) => edit({ fallback: e.target.value })}>
                  {examples.map((e) => <option key={e.id} value={e.name}>{e.name}</option>)}
                </select>
              </div>
            </div>
            <span className="rules-help">Without a fallback, an unknown pastry name returns 404.</span>
          </div>
        ) : null}

        {draft.dispatcher === 'PROXY_FALLBACK' ? (
          <div className="rules-block">
            <div className="rules-chain">
              {firstTry}
              <span aria-hidden="true" className="rules-arrow">→</span>
              <div className="rules-step rules-step-wide">
                <label htmlFor="proxy-url" className="section-label">2 · Else forward to (proxyUrl)</label>
                <input id="proxy-url" className="rules-input rules-url" type="url" spellCheck={false} value={draft.proxyUrl ?? ''} onChange={(e) => edit({ proxyUrl: e.target.value })} />
              </div>
            </div>
            <span className="rules-help">Microcks keeps the path and query, swaps the base URL, and returns the real backend's response.</span>
          </div>
        ) : null}

        {reach.length ? (
          <div className="reach">
            <div className="section-label reach-head">
              <h4 className="reach-title">Examples and their dispatch criteria</h4>
              <span className="reach-count">{reachLabel}</span>
            </div>
            <ul className="reach-list">
              {reach.map((r) => (
                <li key={r.name} className="reach-row" data-ok={r.reachable || undefined}>
                  <span className="reach-name">{r.name}</span>
                  <span className="reach-criteria">{r.criteria}</span>
                  <span className="reach-state"><Icon name={r.reachable ? 'check' : 'warning'} size={13} />{r.reachable ? 'reachable' : 'unreachable'}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="rules-stored">
          <span className="section-label" aria-hidden="true">Stored as</span>
          <CodeBlock variant="plain" caption="Stored as" code={storedAs(draft)} />
        </div>
      </div>
    </Panel>
  );
}
