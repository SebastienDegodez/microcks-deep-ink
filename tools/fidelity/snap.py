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

Typical refactor loop: shoot the baseline BEFORE editing (or from origin/main), edit,
shoot again with --routes from the baseline's routes.txt, then diff.
"""
import os, socket, subprocess, sys, time, re
from playwright.sync_api import sync_playwright

def free_port():
    s = socket.socket(); s.bind(('127.0.0.1', 0)); p = s.getsockname()[1]; s.close(); return p

def safe(route):
    return re.sub(r'[^A-Za-z0-9]+', '_', route).strip('_') or 'root'

def shoot(wt, out, build=True, routes=None, app='apps/demo-react'):
    os.makedirs(out, exist_ok=True)
    demo = os.path.join(wt, app)
    if build:
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
    port = free_port()
    srv = subprocess.Popen(['python3', '-m', 'http.server', str(port), '-d', os.path.join(demo, 'dist')],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1)
    base = f'http://127.0.0.1:{port}/'
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch()
            if routes is None:
                seen, queue = [], ['/']
                pg = b.new_page(viewport={'width': 1440, 'height': 1000})
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
                    pg = b.new_page(viewport={'width': 1440, 'height': 1000}, color_scheme=theme, reduced_motion='reduce')
                    pg.add_init_script(f"try{{localStorage.setItem('microcks-theme','{theme}')}}catch(e){{}}")
                    pg.goto(base + '#' + r); pg.wait_for_timeout(1200)
                    pg.screenshot(path=os.path.join(out, f'{safe(r)}--{theme}.png'), full_page=True, animations='disabled')
                    pg.close()
            b.close()
    finally:
        srv.kill()
    print(f'{len(routes)} routes x 2 themes -> {out}')

def diff(a, b, tolerant=False):
    from PIL import Image, ImageChops
    bad = near = 0
    for n in sorted(os.listdir(a)):
        if not n.endswith('.png') or n.startswith('diff-'): continue
        pb = os.path.join(b, n)
        if not os.path.exists(pb): print('MISSING', n); bad += 1; continue
        ia, ib = Image.open(os.path.join(a, n)).convert('RGB'), Image.open(pb).convert('RGB')
        if ia.size != ib.size:
            print(f'SIZE {n}: {ia.size} -> {ib.size}'); bad += 1; continue
        d = ImageChops.difference(ia, ib)
        box = d.getbbox()
        if box and box[2]-box[0] <= 3 and box[3]-box[1] <= 40:
            print(f'NOISE {n}: caret-sized change at {box} (ignored)'); continue
        if box:
            px = sum(1 for p in d.get_flattened_data() if p != (0, 0, 0))
            peak = max(hi for _, hi in d.getextrema())
            if peak <= 2 and px <= 200:
                # Looks like anti-aliasing jitter, but a real 1-step colour change looks the same: fail unless --tolerant.
                print(f'NEAR {n}: {px} px, max channel delta {peak} at {box}' + (' (tolerated)' if tolerant else ''))
                near += 1
                if not tolerant: bad += 1
            else:
                print(f'DIFF {n}: {100*px/(ia.size[0]*ia.size[1]):.3f}% bbox={box}'); bad += 1
            ib.paste((255, 0, 255), mask=d.convert('L').point(lambda v: 255 if v else 0))
            ib.save(os.path.join(b, 'diff-' + n))
    if bad: print(f'{bad} screenshot(s) differ')
    else: print('identical' + (f' ({near} NEAR tolerated)' if near else ''))
    sys.exit(1 if bad else 0)

if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'shoot':
        rt = None
        if '--routes' in sys.argv: rt = [r for r in sys.argv[sys.argv.index('--routes') + 1].split(',') if r]
        app = sys.argv[sys.argv.index('--app') + 1] if '--app' in sys.argv else 'apps/demo-react'
        shoot(sys.argv[2], sys.argv[3], '--no-build' not in sys.argv, rt, app)
    elif cmd == 'diff':
        diff(sys.argv[2], sys.argv[3], '--tolerant' in sys.argv)
