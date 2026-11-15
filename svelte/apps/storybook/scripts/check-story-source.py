"""Check Show code in the built Storybook, not only its CSF metadata."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


site = Path(__file__).resolve().parent.parent / "storybook-static"
if not (site / "index.html").is_file():
    raise RuntimeError("Build the Svelte Storybook before checking Show code")

server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(site)))
thread = Thread(target=server.serve_forever, daemon=True)
thread.start()
try:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page()
        for group, expected in [
            ("components-button", '<Button variant="primary" icon="play">Run test</Button>'),
            ("components-dialog", "<Dialog "),
            ("microcks-apibadge", '<ApiBadge protocol="REST" name="API Pastry"'),
            ("microcks-statcard", "{#snippet title()}Conformance{/snippet}"),
        ]:
            page.goto(f"http://127.0.0.1:{server.server_port}/iframe.html?id={group}--docs&viewMode=docs")
            toggle = page.get_by_role("switch", name="Show code")
            toggle.first.wait_for(timeout=30000)
            for _ in range(toggle.count()):
                toggle.first.click()
            code = page.locator("pre").all_text_contents()
            assert any(expected in block for block in code), f"{group}: expected {expected!r} in {code!r}"
            assert not any("Component:" in block for block in code), f"{group}: CSF adapter shown as source"
            print(f"Show code: {group} OK")
        browser.close()
finally:
    server.shutdown()
    server.server_close()
    thread.join()
