import { Directive, ElementRef, booleanAttribute, effect, inject, input } from '@angular/core';
import './elements/mk-plugin-slot.js';

export { getPluginHost } from './elements/mk-plugin-slot.js';
export type { PluginHost } from './elements/mk-plugin-slot.js';

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

/** The `<mk-plugin-slot>` element and its properties. */
export interface PluginSlotElement extends HTMLElement {
  point: ExtensionPointId;
  context: SlotContext;
  outlined: boolean;
}

const DEFAULT_CONTEXT: SlotContext = { theme: 'dark' };

/**
 * Extension point: `<mk-plugin-slot point="service.tabs" [context]="ctx">fallback</mk-plugin-slot>`.
 * Contributions render in the light DOM, wrapped in `div.di-plugin-item[data-plugin-id]`.
 * The host component needs `schemas: [CUSTOM_ELEMENTS_SCHEMA]`.
 */
@Directive({ selector: 'mk-plugin-slot' })
export class PluginSlotDirective {
  private readonly host = inject<ElementRef<PluginSlotElement>>(ElementRef);

  readonly point = input.required<ExtensionPointId>();
  readonly context = input<SlotContext>(DEFAULT_CONTEXT);
  /** Shows each contribution's origin in a dashed frame (docs and dev mode). */
  readonly outlined = input(false, { transform: booleanAttribute });

  constructor() {
    const el = this.host.nativeElement;
    effect(() => {
      el.context = this.context();
    });
    effect(() => {
      el.point = this.point();
    });
    effect(() => {
      el.outlined = this.outlined();
    });
  }
}
