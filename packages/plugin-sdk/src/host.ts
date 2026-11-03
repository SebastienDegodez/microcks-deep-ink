import type { ExtensionPointId, MicrocksPluginManifest, Protocol } from './manifest.js';

/** Context handed to every contributed element through its `context` property. */
export interface SlotContext {
  /** Current theme of the shell. */
  theme: 'dark' | 'light';
  /** Present on service-scoped extension points. */
  service?: { id: string; name: string; version: string; protocol: Protocol };
  /** Present on operation-scoped extension points. */
  operation?: { name: string; method?: string; path?: string };
  /** Present on test-scoped extension points. */
  testResult?: { id: string; success: boolean };
  /** Free-form data supplied by the host page. */
  [key: string]: unknown;
}

/**
 * A contribution renders a custom element. Any framework can provide one:
 * plain Web Components, Angular Elements, React wrapped with a custom-element adapter, Lit, Stencil…
 */
export interface Contribution {
  /** Unique within the plugin. */
  id: string;
  /** Custom element tag, must start with the plugin's tagPrefix. */
  element: string;
  /** Label used by nav items, tabs, command actions. */
  title?: string;
  /** Lower comes first. Default 100. */
  order?: number;
  /** Extra attributes set on the element. */
  attributes?: Record<string, string>;
  /** Optional filter: return false to hide the contribution for a given context. */
  when?: (ctx: SlotContext) => boolean;
}

export interface RegisteredContribution extends Contribution {
  pluginId: string;
  point: ExtensionPointId;
}

export interface PluginApi {
  readonly manifest: MicrocksPluginManifest;
  contribute(point: ExtensionPointId, contribution: Contribution): () => void;
  /** Host event bus, namespaced: events emitted by plugins are prefixed with their id. */
  emit(event: string, detail?: unknown): void;
  on(event: string, handler: (detail: unknown) => void): () => void;
}

export interface MicrocksPlugin {
  manifest: MicrocksPluginManifest;
  activate(api: PluginApi): void | Promise<void>;
  deactivate?(): void | Promise<void>;
}

type Listener = () => void;

/**
 * The plugin host lives on `globalThis` so that the shell and every plugin bundle
 * share one registry, even when each bundle ships its own copy of this SDK.
 */
export class PluginHost {
  static readonly GLOBAL_KEY = '__MICROCKS_PLUGIN_HOST__';
  readonly apiVersion = 1;

  private plugins = new Map<string, MicrocksPlugin>();
  private contributions: RegisteredContribution[] = [];
  private listeners = new Set<Listener>();
  private bus = new EventTarget();

  async register(plugin: MicrocksPlugin): Promise<void> {
    const { manifest } = plugin;
    if (this.plugins.has(manifest.id)) {
      throw new Error(`Plugin ${manifest.id} is already registered`);
    }
    this.plugins.set(manifest.id, plugin);
    const prefix = manifest.frontend?.tagPrefix;
    const api: PluginApi = {
      manifest,
      contribute: (point, c) => {
        if (prefix && !c.element.startsWith(prefix)) {
          throw new Error(`${manifest.id}: element <${c.element}> must start with "${prefix}"`);
        }
        const entry: RegisteredContribution = { order: 100, ...c, pluginId: manifest.id, point };
        this.contributions.push(entry);
        this.notify();
        return () => {
          this.contributions = this.contributions.filter((x) => x !== entry);
          this.notify();
        };
      },
      emit: (event, detail) =>
        this.bus.dispatchEvent(new CustomEvent(`${manifest.id}:${event}`, { detail })),
      on: (event, handler) => this.on(event, handler),
    };
    await plugin.activate(api);
  }

  async unregister(id: string): Promise<void> {
    const plugin = this.plugins.get(id);
    if (!plugin) return;
    await plugin.deactivate?.();
    this.plugins.delete(id);
    this.contributions = this.contributions.filter((c) => c.pluginId !== id);
    this.notify();
  }

  /** Loads a frontend part from its ES module URL. The module must `export default` a MicrocksPlugin. */
  async load(entryUrl: string): Promise<void> {
    const mod = await import(/* @vite-ignore */ /* webpackIgnore: true */ entryUrl);
    await this.register((mod.default ?? mod.plugin) as MicrocksPlugin);
  }

  list(): MicrocksPluginManifest[] {
    return [...this.plugins.values()].map((p) => p.manifest);
  }

  contributionsFor(point: ExtensionPointId, ctx?: SlotContext): RegisteredContribution[] {
    return this.contributions
      .filter((c) => c.point === point && (!ctx || !c.when || c.when(ctx)))
      .sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  on(event: string, handler: (detail: unknown) => void): () => void {
    const fn = (e: Event) => handler((e as CustomEvent).detail);
    this.bus.addEventListener(event, fn);
    return () => this.bus.removeEventListener(event, fn);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }
}

/** Returns the shared host, creating it on first use. */
export function getPluginHost(): PluginHost {
  const g = globalThis as unknown as Record<string, PluginHost | undefined>;
  return (g[PluginHost.GLOBAL_KEY] ??= new PluginHost());
}

/** Typed helper for plugin authors. */
export function definePlugin(plugin: MicrocksPlugin): MicrocksPlugin {
  return plugin;
}
