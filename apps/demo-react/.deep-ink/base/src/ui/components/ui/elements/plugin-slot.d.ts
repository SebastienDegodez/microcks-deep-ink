// Deep Ink · plugin-slot@0.2.0 · copied from packages/registry. You own this file.
export interface PluginHost {
  readonly apiVersion: number;
  register(
    plugin: { manifest: { id: string; [key: string]: unknown }; activate(api: any): void | Promise<void>; deactivate?(): void | Promise<void> },
    trusted?: { manifest?: { id: string; [key: string]: unknown }; granted?: string[] },
  ): Promise<void>;
  unregister(id: string): Promise<void>;
  /** With `manifest` (as the server provides it) the module cannot widen its own rights; `integrity` is "sha256-<base64>" of the entry. */
  load(entryUrl: string, options?: { manifest?: { id: string; [key: string]: unknown }; integrity?: string; granted?: string[] }): Promise<void>;
  list(): Array<{ id: string; [key: string]: unknown }>;
  subscribe(listener: () => void): () => void;
  on(event: string, handler: (detail: unknown) => void): () => void;
}
/** The plugin host shared through globalThis.__MICROCKS_PLUGIN_HOST__ (created on first use, then read-only). */
export declare function getPluginHost(): PluginHost;
