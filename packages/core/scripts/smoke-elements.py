#!/usr/bin/env python3
"""Smoke test of the self-contained element bundles (dist/elements) with Playwright.

Serves packages/ over HTTP, opens smoke-elements.html once per element (each bundle alone in a blank page)
and checks behaviour and accessibility (axe-core when found in node_modules).
Usage: python3 packages/core/scripts/smoke-elements.py [--shots DIR]
"""
import functools, glob, http.server, json, os, sys, threading
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
PACKAGES = os.path.abspath(os.path.join(HERE, '..', '..'))
REPO = os.path.abspath(os.path.join(PACKAGES, '..'))
AXE = next(iter(glob.glob(os.path.join(REPO, 'node_modules/.pnpm/axe-core@*/node_modules/axe-core/axe.min.js'))), None)
SHOTS = sys.argv[sys.argv.index('--shots') + 1] if '--shots' in sys.argv else None

failures = []

def press(page, k):
    page.keyboard.press(k)
    page.wait_for_timeout(60)

def typ(page, t):
    page.keyboard.type(t)
    page.wait_for_timeout(80)
def check(cond, msg):
    print(('ok    ' if cond else 'FAIL  ') + msg)
    if not cond: failures.append(msg)

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

def serve():
    handler = functools.partial(Quiet, directory=PACKAGES)
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv

def open_page(browser, base, query, width=1100, height=800):
    ctx = browser.new_context(viewport={'width': width, 'height': height})
    page = ctx.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.goto(f'{base}/core/scripts/smoke-elements.html?{query}')
    page.wait_for_function('window.ready === true')
    page.wait_for_timeout(150)
    return page, errors

def axe(page, label):
    if not AXE:
        print('skip  axe-core not found'); return
    page.add_script_tag(path=AXE)
    res = page.evaluate("axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice']}})")
    v = [(x['id'], x['impact'], [n['target'] for n in x['nodes']][:2]) for x in res['violations']]
    check(not v, f'axe {label}: {v}')

