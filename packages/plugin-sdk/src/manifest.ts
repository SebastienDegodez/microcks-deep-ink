/**
 * Microcks plugin manifest (microcks-plugin.json).
 *
 * A plugin is one marketplace entry that can ship a backend part, a frontend part, or both.
 * The backend part is loaded by the Microcks server (out of scope for this repository);
 * the frontend part is an ES module that registers Web Components into extension points.
 */
export interface MicrocksPluginManifest {
  /** Manifest format version. */
  schemaVersion: 1;
  /** Reverse-DNS identifier, unique in the marketplace. Example: "io.github.acme.kafka-replay". */
  id: string;
  /** Display name shown in the Hub / marketplace. */
  name: string;
  /** SemVer version of the plugin. */
  version: string;
  description?: string;
  publisher: { name: string; url?: string };
  license?: string;
  /** SemVer range of compatible Microcks versions. Example: ">=2.0.0 <3.0.0". */
  microcks: string;
  /** Marketplace categories. */
  categories?: PluginCategory[];
  /** Protocols the plugin is about, rendered as API badges in the marketplace. */
  protocols?: Protocol[];
  /** Permissions the user must grant at install time. */
  permissions?: PluginPermission[];
  backend?: BackendPart;
  frontend?: FrontendPart;
}

export type Protocol = 'REST' | 'SOAP' | 'EVENT' | 'gRPC' | 'GRAPHQL' | 'DIRECT' | 'A2A';

export type PluginCategory =
  | 'importer'
  | 'dispatcher'
  | 'test-runner'
  | 'observability'
  | 'ai'
  | 'integration'
  | 'ui';

export type PluginPermission =
  | 'services:read'
  | 'services:write'
  | 'tests:run'
  | 'secrets:read'
  | 'network:outbound';

/** Backend extension points implemented by the Microcks server. Declarative only here. */
export interface BackendPart {
  /** OCI image or artifact coordinates, resolved by the server. */
  artifact: string;
  /** Server-side extension points the plugin implements. */
  extensions: Array<
    | { point: 'importer'; id: string; mediaTypes: string[] }
    | { point: 'dispatcher'; id: string; protocols: Protocol[] }
    | { point: 'test-runner'; id: string; protocols: Protocol[] }
    | { point: 'secret-provider'; id: string }
  >;
}

export interface FrontendPart {
  /** URL (or path relative to the plugin bundle) of the ES module exporting `activate`. */
  entry: string;
  /** Custom element tag prefix reserved by the plugin, to avoid collisions. Example: "acme-". */
  tagPrefix: string;
  /** Extension points the plugin contributes to, declared for marketplace display and lazy loading. */
  contributes: ExtensionPointId[];
}

/** Frontend extension points exposed by the Microcks UI v2 shell. */
export const EXTENSION_POINTS = {
  'nav.items': 'Entries in the left navigation.',
  'command.actions': 'Actions in the ⌘K command bar.',
  'cockpit.widgets': 'Widgets on the Cockpit dashboard.',
  'service.header.badges': 'Proof badges in a service header.',
  'service.tabs': 'Tabs on a service detail page.',
  'operation.panels': 'Panels in the operation detail pane.',
  'import.sources': 'Extra import sources on the Import screen (next to File, URL, Git).',
  'test.results.panels': 'Panels on a test result page.',
} as const;

export type ExtensionPointId = keyof typeof EXTENSION_POINTS;
