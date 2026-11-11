import type { Behavior, ParameterConstraint } from '../../domain/catalog/index.js';
import type { Example, ServiceSummary } from '../../domain/shared/index.js';

/** One-click default delays, in ms. */
export const DELAY_PRESETS: readonly number[] = [0, 100, 250, 500, 1000];

/** Served examples of an operation: a pending AI example is not served until it is accepted, so it does not count here. */
export const servedExamples = (examples: readonly Example[]) => examples.filter((e) => e.reviewState !== 'pending');

/** Parameters of an operation path template: `/pastries/{name}` gives `['name']`. */
export const pathParamsOf = (path: string) => [...path.matchAll(/\{([^}]+)\}/g)].map((m) => m[1] as string);

/** The contract infers URI_PARTS on the path parameters; say so only while that is what is saved. */
export const isInferred = (saved: Behavior | undefined, pathParams: readonly string[]) => saved?.dispatcher === 'URI_PARTS' && saved.rule === pathParams.join(' && ');

/** Constraints by location: "1 header · 2 query". */
export function constraintCounts(constraints: readonly ParameterConstraint[]): string {
  const headerCount = constraints.filter((c) => c.in === 'header').length;
  return `${headerCount} header · ${constraints.length - headerCount} query`;
}

/** What the default delay and its strategy do to every response. */
export const delayHelp = ({ delayMs, delayStrategy }: Pick<Behavior, 'delayMs' | 'delayStrategy'>) =>
  delayMs === 0
    ? 'No delay: responses return immediately.'
    : (delayStrategy ?? 'fixed') === 'fixed'
      ? `Every response waits exactly ${delayMs} ms.`
      : `The wait varies on every call, based on ${delayMs} ms. Use random-N in the raw value to bound the range.`;

/** Base URL of the REST mock of a service, shown under the simulator's request field. */
export const mockBaseOf = (service: Pick<ServiceSummary, 'name' | 'version'>) => `http://microcks.local:8080/rest/${service.name.replace(/ /g, '+')}/${service.version}`;
