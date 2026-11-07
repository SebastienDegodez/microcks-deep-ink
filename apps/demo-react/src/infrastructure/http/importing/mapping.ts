/** Microcks DTOs (`./microcks.ts`) <-> importing domain. Pure functions, unit-tested in `mapping.test.ts`. */
import { detectArtifactKind, type Importer, type ProducedService } from '@/domain/importing';
import type { SecretKind, SecretSummary } from '@/domain/shared';
import type { SecretInput } from '@/application/ports/importing';
import { SECRET_VALUE_FIELD, type MicrocksImportJob, type MicrocksSecret } from './microcks';

function definedOnly<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
}

const iso = (epochMs: number) => new Date(epochMs).toISOString();

/** Microcks `ImportJob` -> importer. A job without the demo extension gets the defaults of a scheduled URL. */
export function toImporter(dto: MicrocksImportJob): Importer {
  const demo = dto.demo ?? {};
  const failed = Boolean(dto.lastImportError);
  const secretName = dto.secretRef?.name;
  const lastSyncAt = dto.lastImportDate !== undefined ? iso(dto.lastImportDate) : undefined;
  const produces = (dto.serviceRefs ?? []).map<ProducedService>((ref, i) =>
    definedOnly({ protocol: demo.serviceProtocols?.[i] ?? 'REST', name: ref.name, version: ref.version, id: ref.serviceId || undefined }),
  );
  return definedOnly<Importer>({
    id: dto.id ?? dto.name,
    name: dto.name,
    source: definedOnly({ kind: 'url' as const, url: dto.repositoryUrl, secretName }),
    kind: demo.kind ?? detectArtifactKind(dto.repositoryUrl),
    origin: demo.origin ?? 'url',
    active: dto.active ?? true,
    state: demo.state ?? (failed ? 'failed' : 'idle'),
    schedule: demo.schedule ?? 'every hour',
    lastSyncAt,
    secretName,
    versions: demo.versions ?? [],
    url: dto.repositoryUrl,
    role: dto.mainArtifact === false ? 'secondary' : 'primary',
    artifactLabel: demo.artifactLabel ?? '',
    artifactNote: demo.artifactNote,
    secretType: demo.secretType,
    sslValidation: !dto.repositoryDisableSSLValidation,
    labels: Object.entries(dto.metadata?.labels ?? {}).map(([key, value]) => ({ key, value })),
    createdAt: iso(dto.createdDate ?? dto.metadata?.createdOn ?? 0),
    createdBy: demo.createdBy ?? '',
    produces,
    workflows: demo.workflows,
    producedLabel: demo.producedLabel,
    health: demo.health ?? (failed ? 'failed' : 'imported'),
    error: demo.error ?? (dto.lastImportError ? { message: dto.lastImportError, since: lastSyncAt ?? '', detail: '', servedSince: '' } : undefined),
    warning: demo.warning,
    timeline: demo.timeline ?? [],
  });
}

/** The type of a plain Microcks secret, read from the credentials it holds. */
function kindOf(dto: MicrocksSecret): SecretKind {
  if (dto.caCertPem) return 'ca';
  if (dto.username) return 'basic';
  return 'token';
}

/** Microcks `Secret` -> secret summary (never the value). */
export function toSecretSummary(dto: MicrocksSecret): SecretSummary {
  const demo = dto.demo ?? {};
  return definedOnly<SecretSummary>({
    id: dto.id ?? dto.name,
    name: dto.name,
    kind: demo.kind ?? kindOf(dto),
    description: dto.description,
    masked: demo.masked ?? '••••••••',
    detail: demo.detail,
    usedBy: demo.usedBy,
    createdAt: demo.createdAt ?? '',
    updatedAt: demo.updatedAt,
  });
}

/** Secret input -> Microcks `Secret` request: the value goes in the credential field of its kind; empty, it is left out (kept). */
export function toMicrocksSecretRequest(name: string, input: Omit<SecretInput, 'name'>): MicrocksSecret {
  return definedOnly<MicrocksSecret>({
    name,
    description: input.description,
    ...(input.value ? { [SECRET_VALUE_FIELD[input.kind]]: input.value } : {}),
    demo: definedOnly({ kind: input.kind, detail: input.detail }),
  });
}

/** Microcks `Secret` request -> secret input (the MSW handlers' side of `toMicrocksSecretRequest`). */
export function toSecretInput(dto: MicrocksSecret): SecretInput {
  const kind = dto.demo?.kind ?? kindOf(dto);
  return definedOnly<SecretInput>({
    name: dto.name,
    kind,
    description: dto.description,
    value: dto[SECRET_VALUE_FIELD[kind]] ?? '',
    detail: dto.demo?.detail,
  });
}
