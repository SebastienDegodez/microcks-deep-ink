import { useState } from 'react';
import { CARD_SECTIONS, cardLines, diffCards, missingCardFields, sectionRanges, serveCardFromMock, type AgentProfile } from '@/domain/agents';
import { Button } from '@/ui/components/ui/button';
import { Callout } from '@/ui/components/ui/callout';
import { CodeBlock } from '@/ui/components/ui/code-block';
import { CopyButton } from '@/ui/components/ui/copy-button';
import { Segmented } from '@/ui/components/ui/segmented';

/** The Agent Card as published and as the mock serves it, with an outline of its sections. */
export function AgentCardTab({ agent }: { agent: AgentProfile }) {
  const [variant, setVariant] = useState<'published' | 'mock'>('published');
  const [section, setSection] = useState('');
  const published = cardLines(agent.card);
  const mockCard = serveCardFromMock(agent);
  const mock = cardLines(mockCard);
  const diff = diffCards(published, mock);
  const changed = diff.filter((l) => l.mark === '+').length;
  const ranges = sectionRanges(published);
  const range = section ? ranges[section] : undefined;
  const shown = variant === 'mock' ? mock : published;
  const url = variant === 'mock' ? agent.mockCardUrl : agent.publishedCardUrl;
  const missing = missingCardFields(agent.card);

  return (
    <div className="ag-layout">
      <div className="ex-stack">
        <h2 style={{ margin: 0 }}>Outline</h2>
        <ul className="ex-plain-list" aria-label="Sections of the Agent Card">
          {CARD_SECTIONS.map((s) => {
            const r = ranges[s.key];
            const on = section === s.key;
            return (
              <li key={s.key}>
                <Button variant={on ? 'secondary' : 'ghost'} aria-pressed={on} onClick={() => setSection(on ? '' : s.key)} style={{ width: '100%', justifyContent: 'flex-start', height: 'auto', padding: 8 }}>
                  <span className="ex-stack" style={{ gap: 2, textAlign: 'start' }}>
                    <span className="ex-row"><span className="ex-mono">{s.key}</span><span className="ex-small ex-muted">{r ? `L${r[0]}–${r[1]}` : ''}</span></span>
                    <span className="ex-small ex-secondary">{s.summary}</span>
                  </span>
                </Button>
              </li>
            );
          })}
        </ul>
        <Callout tone={missing.length ? 'danger' : 'success'} title="Required fields present">
          <p>name, description, version, supportedInterfaces, capabilities, defaultInputModes, defaultOutputModes, skills</p>
        </Callout>
        <Callout tone="warning" title="No signatures">
          <p>Optional JWS. The card cannot be verified, reported as a warning by the last test.</p>
        </Callout>
      </div>
      <div className="ex-stack">
        <div className="ex-row-between">
          <Segmented
            label="Card version"
            value={variant}
            onChange={(v) => setVariant(v as 'published' | 'mock')}
            options={[{ id: 'published', label: 'As published' }, { id: 'mock', label: 'Served by the mock' }]}
          />
          <span className="ex-small ex-secondary">
            {variant === 'mock' ? `+${changed} −${changed} lines · supportedInterfaces rewritten to the mock` : `${published.length} lines · fetched Nov 3, 2026 at 08:41 · unsigned`}
          </span>
        </div>
        <p className="ex-row ex-small" style={{ margin: 0 }}>
          <span className="ex-muted">Agent Card URL</span> <span className="ex-mono ex-url-line">{url}</span>
          <CopyButton value={url} label="Copy URL" />
        </p>
        {variant === 'mock' ? (
          <>
            <p className="ex-small ex-secondary" style={{ margin: 0 }}>
              Microcks serves this copy of the card. Only <span className="ex-mono">supportedInterfaces</span> changes: every transport points at the mock, in the same order, so JSON-RPC stays preferred.{' '}
              <span className="ex-mono">securitySchemes</span> is kept as declared; the mock accepts any bearer token.
            </p>
            <ul className="ag-diff" aria-label="Lines that change in the mock copy">
              {diff.filter((l) => l.mark !== ' ').map((l, i) => (
                <li key={i} data-mark={l.mark}><span aria-hidden="true">{l.mark} </span><span className="sr-only">{l.mark === '-' ? 'removed: ' : 'added: '}</span>{l.text}</li>
              ))}
            </ul>
          </>
        ) : null}
        <CodeBlock code={shown.join('\n')} language="json" caption={variant === 'mock' ? 'agent-card.json (mock)' : 'agent-card.json'} maxHeight={420} />
        {range ? (
          <CodeBlock
            code={shown.slice(range[0] - 1, range[1]).join('\n')}
            language="json"
            caption={`Section ${section} · lines ${range[0]}–${range[1]}`}
          />
        ) : null}
      </div>
    </div>
  );
}