def main():
    srv = serve()
    base = f'http://127.0.0.1:{srv.server_address[1]}'
    with sync_playwright() as p:
        browser = p.chromium.launch()

        # ---------- Loom ----------
        for theme in ('dark', 'light'):
            page, errors = open_page(browser, base, f'el=mk-workflow-loom&fixture=run14&theme={theme}')
            check(page.evaluate("!!customElements.get('mk-workflow-loom')"), f'loom [{theme}] registered by its bundle alone')
            check(not errors, f'loom [{theme}] no console errors {errors}')
            if theme == 'dark':
                txt = page.evaluate("document.querySelector('mk-workflow-loom').shadowRoot.textContent")
                check('retry ×2 · 1 s · 3 attempts' in txt, 'loom shows "retry ×2 · 1 s · 3 attempts"')
                check("end if $response.body#/status == 'available' · not taken" in txt, 'loom shows the end branch, not taken')
                check('Not run' in txt, 'loom shows "Not run"')
                check('Success criteria' in txt and 'Schema validation' in txt, 'loom shows both checks')
                check('goto' not in txt.lower(), 'loom has no goto')
                check('Not linked' in txt and 'not runnable' in txt, 'loom marks unlinked and AsyncAPI sources')
                names = page.evaluate("[...document.querySelector('mk-workflow-loom').shadowRoot.querySelectorAll('button.node')].map(b => b.getAttribute('aria-label'))")
                check(names[2] == 'Step 3, patchPastry, PATCH /pastries/{name}, Failed after 3 attempts, Success criteria passed, Schema validation failed', f'node accessible name: {names[2]}')
                check(page.evaluate("document.querySelector('mk-workflow-loom').shadowRoot.querySelector('svg.bg').getAttribute('aria-hidden')") == 'true', 'SVG is aria-hidden')
                # keyboard: reach every node with the arrow keys
                press(page, 'Tab')   # toggle button
                press(page, 'Tab')   # scroll region
                press(page, 'Tab')   # first node (roving tabindex)
                seen = []
                for _ in range(8):
                    seen.append(page.evaluate("document.querySelector('mk-workflow-loom').shadowRoot.activeElement?.getAttribute('aria-label')?.split(',')[1]?.trim()"))
                    press(page, 'ArrowRight')
                check(seen[:5] == ['listPastries', 'getPastry', 'patchPastry', 'verifyPastry', 'awaitRestock'] or 'awaitRestock' in seen, f'arrow keys walk the nodes: {seen}')
                press(page, 'Home')
                first = page.evaluate("document.querySelector('mk-workflow-loom').shadowRoot.activeElement.getAttribute('aria-label')")
                check(first.startswith('Step 1,'), 'Home goes to the first node')
                press(page, 'Enter')
                check(page.evaluate('window.events')[-1][0] == 'mkStepSelect', 'Enter selects a step (mkStepSelect)')
                check(page.evaluate("document.querySelector('mk-workflow-loom').shadowRoot.activeElement.getAttribute('aria-pressed')") == 'true', 'selected node has aria-pressed=true')
                # table toggle
                page.evaluate("document.querySelector('mk-workflow-loom').shadowRoot.querySelector('button.toggle').click()")
                page.wait_for_timeout(100)
                heads = page.evaluate("[...document.querySelector('mk-workflow-loom').shadowRoot.querySelectorAll('thead th')].map(t => t.textContent)")
                check(heads == ['#', 'Step', 'Source', 'Operation', 'Depends on', 'Status', 'Checks', 'Actions'], f'table columns {heads}')
                rows = page.evaluate("document.querySelector('mk-workflow-loom').shadowRoot.querySelectorAll('tbody tr').length")
                check(rows == 5, 'table has one row per step')
                if SHOTS:
                    page.screenshot(path=os.path.join(SHOTS, 'loom-table-dark.png'))
                page.evaluate("document.querySelector('mk-workflow-loom').shadowRoot.querySelector('button.toggle').click()")
                page.wait_for_timeout(100)
                if SHOTS:
                    page.screenshot(path=os.path.join(SHOTS, 'loom-run14-dark.png'))
            axe(page, f'loom run14 [{theme}]')
            if theme == 'dark':
                page.evaluate("document.querySelector('mk-workflow-loom').shadowRoot.querySelector('button.toggle').click()")
                page.wait_for_timeout(100)
                axe(page, 'loom run14 table [dark]')
            page.context.close()

        page, errors = open_page(browser, base, 'el=mk-workflow-loom&fixture=menu')
        info = page.evaluate("""(() => { const r = document.querySelector('mk-workflow-loom').shadowRoot;
          const b = [...r.querySelectorAll('button.node')].map(n => [n.getAttribute('aria-label').split(',')[1].trim(), parseInt(n.style.left), parseInt(n.style.top)]);
          return b; })()""")
        lefts = {n: (x, y) for n, x, y in info}
        check(lefts['getSmall'][0] == lefts['getMedium'][0] == lefts['getLarge'][0], 'check-menu: 3 parallel branches share a column')
        check(len({lefts[n][1] for n in ('getSmall', 'getMedium', 'getLarge')}) == 3, 'check-menu: branches on 3 sub-rows')
        check(lefts['compareSizes'][0] > lefts['getSmall'][0], 'check-menu: compareSizes joins to the right')
        edges = page.evaluate("document.querySelector('mk-workflow-loom').shadowRoot.querySelectorAll('path.edge').length")
        check(edges == 3, f'check-menu: 3 join edges (got {edges})')
        # vertical arrows reach the parallel branches
        press(page, 'Tab'); press(page, 'Tab'); press(page, 'Tab')
        press(page, 'ArrowDown'); press(page, 'ArrowDown')
        n = page.evaluate("document.querySelector('mk-workflow-loom').shadowRoot.activeElement.getAttribute('aria-label')")
        check('getLarge' in n, f'ArrowDown walks the parallel branches ({n})')
        press(page, 'ArrowRight')
        n = page.evaluate("document.querySelector('mk-workflow-loom').shadowRoot.activeElement.getAttribute('aria-label')")
        check('compareSizes' in n, 'ArrowRight reaches the join step')
        if SHOTS:
            page.screenshot(path=os.path.join(SHOTS, 'loom-menu-dark.png'))
        axe(page, 'loom check-menu')
        page.context.close()

        page, errors = open_page(browser, base, 'el=mk-workflow-loom&fixture=definition&theme=light', width=320, height=700)
        check(not errors, 'loom 320px no console errors')
        check(page.evaluate('document.documentElement.scrollWidth <= 320'), 'loom reflows at 320px (no page scroll)')
        page.context.close()

        # ---------- Command bar ----------
        page, errors = open_page(browser, base, 'el=mk-command-bar')
        check(not errors, f'command bar no console errors {errors}')
        sr = "document.querySelector('mk-command-bar').shadowRoot"
        page.focus('#opener')
        press(page, 'Enter')
        page.wait_for_timeout(150)
        check(page.evaluate(f"{sr}.querySelector('dialog').open"), 'opens as a modal dialog')
        check(page.evaluate(f"{sr}.querySelector('dialog').matches(':modal')"), 'dialog is modal (:modal)')
        attrs = page.evaluate(f"(() => {{ const i = {sr}.querySelector('input'); return [i.getAttribute('role'), i.getAttribute('aria-expanded'), i.getAttribute('aria-autocomplete'), i.getAttribute('aria-controls'), i.getAttribute('aria-activedescendant')]; }})()")
        check(attrs[0] == 'combobox' and attrs[1] == 'true' and attrs[2] == 'list' and attrs[3] and attrs[4], f'combobox attributes {attrs}')
        check(page.evaluate(f"{sr}.activeElement === {sr}.querySelector('input')"), 'focus is in the input on open')
        check(page.evaluate(f"{sr}.querySelector('[role=listbox]') !== null && {sr}.querySelectorAll('[role=group]').length === 3"), 'listbox with 3 role=group (Actions, Services, Operations)')
        check(page.evaluate(f"{sr}.querySelector('[role=status]').textContent") == '5 results', 'live region announces "5 results"')
        press(page, 'ArrowDown')
        d1 = page.evaluate(f"{sr}.querySelector('input').getAttribute('aria-activedescendant')")
        sel = page.evaluate(f"{sr}.querySelector('[aria-selected=true]').id")
        check(d1 == sel and 'o1' in d1, 'ArrowDown moves aria-activedescendant / aria-selected')
        press(page, 'End')
        check('o4' in page.evaluate(f"{sr}.querySelector('input').getAttribute('aria-activedescendant')"), 'End goes to the last option')
        press(page, 'Home')
        check('o0' in page.evaluate(f"{sr}.querySelector('input').getAttribute('aria-activedescendant')"), 'Home goes to the first option')
        typ(page, 'pastry')
        check(page.evaluate(f"{sr}.querySelector('[role=status]').textContent") == '3 results', 'typing filters and announces "3 results"')
        axe(page, 'command bar modal')
        if SHOTS:
            page.screenshot(path=os.path.join(SHOTS, 'command-bar-dark.png'))
        for _ in range(4):
            press(page, 'Tab')
        inside = page.evaluate(f"{sr}.querySelector('dialog').contains({sr}.activeElement)")
        check(inside, 'Tab stays inside the modal (focus trap)')
        press(page, 'Escape')
        page.wait_for_timeout(150)
        check(not page.evaluate(f"{sr}.querySelector('dialog').open"), 'Escape closes the dialog')
        check(page.evaluate("document.activeElement.id") == 'opener', 'focus returns to the opener')
        check(any(e[0] == 'mkClose' for e in page.evaluate('window.events')), 'mkClose emitted')
        press(page, 'Control+k')
        page.wait_for_timeout(150)
        check(page.evaluate(f"{sr}.querySelector('dialog').open"), 'Ctrl K opens the bar')
        typ(page, 'import')
        press(page, 'Enter')
        page.wait_for_timeout(150)
        check(['mkCommand', 'import'] in page.evaluate('window.events'), 'Enter runs the item (mkCommand)')
        check(not page.evaluate(f"{sr}.querySelector('dialog').open") and page.evaluate("document.activeElement.id") == 'opener', 'closes after running and returns focus')
        page.context.close()

        page, errors = open_page(browser, base, 'el=mk-command-bar&inline=1&theme=light')
        check(page.evaluate("!!document.querySelector('mk-command-bar').shadowRoot.querySelector('[role=listbox]')"), 'inline command bar renders the listbox')
        axe(page, 'command bar inline [light]')
        page.context.close()

        # ---------- Plugin slot ----------
        page, errors = open_page(browser, base, 'el=mk-plugin-slot')
        check(not errors, f'plugin slot no console errors {errors}')
        check(page.evaluate("document.querySelector('mk-plugin-slot').shadowRoot === null"), 'plugin slot renders in the light DOM')
        check(page.evaluate("!!document.querySelector('mk-plugin-slot > .di-plugin-item[data-plugin-id=probe] > probe-widget')"), 'contribution wrapped in div.di-plugin-item[data-plugin-id]')
        check('probe dark' in page.evaluate("document.querySelector('probe-widget').textContent"), 'context handed to the contributed element')
        check(page.evaluate("!!document.querySelector('probe-widget .di-live')"), 'light DOM content can use di-* classes')
        check(page.evaluate("document.getElementById('fallback') !== null && document.getElementById('fallback').offsetParent !== null"), 'fallback slot kept when nothing contributes')
        axe(page, 'plugin slot')
        page.context.close()
        browser.close()
    srv.shutdown()
    print(f'\n{len(failures)} failure(s)')
    sys.exit(1 if failures else 0)

main()
