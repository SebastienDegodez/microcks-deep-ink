// Deep Ink · plugin-slot@0.2.0 · copied from packages/registry. You own this file.
import { useLayoutEffect, useRef } from 'react';
import type { DetailedHTMLProps, HTMLAttributes, ReactNode, Ref } from 'react';
import './elements/plugin-slot.js';

export { getPluginHost } from './elements/plugin-slot.js';
export type { PluginHost } from './elements/plugin-slot.js';

type SlotProtocol = 'REST' | 'SOAP' | 'EVENT' | 'gRPC' | 'GRAPHQL' | 'DIRECT';

/** Extension points of the Microcks UI v2 shell (same ids as the plugin SDK). */
export type ExtensionPointId =
  | 'nav.items'
  | 'command.actions'
  | 'cockpit.widgets'
  | 'service.header.badges'
  | 'service.tabs'
  | 'operation.panels'
  | 'import.sources'
  | 'test.results.panels';

/** Context handed to every contributed element through its `context` property. */
export interface SlotContext {
  theme: 'dark' | 'light';
  service?: { id: string; name: string; version: string; protocol: SlotProtocol };
  operation?: { name: string; method?: string; path?: string };
  testResult?: { id: string; success: boolean };
  [key: string]: unknown;
}

/** The `<plugin-slot>` element and its properties. */
export interface PluginSlotElement extends HTMLElement {
  point: ExtensionPointId;
  context: SlotContext;
  outlined: boolean;
}

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'plugin-slot': DetailedHTMLProps<HTMLAttributes<PluginSlotElement>, PluginSlotElement>;
    }
  }
}

export interface PluginSlotProps extends Omit<HTMLAttributes<PluginSlotElement>, 'children'> {
  point: ExtensionPointId;
  context?: SlotContext;
  /** Shows each contribution's origin in a dashed frame (docs and dev mode). */
  outlined?: boolean;
  /** Fallback shown when no plugin contributes to `point`. */
  children?: ReactNode;
  ref?: Ref<PluginSlotElement>;
}

const DEFAULT_CONTEXT: SlotContext = { theme: 'dark' };

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

/**
 * Extension point: renders every plugin contribution for `point` in the light DOM, each wrapped in
 * `<div class="plugin-item" data-plugin-id="...">`. Contributed elements receive `context` as a property.
 * Wrapper around the self-registering `<plugin-slot>` element in ./elements.
 */
export function PluginSlot({ point, context = DEFAULT_CONTEXT, outlined, children, ref, ...rest }: PluginSlotProps) {
  const el = useRef<PluginSlotElement | null>(null);

  useLayoutEffect(() => {
    if (el.current) el.current.context = context;
  }, [context]);
  useLayoutEffect(() => {
    if (el.current) el.current.point = point;
  }, [point]);
  useLayoutEffect(() => {
    if (el.current && outlined !== undefined) el.current.outlined = outlined;
  }, [outlined]);

  return (
    <plugin-slot
      {...rest}
      ref={(node) => {
        el.current = node;
        assignRef(ref, node);
      }}
    >
      {children}
    </plugin-slot>
  );
}
