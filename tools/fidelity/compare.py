"""Render one prototype artboard and the matching demo route, side by side.

usage: python3 -I compare.py <worktree> <Proto.dc.html> <demo hash route> <out-dir> [--theme dark|light] [--no-build]
  e.g. PROTO_DIR=../proto-render python3 -I tools/fidelity/compare.py . Catalogue.dc.html /services ../pix/cmp
Writes <out>/proto.png, <out>/demo.png (1440 px wide, full page) and prints page errors.
The prototype files are served from $PROTO_DIR (default: tools/fidelity/proto next to this script).
The @microcks/deep-ink package (react/packages/deep-ink) is built first when present, then the demo
with `vite build` (skip both with --no-build when nothing changed).
"""
import subprocess, sys, time, socket, os
from playwright.sync_api import sync_playwright

PROTO_DIR = os.environ.get('PROTO_DIR', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'proto'))

def free_port():
    s = socket.socket(); s.bind(('127.0.0.1', 0)); p = s.getsockname()[1]; s.close(); return p

def main():
    wt, proto, route, out = sys.argv[1:5]
    theme = 'light' if '--theme' in sys.argv and sys.argv[sys.argv.index('--theme') + 1] == 'light' else 'dark'
    os.makedirs(out, exist_ok=True)
    demo = os.path.join(wt, 'apps/demo-react')
    if '--no-build' not in sys.argv:
        # Same pre-build as snap.py: the demo consumes the @microcks/deep-ink package (a link:).
        pkg = os.path.join(wt, 'react', 'packages', 'deep-ink')
        if os.path.exists(os.path.join(pkg, 'package.json')):
            if not os.path.isdir(os.path.join(pkg, 'node_modules')):
                r = subprocess.run(['pnpm', 'install', '--frozen-lockfile'], cwd=os.path.join(wt, 'react'), capture_output=True, text=True)
                if r.returncode: print(r.stdout[-2000:], r.stderr[-2000:]); sys.exit(1)
            r = subprocess.run(['pnpm', 'run', 'build'], cwd=pkg, capture_output=True, text=True)
            if r.returncode: print(r.stdout[-2000:], r.stderr[-2000:]); sys.exit(1)
        r = subprocess.run(['pnpm', 'exec', 'vite', 'build', '--logLevel', 'error'], cwd=demo, capture_output=True, text=True)
        if r.returncode: print(r.stdout[-2000:], r.stderr[-2000:]); sys.exit(1)
    p1, p2 = free_port(), free_port()
    srv = [subprocess.Popen(['python3', '-m', 'http.server', str(p), '-d', d], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
           for p, d in [(p1, PROTO_DIR), (p2, os.path.join(demo, 'dist'))]]
    time.sleep(1)
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch()
            for name, url in [('proto', f'http://127.0.0.1:{p1}/{proto}'), ('demo', f'http://127.0.0.1:{p2}/#{route}')]:
                pg = b.new_page(viewport={'width': 1440, 'height': 1000}, color_scheme=theme)
                errs = []
                pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
                if name == 'demo':
                    pg.add_init_script(f"try{{localStorage.setItem('microcks-theme','{theme}')}}catch(e){{}}")
                pg.goto(url); pg.wait_for_timeout(2500)
                if name == 'proto' and theme == 'light':
                    # The prototype ignores prefers-color-scheme: click its theme toggle.
                    try:
                        import re as _re
                        pg.get_by_role('button', name=_re.compile('theme|light|dark', _re.I)).first.click(timeout=2000)
                        pg.wait_for_timeout(700)
                    except Exception as e:
                        print('proto light toggle failed:', str(e)[:80])
                pg.screenshot(path=os.path.join(out, f'{name}.png'), full_page=True)
                print(name, 'errors:', errs[:3])
                pg.close()
            b.close()
    finally:
        for s in srv: s.kill()

main()
