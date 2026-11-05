"""Pixel guard for behaviour-preserving refactors of apps/demo-react.

usage:
  python3 -I snap.py shoot <worktree> <out-dir> [--no-build] [--routes r1,r2,...] [--app apps/demo-react]
      Builds the @microcks/deep-ink package when the worktree has it, then the demo (vite build), crawls every in-app hash link from "/" (max 120 routes),
      screenshots each route at 1440 px, full page, in dark AND light. Writes <out>/routes.txt.
      --app is the demo app directory relative to the worktree (default apps/demo-react); its dist/ is served.
  python3 -I snap.py diff <baseline-dir> <after-dir> [--tolerant]
      Compares every PNG pair; prints the routes whose pixels differ (with % of changed pixels)
      and writes <after>/diff-<name>.png highlighting changes. Exit code 1 if anything differs.
      A small change (<= 200 px, every channel within +-2) is reported as NEAR and still fails,
      unless --tolerant is given (opt-in, for known anti-aliasing jitter only).
      When both dirs have anim/ (from probe), any JSON difference is an `ANIM <file>` failure.
  python3 -I snap.py states <worktree> <out-dir> [--no-build] [--only id1,id2] [--file states.json] [--app ...]
      Replays each state of states.json (route as-is, then focus by role + name, keys, type) and captures
      <id>--<theme>.png with the shoot settings.
  python3 -I snap.py probe <worktree> <out-dir> [--no-build] [--routes ...] [--app ...]
      Without reduced motion, writes <out>/anim/<safe-route>.json: every element whose animation-name != none.
  python3 -I snap.py leak <worktree> <out-dir> [--no-build] [--routes ...] [--app ...] [--tolerant]
      One page per theme visits every route by hash navigation, re-captures each into <out>/leak/ and compares with a
      fresh-page capture (<out>/fresh/). A difference is `LEAK <foreign rules> -> <routes>` (exit 1) only when swapping
      the accumulated stylesheets into the fresh page changes its pixels and a rule from a sheet the route does not load
      matches an element whose computed value of a declared property changed; otherwise `LEAK-NOISE` (non-failing).
  states and leak run on a paused fake clock (Playwright clock), advanced by fixed amounts.
  probe and leak default to routes.txt next to this script.

Typical refactor loop: shoot the baseline BEFORE editing (or from origin/main), edit,
shoot again with --routes from the baseline's routes.txt, then diff.
"""
import contextlib, json, os, socket, subprocess, sys, time, re
from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright

def free_port():
    s = socket.socket(); s.bind(('127.0.0.1', 0)); p = s.getsockname()[1]; s.close(); return p

def safe(route):
    return re.sub(r'[^A-Za-z0-9]+', '_', route).strip('_') or 'root'

HERE = os.path.dirname(os.path.abspath(__file__))
VIEWPORT = {'width': 1440, 'height': 1000}

def build_demo(wt, app):
    demo = os.path.join(wt, app)
    # Since the workspaces PR 8 the demo consumes the @microcks/deep-ink package (react/packages/deep-ink, a link:):
    # build it first. Needs the root packages built once (`pnpm build`) and `pnpm -C react install`.
    pkg = os.path.join(wt, 'react', 'packages', 'deep-ink')
    if os.path.exists(os.path.join(pkg, 'package.json')):
        if not os.path.isdir(os.path.join(pkg, 'node_modules')):
            r = subprocess.run(['pnpm', 'install', '--frozen-lockfile'], cwd=os.path.join(wt, 'react'), capture_output=True, text=True)
            if r.returncode:
                print(r.stdout[-2000:], r.stderr[-2000:]); sys.exit(2)
        r = subprocess.run(['pnpm', 'run', 'build'], cwd=pkg, capture_output=True, text=True)
        if r.returncode:
            print(r.stdout[-2000:], r.stderr[-2000:]); sys.exit(2)
    r = subprocess.run(['pnpm', 'exec', 'vite', 'build', '--logLevel', 'error'], cwd=demo, capture_output=True, text=True)
    if r.returncode:
        print(r.stdout[-2000:], r.stderr[-2000:]); sys.exit(2)

