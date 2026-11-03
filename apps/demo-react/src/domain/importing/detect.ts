import type { ArtifactKind } from './types';

export const RECOGNIZED_FORMATS = [
  'OpenAPI',
  'AsyncAPI',
  'Arazzo',
  'gRPC/Protobuf',
  'GraphQL',
  'Postman',
  'SoapUI',
  'HAR',
  'APIMetadata',
  'APIExamples',
] as const;

/** Guesses what an artifact is from its name or URL (the real Microcks reads the content). */
export function detectArtifactKind(nameOrUrl: string): ArtifactKind {
  const n = nameOrUrl.toLowerCase();
  if (n.includes('arazzo')) return 'arazzo';
  if (/\.proto(\?|$)/.test(n)) return 'grpc';
  if (/\.(graphql|gql)(\?|$)/.test(n)) return 'graphql';
  if (n.includes('postman') || n.includes('getpostman.com')) return 'postman';
  if (/\.(wsdl)(\?|$)/.test(n) || n.includes('soapui')) return 'soap';
  if (n.includes('asyncapi')) return 'asyncapi';
  if (/\.(ya?ml|json)(\?|$)/.test(n) || n.includes('openapi') || n.includes('swagger')) return 'openapi';
  return 'unknown';
}

/** "apipastry-openapi.yaml" → "Apipastry", "HelloService-soapui-project.xml" → "HelloService". */
export function nameFromFile(fileName: string): string {
  const base = (fileName.split('/').pop() ?? fileName).replace(/\.[a-z]+$/i, '');
  const first = base.split(/[-_.]/)[0] ?? base;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

/** Absolute http(s) URL, as the real importer needs. Returns an error message or undefined. */
export function validateArtifactUrl(url: string): string | undefined {
  const text = url.trim();
  if (!text) return 'Enter the URL of the artifact.';
  try {
    const parsed = new URL(text);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return 'Use an http or https URL.';
  } catch {
    return 'Enter an absolute URL, for example https://raw.githubusercontent.com/acme/contracts/main/openapi.yaml.';
  }
  return undefined;
}

export interface GitForm {
  name: string;
  url: string;
}

/** Field errors of the Git repository tab. */
export function validateGitForm(form: GitForm): Partial<Record<keyof GitForm, string>> {
  const errors: Partial<Record<keyof GitForm, string>> = {};
  if (!form.name.trim()) errors.name = 'Name the importer, for example API Pastry — main.';
  const url = validateArtifactUrl(form.url);
  if (url) errors.url = url;
  return errors;
}
