import {
  EXTENSION_POINTS,
  RESERVED_TAGS,
  RESERVED_TAG_PREFIXES,
  type MicrocksPluginManifest,
} from './manifest.js';

const PERMISSIONS = ['services:read', 'services:write', 'tests:run', 'secrets:read', 'network:outbound'];
const CATEGORIES = ['importer', 'dispatcher', 'test-runner', 'observability', 'ai', 'integration', 'ui'];
const PROTOCOLS = ['REST', 'SOAP', 'EVENT', 'gRPC', 'GRAPHQL', 'DIRECT'];

const PREFIX_RE = /^[a-z][a-z0-9]*-$/;
/** A valid custom element name restricted to lowercase letters, digits and hyphens, with at least one hyphen. */
const TAG_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/;
const ID_RE = /^[a-z0-9]+(\.[a-z0-9-]+)+$/;

/** Why a `tagPrefix` is unacceptable, or undefined when it is fine. */
export function tagPrefixError(prefix: unknown): string | undefined {
  if (typeof prefix !== 'string' || prefix === '') return 'frontend.tagPrefix is required';
  if (!PREFIX_RE.test(prefix)) return `frontend.tagPrefix "${prefix}" must match ${PREFIX_RE} (for example "acme-")`;
  if (RESERVED_TAG_PREFIXES.some((r) => prefix === r || prefix.startsWith(r))) {
    return `frontend.tagPrefix "${prefix}" is reserved by the host`;
  }
  // A prefix such as "workflow-" or "command-" would let a plugin name a host tag.
  if (RESERVED_TAGS.some((t) => t.startsWith(prefix))) {
    return `frontend.tagPrefix "${prefix}" would cover a host tag (${RESERVED_TAGS.join(', ')})`;
  }
  return undefined;
}

/** Why a contributed tag is unacceptable for a plugin with this `tagPrefix`, or undefined when it is fine. */
export function tagError(tag: unknown, prefix: string): string | undefined {
  if (typeof tag !== 'string' || !TAG_RE.test(tag)) {
    return `<${String(tag)}> is not a valid custom element name (lowercase, at least one hyphen)`;
  }
  if ((RESERVED_TAGS as readonly string[]).includes(tag)) return `<${tag}> is a host element`;
  if (RESERVED_TAG_PREFIXES.some((r) => tag.startsWith(r))) return `<${tag}> uses a prefix reserved by the host`;
  if (!tag.startsWith(prefix)) return `<${tag}> must start with the plugin's tagPrefix "${prefix}"`;
  return undefined;
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Runtime counterpart of microcks-plugin.schema.json. Returns every problem found (empty array: valid).
 * The checks that matter for the host (tagPrefix, contributes, permissions) are the same as in the schema.
 */
export function validateManifest(manifest: unknown): string[] {
  const errors: string[] = [];
  if (!isObject(manifest)) return ['manifest must be an object'];
  const m = manifest;
  if (m.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (typeof m.id !== 'string' || !ID_RE.test(m.id)) errors.push('id must be a reverse-DNS identifier such as "io.github.acme.kafka-replay"');
  if (typeof m.name !== 'string' || m.name === '') errors.push('name is required');
  if (typeof m.version !== 'string' || m.version === '') errors.push('version is required');
  if (!isObject(m.publisher) || typeof m.publisher.name !== 'string') errors.push('publisher.name is required');
  if (typeof m.microcks !== 'string' || m.microcks === '') errors.push('microcks (SemVer range) is required');
  if (m.categories !== undefined && (!Array.isArray(m.categories) || m.categories.some((c) => !CATEGORIES.includes(c as string)))) {
    errors.push('categories contains an unknown category');
  }
  if (m.protocols !== undefined && (!Array.isArray(m.protocols) || m.protocols.some((p) => !PROTOCOLS.includes(p as string)))) {
    errors.push('protocols contains an unknown protocol');
  }
  if (m.permissions !== undefined) {
    if (!Array.isArray(m.permissions) || m.permissions.some((p) => !PERMISSIONS.includes(p as string))) {
      errors.push(`permissions must be a list of: ${PERMISSIONS.join(', ')}`);
    }
  }
  if (m.frontend !== undefined) {
    if (!isObject(m.frontend)) errors.push('frontend must be an object');
    else {
      const f = m.frontend;
      if (typeof f.entry !== 'string' || f.entry === '') errors.push('frontend.entry is required');
      const prefixProblem = tagPrefixError(f.tagPrefix);
      if (prefixProblem) errors.push(prefixProblem);
      if (!Array.isArray(f.contributes) || f.contributes.length === 0) {
        errors.push('frontend.contributes must list at least one extension point');
      } else {
        for (const point of f.contributes) {
          if (!(point in EXTENSION_POINTS)) errors.push(`frontend.contributes: unknown extension point "${String(point)}"`);
        }
      }
    }
  }
  return errors;
}

export function assertValidManifest(manifest: unknown): asserts manifest is MicrocksPluginManifest {
  const errors = validateManifest(manifest);
  if (errors.length > 0) {
    const id = isObject(manifest) && typeof manifest.id === 'string' ? manifest.id : '(unknown plugin)';
    throw new Error(`Invalid manifest for ${id}:\n- ${errors.join('\n- ')}`);
  }
}

/** Key-order-insensitive comparison. Returns the path of the first difference, or undefined when equal. */
export function firstDifference(a: unknown, b: unknown, path = 'manifest'): string | undefined {
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return path;
    for (let i = 0; i < a.length; i++) {
      const d = firstDifference(a[i], b[i], `${path}[${i}]`);
      if (d) return d;
    }
    return undefined;
  }
  if (isObject(a) && isObject(b)) {
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const d = firstDifference(a[key], b[key], `${path}.${key}`);
      if (d) return d;
    }
    return undefined;
  }
  return Object.is(a, b) ? undefined : path;
}
