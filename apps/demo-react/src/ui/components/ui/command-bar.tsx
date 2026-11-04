// Deep Ink · command-bar@0.2.0 · copied from packages/registry. You own this file.
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { HTMLAttributes, KeyboardEvent, Ref } from 'react';
import { Icon } from './icon';

export type CommandProtocol = 'REST' | 'SOAP' | 'EVENT' | 'gRPC' | 'GRAPHQL' | 'DIRECT' | 'A2A';

export interface CommandItem {
  id: string;
  label: string;
  /** 'action' items are commands (run a test…); others are navigation targets. */
  kind: 'action' | 'service' | 'operation' | 'test';
  protocol?: CommandProtocol;
  hint?: string;
  keywords?: string[];
}

const KINDS: CommandItem['kind'][] = ['action', 'service', 'operation', 'test'];
const KIND_LABEL: Record<CommandItem['kind'], string> = {
  action: 'Actions',
  service: 'Services',
  operation: 'Operations',
  test: 'Tests',
};
const PROTOCOL_TOKEN: Record<CommandProtocol, string> = {
  REST: 'proto-rest',
  SOAP: 'proto-soap',
  EVENT: 'proto-event',
  gRPC: 'proto-grpc',
  GRAPHQL: 'proto-graphql',
  DIRECT: 'proto-direct',
  A2A: 'proto-a2a',
};

export interface CommandBarProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'onSelect'> {
  items: CommandItem[];
  /** Modal mode: controls the dialog. Update it from `onClose`. */
  open?: boolean;
  /** Render in place instead of in a dialog (docs, embedding). */
  inline?: boolean;
  placeholder?: string;
  /** Ctrl/⌘K opens the bar from anywhere. Default true. */
  globalShortcut?: boolean;
  /** Accessible name of the dialog and the search field. Default "Command bar". */
  label?: string;
  onCommand?: (item: CommandItem) => void;
  /** Called when the modal closes (Escape, backdrop, close button, or after a command ran). */
  onClose?: () => void;
  /** The root element: the `<dialog>`, or the inline `<div>`. */
  ref?: Ref<HTMLElement>;
}

/** Results grouped by kind, in display order. Flat index = position in this array. */
function filterItems(items: CommandItem[], query: string): CommandItem[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const filtered = items.filter((i) => {
    const hay = [i.label, ...(i.keywords ?? [])].join(' ').toLowerCase();
    return words.every((w) => hay.includes(w));
  });
  return KINDS.flatMap((k) => filtered.filter((i) => i.kind === k));
}

/** Active element, looking through shadow roots, so focus can return to the real opener. */
function deepActiveElement(): HTMLElement | null {
  let el = document.activeElement as HTMLElement | null;
  while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement as HTMLElement;
  return el;
}

function Tag({ item }: { item: CommandItem }) {
  if (item.kind === 'action')
    return (
      <span className="command-bar-tag" data-kind="action">
        RUN
      </span>
    );
  if (item.protocol)
    return (
      <span className="command-bar-tag" style={{ background: `var(--${PROTOCOL_TOKEN[item.protocol]})` }}>
        {item.protocol}
      </span>
    );
  return (
    <span className="command-bar-tag" data-kind="nav">
      {item.kind.toUpperCase()}
    </span>
  );
}

/**
 * Command bar (Ctrl/⌘K): navigation and actions behind one search field.
 * WAI-ARIA 1.2 combobox with a listbox popup (aria-activedescendant keeps DOM focus in the input).
 * Modal mode is a native `<dialog>` opened with `showModal()`: focus is trapped, Escape closes,
 * and focus returns to the opener. `inline` renders the same widget in place, for docs and embedding.
 */
