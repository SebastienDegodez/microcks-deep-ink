import { getContext, setContext, untrack, type Component } from 'svelte';
import type { RouteHandle } from './nav';
import {
  createPath,
  createSearchParams,
  flattenAndRankRoutes,
  matchRoutes,
  parsePath,
  resolveTo,
  routePathnames,
  type Location,
  type Params,
  type Path,
  type RouteBranch,
  type RouteMatch,
  type RouteNode,
  type SearchParamsInit,
} from './routing';

/**
 * Hash router of the demo, with the behaviour of the reference demo's data router:
 * - the URL is written when a navigation COMMITS, after the page module has loaded; until then the
 *   previous page stays on screen, and a newer navigation cancels a pending one;
 * - the very first render waits for the first page module (nothing is shown before);
 * - a link to the current location replaces the history entry instead of pushing a new one;
 * - a page module that fails to load renders the route error page inside the shell.
 */

/** Module of a page: its default export is the page component. */
export interface PageModule {
  default: Component;
}

export interface AppRoute extends RouteNode {
  handle?: RouteHandle;
  /** Lazy import of the page module. */
  load?: () => Promise<PageModule>;
  /** Target of a redirect route (rendered as `<Navigate replace>`). */
  redirect?: string;
  children?: AppRoute[];
}

export type AppMatch = RouteMatch<AppRoute>;

export type To = string | Partial<Path>;

export interface NavigateOptions {
  replace?: boolean;
  state?: unknown;
}

export interface NavigateFunction {
  (to: To, options?: NavigateOptions): void;
  (delta: number): void;
}

type Action = 'POP' | 'PUSH' | 'REPLACE';

interface HistoryState {
  usr?: unknown;
  key?: string;
  idx?: number | null;
}

function historyState(): HistoryState | null {
  return window.history.state as HistoryState | null;
}

function createKey(): string {
  return Math.random().toString(36).substring(2, 10);
}

/** The location held in the URL hash (`#/services?x=1`), as a browser router reads `window.location`. */
function readLocation(): Location {
  const { pathname: parsed = '/', search = '', hash = '' } = parsePath(window.location.hash.substring(1));
  // A hash route always has a leading slash, so `/#something` matches like `/something` (a 404, not the root).
  const pathname = !parsed.startsWith('/') && !parsed.startsWith('.') ? `/${parsed}` : parsed;
  const state = historyState();
  return { pathname, search, hash, state: state?.usr ?? null, key: state?.key ?? 'default' };
}

export class Router {
  /** Current (committed) location. */
  location = $state.raw<Location>({ pathname: '/', search: '', hash: '', state: null, key: 'default' });
  /** Matched routes of the current location, root first. Empty when nothing matches. */
  matches = $state.raw<AppMatch[]>([]);
  /** Set when the page module of the current location could not be loaded. */
  failure = $state.raw<{ error: unknown } | null>(null);
  /** False until the first navigation has committed. */
  ready = $state.raw(false);

  readonly #branches: RouteBranch<AppRoute>[];
  readonly #modules = new Map<string, Component>();
  #token = 0;
  readonly #onpopstate = () => this.#start('POP', readLocation());

