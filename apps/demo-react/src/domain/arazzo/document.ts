import type { Protocol } from '@/domain/shared';

/** Why an Arazzo feature outside the POC subset was refused at import. */
export type ImportIssueCode =
  | 'goto'
  | 'jsonpath-criteria'
  | 'xpath-criteria'
  | 'workflow-id-step'
  | 'operation-path-step'
  | 'workflow-depends-on'
  | 'workflow-success-actions'
  | 'workflow-failure-actions'
  | 'components-action'
  | 'cookie-parameter';

export interface ImportIssue {
  code: ImportIssueCode;
  /** JSON pointer-like location, e.g. `workflows[0].steps[2].onFailure[0]`. */
  path: string;
  message: string;
}

/** A source description, linked (matched) or not (no API imported yet) to a Microcks API. */
export type SourceLink =
  | { status: 'linked'; serviceId: string; protocol: Protocol; operationsFound: string }
  | { status: 'not-linked'; expectedFile: string };

export interface SourceDescription {
  name: string;
  type: 'openapi' | 'asyncapi';
  url: string;
  link: SourceLink;
}

export interface ArazzoDocument {
  /** `pastry` | `beer` in the seed. */
  id: string;
  /** Identifier used in the API snippet (hex). */
  apiId: string;
  file: string;
  title: string;
  arazzoVersion: string;
  version: string;
  /** Where the document comes from, e.g. "Synced 12 min ago from GitHub". */
  origin: string;
  /** Name of the ArazzoSources overlay file, when there is one. */
  overlay?: string;
  sources: SourceDescription[];
  workflowIds: string[];
  /** Features refused at import (empty for a clean document). */
  importIssues: ImportIssue[];
}
