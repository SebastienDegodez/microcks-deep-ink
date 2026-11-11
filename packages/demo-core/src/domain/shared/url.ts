/** The parts of a WHATWG URL that the domain reads. */
export interface UrlParts {
  readonly protocol: string;
  readonly host: string;
  readonly pathname: string;
  readonly search: string;
}

type UrlConstructor = new (input: string) => UrlParts;

/**
 * Parses an absolute URL with the host's WHATWG `URL` (browsers, Node). demo-core typechecks against
 * ES2022 only, which does not declare it. Throws a `TypeError` on invalid input, like `new URL`.
 */
export function parseUrl(input: string): UrlParts {
  const { URL: WhatwgUrl } = globalThis as unknown as { URL: UrlConstructor };
  return new WhatwgUrl(input);
}
