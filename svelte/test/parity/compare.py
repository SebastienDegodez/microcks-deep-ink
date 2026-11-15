import ast
import io
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parent / '.artifacts'
base = sys.argv[1]
cases = json.loads((root / 'cases.json').read_text())
repeat = int(os.environ.get('PARITY_REPEAT', '2'))
assert repeat >= 2, 'PARITY_REPEAT must be >= 2 (React self-parity is mandatory)'
themes = os.environ.get('PARITY_THEMES', 'dark,light').split(',')
assert set(themes) <= {'dark', 'light'}
source = root.parents[3] / 'tools/fidelity/snap.py'
args = next(ast.literal_eval(node.value) for node in ast.parse(source.read_text()).body
            if isinstance(node, ast.Assign) and any(getattr(t, 'id', '') == 'DETERMINISTIC_ARGS' for t in node.targets))
for stale in root.glob('*.png'):
    stale.unlink()
results = []
widths = [1280, 390] if os.environ.get('PARITY_MOBILE') == '1' else [1280]


def difference(a, b):
    if a.size == b.size:
        return ImageChops.difference(a, b)
    size = (max(a.width, b.width), max(a.height, b.height))
    canvases = [Image.new('RGB', size) for _ in range(2)]
    canvases[0].paste(a, (0, 0))
    canvases[1].paste(b, (0, 0))
    return ImageChops.difference(*canvases)


def pixels(a, b):
    if a.size != b.size:
        return max(a.width * a.height, b.width * b.height)
    return sum(pixel != (0, 0, 0) for pixel in difference(a, b).get_flattened_data())


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=args)
    version = browser.version
    for entry in cases:
        for theme in themes:
            for width in widths:
                result = {'id': entry['id'], 'theme': theme, 'width': width}
                key = f"{entry['id']}-{theme}-{width}"
                if not entry['svelte']:
                    results.append({**result, 'status': 'missing'})
                    print(f'MISSING {key}')
                    continue
                images = {}
                active_page = None
                try:
                    for framework in ['react', 'svelte']:
                        for attempt in range(repeat):
                            page = browser.new_page(viewport={'width': width, 'height': 900}, device_scale_factor=1, reduced_motion='reduce', color_scheme=theme)
                            active_page = page
                            errors = []
                            page.on('pageerror', lambda error: errors.append(str(error)))
                            page.route('**/*', lambda route: route.continue_() if route.request.url.startswith(base + '/') else route.abort())
                            page.clock.install(time=datetime(2024, 12, 31, 23, tzinfo=timezone.utc))
                            page.clock.pause_at(datetime(2025, 1, 1, tzinfo=timezone.utc))
                            page.clock.set_fixed_time(datetime(2025, 1, 1, tzinfo=timezone.utc))
                            page.goto(f"{base}/{framework}/{framework}.html?" + urlencode({'file': entry[framework], 'id': entry['id'], 'theme': theme}))
                            # Advance only controlled frames, not wall-clock time.
                            page.clock.run_for(100)
                            page.wait_for_function('window.__parityReady || window.__parityError', timeout=15000)
                            page.clock.run_for(100)
                            error = page.evaluate('window.__parityError')
                            if error or errors:
                                raise RuntimeError(f'{framework}: {error or errors}')
                            page.evaluate('async () => { await document.fonts.ready; if ([...document.fonts].some(f => f.status === "error")) throw Error("Font unavailable"); }')
                            assert page.locator('#app').evaluate('(el) => el.childElementCount > 0'), 'Empty story frame'
                            assert page.evaluate('getComputedStyle(document.body).getPropertyValue("--bg").trim()'), 'Missing package CSS'
                            image = Image.open(io.BytesIO(page.screenshot(animations='disabled', full_page=True))).convert('RGB')
                            page.close()
                            active_page = None
                            if attempt == 0:
                                images[framework] = image
                            elif pixels(images[framework], image):
                                drift = pixels(images[framework], image)
                                image.save(root / f'{key}-{framework}-repeat{attempt}.png')
                                difference(images[framework], image).save(root / f'{key}-{framework}-self-diff.png')
                                raise RuntimeError(f'NONDETERMINISTIC {framework}: {drift} differing pixels')
                    count = pixels(images['react'], images['svelte'])
                    result.update(status='differing' if count else 'identical', diffPixels=count, sizes={framework: list(image.size) for framework, image in images.items()})
                    if count:
                        for framework, image in images.items():
                            image.save(root / f'{key}-{framework}.png')
                        difference(images['react'], images['svelte']).save(root / f'{key}-diff.png')
                except Exception as error:
                    result.update(status='error', error=str(error), nondeterministic='NONDETERMINISTIC' in str(error))
                finally:
                    if active_page:
                        active_page.close()
                results.append(result)
                print(f"{result['status'].upper()} {key}" + (f" {result.get('error', result.get('diffPixels', ''))}"))
    browser.close()
summary = {name: sum(r['status'] == status for r in results) for name, status in [('identical', 'identical'), ('differing', 'differing'), ('missing', 'missing'), ('errors', 'error')]}
summary['compared'] = summary['identical'] + summary['differing']
report = {'summary': summary, 'metadata': {'browser': version, 'launchArgs': args, 'repeat': repeat, 'fonts': json.loads((root.parent / 'fonts/manifest.json').read_text()), 'viewportHeight': 900, 'deviceScaleFactor': 1, 'fixedDate': '2025-01-01T00:00:00Z', 'tolerance': 0}, 'results': results}
(root / 'report.json').write_text(json.dumps(report, indent=2))
print(' / '.join(f'{name} {summary[name]}' for name in ['compared', 'identical', 'differing', 'missing', 'errors']))
sys.exit(1 if summary['differing'] or summary['missing'] or summary['errors'] else 0)
