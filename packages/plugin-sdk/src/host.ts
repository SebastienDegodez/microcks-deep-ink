import {
  EXTENSION_POINT_PERMISSIONS,
  type ExtensionPointId,
  type MicrocksPluginManifest,
  type PluginPermission,
  type Protocol,
} from './manifest.js';
import { assertValidManifest, firstDifference, tagError } from './validate.js';

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
  /** Custom element tag: must start with the plugin's tagPrefix, contain a hyphen and not be a host tag. */
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
  /** The manifest the host enforces: the trusted one when the host supplied it, frozen. */
  readonly manifest: Readonly<MicrocksPluginManifest>;
  /** Permissions granted to this plugin (declared permissions, narrowed by what the host granted). */
  readonly permissions: readonly PluginPermission[];
  hasPermission(permission: PluginPermission): boolean;
  /**
   * Throws when the contribution breaks a host rule: no frontend part, `element` outside the plugin's `tagPrefix`
   * or reserved, extension point missing from `frontend.contributes`, or a permission the point requires.
   */
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

/** What the host knows about a plugin independently of the module: the manifest as the server provides it. */
export interface TrustedPluginInfo {
  /**
   * Manifest as the Microcks server provides it. It wins over the manifest exported by the module,
   * and any difference between the two is an error.
   */
  manifest?: MicrocksPluginManifest;
  /** Permissions the admin granted. When set, the manifest may not request more. Default: all declared ones. */
  granted?: PluginPermission[];
}

export interface LoadOptions extends TrustedPluginInfo {
  /**
   * Subresource-Integrity style hash of the `entry` bytes: "sha256-<base64>" (sha384 and sha512 also work,
   * several values separated by spaces: one match is enough). The module is imported from the verified bytes,
   * so the entry must be a self-contained bundle (no relative imports).
   */
  integrity?: string;
}

export interface PluginHostOptions {
  /** Downloads the entry for the integrity check. Default: global `fetch`. */
  fetchBytes?: (url: string) => Promise<ArrayBuffer>;
  /** Imports the module. `verified` holds the bytes that passed the integrity check. Default: dynamic import. */
  importModule?: (url: string, verified?: ArrayBuffer) => Promise<unknown>;
}

type Listener = () => void;

interface Installed {
  plugin: MicrocksPlugin;
  manifest: Readonly<MicrocksPluginManifest>;
}

const defaultFetchBytes = async (url: string): Promise<ArrayBuffer> => {
  const res = await fetch(url, { credentials: 'omit' });
  if (!res.ok) throw new Error(`Could not fetch ${url} (${res.status})`);
  return res.arrayBuffer();
};