export function CommandBar({
  items,
  open,
  inline = false,
  placeholder = 'Jump to a service, or type an action…',
  globalShortcut = true,
  label = 'Command bar',
  onCommand,
  onClose,
  className,
  ref,
  ...rest
}: CommandBarProps) {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  // `open` drives the modal; Ctrl/⌘K and the close paths change it locally and report through onClose.
  const [shown, setShown] = useState(Boolean(open));
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open !== undefined) setShown(open);
  }
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [prevItems, setPrevItems] = useState(items);
  if (items !== prevItems) {
    setPrevItems(items);
    setActive(0);
  }

  const list = filterItems(items, query);
  const cur = Math.max(0, Math.min(active, list.length - 1));
  const optionId = (i: number) => `${id}-o${i}`;
  const listId = `${id}-list`;
  const inputId = `${id}-input`;

  const close = () => {
    setQuery('');
    setActive(0);
    if (inline) return;
    // Read and clear the latest value, so a second close in the same event (Escape, then cancel) is a no-op.
    const wasOpen = latest.current.shown;
    latest.current.shown = false;
    setShown(false);
    if (wasOpen) onClose?.();
  };
  const choose = (item?: CommandItem) => {
    if (!item) return;
    onCommand?.(item);
    if (!inline) close();
  };

  // Latest values for the document and dialog listeners.
  const latest = useRef({ close, inline, shown, globalShortcut });
  useLayoutEffect(() => {
    latest.current = { close, inline, shown, globalShortcut };
  });

  // Open and close the native dialog; focus goes to the search field, then back to the opener.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (inline || !dialog) return;
    if (shown && !dialog.open) {
      opener.current = deepActiveElement();
      dialog.showModal();
      inputRef.current?.focus();
    } else if (!shown && dialog.open) {
      dialog.close();
      const o = opener.current;
      opener.current = null;
      if (o && o.isConnected) o.focus();
    }
  }, [shown, inline]);

  // Keep the active option visible while moving with the arrow keys.
  useEffect(() => {
    listRef.current?.querySelector(`[id="${optionId(cur)}"]`)?.scrollIntoView?.({ block: 'nearest' });
  });

  // Ctrl/⌘K from anywhere.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const s = latest.current;
      if (!s.globalShortcut || !(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'k') return;
      e.preventDefault();
      if (s.inline) inputRef.current?.focus();
      else if (s.shown) s.close();
      else setShown(true);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Dialog: Escape (cancel), a native close and a click on the backdrop all close the bar.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (inline || !dialog) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      latest.current.close();
    };
    const onNativeClose = () => {
      if (latest.current.shown) latest.current.close();
    };
    const onClick = (e: MouseEvent) => {
      if (e.target === dialog) latest.current.close();
    };
    dialog.addEventListener('cancel', onCancel);
    dialog.addEventListener('close', onNativeClose);
    dialog.addEventListener('click', onClick);
    return () => {
      dialog.removeEventListener('cancel', onCancel);
      dialog.removeEventListener('close', onNativeClose);
      dialog.removeEventListener('click', onClick);
      if (dialog.open) dialog.close();
    };
  }, [inline]);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const last = list.length - 1;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (last >= 0) setActive(cur >= last ? 0 : cur + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (last >= 0) setActive(cur <= 0 ? last : cur - 1);
        break;
      case 'Home':
        if (last >= 0) {
          e.preventDefault();
          setActive(0);
        }
        break;
      case 'End':
        if (last >= 0) {
          e.preventDefault();
          setActive(last);
        }
        break;
      case 'Enter':
        if (list[cur]) {
          e.preventDefault();
          choose(list[cur]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        close();
        break;
    }
  };

  const announce = list.length === 0 ? 'No results' : `${list.length} ${list.length === 1 ? 'result' : 'results'}`;
  let flat = 0;
  const panel = (
    <div className="command-bar-panel">
      <div className="command-bar-search">
        <Icon name="search" size={18} />
        <label className="sr-only" htmlFor={inputId}>
          {label}
        </label>
        <input
          id={inputId}
          ref={inputRef}
          className="command-bar-input"
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={list.length > 0}
          aria-controls={list.length > 0 ? listId : undefined}
          aria-activedescendant={list[cur] ? optionId(cur) : undefined}
          aria-keyshortcuts={globalShortcut ? 'Control+K Meta+K' : undefined}
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
        />
        {globalShortcut && (
          <kbd className="command-bar-kbd" aria-hidden="true">
            Ctrl K
          </kbd>
        )}
        {!inline && (
          <button type="button" className="command-bar-close" aria-label="Close" onClick={close}>
            <Icon name="close" size={18} />
          </button>
        )}
      </div>
      {list.length > 0 ? (
        <div className="command-bar-list" id={listId} ref={listRef} role="listbox" aria-label={`${label} results`}>
          {KINDS.map((k) => {
            const group = list.filter((i) => i.kind === k);
            if (!group.length) return null;
            return (
              <div key={k} className="command-bar-group" role="group" aria-label={KIND_LABEL[k]}>
                <div className="command-bar-group-title" aria-hidden="true">
                  {KIND_LABEL[k]}
                </div>
                {group.map((i) => {
                  const idx = flat++;
                  const selected = idx === cur;
                  return (
                    // Keyboard: the combobox owns it (aria-activedescendant); the pointer can pick an option too.
                    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
                    <div
                      key={i.id}
                      id={optionId(idx)}
                      className="command-bar-option"
                      role="option"
                      tabIndex={-1}
                      aria-selected={selected}
                      onMouseMove={() => active !== idx && setActive(idx)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => choose(i)}
                    >
                      <Tag item={i} />
                      <span>{i.label}</span>
                      <span className="command-bar-hint" aria-hidden="true">
                        {selected ? 'Enter' : (i.hint ?? i.kind)}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="command-bar-empty">No match. Try a service name or &quot;test&quot;.</div>
      )}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {shown || inline ? announce : ''}
      </div>
    </div>
  );

  const classes = ['command-bar', className].filter(Boolean).join(' ');
  if (inline) {
    return (
      <div {...rest} ref={ref as Ref<HTMLDivElement>} className={classes} data-inline="" role="group" aria-label={label}>
        {panel}
      </div>
    );
  }
  return (
    <dialog
      {...rest}
      ref={(node) => {
        dialogRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as { current: HTMLElement | null }).current = node;
      }}
      className={classes}
      aria-label={label}
    >
      {shown && panel}
    </dialog>
  );
}
