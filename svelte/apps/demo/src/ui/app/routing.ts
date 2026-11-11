/**
 * Framework-free URL matching, the same algorithm as the reference demo's router (path ranking,
 * optional segments, splats, path resolution), so both demos pick the same route for every URL.
 */

export interface Path {
  pathname: string;
  search: string;
  hash: string;
}

export interface Location extends Path {
  state: unknown;
  key: string;
}

export type Params = Record<string, string | undefined>;

export interface RouteNode {
  id: string;
  path?: string;
  index?: boolean;
  caseSensitive?: boolean;
  children?: RouteNode[];
}

export interface RouteMatch<R extends RouteNode> {
  params: Params;
  pathname: string;
  pathnameBase: string;
  route: R;
}

interface CompiledParam {
  paramName: string;
  isOptional?: boolean;
}

interface RouteMeta<R extends RouteNode> {
  relativePath: string;
  caseSensitive: boolean;
  childrenIndex: number;
  route: R;
  matcher: RegExp;
  compiledParams: CompiledParam[];
}

export interface RouteBranch<R extends RouteNode> {
  path: string;
  score: number;
  routesMeta: RouteMeta<R>[];
}

export function parsePath(path: string): Partial<Path> {
  const parsed: Partial<Path> = {};
  if (path) {
    const hashIndex = path.indexOf('#');
    if (hashIndex >= 0) {
      parsed.hash = path.substring(hashIndex);
      path = path.substring(0, hashIndex);
    }
    const searchIndex = path.indexOf('?');
    if (searchIndex >= 0) {
      parsed.search = path.substring(searchIndex);
      path = path.substring(0, searchIndex);
    }
    if (path) parsed.pathname = path;
  }
  return parsed;
}

export function createPath({ pathname = '/', search = '', hash = '' }: Partial<Path>): string {
  if (search && search !== '?') pathname += search.charAt(0) === '?' ? search : `?${search}`;
  if (hash && hash !== '#') pathname += hash.charAt(0) === '#' ? hash : `#${hash}`;
  return pathname;
}

const removeDoubleSlashes = (path: string): string => path.replace(/[\\/]{2,}/g, '/');
const joinPaths = (paths: string[]): string => removeDoubleSlashes(paths.join('/'));

function removeTrailingSlash(path: string, minLength = 0): string {
  let end = path.length;
  while (end > minLength && path.charCodeAt(end - 1) === 47) end--;
  return end === path.length ? path : path.slice(0, end);
}

const normalizePathname = (pathname: string): string => removeTrailingSlash(pathname).replace(/^\/*/, '/');
const normalizeSearch = (search: string): string => (!search || search === '?' ? '' : search.startsWith('?') ? search : `?${search}`);
const normalizeHash = (hash: string): string => (!hash || hash === '#' ? '' : hash.startsWith('#') ? hash : `#${hash}`);

function compilePath(path: string, caseSensitive = false, end = true): [RegExp, CompiledParam[]] {
  const params: CompiledParam[] = [];
  let source =
    '^' +
    path
      .replace(/\/*\*?$/, '')
      .replace(/^\/*/, '/')
      .replace(/[\\.*+^${}|()[\]]/g, '\\$&')
      .replace(/\/:([\w-]+)(\?)?/g, (match: string, paramName: string, isOptional: string | undefined, index: number, str: string) => {
        params.push({ paramName, isOptional: isOptional != null });
        if (isOptional) {
          const nextChar = str.charAt(index + match.length);
          if (nextChar && nextChar !== '/') return '/([^\\/]*)';
          return '(?:/([^\\/]*))?';
        }
        return '/([^\\/]+)';
      })
      .replace(/\/((?:[^/?()[\]*^\\]|\\.)+)\?(?=\/|$|\()/g, '(?:/$1)?');
  if (path.endsWith('*')) {
    params.push({ paramName: '*' });
    source += path === '*' || path === '/*' ? '(.*)$' : '(?:\\/(.+)|\\/*)$';
  } else if (end) source += '\\/*$';
  else if (path !== '' && path !== '/') source += '(?:(?=\\/|$))';
  return [new RegExp(source, caseSensitive ? undefined : 'i'), params];
}