const defaultImportModule = async (url: string, verified?: ArrayBuffer): Promise<unknown> => {
  if (!verified) return import(/* @vite-ignore */ /* webpackIgnore: true */ url);
  const blobUrl = URL.createObjectURL(new Blob([verified], { type: 'text/javascript' }));
  try {
    return await import(/* @vite-ignore */ /* webpackIgnore: true */ blobUrl);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
};

const ALGORITHMS: Record<string, string> = { sha256: 'SHA-256', sha384: 'SHA-384', sha512: 'SHA-512' };

async function verifyIntegrity(bytes: ArrayBuffer, integrity: string, url: string): Promise<void> {
  const wanted = integrity.trim().split(/\s+/).filter(Boolean);
  if (wanted.length === 0) throw new Error(`Empty integrity value for ${url}`);
  const computed = new Map<string, string>();
  for (const token of wanted) {
    const match = /^(sha256|sha384|sha512)-([A-Za-z0-9+/]+={0,2})$/.exec(token);
    if (!match) throw new Error(`Unsupported integrity value "${token}" (use sha256-<base64>, sha384-… or sha512-…)`);
    const alg = match[1] as string;
    const expected = match[2] as string;
    if (!computed.has(alg)) {
      const digest = new Uint8Array(await crypto.subtle.digest(ALGORITHMS[alg] as string, bytes));
      let bin = '';
      for (const b of digest) bin += String.fromCharCode(b);
      computed.set(alg, btoa(bin));
    }
    if (computed.get(alg) === expected) return;
  }
  throw new Error(`Integrity check failed for ${url}: the bytes do not match the expected hash`);
}

function entryMatches(entryUrl: string, declared: string): boolean {
  const clean = (u: string): string => u.split(/[?#]/)[0] ?? '';
  const url = clean(entryUrl);
  if (/^[a-z][a-z0-9+.-]*:/i.test(declared)) return clean(declared) === url;
  const d = clean(declared).replace(/^\.\//, '');
  return url === d || url.endsWith(d.startsWith('/') ? d : `/${d}`);
}

const deepFreeze = <T>(value: T): T => {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value)) deepFreeze(v);
  }
  return value;
};

/**
 * The plugin host lives on `globalThis` so that the shell and every plugin bundle
 * share one registry, even when each bundle ships its own copy of this SDK.
 *
 * Trust model: plugins are same-origin code installed by an admin. The rules below keep honest plugins
 * from colliding with the host; they are not a sandbox (see docs/plugins.md, "Trust model").
 */
export class PluginHost {
  static readonly GLOBAL_KEY = '__MICROCKS_PLUGIN_HOST__';
  readonly apiVersion = 1;

  private plugins = new Map<string, Installed>();
  private contributions: RegisteredContribution[] = [];
  private listeners = new Set<Listener>();
  private bus = new EventTarget();
  private fetchBytes: NonNullable<PluginHostOptions['fetchBytes']>;
  private importModule: NonNullable<PluginHostOptions['importModule']>;

  constructor(options: PluginHostOptions = {}) {
    this.fetchBytes = options.fetchBytes ?? defaultFetchBytes;
    this.importModule = options.importModule ?? defaultImportModule;
  }

  /**
   * Registers a plugin. With `trusted.manifest` (from the server) that manifest is the one enforced and the
   * module's own manifest must be identical; without it the module's manifest is validated and used, which only
   * suits development and tests.
   */
  async register(plugin: MicrocksPlugin, trusted: TrustedPluginInfo = {}): Promise<void> {
    const source = trusted.manifest ?? plugin.manifest;
    assertValidManifest(source);
    if (trusted.manifest && plugin.manifest !== undefined) {
      const diff = firstDifference(plugin.manifest, trusted.manifest);
      if (diff) {
        throw new Error(`${trusted.manifest.id}: the manifest exported by the module differs from the trusted manifest (${diff})`);
      }
    }
    const manifest = deepFreeze(structuredClone(source));
    const declared = manifest.permissions ?? [];
    const granted = trusted.granted;
    if (granted) {
      const extra = declared.filter((p) => !granted.includes(p));
      if (extra.length > 0) throw new Error(`${manifest.id}: permissions not granted: ${extra.join(', ')}`);
    }
    const permissions = Object.freeze([...declared]);
    if (this.plugins.has(manifest.id)) {
      throw new Error(`Plugin ${manifest.id} is already registered`);
    }
    this.plugins.set(manifest.id, { plugin, manifest });
    const frontend = manifest.frontend;
    const api: PluginApi = {
      manifest,
      permissions,
      hasPermission: (p) => permissions.includes(p),
      contribute: (point, c) => {
        if (!frontend) throw new Error(`${manifest.id}: the manifest has no frontend part, it cannot contribute`);
        if (!frontend.contributes.includes(point)) {
          throw new Error(`${manifest.id}: extension point "${point}" is not listed in frontend.contributes`);
        }
        const problem = tagError(c.element, frontend.tagPrefix);
        if (problem) throw new Error(`${manifest.id}: ${problem}`);
        const needed = EXTENSION_POINT_PERMISSIONS[point];
        if (needed && !permissions.includes(needed)) {
          throw new Error(`${manifest.id}: contributing to "${point}" requires the "${needed}" permission`);
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
    try {
      await plugin.activate(api);
    } catch (e) {
      // A plugin that fails to activate must not stay half registered.
      this.plugins.delete(manifest.id);
      this.contributions = this.contributions.filter((x) => x.pluginId !== manifest.id);
      this.notify();
      throw e;
    }
  }

  async unregister(id: string): Promise<void> {
    const installed = this.plugins.get(id);
    if (!installed) return;
    await installed.plugin.deactivate?.();
    this.plugins.delete(id);
    this.contributions = this.contributions.filter((c) => c.pluginId !== id);
    this.notify();
  }

  /**
   * Loads a frontend part from its ES module URL. The module must `export default` a MicrocksPlugin.
   * Pass the manifest the server provides (and the entry's integrity hash) so that the host does not have to
   * believe the module about itself.
   */
  async load(entryUrl: string, options: LoadOptions = {}): Promise<void> {
    const { manifest, integrity, granted } = options;
    if (manifest) {
      assertValidManifest(manifest);
      if (!manifest.frontend) throw new Error(`${manifest.id}: the trusted manifest has no frontend part`);
      if (!entryMatches(entryUrl, manifest.frontend.entry)) {
        throw new Error(`${manifest.id}: ${entryUrl} does not match frontend.entry "${manifest.frontend.entry}"`);
      }
    }
    let verified: ArrayBuffer | undefined;
    if (integrity !== undefined) {
      verified = await this.fetchBytes(entryUrl);
      await verifyIntegrity(verified, integrity, entryUrl);
    }
    const mod = (await this.importModule(entryUrl, verified)) as { default?: MicrocksPlugin; plugin?: MicrocksPlugin };
    const plugin = mod.default ?? mod.plugin;
    if (!plugin || typeof plugin.activate !== 'function') {
      throw new Error(`${entryUrl} does not export a plugin (expected a default export with activate())`);
    }
    await this.register(plugin, { manifest, granted });
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

/**
 * Returns the shared host, creating it on first use. The property is defined once as non-writable and
 * non-configurable, so a plugin cannot replace the host the shell and the other bundles use.
 * The shell should call this before it loads any plugin.
 */
export function getPluginHost(): PluginHost {
  const g = globalThis as unknown as Record<string, PluginHost | undefined>;
  const existing = g[PluginHost.GLOBAL_KEY];
  if (existing !== undefined) {
    // Another bundle may ship its own copy of this class, so check the shape, not the identity.
    if (typeof existing.register !== 'function' || typeof existing.contributionsFor !== 'function') {
      throw new Error(`globalThis.${PluginHost.GLOBAL_KEY} is not a plugin host`);
    }
    return existing;
  }
  const host = new PluginHost();
  Object.defineProperty(globalThis, PluginHost.GLOBAL_KEY, {
    value: host,
    writable: false,
    configurable: false,
    enumerable: false,
  });
  return host;
}

/** Typed helper for plugin authors. */
export function definePlugin(plugin: MicrocksPlugin): MicrocksPlugin {
  return plugin;
}
