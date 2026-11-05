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
      fresh-page capture (<out>/fresh/). Prints `LEAK <route> <theme> css|state: ...` (exit 1 on any)
      or `FLAKY <route> <theme>` when two fresh captures already differ (not judged, not failing).
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

@contextlib.contextmanager
def served(wt, app, build):
    """Builds (unless build is False), serves <app>/dist and yields (base url, chromium browser)."""
    if build: build_demo(wt, app)
    port = free_port()
    srv = subprocess.Popen(['python3', '-m', 'http.server', str(port), '-d', os.path.join(wt, app, 'dist')],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1)
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch()
            try: yield f'http://127.0.0.1:{port}/', b
            finally: b.close()
    finally:
        srv.kill()

def new_page(b, theme, reduced=True):
    pg = b.new_page(viewport=VIEWPORT, color_scheme=theme, reduced_motion='reduce' if reduced else 'no-preference')
    pg.add_init_script(f"try{{localStorage.setItem('microcks-theme','{theme}')}}catch(e){{}}")
    return pg

def capture(b, base, route, theme, path, primed=False):
    """The reference capture: fresh page, reduced motion, animations disabled, full page."""
    pg = new_page(b, theme)
    pg.goto(base + '#' + route); pg.wait_for_timeout(1200)
    if primed: prime(pg)
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
    pg.goto(base + '#' + st['route']); pg.wait_for_timeout(1200)
    if 'focus' in st:
        f = st['focus']
        pg.get_by_role(f['role'], name=f['name'], exact=f.get('exact', True)).focus(timeout=5000)
    for k in st.get('keys', []):
        pg.keyboard.press(k); pg.wait_for_timeout(150)
    if 'type' in st:
        pg.keyboard.type(st['type'], delay=20)
    pg.wait_for_timeout(800)

def states(wt, out, build=True, only=None, app='apps/demo-react', file=None):
    os.makedirs(out, exist_ok=True)
    sts = load_states(file or os.path.join(HERE, 'states.json'), only)
    failed = []
    with served(wt, app, build) as (base, b):
        for theme in ('dark', 'light'):
            for st in sts:
                pg = new_page(b, theme)
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

def leak(wt, out, build=True, routes=None, app='apps/demo-react', tolerant=False):
    """Visits every route in ONE page (hash navigation, no reload) so every route's CSS chunk stays loaded, then
    re-captures each route and compares it with a fresh-page capture. A difference is re-checked on a fresh page that
    gets the accumulated stylesheets (same order): 'css' if it reproduces (a real leak), 'state' otherwise."""
    from PIL import Image
    routes = routes or default_routes()
    ld, fd = os.path.join(out, 'leak'), os.path.join(out, 'fresh')
    os.makedirs(ld, exist_ok=True); os.makedirs(fd, exist_ok=True)
    leaks, flaky = [], []
    def go(pg, r):
        pg.evaluate('h => { location.hash = h }', '#' + r); pg.wait_for_timeout(1200)
        pg.evaluate('() => window.scrollTo(0, 0)'); pg.wait_for_timeout(100)
    with served(wt, app, build) as (base, b):
        for theme in ('dark', 'light'):
            pg = new_page(b, theme)
            pg.goto(base + '#/'); pg.wait_for_timeout(1200)
            prime(pg)
            for r in routes: go(pg, r)
            sheets = pg.eval_on_selector_all('link[rel=stylesheet]', 'els => els.map(e => e.href)')
            for r in routes:
                go(pg, r)
                lp, fp = os.path.join(ld, f'{safe(r)}--{theme}.png'), os.path.join(fd, f'{safe(r)}--{theme}.png')
                pg.screenshot(path=lp, full_page=True, animations='disabled')
                capture(b, base, r, theme, fp, primed=True)
                verdict = compare(Image.open(fp).convert('RGB'), Image.open(lp).convert('RGB'))
                if verdict is None or (verdict[0] == 'NEAR' and tolerant): continue
                fp2 = os.path.join(fd, f'{safe(r)}--{theme}--again.png')
                capture(b, base, r, theme, fp2, primed=True)
                if compare(Image.open(fp).convert('RGB'), Image.open(fp2).convert('RGB')):
                    # Two fresh captures already differ (live/time-based content): no verdict possible.
                    print(f'FLAKY {r} {theme}: fresh captures differ, not judged'); flaky.append(r); continue
                cp = new_page(b, theme)
                cp.goto(base + '#' + r); cp.wait_for_timeout(1200)
                prime(cp)
                # Same stylesheets in the same order as the leaky page (cached: no network wait needed beyond a beat).
                cp.evaluate('''hs => { document.querySelectorAll('link[rel=stylesheet]').forEach(l => l.remove());
                    for (const h of hs) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = h; document.head.appendChild(l); } }''', sheets)
                cp.wait_for_timeout(800)
                cpath = os.path.join(ld, f'{safe(r)}--{theme}--css.png')
                cp.screenshot(path=cpath, full_page=True, animations='disabled'); cp.close()
                kind = 'css' if compare(Image.open(fp).convert('RGB'), Image.open(cpath).convert('RGB')) else 'state'
                print(f'LEAK {r} {theme} {kind}: {verdict[0]} {verdict[1]}'); leaks.append(r)
            pg.close()
    print((f'{len(leaks)} leak(s)' if leaks else 'no leak') + f' over {len(routes)} routes x 2 themes' + (f', {len(flaky)} flaky' if flaky else ''))
    sys.exit(1 if leaks else 0)

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
