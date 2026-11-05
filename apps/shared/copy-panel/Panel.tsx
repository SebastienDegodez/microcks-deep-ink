// The "Copy" manager panel: shows the exact source the CLI would copy, for the framework in use.
// It runs in the Storybook manager (React in both Storybooks), so one implementation serves React and Angular.
import React, { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useGlobals, useParameter } from 'storybook/manager-api';
import { useTheme } from 'storybook/theming';
import registryJson from '@microcks-deep-ink/registry/dist/registry.full.json';
import {
  FRAMEWORK_LABEL,
  PREVIEW_LIMIT,
  asFramework,
  buildPanelItems,
  cliCommands,
  type CopyFramework,
  type DeepInkParameter,
  type PanelFile,
  type Registry,
} from './model';

const registry = registryJson as unknown as Registry;
// React is the @microcks/deep-ink package (nothing to copy): its Storybook has its own panel.
const FRAMEWORKS: CopyFramework[] = ['angular', 'html'];

async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/** A Copy button with its own label swap; announcements go through the panel's shared live region. */
function CopyButton({ value, label, announce, className }: { value: string; label: string; announce: (m: string) => void; className?: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <button
      type="button"
      className={`dc-btn ${className ?? ''}`}
      data-state={state}
      onClick={async () => {
        const ok = await writeClipboard(value);
        setState(ok ? 'copied' : 'failed');
        announce(ok ? `Copied ${label}` : 'Copy failed');
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setState('idle'), 2000);
      }}
    >
      {state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : 'Copy'}
      <span className="dc-sr"> {label}</span>
    </button>
  );
}

interface TabDef {
  id: string;
  label: string;
  hint?: string;
}

