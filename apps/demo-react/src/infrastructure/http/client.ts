import { BackendError, NotFoundError, ValidationError } from '@/application/shared';

/**
 * Minimal JSON client used by the `src/infrastructure/http/<feature>` adapters.
 *
 * Paths are relative to `baseUrl` (a leading `/` is ignored), so the demo keeps working under any sub-path:
 * `get('services/pastry2')` with the default base fetches `<page directory>/api/services/pastry2`.
 *
 * Errors are mapped to `@/application/shared` errors, so use cases and pages never see an HTTP status:
 * 404 -> `NotFoundError`, 400/422 -> `ValidationError`, any other non-2xx -> `BackendError(status)`,
 * no response (network failure) -> `BackendError(null)`. An aborted request rejects with the original `AbortError`.
 */
export interface HttpClient {
  get<T>(path: string, options?: RequestOptions): Promise<T>;
  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  delete<T = void>(path: string, options?: RequestOptions): Promise<T>;
}

export interface RequestOptions {
  /** Appended as a query string; `undefined` values are skipped, arrays repeat the key. */
  query?: Record<string, string | number | boolean | ReadonlyArray<string> | undefined>;
  signal?: AbortSignal;
}

export interface HttpClientOptions {
  /** Absolute base URL of the API, e.g. `https://host/microcks-deep-ink/demo/api/`. */
  baseUrl: string;
  /** Defaults to the global `fetch`, looked up at call time (so MSW interception applies). */
  fetch?: typeof fetch;
}

/** Body of a non-2xx answer. Every field is optional: the client falls back to the status and the path. */
export interface HttpErrorBody {
  message?: string;
  entity?: string;
  id?: string;
}

/** `<directory of the current page>/api/`: under GitHub Pages, `/microcks-deep-ink/demo/api/`. */
export function defaultApiBaseUrl(): string {
  return new URL('api/', globalThis.location?.href ?? 'http://localhost/').href;
}

export function createHttpClient(options: HttpClientOptions): HttpClient {
  const base = options.baseUrl.endsWith('/') ? options.baseUrl : `${options.baseUrl}/`;
  const doFetch = options.fetch ?? ((input: RequestInfo | URL, init?: RequestInit) => globalThis.fetch(input, init));

  async function request<T>(method: string, path: string, body: unknown, opts: RequestOptions = {}): Promise<T> {
    const url = new URL(path.replace(/^\/+/, ''), base);
    for (const [key, value] of Object.entries(opts.query ?? {})) {
      if (value === undefined) continue;
      for (const item of Array.isArray(value) ? value : [value]) url.searchParams.append(key, String(item));
    }
    const headers: Record<string, string> = { accept: 'application/json' };
    if (body !== undefined) headers['content-type'] = 'application/json';

    let response: Response;
    try {
      response = await doFetch(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: opts.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') throw error;
      throw new BackendError(`${method} ${path}: network error`, null);
    }

    if (!response.ok) throw await toError(method, path, response);
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    if (text === '') return undefined as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new BackendError(`${method} ${path}: invalid JSON`, response.status);
    }
  }

  return {
    get: (path, opts) => request('GET', path, undefined, opts),
    post: (path, body, opts) => request('POST', path, body, opts),
    put: (path, body, opts) => request('PUT', path, body, opts),
    patch: (path, body, opts) => request('PATCH', path, body, opts),
    delete: (path, opts) => request('DELETE', path, undefined, opts),
  };
}

async function toError(method: string, path: string, response: Response): Promise<Error> {
  let body: HttpErrorBody = {};
  try {
    const parsed: unknown = await response.json();
    if (parsed && typeof parsed === 'object') body = parsed as HttpErrorBody;
  } catch {
    // Not JSON: keep the defaults.
  }
  switch (response.status) {
    case 404:
      return new NotFoundError(body.entity ?? 'Resource', body.id ?? path);
    case 400:
    case 422:
      return new ValidationError(body.message ?? `${method} ${path}: ${response.status}`);
    default:
      return new BackendError(body.message ?? `${method} ${path}: ${response.status}`, response.status);
  }
}
