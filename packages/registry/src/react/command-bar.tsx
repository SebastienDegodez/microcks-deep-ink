import { useEffect, useLayoutEffect, useRef } from 'react';
import type { DetailedHTMLProps, HTMLAttributes, Ref } from 'react';
import './elements/mk-command-bar.js';

/* Types mirror packages/core/src/utils/types.ts (a parity test keeps them identical). */
export type CommandProtocol = 'REST' | 'SOAP' | 'EVENT' | 'gRPC' | 'GRAPHQL' | 'DIRECT';

export interface CommandItem {
  id: string;
  label: string;
  /** 'action' items are commands (run a test…); others are navigation targets. */
  kind: 'action' | 'service' | 'operation' | 'test';
  protocol?: CommandProtocol;
  hint?: string;
  keywords?: string[];
}

/** The `<mk-command-bar>` element and its properties. */
export interface CommandBarElement extends HTMLElement {
  items: CommandItem[];
  open: boolean;
  inline: boolean;
  placeholder: string;
  globalShortcut: boolean;
  label: string;
  show(): Promise<void>;
  hide(): Promise<void>;
}

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'mk-command-bar': DetailedHTMLProps<HTMLAttributes<CommandBarElement>, CommandBarElement>;
    }
  }
}

export interface CommandBarProps extends Omit<HTMLAttributes<CommandBarElement>, 'children' | 'onSelect'> {
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
  ref?: Ref<CommandBarElement>;
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

/**
 * Command bar (Ctrl/⌘K): WAI-ARIA combobox with a listbox, in a native modal <dialog>.
 * Wrapper around the self-registering `<mk-command-bar>` element in ./elements.
 */
export function CommandBar({
  items,
  open,
  inline,
  placeholder,
  globalShortcut,
  label,
  onCommand,
  onClose,
  ref,
  ...rest
}: CommandBarProps) {
  const el = useRef<CommandBarElement | null>(null);
  const handlers = useRef({ onCommand, onClose });

  useLayoutEffect(() => {
    handlers.current = { onCommand, onClose };
  });
  useLayoutEffect(() => {
    if (el.current) el.current.items = items;
  }, [items]);
  useLayoutEffect(() => {
    if (el.current && open !== undefined) el.current.open = open;
  }, [open]);
  useLayoutEffect(() => {
    if (el.current && inline !== undefined) el.current.inline = inline;
  }, [inline]);
  useLayoutEffect(() => {
    if (el.current && placeholder !== undefined) el.current.placeholder = placeholder;
  }, [placeholder]);
  useLayoutEffect(() => {
    if (el.current && globalShortcut !== undefined) el.current.globalShortcut = globalShortcut;
  }, [globalShortcut]);
  useLayoutEffect(() => {
    if (el.current && label !== undefined) el.current.label = label;
  }, [label]);

  useEffect(() => {
    const node = el.current;
    if (!node) return;
    const onCmd = (e: Event) => handlers.current.onCommand?.((e as CustomEvent<CommandItem>).detail);
    const onCls = () => handlers.current.onClose?.();
    node.addEventListener('mkCommand', onCmd);
    node.addEventListener('mkClose', onCls);
    return () => {
      node.removeEventListener('mkCommand', onCmd);
      node.removeEventListener('mkClose', onCls);
    };
  }, []);

  return (
    <mk-command-bar
      {...rest}
      ref={(node) => {
        el.current = node;
        assignRef(ref, node);
      }}
    />
  );
}
