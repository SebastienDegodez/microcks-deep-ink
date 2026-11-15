import ast
import hashlib
import io
import json
import os
import sys
from pathlib import Path
from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parent / ".artifacts"
base = sys.argv[1]
cases = json.loads((root / "cases.json").read_text())
only = {case for case in os.environ.get("PARITY_CASES", "").split(",") if case}
if only:
    unknown = only - {entry["id"] for entry in cases}
    assert not unknown, f"Unknown PARITY_CASES: {sorted(unknown)}"
    cases = [entry for entry in cases if entry["id"] in only]
# Each framework is captured this many times per state; every capture must equal the first (self-parity).
repeat = int(os.environ.get("PARITY_REPEAT", "1"))
assert repeat >= 1, "PARITY_REPEAT must be >= 1"


def deterministic_args():
    # Single source of truth: the verified fidelity snapshot flags, read as a literal (snap.py is not imported).
    source = root.parents[3] / "tools/fidelity/snap.py"
    for node in ast.parse(source.read_text()).body:
        if isinstance(node, ast.Assign) and any(getattr(target, "id", None) == "DETERMINISTIC_ARGS" for target in node.targets):
            return list(ast.literal_eval(node.value))
    raise RuntimeError(f"DETERMINISTIC_ARGS not found in {source}")


launch_args = deterministic_args()
# Never let failure screenshots from a previous run masquerade as current evidence.
for stale in root.glob("*.png"):
    stale.unlink()