  constructor(routes: AppRoute[]) {
    this.#branches = flattenAndRankRoutes(routes);
    const state = historyState();
    if (state?.idx == null) window.history.replaceState({ ...state, idx: 0 }, '');
    window.addEventListener('popstate', this.#onpopstate);
    this.#start('POP', readLocation());
  }

  /** Component of the deepest matched route, once loaded. */
  get page(): Component | undefined {
    const leaf = this.matches[this.matches.length - 1];
    return leaf ? this.#modules.get(leaf.route.id) : undefined;
  }

  /** Params of the deepest matched route (they include the params of its parents). */
  get params(): Params {
    return this.matches[this.matches.length - 1]?.params ?? {};
  }

  /** Resolves a link target against the current route and location. */
  resolve(to: To): Path {
    return untrack(() => resolveTo(to, routePathnames(this.matches), this.location.pathname));
  }

  /** `href` of a link to `to` (`#/path?search`). */
  href(to: To): string {
    return `#${createPath(resolveTo(to, routePathnames(this.matches), this.location.pathname))}`;
  }

  /** Programmatic navigation. Pushes a new history entry unless `replace`; a number moves in the history. */
  navigate: NavigateFunction = (to: To | number, options: NavigateOptions = {}): void => {
    if (typeof to === 'number') {
      window.history.go(to);
      return;
    }
    const path = this.resolve(to);
    this.#start(options.replace ? 'REPLACE' : 'PUSH', { ...path, state: options.state ?? null, key: createKey() });
  };

  /**
   * Click handler of a router link: lets the browser handle modified clicks (new tab, download...) and
   * other targets, else navigates without reloading. A link to the current location replaces it.
   */
  followLink(event: MouseEvent, to: To, options: NavigateOptions & { target?: string | null } = {}): void {
    if (event.defaultPrevented || event.button !== 0) return;
    if (options.target && options.target !== '_self') return;
    if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    const path = this.resolve(to);
    const replace = options.replace ?? untrack(() => createPath(this.location) === createPath(path));
    this.navigate(path, { replace, state: options.state });
  }

  destroy(): void {
    window.removeEventListener('popstate', this.#onpopstate);
    this.#token += 1;
  }

  #start(action: Action, location: Location): void {
    const token = ++this.#token;
    const matches = matchRoutes(this.#branches, location.pathname) ?? [];
    const missing = matches.filter((m) => m.route.load && !this.#modules.has(m.route.id));
    if (missing.length === 0) {
      this.#commit(action, location, matches, null);
      return;
    }
    Promise.all(missing.map((m) => (m.route.load as () => Promise<PageModule>)())).then(
      (modules) => {
        if (token !== this.#token) return;
        modules.forEach((module, i) => this.#modules.set((missing[i] as AppMatch).route.id, module.default));
        this.#commit(action, location, matches, null);
      },
      (error: unknown) => {
        if (token !== this.#token) return;
        this.#commit(action, location, matches, { error });
      },
    );
  }

  #commit(action: Action, location: Location, matches: AppMatch[], failure: { error: unknown } | null): void {
    const url = `#${createPath(location)}`;
    if (action === 'PUSH') {
      const idx = (historyState()?.idx ?? 0) + 1;
      window.history.pushState({ usr: location.state, key: location.key, idx }, '', url);
    } else if (action === 'REPLACE') {
      window.history.replaceState({ usr: location.state, key: location.key, idx: historyState()?.idx ?? null }, '', url);
    }
    this.location = location;
    this.matches = matches;
    this.failure = failure;
    this.ready = true;
  }
}

const ROUTER = Symbol('router');

export function createRouter(routes: AppRoute[]): Router {
  return new Router(routes);
}

/** Called once by `App` with the router of the document. */
export function provideRouter(router: Router): void {
  setContext(ROUTER, router);
}

export function useRouter(): Router {
  const router = getContext<Router | undefined>(ROUTER);
  if (!router) throw new Error('useRouter() must be used inside <App>');
  return router;
}

/** Params of the current route. Read them in markup or `$derived` (`params.serviceId`): they follow the URL. */
export function useParams(): Params {
  const router = useRouter();
  return new Proxy({} as Params, {
    get: (_, key) => (typeof key === 'string' ? router.params[key] : undefined),
    has: (_, key) => typeof key === 'string' && key in router.params,
    ownKeys: () => Reflect.ownKeys(router.params),
    getOwnPropertyDescriptor: (_, key) => {
      if (typeof key !== 'string' || !(key in router.params)) return undefined;
      return { value: router.params[key], enumerable: true, configurable: true, writable: false };
    },
  });
}

export type SetSearchParams = (next: SearchParamsInit | ((previous: URLSearchParams) => SearchParamsInit), options?: NavigateOptions) => void;

/**
 * Query string of the current location, and a setter that navigates to `?<next>` (pushes unless
 * `replace`). The params follow the URL: read them in markup or `$derived` (`search.get('tab')`).
 */
export function useSearchParams(): [URLSearchParams, SetSearchParams] {
  const router = useRouter();
  const search = new Proxy(new URLSearchParams(), {
    get: (_, key) => {
      const current = new URLSearchParams(router.location.search);
      const value: unknown = Reflect.get(current, key, current);
      return typeof value === 'function' ? value.bind(current) : value;
    },
  });
  const setSearch: SetSearchParams = (next, options) => {
    const previous = untrack(() => new URLSearchParams(router.location.search));
    router.navigate(`?${createSearchParams(typeof next === 'function' ? next(previous) : next)}`, options);
  };
  return [search, setSearch];
}

export function useNavigate(): NavigateFunction {
  return useRouter().navigate;
}

/** The current location. Its fields follow the URL: read them in markup or `$derived`. */
export function useLocation(): Location {
  const router = useRouter();
  return {
    get pathname() {
      return router.location.pathname;
    },
    get search() {
      return router.location.search;
    },
    get hash() {
      return router.location.hash;
    },
    get state() {
      return router.location.state;
    },
    get key() {
      return router.location.key;
    },
  };
}
