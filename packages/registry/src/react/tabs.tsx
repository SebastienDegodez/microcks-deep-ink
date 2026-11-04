import { createContext, useContext, useId, useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: string;
  /** Shown after the label. Read as "Operations, 4". */
  count?: number;
  /** Warning pill after the count. Read as "Users, 2 pending changes" with `alertLabel`. */
  alert?: number;
  /** Words read after the alert number (default "need attention"). */
  alertLabel?: string;
  /** Live dot before the label. Read as "Tasks, live". */
  live?: boolean;
  disabled?: boolean;
}

export interface TabsProps {
  /** Accessible name of the tab list. */
  label: string;
  items: TabItem[];
  /** Id of the selected tab. */
  value: string;
  onChange: (id: string) => void;
  /** `automatic`: arrows select. `manual`: arrows move focus, Enter or Space selects. */
  activation?: 'automatic' | 'manual';
  /**
   * Prefix of the generated ids. Only needed when a `TabPanel` is rendered outside `Tabs`;
   * panels passed as `children` find it by themselves.
   */
  idPrefix?: string;
  /** Panels, rendered after the tab list. */
  children?: ReactNode;
  className?: string;
}

const PrefixContext = createContext<string | undefined>(undefined);

const tabId = (prefix: string, id: string) => `${prefix}-tab-${id}`;
const panelId = (prefix: string, id: string) => `${prefix}-panel-${id}`;

/**
 * Tabs with the WAI-ARIA tabs pattern: roving tabindex, arrow keys with wrap, Home and End.
 * Put `TabPanel`s in `children`, or render them yourself with the same `idPrefix`.
 */
export function Tabs({ label, items, value, onChange, activation = 'automatic', idPrefix, children, className }: TabsProps) {
  const generated = useId();
  const prefix = idPrefix ?? generated;
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const enabled = items.map((t, i) => (t.disabled ? -1 : i)).filter((i) => i >= 0);
  const selectedIndex = items.findIndex((t) => t.id === value && !t.disabled);
  // Roving tabindex: the selected tab, or the first enabled one when nothing valid is selected.
  const tabStop = selectedIndex >= 0 ? selectedIndex : (enabled[0] ?? -1);

  const move = (to: number) => {
    refs.current[to]?.focus();
    const item = items[to];
    if (activation === 'automatic' && item) onChange(item.id);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (enabled.length === 0) return;
    const pos = enabled.indexOf(index);
    let next: number | undefined;
    switch (e.key) {
      case 'ArrowRight':
        next = enabled[(pos + 1) % enabled.length];
        break;
      case 'ArrowLeft':
        next = enabled[(pos - 1 + enabled.length) % enabled.length];
        break;
      case 'Home':
        next = enabled[0];
        break;
      case 'End':
        next = enabled[enabled.length - 1];
        break;
      default:
        return;
    }
    if (next === undefined) return;
    e.preventDefault();
    move(next);
  };

  return (
    <PrefixContext.Provider value={prefix}>
      <div className={['tabs', className].filter(Boolean).join(' ')}>
        <div role="tablist" className="tablist" aria-label={label}>
          {items.map((t, i) => {
            const selected = i === selectedIndex;
            return (
              <button
                key={t.id}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                type="button"
                role="tab"
                className="tab"
                id={tabId(prefix, t.id)}
                aria-selected={selected}
                aria-controls={panelId(prefix, t.id)}
                tabIndex={i === tabStop ? 0 : -1}
                disabled={t.disabled}
                onClick={() => onChange(t.id)}
                onKeyDown={(e) => onKeyDown(e, i)}
              >
                {t.live ? <span className="tab-live" aria-hidden="true" /> : null}
                {t.label}
                {t.live ? <span className="sr-only">, live</span> : null}
                {t.count !== undefined ? (
                  <span className="tab-count">
                    <span className="sr-only">, </span>
                    {t.count}
                  </span>
                ) : null}
                {t.alert ? (
                  <span className="tab-alert">
                    <span className="sr-only">, </span>
                    {t.alert}
                    <span className="sr-only"> {t.alertLabel ?? 'need attention'}</span>
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        {children}
      </div>
    </PrefixContext.Provider>
  );
}

export interface TabPanelProps {
  /** Id of the tab this panel belongs to. */
  id: string;
  /** Id of the selected tab. The panel is hidden unless it matches `id`. */
  value: string;
  idPrefix?: string;
  children?: ReactNode;
  className?: string;
}

/** Panel of one tab. Only the selected panel renders its children. */
export function TabPanel({ id, value, idPrefix, children, className }: TabPanelProps) {
  const inherited = useContext(PrefixContext);
  const prefix = idPrefix ?? inherited ?? 'di';
  const active = id === value;
  return (
    <div
      role="tabpanel"
      id={panelId(prefix, id)}
      aria-labelledby={tabId(prefix, id)}
      className={['tabpanel', className].filter(Boolean).join(' ')}
      tabIndex={0}
      hidden={!active}
    >
      {active ? children : null}
    </div>
  );
}