results = []
metadata = {
    "cssSHA256": hashlib.sha256((root / "common.css").read_bytes()).hexdigest(),
    "fontSHA256": hashlib.sha256((root / "font.ttf").read_bytes()).hexdigest(),
    "deviceScaleFactor": 1,
    "motion": "disabled identically; no masks; RGB exact equality; tolerance 0",
    "launchArgs": launch_args,
    "repeat": repeat,
    "cases": sorted(only) if only else "all",
    "linkDifference": "disabled prop maps to React's supported aria-disabled; loading React markup untouched; native navigation prevention tested separately",
}
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=launch_args)
    metadata["browser"] = browser.version
    for theme in ["light", "dark"]:
        for width in [800, 320]:
            pages = {}
            for framework in ["react", "svelte"]:
                page = browser.new_page(viewport={"width": width, "height": 160}, device_scale_factor=1, reduced_motion="reduce", color_scheme=theme)
                page.route("**/*", lambda route: route.continue_() if route.request.url.startswith(base + "/") else route.abort())
                page.goto(f"{base}/{framework}.html")
                page.evaluate("""async (theme) => {
                  document.documentElement.dataset.theme = theme;
                  for (const weight of [400, 500, 600]) await document.fonts.load(`${weight} 14px "IBM Plex Sans"`);
                  await document.fonts.ready;
                  if (![...document.fonts].every(font => font.status === 'loaded')) throw Error('Font unavailable');
                }""", theme)
                pages[framework] = page
            for entry in cases:
                for interaction in entry["interactions"]:
                    key = f'{theme}-{width}-{entry["id"]}-{interaction}'
                    images = {}
                    self_diff = 0
                    for framework, page in pages.items():
                        for attempt in range(repeat):
                            page.mouse.move(width - 1, 159)
                            page.evaluate("""(id) => {
                              document.activeElement?.blur();
                              document.querySelector('.active')?.classList.remove('active');
                              document.getElementById(id).classList.add('active');
                            }""", entry["id"])
                            target = page.locator(f'#{entry["id"]} .button')
                            if interaction == "hover":
                                target.hover()
                            elif interaction == "focus":
                                # Keyboard modality is required to exercise :focus-visible, not synthetic focus.
                                # Blur keeps the sequential navigation start point, so a repeat may first Tab out
                                # of the document; the active case holds a single focusable target.
                                for _ in range(3):
                                    page.keyboard.press("Tab")
                                    if target.evaluate("(el) => el === document.activeElement"):
                                        break
                                assert target.evaluate("(el) => el === document.activeElement && el.matches(':focus-visible')")
                            image = Image.open(io.BytesIO(page.screenshot(animations="disabled"))).convert("RGB")
                            if attempt == 0:
                                images[framework] = image
                                continue
                            drift = ImageChops.difference(images[framework], image)
                            drift_pixels = sum(pixel != (0, 0, 0) for pixel in drift.get_flattened_data())
                            if drift_pixels:
                                image.save(root / f"{key}-{framework}-repeat{attempt}.png")
                                drift.save(root / f"{key}-{framework}-repeat{attempt}-diff.png")
                            self_diff = max(self_diff, drift_pixels)
                    diff = ImageChops.difference(images["react"], images["svelte"])
                    pixels = sum(pixel != (0, 0, 0) for pixel in diff.get_flattened_data())
                    results.append({"key": key, "props": entry["props"], "kind": entry["kind"], "diffPixels": pixels, "selfDiffPixels": self_diff})
                    if pixels or self_diff:
                        for framework, image in images.items():
                            image.save(root / f"{key}-{framework}.png")
                        diff.save(root / f"{key}-diff.png")
            for page in pages.values():
                page.close()

    failed = [result for result in results if result["diffPixels"] or result["selfDiffPixels"]]
    report = {
        "metadata": metadata, "cases": len(cases), "comparisons": len(results),
        "passed": len(results) - len(failed), "failed": len(failed),
        "maxDiffPixels": max(result["diffPixels"] for result in results),
        "maxSelfDiffPixels": max(result["selfDiffPixels"] for result in results),
        "functional": "not yet completed", "results": results,
    }
    (root / "report.json").write_text(json.dumps(report, indent=2))
    page = browser.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(f"{base}/client/functional.html")
    page.locator("#bindings").wait_for()
    assert page.locator("#bindings").inner_text() == "BUTTON/A"
    action = page.locator("#action")
    action.focus()
    page.keyboard.press("Enter")
    page.keyboard.press("Space")
    assert page.locator("#counts").inner_text() == "2/0", "Native action keyboard or default type broken"
    page.locator("#submit").click()
    assert page.locator("#counts").inner_text() == "2/1", "Native form submit broken"
    navigation = page.locator("#navigation")
    navigation.focus()
    page.keyboard.press("Enter")
    assert page.url.endswith("#destination"), "Native link Enter navigation broken"
    page.evaluate("history.replaceState(null, '', location.pathname)")
    for toggle in ["#disable", "#busy"]:
        page.locator(toggle).click()
        assert action.is_disabled()
        assert navigation.get_attribute("href") is None
        assert navigation.get_attribute("aria-disabled") == ("true" if toggle == "#disable" else None)
        assert navigation.get_attribute("tabindex") == "-1"
        assert page.get_by_role("link", name="View details").count() == 1
        page.locator("#submit").focus()
        page.keyboard.press("Tab")
        assert page.locator("#icon-only").evaluate("(el) => el === document.activeElement"), "Inactive link must not be in the tab order"
        navigation.dispatch_event("click")
        navigation.dispatch_event("keydown", {"key": "Enter"})
        assert not page.url.endswith("#destination"), "Inactive link navigated"
        if toggle == "#busy":
            assert action.get_attribute("aria-busy") == "true"
            assert navigation.get_attribute("aria-busy") == "true"
        page.locator(toggle).click()
        assert not action.is_disabled()
        assert navigation.get_attribute("href") == "#destination"
    assert page.get_by_role("button", name="Add API").count() == 1
    assert page.locator("#icon-only svg").get_attribute("aria-hidden") == "true"
    # Check rendered contrast via axe in an actual browser, in both themes.
    page.add_script_tag(path=str(root.parent.parent.parent / "packages/deep-ink/node_modules/axe-core/axe.min.js"))
    for theme in ["light", "dark"]:
        page.evaluate("(theme) => document.documentElement.dataset.theme = theme", theme)
        violations = page.evaluate("async () => (await axe.run(document)).violations")
        assert not violations, json.dumps(violations)
    assert not errors, errors
    browser.close()

report["functional"] = "keyboard action/link, form submission, bindings, inactive activation, restoration, tab order, named decorative icons, browser axe light/dark passed"
(root / "report.json").write_text(json.dumps(report, indent=2))
print(json.dumps({key: value for key, value in report.items() if key != "results"}, indent=2))
assert not failed, f"{len(failed)} strict pixel comparisons failed; inspect .artifacts/report.json and screenshots"