/** WAI-ARIA tabs with automatic activation, roving tabindex, arrows (wrapping), Home and End. */
function Tabs({ label, tabs, value, onChange, children, size }: { label: string; tabs: TabDef[]; value: string; onChange: (id: string) => void; children: ReactNode; size?: 'sm' }) {
  const uid = useId();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const idx = tabs.findIndex((t) => t.id === value);
    let next = -1;
    if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const target = tabs[next];
    onChange(target.id);
    refs.current[target.id]?.focus();
  };
  return (
    <div className="dc-tabs" data-size={size}>
      <div role="tablist" aria-label={label} className="dc-tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[t.id] = el;
            }}
            type="button"
            role="tab"
            id={`${uid}-tab-${t.id}`}
            aria-selected={t.id === value}
            aria-controls={`${uid}-panel`}
            tabIndex={t.id === value ? 0 : -1}
            className="dc-tab"
            onClick={() => onChange(t.id)}
            onKeyDown={onKey}
          >
            {t.label}
            {t.hint ? (
              <>
                {' '}
                <span className="dc-tab-hint">{t.hint}</span>
              </>
            ) : null}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${uid}-panel`} aria-labelledby={`${uid}-tab-${value}`} className="dc-tabpanel">
        {children}
      </div>
    </div>
  );
}

function SourceView({ file, announce }: { file: PanelFile; announce: (m: string) => void }) {
  const long = file.content.length > PREVIEW_LIMIT;
  const shown = long ? `${file.content.slice(0, PREVIEW_LIMIT)}\n\n/* … preview truncated: ${(file.content.length / 1024).toFixed(0)} kB in total. Copy gives the whole file. */` : file.content;
  const lines = file.content.split('\n').length;
  return (
    <div className="dc-source">
      <div className="dc-source-bar">
        <p className="dc-meta">
          <span>{file.role}</span> · <code>{file.target}</code> · {lines} lines
        </p>
        <CopyButton value={file.content} label={file.target} announce={announce} />
      </div>
      <pre className="dc-pre" tabIndex={0} aria-label={`Source of ${file.target}`}>
        <code>{shown}</code>
      </pre>
    </div>
  );
}

export function CopyPanel({ framework: defaultFramework }: { framework: CopyFramework }) {
  const param = useParameter<DeepInkParameter | undefined>('deepInk', undefined);
  const [globals] = useGlobals();
  const theme = useTheme() as unknown as {
    background?: { content?: string; app?: string; hoverable?: string };
    color?: { defaultText?: string; secondary?: string; border?: string; lighter?: string; darker?: string };
    textMutedColor?: string;
    appBorderColor?: string;
    barBg?: string;
  };
  const storyFramework = asFramework(globals?.framework, defaultFramework);
  const [chosen, setChosen] = useState<CopyFramework | undefined>(undefined);
  const framework = chosen ?? storyFramework;
  const requested = useMemo(() => [...(param?.items ?? [])], [param?.items?.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  const key = requested.join('|');

  const { panelItems, unknown } = useMemo(() => buildPanelItems(registry, requested, framework), [key, framework]); // eslint-disable-line react-hooks/exhaustive-deps
  const [itemName, setItemName] = useState('');
  const [fileId, setFileId] = useState('');
  const [message, setMessage] = useState('');
  const announce = useCallback((m: string) => {
    setMessage('');
    // Re-set on the next tick so the same message is announced twice in a row.
    setTimeout(() => setMessage(m), 30);
  }, []);

  // A new story resets the selection to its first requested item.
  useEffect(() => {
    setChosen(undefined);
    setItemName(panelItems[0]?.item.name ?? '');
    setFileId('');
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = panelItems.find((p) => p.item.name === itemName) ?? panelItems[0];
  const fileTabs = current?.files ?? [];
  const file = fileTabs.find((f) => f.id === fileId) ?? fileTabs[0];
  const commands = cliCommands(requested.filter((n) => !unknown.includes(n)), framework);
  const uid = useId();

  const palette = {
    bg: theme.background?.content ?? '#0B1220',
    text: theme.color?.defaultText ?? '#E6EDF7',
    muted: theme.textMutedColor ?? '#8A9AB8',
    border: theme.appBorderColor ?? '#22324F',
    accent: theme.color?.secondary ?? '#2E9BF0',
    raised: theme.background?.hoverable ?? '#101A2C',
  };

  return (
    <div className="dc" style={{ ['--dc-bg' as string]: palette.bg, ['--dc-text' as string]: palette.text, ['--dc-muted' as string]: palette.muted, ['--dc-border' as string]: palette.border, ['--dc-accent' as string]: palette.accent, ['--dc-raised' as string]: palette.raised }}>
      <style>{CSS}</style>
      <div role="status" aria-live="polite" className="dc-sr">
        {message}
      </div>

      {!requested.length ? (
        <p className="dc-empty">This story has no registry source. A story declares what to copy with <code>parameters.deepInk.items</code>.</p>
      ) : (
        <>
          <header className="dc-head">
            <h2 className="dc-h">Copy {FRAMEWORK_LABEL[framework]} source</h2>
            <div role="group" aria-label="Framework" className="dc-seg">
              {FRAMEWORKS.map((f) => (
                <button key={f} type="button" className="dc-seg-btn" aria-pressed={f === framework} onClick={() => setChosen(f)}>
                  {FRAMEWORK_LABEL[f]}
                </button>
              ))}
            </div>
          </header>

          {unknown.length ? (
            <p className="dc-warn" role="alert">
              Unknown registry item: {unknown.join(', ')}. Run <code>pnpm --filter @microcks-deep-ink/registry build</code>.
            </p>
          ) : null}

          <section aria-labelledby={`${uid}-cli`} className="dc-sec">
            <h3 id={`${uid}-cli`} className="dc-h3">
              CLI
            </h3>
            {commands.map((c) => (
              <div className="dc-cmd" key={c.command}>
                <span className="dc-cmd-label">{c.label}</span>
                <div className="dc-cmd-row">
                  <code className="dc-cmd-code" tabIndex={0}>
                    {c.command}
                  </code>
                  <CopyButton value={c.command} label={`command: ${c.command}`} announce={announce} />
                </div>
              </div>
            ))}
            <p className="dc-meta">
              The CLI also copies the dependencies below
              {current?.item.tier === 'element' ? ' and the compiled element bundle into <out>/elements/' : ''}, and keeps a <code>deep-ink.json</code> lockfile so you can <code>diff</code> and upgrade later.
            </p>
          </section>

          {current ? (
            <section aria-labelledby={`${uid}-src`} className="dc-sec">
              <h3 id={`${uid}-src`} className="dc-h3">
                Source
              </h3>
              {panelItems.length > 1 ? (
                <Tabs
                  label="Registry items"
                  tabs={panelItems.map((p) => ({ id: p.item.name, label: p.item.name, hint: p.relation === 'dependency' ? 'dependency' : undefined }))}
                  value={current.item.name}
                  onChange={(id) => {
                    setItemName(id);
                    setFileId('');
                  }}
                >
                  <ItemBody p={current} file={file} fileTabs={fileTabs} fileId={file?.id ?? ''} setFileId={setFileId} framework={framework} announce={announce} />
                </Tabs>
              ) : (
                <ItemBody p={current} file={file} fileTabs={fileTabs} fileId={file?.id ?? ''} setFileId={setFileId} framework={framework} announce={announce} />
              )}
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

function ItemBody({ p, file, fileTabs, fileId, setFileId, framework, announce }: { p: ReturnType<typeof buildPanelItems>['panelItems'][number]; file?: PanelFile; fileTabs: PanelFile[]; fileId: string; setFileId: (id: string) => void; framework: CopyFramework; announce: (m: string) => void }) {
  const { item } = p;
  const npm = framework === 'html' ? [] : item.npmDependencies?.[framework] ?? [];
  const deps = item.registryDependencies;
  return (
    <div className="dc-item">
      <p className="dc-meta">
        <strong>{item.title}</strong> · {item.tier} · v{item.version}. {item.description}
      </p>
      <ul className="dc-facts">
        <li>
          Registry dependencies: {deps.length ? deps.map((d, i) => <span key={d}>{i ? ', ' : ''}<code>{d}</code></span>) : 'none'}
        </li>
        <li>npm dependencies: {npm.length ? npm.map((d, i) => <span key={d}>{i ? ', ' : ''}<code>{d}</code></span>) : 'none'}</li>
        {item.elements?.length ? (
          <li>
            Web Component bundle: {item.elements.map((e, i) => <span key={e}>{i ? ', ' : ''}<code>{e}</code></span>)}. Self-contained ESM, copied to <code>&lt;out&gt;/elements/</code>
            {framework === 'angular' ? '; add schemas: [CUSTOM_ELEMENTS_SCHEMA] to the host component' : ''}.
          </li>
        ) : null}
        {item.a11y.notes ? <li>{item.a11y.notes}</li> : null}
      </ul>
      {fileTabs.length === 0 ? (
        <p className="dc-empty">No {FRAMEWORK_LABEL[framework]} file for this item yet (the registry reports only what exists).</p>
      ) : fileTabs.length === 1 ? (
        <SourceView file={fileTabs[0]} announce={announce} />
      ) : (
        <Tabs label={`Files of ${item.name}`} size="sm" tabs={fileTabs.map((f) => ({ id: f.id, label: f.label, hint: f.role }))} value={fileId} onChange={setFileId}>
          {file ? <SourceView file={file} announce={announce} /> : null}
        </Tabs>
      )}
    </div>
  );
}

const CSS = `
.dc{box-sizing:border-box;padding:12px 16px 24px;background:var(--dc-bg);color:var(--dc-text);font:14px/1.45 "IBM Plex Sans",system-ui,sans-serif;min-height:100%}
.dc *{box-sizing:border-box}
.dc code,.dc pre{font-family:"JetBrains Mono",ui-monospace,monospace;font-size:12.5px}
.dc-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.dc-head{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;margin-bottom:12px}
.dc-h{font-size:15px;font-weight:600;margin:0}
.dc-h3{font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--dc-muted);margin:0 0 8px}
.dc-sec{margin:0 0 20px}
.dc-meta{margin:6px 0;color:var(--dc-muted)}
.dc-meta code{color:var(--dc-text)}
.dc-empty{color:var(--dc-muted);margin:12px 0}
.dc-warn{border:1px solid #F5A524;padding:8px 12px;margin:0 0 12px}
.dc-btn,.dc-seg-btn,.dc-tab{font:inherit;cursor:pointer;color:var(--dc-text);background:var(--dc-raised);border:1px solid var(--dc-muted);min-height:28px;padding:2px 10px;border-radius:4px}
.dc-btn:hover,.dc-seg-btn:hover,.dc-tab:hover{border-color:var(--dc-accent)}
.dc-btn[data-state="copied"]{border-color:#3FB950}
.dc-btn[data-state="failed"]{border-color:#F85149}
.dc-seg{display:inline-flex}
.dc-seg-btn{border-radius:0}
.dc-seg-btn:first-child{border-radius:4px 0 0 4px}
.dc-seg-btn:last-child{border-radius:0 4px 4px 0}
.dc-seg-btn+.dc-seg-btn{margin-inline-start:-1px}
.dc-seg-btn[aria-pressed="true"]{background:var(--dc-accent);color:#070B14;border-color:var(--dc-accent);font-weight:600}
.dc :focus-visible{outline:2px solid var(--dc-accent);outline-offset:2px}
.dc-cmd{margin:0 0 10px}
.dc-cmd-label{display:block;font-size:12px;color:var(--dc-muted);margin-bottom:4px}
.dc-cmd-row{display:flex;gap:8px;align-items:center}
.dc-cmd-code{flex:1;min-width:0;overflow-x:auto;white-space:nowrap;padding:6px 10px;background:var(--dc-raised);border:1px solid var(--dc-border);border-radius:4px}
.dc-tablist{display:flex;flex-wrap:wrap;gap:4px;border-bottom:1px solid var(--dc-border);margin-bottom:8px}
.dc-tab{border-color:transparent;background:transparent;border-bottom:2px solid transparent;border-radius:4px 4px 0 0;color:var(--dc-muted)}
.dc-tab[aria-selected="true"]{color:var(--dc-text);border-bottom-color:var(--dc-accent);font-weight:600}
.dc-tab-hint{margin-inline-start:6px;font-size:11px;color:var(--dc-muted);font-weight:400}
.dc-tabs[data-size="sm"] .dc-tab{font-size:13px}
.dc-tabpanel{min-width:0}
.dc-facts{margin:6px 0 10px;padding-inline-start:18px;color:var(--dc-muted)}
.dc-facts code{color:var(--dc-text)}
.dc-source-bar{display:flex;gap:8px;align-items:center;justify-content:space-between}
.dc-source-bar .dc-meta{margin:0}
.dc-pre{margin:8px 0 0;padding:12px;max-height:420px;overflow:auto;background:var(--dc-raised);border:1px solid var(--dc-border);border-radius:4px;white-space:pre;color:var(--dc-text)}
@media (prefers-reduced-motion:reduce){.dc *{transition:none!important;animation:none!important}}
`;
