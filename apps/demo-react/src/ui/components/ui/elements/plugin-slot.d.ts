// Deep Ink · plugin-slot@0.2.0 · copied from packages/registry. You own this file.
export interface PluginHost {
  readonly apiVersion: number;
  register(plugin: { manifest: { id: string; [key: string]: unknown }; activate(api: any): void | Promise<void>; deactivate?(): void | Promise<void> }): Promise<void>;
  unregister(id: string): Promise<void>;
  load(entryUrl: string): Promise<void>;
  list(): Array<{ id: string; [key: string]: unknown }>;
  subscribe(listener: () => void): () => void;
  on(event: string, handler: (detail: unknown) => void): () => void;
}
/** The plugin host shared through globalThis.__MICROCKS_PLUGIN_HOST__ (created on first use). */
export declare function getPluginHost(): PluginHost;