function matchPathImpl(pathname: string, matcher: RegExp, compiledParams: CompiledParam[]): { params: Params; pathname: string; pathnameBase: string } | null {
  const match = pathname.match(matcher);
  if (!match) return null;
  const matchedPathname = match[0];
  let pathnameBase = removeTrailingSlash(matchedPathname, 1);
  const captureGroups = match.slice(1);
  const params = compiledParams.reduce<Params>((memo, { paramName, isOptional }, index) => {
    if (paramName === '*') {
      const splatValue = captureGroups[index] || '';
      pathnameBase = removeTrailingSlash(matchedPathname.slice(0, matchedPathname.length - splatValue.length), 1);
    }
    const value = captureGroups[index];
    memo[paramName] = isOptional && !value ? undefined : (value || '').replace(/%2F/g, '/');
    return memo;
  }, {});
  return { params, pathname: matchedPathname, pathnameBase };
}

function decodePath(value: string): string {
  try {
    return value
      .split('/')
      .map((v) => decodeURIComponent(v).replace(/\//g, '%2F'))
      .join('/');
  } catch {
    return value;
  }
}

function explodeOptionalSegments(path: string): string[] {
  const segments = path.split('/');
  if (segments.length === 0) return [];
  const [first, ...rest] = segments as [string, ...string[]];
  const isOptional = first.endsWith('?');
  const required = first.replace(/\?$/, '');
  if (rest.length === 0) return isOptional ? [required, ''] : [required];
  const restExploded = explodeOptionalSegments(rest.join('/'));
  const result: string[] = [];
  result.push(...restExploded.map((subpath) => (subpath === '' ? required : [required, subpath].join('/'))));
  if (isOptional) result.push(...restExploded);
  return result.map((exploded) => (path.startsWith('/') && exploded === '' ? '/' : exploded));
}

const paramRe = /^:[\w-]+$/;
const partialParamRe = /^:[\w-]+/;
const isSplat = (s: string): boolean => s === '*';

function computeScore(path: string, index: boolean | undefined): number {
  const segments = path.split('/');
  let initialScore = segments.length;
  if (segments.some(isSplat)) initialScore += -2;
  if (index) initialScore += 2;
  return segments
    .filter((s) => !isSplat(s))
    .reduce((score, segment) => score + (paramRe.test(segment) ? 3 : partialParamRe.test(segment) ? 3.5 : segment === '' ? 1 : 10), initialScore);
}

function compareIndexes(a: number[], b: number[]): number {
  const sameParents = a.length === b.length && a.slice(0, -1).every((n, i) => n === b[i]);
  return sameParents ? (a[a.length - 1] as number) - (b[b.length - 1] as number) : 0;
}

type Meta<R extends RouteNode> = Omit<RouteMeta<R>, 'matcher' | 'compiledParams'>;

function flattenRoutes<R extends RouteNode>(routes: readonly R[], branches: RouteBranch<R>[] = [], parentsMeta: Meta<R>[] = [], parentPath = ''): RouteBranch<R>[] {
  const flattenRoute = (route: R, index: number, relativePath?: string): void => {
    const meta: Meta<R> = {
      relativePath: relativePath === undefined ? route.path || '' : relativePath,
      caseSensitive: route.caseSensitive === true,
      childrenIndex: index,
      route,
    };
    if (meta.relativePath.startsWith('/')) {
      if (!meta.relativePath.startsWith(parentPath)) throw new Error(`Absolute route path "${meta.relativePath}" nested under path "${parentPath}" is not valid.`);
      meta.relativePath = meta.relativePath.slice(parentPath.length);
    }
    const path = joinPaths([parentPath, meta.relativePath]);
    const routesMeta = parentsMeta.concat(meta);
    if (route.children && route.children.length > 0) flattenRoutes(route.children as R[], branches, routesMeta, path);
    if (route.path == null && !route.index) return;
    branches.push({
      path,
      score: computeScore(path, route.index),
      routesMeta: routesMeta.map((m, i) => {
        const [matcher, compiledParams] = compilePath(m.relativePath, m.caseSensitive, i === routesMeta.length - 1);
        return { ...m, matcher, compiledParams };
      }),
    });
  };
  routes.forEach((route, index) => {
    if (route.path === '' || !route.path?.includes('?')) flattenRoute(route, index);
    else for (const exploded of explodeOptionalSegments(route.path)) flattenRoute(route, index, exploded);
  });
  return branches;
}

/** Every routable branch of the tree, best match first. */
export function flattenAndRankRoutes<R extends RouteNode>(routes: readonly R[]): RouteBranch<R>[] {
  const branches = flattenRoutes(routes);
  branches.sort((a, b) =>
    a.score !== b.score
      ? b.score - a.score
      : compareIndexes(
          a.routesMeta.map((m) => m.childrenIndex),
          b.routesMeta.map((m) => m.childrenIndex),
        ),
  );
  return branches;
}

function matchRouteBranch<R extends RouteNode>(branch: RouteBranch<R>, pathname: string): RouteMatch<R>[] | null {
  const matchedParams: Params = {};
  let matchedPathname = '/';
  const matches: RouteMatch<R>[] = [];
  for (const meta of branch.routesMeta) {
    const remainingPathname = matchedPathname === '/' ? pathname : pathname.slice(matchedPathname.length) || '/';
    const match = matchPathImpl(remainingPathname, meta.matcher, meta.compiledParams);
    if (!match) return null;
    Object.assign(matchedParams, match.params);
    matches.push({
      params: matchedParams,
      pathname: joinPaths([matchedPathname, match.pathname]),
      pathnameBase: normalizePathname(joinPaths([matchedPathname, match.pathnameBase])),
      route: meta.route,
    });
    if (match.pathnameBase !== '/') matchedPathname = joinPaths([matchedPathname, match.pathnameBase]);
  }
  return matches;
}

/** The matched route chain (root first) for `pathname`, or `null`. */
export function matchRoutes<R extends RouteNode>(branches: readonly RouteBranch<R>[], pathname: string): RouteMatch<R>[] | null {
  const decoded = decodePath(pathname || '/');
  let matches: RouteMatch<R>[] | null = null;
  for (let i = 0; matches == null && i < branches.length; ++i) matches = matchRouteBranch(branches[i] as RouteBranch<R>, decoded);
  return matches;
}

function resolvePathname(relativePath: string, fromPathname: string): string {
  const segments = removeTrailingSlash(fromPathname).split('/');
  relativePath.split('/').forEach((segment) => {
    if (segment === '..') {
      if (segments.length > 1) segments.pop();
    } else if (segment !== '.') segments.push(segment);
  });
  return segments.length > 1 ? segments.join('/') : '/';
}

function resolvePath(to: Partial<Path>, fromPathname: string): Path {
  const { pathname: toPathname, search = '', hash = '' } = to;
  let pathname: string;
  if (toPathname) {
    const clean = removeDoubleSlashes(toPathname);
    pathname = clean.startsWith('/') || clean.startsWith('\\') ? resolvePathname(clean.substring(1), '/') : resolvePathname(clean, fromPathname);
  } else pathname = fromPathname;
  return { pathname, search: normalizeSearch(search), hash: normalizeHash(hash) };
}

/** Pathnames a relative `to` resolves against: the matches that contribute a path segment. */
export function routePathnames<R extends RouteNode>(matches: readonly RouteMatch<R>[]): string[] {
  const contributing = matches.filter((m, i) => i === 0 || (m.route.path && m.route.path.length > 0));
  return contributing.map((m, i) => (i === contributing.length - 1 ? m.pathname : m.pathnameBase));
}

/** Resolves a link target (`/abs`, `rel`, `../up`, `?search`) against the current route and location. */
export function resolveTo(toArg: string | Partial<Path>, pathnames: readonly string[], locationPathname: string): Path {
  const to: Partial<Path> = typeof toArg === 'string' ? parsePath(toArg) : { ...toArg };
  const isEmptyPath = toArg === '' || to.pathname === '';
  const toPathname = isEmptyPath ? '/' : to.pathname;
  let from: string;
  if (toPathname == null) from = locationPathname;
  else {
    let index = pathnames.length - 1;
    if (toPathname.startsWith('..')) {
      const toSegments = toPathname.split('/');
      while (toSegments[0] === '..') {
        toSegments.shift();
        index -= 1;
      }
      to.pathname = toSegments.join('/');
    }
    from = index >= 0 ? (pathnames[index] as string) : '/';
  }
  const path = resolvePath(to, from);
  const explicitTrailingSlash = toPathname && toPathname !== '/' && toPathname.endsWith('/');
  const currentTrailingSlash = (isEmptyPath || toPathname === '.') && locationPathname.endsWith('/');
  if (!path.pathname.endsWith('/') && (explicitTrailingSlash || currentTrailingSlash)) path.pathname += '/';
  return path;
}

export type SearchParamsInit = string | string[][] | Record<string, string | string[]> | URLSearchParams;

/** `new URLSearchParams(init)` that also accepts arrays as values in the object form. */
export function createSearchParams(init: SearchParamsInit = ''): URLSearchParams {
  if (typeof init === 'string' || Array.isArray(init) || init instanceof URLSearchParams) return new URLSearchParams(init);
  return new URLSearchParams(
    Object.keys(init).reduce<string[][]>((memo, key) => {
      const value = init[key] as string | string[];
      return memo.concat(Array.isArray(value) ? value.map((v) => [key, v]) : [[key, value]]);
    }, []),
  );
}
