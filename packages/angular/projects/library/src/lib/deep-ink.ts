import { DIRECTIVES } from './stencil-generated/index';
import { TextValueAccessor } from './stencil-generated/text-value-accessor';

/**
 * Everything at once, for a component's `imports` array:
 *   imports: [DEEP_INK]
 * Includes the value accessor so `<mk-input [(ngModel)]>` and reactive forms work.
 */
export const DEEP_INK = [...DIRECTIVES, TextValueAccessor] as const;

export { setTheme, getTheme, restoreTheme, DEFAULT_NAV, PROTOCOL_TOKEN } from '@microcks-deep-ink/core';
export type {
  Protocol,
  Outcome,
  ProofStatus,
  OperationResult,
  NavItem,
  TabItem,
  CommandItem,
  TableColumn,
  WorkflowSource,
  WorkflowStep,
  WorkflowThread,
  WorkflowGoto,
  Theme,
} from '@microcks-deep-ink/core';

export { definePlugin, getPluginHost, EXTENSION_POINTS } from '@microcks-deep-ink/plugin-sdk';
export type { MicrocksPlugin, MicrocksPluginManifest, PluginApi, SlotContext, ExtensionPointId } from '@microcks-deep-ink/plugin-sdk';
