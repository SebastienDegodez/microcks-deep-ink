import '@microcks/demo-styles/pages/behavior/dispatcher.css';
import { useMemo } from 'react';
import { parseJsonBodyRule, reachability, ruleNames, scriptSample, storedAs, type Behavior, type BehaviorDispatcher } from '@/domain/catalog';
import type { Example } from '@/domain/shared';
import { Callout, CodeBlock, Icon, Panel, Segmented } from '@microcks/deep-ink';

const CARDS: { id: BehaviorDispatcher; desc: string; tag?: string; disabled?: boolean }[] = [
  { id: 'URI_PARTS', desc: 'Matches path segments, here {name}.', tag: 'inferred from contract' },
  { id: 'URI_PARAMS', desc: 'Matches query parameter values.' },
  { id: 'QUERY_ARGS', desc: 'Matches GraphQL or gRPC arguments.', tag: 'GraphQL & gRPC only', disabled: true },
  { id: 'JSON_BODY', desc: 'Evaluates a JSON Pointer in the request body.' },
  { id: 'SCRIPT', desc: 'Groovy or JavaScript returns the example name.' },
  { id: 'FALLBACK', desc: 'A dispatcher, plus a default example when nothing matches.' },
  { id: 'PROXY_FALLBACK', desc: 'A dispatcher, else forwards to the real backend.' },
];

const HINTS: Partial<Record<BehaviorDispatcher, string>> = {
  URI_PARTS: 'Criteria built from path parameters. Example names map to /name=<value>.',
  URI_PARAMS: 'Criteria built from query parameters, joined with &&.',
  QUERY_ARGS: 'Not applicable to a REST operation.',
  JSON_BODY: 'A JSON Pointer is evaluated on the body; cases map values to example names.',
  SCRIPT: 'Code evaluated on each request; it returns the example name to serve.',
  FALLBACK: 'Apply a dispatcher first, then serve a default example when nothing matches.',
  PROXY_FALLBACK: 'Apply a dispatcher first, then forward unmatched calls to the real backend.',
};

/** Default query rule offered when URI_PARAMS is picked. */
const QUERY_RULE_SAMPLE = 'size';
const JSON_RULE_SAMPLE = JSON.stringify({ exp: '/name', operator: 'equals', cases: { 'Eclair Cafe': 'Eclair Cafe', default: 'Millefeuille' } }, null, 2);
const PROXY_URL_SAMPLE = 'https://pastry.staging.acme.io/v2';
const SCOPE = ['mockRequest', 'requestContext', 'store', 'log'];

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
  const reachable = reach.filter((r) => r.reachable).length;
  const base = draft.baseDispatcher ?? 'URI_PARTS';
  let reachLabel = `${reachable} of ${reach.length} examples reachable`;
  if (draft.dispatcher === 'FALLBACK' && draft.fallback) reachLabel += ` · unknown names → ${draft.fallback}`;
  if (draft.dispatcher === 'PROXY_FALLBACK') reachLabel += ' · unknown names → proxyUrl';

  const pick = (id: BehaviorDispatcher) => {
    const patch: Partial<Behavior> = { dispatcher: id };
    const pathRule = names.length > 0 && names.every((n) => pathParams.includes(n));
    if (id === 'JSON_BODY' && 'error' in parseJsonBodyRule(draft.rule)) patch.rule = JSON_RULE_SAMPLE;
    if (id === 'URI_PARAMS') patch.rule = QUERY_RULE_SAMPLE;
    if ((id === 'URI_PARTS' || id === 'FALLBACK' || id === 'PROXY_FALLBACK') && !pathRule) patch.rule = pathParams[0] ?? '';
    if (id === 'SCRIPT' && !draft.script) {
      patch.scriptLanguage = draft.scriptLanguage ?? 'GROOVY';
      patch.script = scriptSample(patch.scriptLanguage, draft.stateful);
    }
    if (id !== 'SCRIPT' && draft.stateful) patch.stateful = false;
    if (id === 'FALLBACK' && !draft.fallback) patch.fallback = examples[0]?.name;
    if (id === 'PROXY_FALLBACK' && !draft.proxyUrl) patch.proxyUrl = PROXY_URL_SAMPLE;
    edit(patch);
  };

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
          {CARDS.map((c) => (
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
          <span className="rules-hint">{HINTS[draft.dispatcher]}</span>
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
                    onClick={() => edit({ rule: (on ? names.filter((n) => n !== p) : [...names, p]).join(' && ') })}
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
              <span className="rules-scope">In scope {SCOPE.map((s) => <code key={s}>{s}</code>)}</span>
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
