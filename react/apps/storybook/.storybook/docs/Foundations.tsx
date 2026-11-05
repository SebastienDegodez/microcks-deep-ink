import React, { useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { DocsContext, Unstyled } from '@storybook/addon-docs/blocks';
import { GLOBALS_UPDATED, SET_GLOBALS } from 'storybook/internal/core-events';
import {
  ApiBadge,
  Button,
  CommandBar,
  CopyButton,
  Kbd,
  Link,
  MockUrl,
  OperationList,
  OperationRow,
  StatCard,
  StatusBadge,
  THEME_EVENT,
  getTheme,
  setTheme,
  type Outcome,
  type Protocol,
} from '@microcks/deep-ink';
import { COLOR_GROUPS, COMMANDS, MOCK_BASE, OPERATIONS } from '@microcks-deep-ink/storybook-shared/fixtures';

// The live showcase of the Introduction page (the "Main" board of the prototype): real tokens, real components.

type ThemeName = 'dark' | 'light';
type Globals = Record<string, unknown> | undefined;

/** Docs pages run no decorator: follow the Theme toolbar global here, like the story decorator does. */
function useDocsTheme(): void {
  const ctx = useContext(DocsContext) as unknown as {
    channel?: { on: (e: string, fn: (p: { globals?: Globals }) => void) => void; off: (e: string, fn: (p: { globals?: Globals }) => void) => void };
    store?: { userGlobals?: { get?: () => Globals } };
  };
  useEffect(() => {
    const apply = (g: Globals) => {
      const t = g?.theme;
      if (t === 'dark' || t === 'light') setTheme(t, false);
    };
    apply(ctx.store?.userGlobals?.get?.());
    const onGlobals = (p: { globals?: Globals }) => apply(p?.globals);
    ctx.channel?.on(GLOBALS_UPDATED, onGlobals);
    ctx.channel?.on(SET_GLOBALS, onGlobals);
    return () => {
      ctx.channel?.off(GLOBALS_UPDATED, onGlobals);
      ctx.channel?.off(SET_GLOBALS, onGlobals);
    };
  }, [ctx]);
}

/** The active theme, re-read when `setTheme` dispatches its event. */
function useTheme(): ThemeName {
  const [theme, set] = useState<ThemeName>(() => getTheme());
  useEffect(() => {
    const on = () => set(getTheme());
    on();
    document.addEventListener(THEME_EVENT, on);
    return () => document.removeEventListener(THEME_EVENT, on);
  }, []);
  return theme;
}

/** The computed value of a CSS variable in the active theme, as text. */
function useTokenValue(name: string): string {
  const theme = useTheme();
  const [value, setValue] = useState('');
  useEffect(() => {
    setValue(getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim());
  }, [name, theme]);
  return value;
}

const SURFACE = { background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, padding: 24, margin: '16px 0 0' } as const;

/** A themed block of the page: the tokens apply inside, whatever the docs chrome around it. */
function Showcase({ children, label }: { children: ReactNode; label: string }) {
  useDocsTheme();
  return (
    <Unstyled>
      <div className="sb-page" style={SURFACE} role="group" aria-label={label}>
        {children}
      </div>
    </Unstyled>
  );
}

function tokensOf(title: string): string[] {
  return COLOR_GROUPS.find((g) => g.title.startsWith(title))?.tokens ?? [];
}

function Swatch({ token, as: Tag = 'li' }: { token: string; as?: 'li' | 'div' }) {
  const value = useTokenValue(token);
  return (
    <Tag className="sb-swatch">
      <i style={{ background: `var(--${token})` }} aria-hidden="true" />
      <div>
        <code>--{token}</code>
        <br />
        <small style={{ font: 'var(--type-small)', color: 'var(--text-secondary)' }}>{value.toUpperCase()}</small>
      </div>
    </Tag>
  );
}

function Swatches({ title, tokens }: { title: string; tokens: string[] }) {
  return (
    <div>
      <h3>{title}</h3>
      <ul className="sb-grid" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {tokens.map((t) => (
          <Swatch key={t} token={t} />
        ))}
      </ul>
    </div>
  );
}

const INKS = [...tokensOf('Ink ground'), ...tokensOf('Text')];
const STATUSES: Array<[Outcome, string]> = [
  ['conformant', 'success'],
  ['failed', 'danger'],
  ['partial', 'warning'],
  ['running', 'running'],
];

export function Colours() {
  return (
    <Showcase label="Colours">
      <Swatches title="Inks (theme grounds and text)" tokens={INKS} />
      <Swatches title="Brand (theme-independent)" tokens={tokensOf('Brand')} />
      <Swatches title="Protocol spectrum" tokens={tokensOf('Protocols').filter((t) => t !== 'on-proto')} />
      <div>
        <h3>Statuses: an icon and a word, never colour alone</h3>
        <ul className="sb-grid" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {STATUSES.map(([status, token]) => (
            <li key={status} className="sb-cell">
              <StatusBadge status={status} />
              <Swatch as="div" token={token} />
            </li>
          ))}
        </ul>
      </div>
    </Showcase>
  );
}

const FAMILIES = [
  { token: 'font-brand', role: 'Brand: display and page titles', sample: 'Microcks Deep Ink', type: 'section' },
  { token: 'font-ui', role: 'Headings and text', sample: 'Returns the requested pastry.', type: 'body' },
  { token: 'font-mono', role: 'Data: paths, URLs, payloads', sample: 'GET /pastries/{name}', type: 'code' },
];

function FamilyRow({ token, role, sample, type }: (typeof FAMILIES)[number]) {
  const value = useTokenValue(token);
  return (
    <div className="sb-type">
      <span style={{ font: `var(--type-${type})` }}>{sample}</span>
      <small>
        <strong>{value.split(',')[0].replaceAll('"', '')}</strong> · {role} · <code>--{token}</code>
      </small>
    </div>
  );
}

export function Typography() {
  return (
    <Showcase label="Typography">
      <div>
        {FAMILIES.map((f) => (
          <FamilyRow key={f.token} {...f} />
        ))}
      </div>
    </Showcase>
  );
}

const RADII = [
  ['radius-control', 'Controls'],
  ['radius-panel', 'Panels'],
  ['radius-node', 'Nodes and cards'],
] as const;
const DEPTH = ['bg', 'canvas', 'surface', 'raised'];

function Labelled({ token, children, note }: { token: string; children: ReactNode; note?: string }) {
  const value = useTokenValue(token);
  return (
    <div className="sb-cell">
      {children}
      <span className="sb-caption">
        <code>--{token}</code> · {value}
        {note ? ` · ${note}` : ''}
      </span>
    </div>
  );
}

export function ShapesAndDepth() {
  return (
    <Showcase label="Shapes and depth">
      <div>
        <h3>Radii: 4, 8, 12</h3>
        <div className="sb-stack">
          {RADII.map(([r, note]) => (
            <Labelled key={r} token={r} note={note}>
              <span className="sb-box" style={{ borderRadius: `var(--${r})` }} aria-hidden="true" />
            </Labelled>
          ))}
        </div>
      </div>
      <div>
        <h3>Depth through light: elevation lightens the ink</h3>
        <div className="sb-stack">
          {DEPTH.map((t, i) => (
            <Labelled key={t} token={t} note={`level ${i}`}>
              <span className="sb-box" style={{ background: `var(--${t})`, border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-panel)' }} aria-hidden="true" />
            </Labelled>
          ))}
        </div>
      </div>
      <div>
        <h3>Blue halo = focus</h3>
        <div className="sb-stack">
          <Labelled token="shadow-focus" note="the only non-overlay shadow">
            <span className="sb-box" style={{ boxShadow: 'var(--shadow-focus)', outline: '2px solid var(--action)', borderRadius: 'var(--radius-control)' }} aria-hidden="true" />
          </Labelled>
          <Button>Press Tab to see the halo</Button>
        </div>
      </div>
    </Showcase>
  );
}

const BADGES: Array<[Protocol, string, string]> = [
  ['REST', 'API Pastry', '2.0'],
  ['SOAP', 'HelloService', '0.9'],
  ['EVENT', 'Pastry orders API', '0.1.0'],
  ['gRPC', 'HelloService', 'v1'],
  ['GRAPHQL', 'Movie Graph', '1.0'],
  ['DIRECT', 'Direct', '1.0'],
  ['A2A', 'Pastry concierge', '1.0'],
];

export function ApiBadges() {
  return (
    <Showcase label="API badges">
      <p className="sb-note">Type, name, version: the visible text is the accessible name. The protocol colour identifies the API type; the type is always written too.</p>
      <div className="inline">
        {BADGES.map(([p, n, v]) => (
          <ApiBadge key={p} protocol={p} name={n} version={v} />
        ))}
        <ApiBadge arazzo name="restock-pastry" />
      </div>
      <div className="inline">
        <ApiBadge label="conformance" value="92 %" status="success" />
        <ApiBadge label="last run" value="2 failures" status="danger" />
        <ApiBadge label="drift" value="1 field" status="warning" />
      </div>
    </Showcase>
  );
}

export function Actions() {
  return (
    <Showcase label="Actions">
      <p className="sb-note">One primary per task region. Every action is a native button or link.</p>
      <div className="inline">
        <Button variant="primary" icon="play">
          Run test
        </Button>
        <Button>Cancel</Button>
        <Button variant="ghost">Skip</Button>
        <Button variant="dashed" icon="plus">
          Add header
        </Button>
        <Button variant="danger">Delete service</Button>
        <CopyButton value={`${MOCK_BASE}/pastries`} label="Copy mock URL" />
        <Link href="#actions">A link</Link>
      </div>
    </Showcase>
  );
}

export function CommandBarShowcase() {
  const [last, setLast] = useState('');
  return (
    <Showcase label="Command bar">
      <p className="sb-note">
        In the app, <Kbd>⌘</Kbd> <Kbd>K</Kbd> (<Kbd>Ctrl</Kbd> <Kbd>K</Kbd>) opens it as a dialog. Here it is inline: type, use the arrow keys, press <Kbd>Enter</Kbd>.
      </p>
      <div style={{ maxWidth: 560 }}>
        <CommandBar inline globalShortcut={false} items={COMMANDS} label="Command bar" placeholder="Type a command or a service" onCommand={(item) => setLast(item.label)} />
      </div>
      <p className="sb-note" role="status">
        {last ? `Ran: ${last}` : 'No command run yet.'}
      </p>
    </Showcase>
  );
}

export function DomainComponents() {
  const [sel, setSel] = useState(1);
  return (
    <Showcase label="Domain components">
      <div className="inline" style={{ alignItems: 'stretch' }}>
        <StatCard headingLevel={3} title="Mock invocations · 7 days" value="638" unit="requests" />
        <StatCard headingLevel={3} title="Conformance" value="92 %" tone="success" unit="29 operations" />
      </div>
      <div style={{ maxWidth: 720 }}>
        <OperationList label="Operations of API Pastry 2.0">
          {OPERATIONS.map((op, i) => (
            <OperationRow key={`${op.method}${op.path}`} {...op} selected={sel === i} onSelect={() => setSel(i)} />
          ))}
        </OperationList>
      </div>
      <div style={{ maxWidth: 720 }}>
        <MockUrl url={`${MOCK_BASE}/pastries/Millefeuille`} mcpTool="getPastry" />
      </div>
    </Showcase>
  );
}
