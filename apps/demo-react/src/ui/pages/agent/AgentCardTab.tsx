import './agent-card.css';
import { useState } from 'react';
import { CARD_SECTIONS, cardLines, diffCards, missingCardFields, sectionRanges, serveCardFromMock, type AgentProfile } from '@/domain/agents';
import { CopyButton } from '@/ui/components/ui/copy-button';
import { Icon } from '@/ui/components/ui/icon';
import { Input } from '@/ui/components/ui/input';
import { SectionLabel } from '@/ui/components/ui/section-label';
import { Segmented } from '@/ui/components/ui/segmented';

type Tok = { v: string; k: 'key' | 'colon' | 'str' | 'num' | 'lit' | 'punct' | 'plain' };

/** JSON tokens of one pretty-printed line, coloured like the prototype viewer. */
function tokenize(line: string): Tok[] {
  const out: Tok[] = [];
  const re = /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\d+(?:\.\d+)?)|\b(true|false|null)\b|([{}[\],])|(\s+)/g;
  let last = 0;
  for (let m = re.exec(line); m !== null; m = re.exec(line)) {
    if (m.index > last) out.push({ v: line.slice(last, m.index), k: 'plain' });
    if (m[1] && m[2]) out.push({ v: m[1], k: 'key' }, { v: m[2], k: 'colon' });
    else if (m[1]) out.push({ v: m[1], k: 'str' });
    else if (m[3]) out.push({ v: m[3], k: 'num' });
    else if (m[4]) out.push({ v: m[4], k: 'lit' });
    else if (m[5]) out.push({ v: m[5], k: 'punct' });
    else out.push({ v: m[6] ?? '', k: 'plain' });
    last = re.lastIndex;
  }
  if (last < line.length) out.push({ v: line.slice(last), k: 'plain' });
  return out;
}

/** The Agent Card as published and as the mock serves it, with an outline of its sections. */
export function AgentCardTab({ agent }: { agent: AgentProfile }) {
  const [variant, setVariant] = useState<'published' | 'mock'>('published');
  const [section, setSection] = useState('supportedInterfaces');
  const published = cardLines(agent.card);
  const mock = cardLines(serveCardFromMock(agent));
  const isMock = variant === 'mock';
  const diff = isMock ? diffCards(published, mock) : published.map((text, i) => ({ number: i + 1, mark: ' ' as const, text }));
  const changed = diffCards(published, mock).filter((l) => l.mark === '+').length;
  const ranges = sectionRanges(published);
  const range = section ? ranges[section] : undefined;
  const url = isMock ? agent.mockCardUrl : agent.publishedCardUrl;
  const missing = missingCardFields(agent.card);

  return (
    <div className="agent-card-split">
      <aside className="agent-outline" aria-label="Card outline">
        <SectionLabel as="h2" size="sm" weight="regular" className="agent-outline-title">Outline</SectionLabel>
        <ul className="agent-outline-list" aria-label="Sections of the Agent Card">
          {CARD_SECTIONS.map((s) => {
            const r = ranges[s.key];
            const on = section === s.key;
            return (
              <li key={s.key}>
                <button type="button" className="agent-outline-item" aria-pressed={on} onClick={() => setSection(on ? '' : s.key)}>
                  <span className="agent-outline-row">
                    <span className="agent-outline-key">{s.key}</span>
                    <span className="agent-outline-range">{r ? `L${r[0]}–${r[1]}` : ''}</span>
                  </span>
                  <span className="agent-outline-summary">{s.summary}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="agent-card-checks">
          {missing.length ? (
            <span className="agent-card-check" data-tone="danger"><Icon name="x-circle" size={13} />Required fields missing</span>
          ) : (
            <span className="agent-card-check" data-tone="success"><Icon name="check-circle" size={13} />Required fields present</span>
          )}
          <span>{missing.length ? missing.join(', ') : 'name, description, version, supportedInterfaces, capabilities, defaultInputModes, defaultOutputModes, skills'}</span>
          <span className="agent-card-check" data-tone="warning"><Icon name="warning" size={13} />No signatures</span>
          <span>Optional JWS. The card cannot be verified, reported as a warning by the last test.</span>
        </div>
      </aside>
      <section className="agent-card-json" aria-label="Agent Card JSON">
        <div className="agent-card-bar">
          <Segmented
            label="Card version"
            value={variant}
            onChange={(v) => setVariant(v as 'published' | 'mock')}
            options={[{ id: 'published', label: 'As published' }, { id: 'mock', label: 'Served by the mock' }]}
          />
          <span className="agent-card-note">
            {isMock ? `+${changed} −${changed} lines · supportedInterfaces rewritten to the mock` : `${published.length} lines · fetched Nov 3, 2026 at 08:41 · unsigned`}
          </span>
        </div>
        <div className="agent-card-url">
          <label htmlFor="agent-card-url" className="sr-only">Agent Card URL</label>
          <Input id="agent-card-url" mono readOnly value={url} className="agent-card-url-input" />
          <CopyButton value={url} label="Copy URL" size="md" />
          <CopyButton value={(isMock ? mock : published).join('\n')} label="Copy JSON" size="md" />
        </div>
        {isMock ? (
          <p className="agent-card-mock-note">
            Microcks serves this copy of the card. Only <span className="ex-mono">supportedInterfaces</span> changes: every transport points at the mock, in the same order, so JSON-RPC stays preferred.{' '}
            <span className="ex-mono">securitySchemes</span> is kept as declared; the mock accepts any bearer token.
          </p>
        ) : null}
        {/* The scroll container must be keyboard reachable (WCAG 2.1.1), so it is focusable and named, as in CodeBlock. */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
        <div className="agent-json" tabIndex={0} role="region" aria-label="agent-card.json">
          <ol className="agent-json-lines" aria-label={isMock ? 'Lines of the mock copy, changed lines marked' : 'Lines of the published card'}>
            {diff.map((l, i) => {
              const n = l.number ?? 0;
              const inSection = !!range && l.mark !== '-' && n >= range[0] && n <= range[1];
              return (
                <li key={i} className="agent-json-line" data-mark={l.mark === ' ' ? undefined : l.mark} data-selected={inSection ? '' : undefined}>
                  <span className="agent-json-num" aria-hidden="true">{l.mark === '-' ? '' : l.number}</span>
                  <span className="agent-json-mark" aria-hidden="true">{l.mark === '-' ? '−' : l.mark === '+' ? '+' : ''}</span>
                  {l.mark !== ' ' ? <span className="sr-only">{l.mark === '-' ? 'removed: ' : 'added: '}</span> : null}
                  <span className="agent-json-text">
                    {tokenize(l.text).map((t, j) => <span key={j} data-tok={t.k}>{t.v}</span>)}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </section>
    </div>
  );
}