# Software raster, one raster thread, no partial raster: removes the 1-step anti-aliasing jitter (NEAR) that GPU/threaded
# raster leaves on table borders and tab underlines. Used by states and leak; shoot keeps the default for its baselines.
DETERMINISTIC_ARGS = ['--disable-gpu', '--disable-gpu-rasterization', '--disable-zero-copy', '--num-raster-threads=1',
                      '--disable-partial-raster']

@contextlib.contextmanager
def served(wt, app, build, args=()):
    """Builds (unless build is False), serves <app>/dist and yields (base url, chromium browser)."""
    if build: build_demo(wt, app)
    port = free_port()
    srv = subprocess.Popen(['python3', '-m', 'http.server', str(port), '-d', os.path.join(wt, app, 'dist')],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1)
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=list(args))
            try: yield f'http://127.0.0.1:{port}/', b
            finally: b.close()
    finally:
        srv.kill()

FROZEN_AT = 1_800_000_000_000  # fixed fake clock (ms since epoch) for states and leak

def new_page(b, theme, reduced=True, frozen=False):
    pg = b.new_page(viewport=VIEWPORT, color_scheme=theme, reduced_motion='reduce' if reduced else 'no-preference')
    pg.add_init_script(f"try{{localStorage.setItem('microcks-theme','{theme}')}}catch(e){{}}")
    if frozen:
        # Date, timers and rAF are faked and paused: JS-driven updates (cockpit traffic ticker every 1.2 s, live counters)
        # only advance through settle(), by a fixed amount, so captures do not depend on machine load.
        pg.clock.install(time=FROZEN_AT); pg.clock.pause_at(FROZEN_AT + 1000)
    return pg

