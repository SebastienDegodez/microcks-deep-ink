// Generated wrappers: one React component per Deep Ink Web Component (MkButton, MkApiBadge…).
export * from './components/stencil-generated/components';

// Shared utilities and types from the core.
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

// Plugin contract, so React plugin authors need a single import.
export { definePlugin, getPluginHost, EXTENSION_POINTS } from '@microcks-deep-ink/plugin-sdk';
export type { MicrocksPlugin, MicrocksPluginManifest, PluginApi, SlotContext, ExtensionPointId } from '@microcks-deep-ink/plugin-sdk';
