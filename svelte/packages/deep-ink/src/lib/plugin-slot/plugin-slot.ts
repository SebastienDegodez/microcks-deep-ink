export { getPluginHost } from '../internal/elements/plugin-slot.js';
export type { PluginHost } from '../internal/elements/plugin-slot.js';
export type ExtensionPointId = 'nav.items' | 'command.actions' | 'cockpit.widgets' | 'service.header.badges' | 'service.tabs' | 'operation.panels' | 'import.sources' | 'test.results.panels';
export interface SlotContext {
  theme: 'dark' | 'light';
  service?: { id: string; name: string; version: string; protocol: import('../types.js').Protocol };
  operation?: { name: string; method?: string; path?: string };
  testResult?: { id: string; success: boolean };
  [key: string]: unknown;
}
export interface PluginSlotElement extends HTMLElement { point: ExtensionPointId; context: SlotContext; outlined: boolean }