def settle(pg, fake_ms=2000, rounds=4):
    """Alternates real waits (chunks, promises) with fixed steps of the paused clock: exactly fake_ms of timers fire,
    in rounds so loaders that chain a timer after an async import still complete."""
    for _ in range(rounds):
        pg.wait_for_timeout(400); pg.clock.run_for(fake_ms // rounds)
    pg.wait_for_timeout(300)

def capture(b, base, route, theme, path):
    """The reference capture: fresh page, reduced motion, animations disabled, full page."""
    pg = new_page(b, theme)
    pg.goto(base + '#' + route); pg.wait_for_timeout(1200)
    pg.screenshot(path=path, full_page=True, animations='disabled')
    pg.close()

def prime(pg):
    """Chromium keeps a different text-measurement state in a document once a full-page screenshot of content taller
    than the viewport was taken (fallback monospace glyphs get wider: 'Ctrl K' 50 -> 57 px), until the next reload.
    leak's single page is in that state after its first tall route, so its fresh references are put in it too."""
    pg.evaluate("() => { document.documentElement.style.minHeight = '3000px' }")
    pg.screenshot(full_page=True)
    pg.evaluate("() => { document.documentElement.style.minHeight = '' }"); pg.wait_for_timeout(200)

def shoot(wt, out, build=True, routes=None, app='apps/demo-react'):
    os.makedirs(out, exist_ok=True)
    with served(wt, app, build) as (base, b):
        if routes is None:
            seen, queue = [], ['/']
            pg = b.new_page(viewport=VIEWPORT)
            while queue and len(seen) < 120:
                r = queue.pop(0)
                if r in seen: continue
                seen.append(r)
                pg.goto(base + '#' + r); pg.wait_for_timeout(600)
                for h in pg.eval_on_selector_all('a[href^="#/"]', 'els => els.map(e => e.getAttribute("href"))'):
                    h = h[1:].split('?')[0]
                    if h not in seen and h not in queue: queue.append(h)
            pg.close()
            routes = seen
        with open(os.path.join(out, 'routes.txt'), 'w') as f: f.write('\n'.join(routes))
        for theme in ('dark', 'light'):
            for r in routes:
                capture(b, base, r, theme, os.path.join(out, f'{safe(r)}--{theme}.png'))
    print(f'{len(routes)} routes x 2 themes -> {out}')

def load_states(path, only=None):
    with open(path) as f: states = json.load(f)
    ids = [s['id'] for s in states]
    dup = {i for i in ids if ids.count(i) > 1}
    if dup: print('duplicate state id(s):', ', '.join(sorted(dup))); sys.exit(2)
    if only:
        missing = [i for i in only if i not in ids]
        if missing: print('unknown state id(s):', ', '.join(missing)); sys.exit(2)
        states = [s for s in states if s['id'] in only]
    return states

def replay(pg, base, st):
    """Opens st.route as-is (query string kept), then focus -> keys -> type. Targets only by role + accessible name."""
    pg.goto(base + '#' + st['route']); settle(pg)
    if 'focus' in st:
        f = st['focus']
        pg.get_by_role(f['role'], name=f['name'], exact=f.get('exact', True)).focus(timeout=5000)
    for k in st.get('keys', []):
        pg.keyboard.press(k); settle(pg, 200, 1)
    if 'type' in st:
        pg.keyboard.type(st['type'], delay=20)
    settle(pg, 800, 2)

def states(wt, out, build=True, only=None, app='apps/demo-react', file=None):
    os.makedirs(out, exist_ok=True)
    sts = load_states(file or os.path.join(HERE, 'states.json'), only)
    failed = []
    with served(wt, app, build, DETERMINISTIC_ARGS) as (base, b):
        for theme in ('dark', 'light'):
            for st in sts:
                pg = new_page(b, theme, frozen=True)
                try:
                    replay(pg, base, st)
                    pg.screenshot(path=os.path.join(out, f"{st['id']}--{theme}.png"), full_page=True, animations='disabled')
                except Exception as e:
                    print(f"FAILED {st['id']} {theme}: {str(e).splitlines()[0][:200]}"); failed.append(st['id'])
                pg.close()
    print(f'{len(sts)} states x 2 themes -> {out}')
    sys.exit(1 if failed else 0)

ANIM_JS = """() => {
  const seg = e => {
    if (e.id) return '#' + e.id;
    const c = [...e.classList].slice(0, 2).map(x => '.' + x).join('');
    return e.localName + c;
  };
  const path = e => {
    const p = [];
    for (let n = e; n && n !== document.documentElement && p.length < 4; n = n.parentElement) {
      p.unshift(seg(n)); if (n.id) break;
    }
    return p.join(' > ');
  };
  const out = [];
  for (const e of document.querySelectorAll('*')) {
    for (const pseudo of [null, '::before', '::after']) {
      const s = getComputedStyle(e, pseudo);
      if (s.animationName && s.animationName !== 'none')
        out.push({path: path(e) + (pseudo || ''), animationName: s.animationName, animationDuration: s.animationDuration});
    }
  }
  return out;
}"""

def probe(wt, out, build=True, routes=None, app='apps/demo-react'):
    routes = routes or default_routes()
    os.makedirs(os.path.join(out, 'anim'), exist_ok=True)
    animated = 0
    with served(wt, app, build) as (base, b):
        for r in routes:
            pg = new_page(b, 'dark', reduced=False)
            pg.goto(base + '#' + r); pg.wait_for_timeout(1200)
            found = sorted(pg.evaluate(ANIM_JS), key=lambda x: (x['path'], x['animationName'], x['animationDuration']))
            pg.close()
            if found:
                animated += 1
                print(f"{r}: " + ', '.join(sorted({f"{x['path']} {x['animationName']} {x['animationDuration']}" for x in found})))
            with open(os.path.join(out, 'anim', f'{safe(r)}.json'), 'w') as f:
                json.dump(found, f, indent=1, sort_keys=True); f.write('\n')
    print(f'{animated}/{len(routes)} routes have animations -> {out}/anim')

CS_BEFORE_JS = """() => {
  const els = [document.documentElement, ...document.querySelectorAll('body, body *')];
  const props = Array.from(getComputedStyle(document.documentElement));
  window.__leak = { props, els, before: els.map(e => { const c = getComputedStyle(e); return props.map(p => c.getPropertyValue(p)); }),
                    own: new Set([...document.querySelectorAll('link[rel=stylesheet]')].map(l => l.href)) };
}"""

SWAP_JS = """hs => new Promise(done => {
  document.querySelectorAll('link[rel=stylesheet]').forEach(l => l.remove());
  let left = hs.length;
  for (const h of hs) {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = h;
    l.onload = l.onerror = () => { if (--left === 0) done(); };
    document.head.appendChild(l);
  }
  if (!left) done();
})"""

# Rules from stylesheets the route does not load itself that match an element whose computed value changed, for a
# property the rule declares (shorthands are expanded by CSSOM, so longhand names match).
CS_RULES_JS = """() => {
  const { props, els, before, own } = window.__leak;
  const foreign = [...document.styleSheets].filter(s => s.href && !own.has(s.href));
  const rules = [];
  const walk = (list, sheet) => { for (const r of list) {
    if (r instanceof CSSStyleRule) rules.push([r, sheet]);
    else if (r.cssRules) walk(r.cssRules, sheet);
  } };
  for (const s of foreign) { try { walk(s.cssRules, s.href.split('/').pop().replace(/-[A-Za-z0-9_-]{8}\\.css$/, '.css')); } catch (e) {} }
  const hits = new Set();
  els.forEach((e, i) => {
    if (!e.isConnected) return;
    const c = getComputedStyle(e);
    const changed = props.filter((p, j) => c.getPropertyValue(p) !== before[i][j]);
    if (!changed.length) return;
    for (const [r, sheet] of rules) {
      let m = false; try { m = e.matches(r.selectorText); } catch (x) {}
      if (m && changed.some(p => r.style.getPropertyValue(p) !== '')) hits.add(sheet + ' ' + r.selectorText);
    }
  });
  return [...hits].sort();
}"""

def leak(wt, out, build=True, routes=None, app='apps/demo-react', tolerant=False):
    """Visits every route in ONE page (hash navigation, no reload) so every route's CSS chunk stays loaded, then
    re-captures each route and compares it with a fresh-page capture. A difference is a LEAK only if it is caused by CSS:
    in the fresh page itself (same DOM, same app state, same clock) the stylesheets are swapped for the accumulated ones
    (same order); it must change the pixels AND a rule of a stylesheet the route does not load itself must match an
    element whose computed value changed for a property that rule declares. Anything else is LEAK-NOISE (non-failing).
    LEAKs are grouped by the set of foreign rules responsible."""
    routes = routes or default_routes()
    ld, fd = os.path.join(out, 'leak'), os.path.join(out, 'fresh')
    os.makedirs(ld, exist_ok=True); os.makedirs(fd, exist_ok=True)
    groups, noise = {}, 0
    def go(pg, r):
        pg.evaluate('h => { location.hash = h }', '#' + r); settle(pg)
        pg.evaluate('() => window.scrollTo(0, 0)')
    with served(wt, app, build, DETERMINISTIC_ARGS) as (base, b):
        for theme in ('dark', 'light'):
            pg = new_page(b, theme, frozen=True)
            pg.goto(base + '#/'); settle(pg)
            prime(pg)
            for r in routes: go(pg, r)
            sheets = pg.eval_on_selector_all('link[rel=stylesheet]', 'els => els.map(e => e.href)')
            for r in routes:
                go(pg, r)
                lp, fp = os.path.join(ld, f'{safe(r)}--{theme}.png'), os.path.join(fd, f'{safe(r)}--{theme}.png')
                pg.screenshot(path=lp, full_page=True, animations='disabled')
                fr = new_page(b, theme, frozen=True)
                fr.goto(base + '#' + r); settle(fr); prime(fr)
                fr.screenshot(path=fp, full_page=True, animations='disabled')
                verdict = compare(Image.open(fp).convert('RGB'), Image.open(lp).convert('RGB'))
                if verdict is None or (verdict[0] == 'NEAR' and tolerant): fr.close(); continue
                fr.evaluate(CS_BEFORE_JS)
                fr.evaluate(SWAP_JS, sheets); fr.wait_for_timeout(200)
                cpath = os.path.join(ld, f'{safe(r)}--{theme}--css.png')
                fr.screenshot(path=cpath, full_page=True, animations='disabled')
                hits = fr.evaluate(CS_RULES_JS); fr.close()
                css = compare(Image.open(fp).convert('RGB'), Image.open(cpath).convert('RGB'))
                if hits and css and not (css[0] == 'NEAR' and tolerant):
                    groups.setdefault(tuple(hits), []).append(f'{r} ({theme})')
                else:
                    print(f'LEAK-NOISE {r} {theme}: {verdict[0]} {verdict[1]} (' +
                          ('no CSS-caused pixel change' if not css else 'no foreign rule involved') + ')'); noise += 1
            pg.close()
    for rules, hit in sorted(groups.items(), key=lambda g: -len(g[1])):
        print(f'LEAK {" + ".join(rules)} -> {len(hit)} route-theme(s): {", ".join(hit)}')
    print(f'{len(groups)} leak(s), {noise} LEAK-NOISE over {len(routes)} routes x 2 themes')
    sys.exit(1 if groups else 0)

def default_routes():
    with open(os.path.join(HERE, 'routes.txt')) as f: return [l.strip() for l in f if l.strip()]

def compare(ia, ib):
    """None when identical (or caret-sized NOISE), else (kind, detail, diff image) with kind SIZE / NEAR / DIFF."""
    if ia.size != ib.size: return ('SIZE', f'{ia.size} -> {ib.size}', None)
    d = ImageChops.difference(ia, ib)
    box = d.getbbox()
    if not box or (box[2]-box[0] <= 3 and box[3]-box[1] <= 40): return None
    px = sum(1 for p in d.get_flattened_data() if p != (0, 0, 0))
    peak = max(hi for _, hi in d.getextrema())
    if peak <= 2 and px <= 200: return ('NEAR', f'{px} px, max channel delta {peak} at {box}', d)
    return ('DIFF', f'{100*px/(ia.size[0]*ia.size[1]):.3f}% bbox={box}', d)

def diff(a, b, tolerant=False):
    bad = near = 0
    for n in sorted(os.listdir(a)):
        if not n.endswith('.png') or n.startswith('diff-'): continue
        pb = os.path.join(b, n)
        if not os.path.exists(pb): print('MISSING', n); bad += 1; continue
        ia, ib = Image.open(os.path.join(a, n)).convert('RGB'), Image.open(pb).convert('RGB')
        v = compare(ia, ib)
        if v is None:
            box = ImageChops.difference(ia, ib).getbbox()
            if box: print(f'NOISE {n}: caret-sized change at {box} (ignored)')
            continue
        kind, detail, d = v
        if kind == 'SIZE': print(f'SIZE {n}: {detail}'); bad += 1; continue
        if kind == 'NEAR':
            # Looks like anti-aliasing jitter, but a real 1-step colour change looks the same: fail unless --tolerant.
            print(f'NEAR {n}: {detail}' + (' (tolerated)' if tolerant else ''))
            near += 1
            if not tolerant: bad += 1
        else:
            print(f'DIFF {n}: {detail}'); bad += 1
        ib.paste((255, 0, 255), mask=d.convert('L').point(lambda v: 255 if v else 0))
        ib.save(os.path.join(b, 'diff-' + n))
    aa, ab = os.path.join(a, 'anim'), os.path.join(b, 'anim')
    if os.path.isdir(aa) or os.path.isdir(ab):
        # Animation probes (snap.py probe): any difference, missing or extra file fails.
        na = set(os.listdir(aa)) if os.path.isdir(aa) else set()
        nb = set(os.listdir(ab)) if os.path.isdir(ab) else set()
        for n in sorted(na | nb):
            if not n.endswith('.json'): continue
            ja = json.load(open(os.path.join(aa, n))) if n in na else None
            jb = json.load(open(os.path.join(ab, n))) if n in nb else None
            if ja != jb: print(f'ANIM {n}'); bad += 1
    if bad: print(f'{bad} screenshot(s) or probe(s) differ')
    else: print('identical' + (f' ({near} NEAR tolerated)' if near else ''))
    sys.exit(1 if bad else 0)

if __name__ == '__main__':
    cmd = sys.argv[1]
    opt = lambda k, d=None: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d
    rt = [r for r in opt('--routes').split(',') if r] if '--routes' in sys.argv else None
    app = opt('--app', 'apps/demo-react')
    build = '--no-build' not in sys.argv
    if cmd == 'shoot':
        shoot(sys.argv[2], sys.argv[3], build, rt, app)
    elif cmd == 'states':
        only = [i for i in opt('--only').split(',') if i] if '--only' in sys.argv else None
        states(sys.argv[2], sys.argv[3], build, only, app, opt('--file'))
    elif cmd == 'probe':
        probe(sys.argv[2], sys.argv[3], build, rt, app)
    elif cmd == 'leak':
        leak(sys.argv[2], sys.argv[3], build, rt, app, '--tolerant' in sys.argv)
    elif cmd == 'diff':
        diff(sys.argv[2], sys.argv[3], '--tolerant' in sys.argv)
    else:
        print(__doc__); sys.exit(2)
