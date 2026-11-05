# Fidelity tools

Pixel guard and helpers for behaviour-preserving refactors of the demo. Python 3 + Playwright (chromium) + Pillow, `gh` for
automerge. No package.json: run the scripts directly from the repo root. Paths below are relative to the repo root.

## snap.py — shoot / diff loop

```sh
# baseline (from origin/main or before editing): builds react/packages/deep-ink, then the demo (vite build)
python3 -I tools/fidelity/snap.py shoot . ../pix/base --routes "$(paste -sd, tools/fidelity/routes.txt)"
# after the change (add --no-build if nothing was rebuilt-relevant)
python3 -I tools/fidelity/snap.py shoot . ../pix/after --routes "$(paste -sd, tools/fidelity/routes.txt)"
python3 -I tools/fidelity/snap.py diff ../pix/base ../pix/after   # prints `identical`, exit 1 on any DIFF/NEAR/SIZE/MISSING
```

Without `--routes` it crawls every in-app `#/` link from `/` (max 120) and writes `<out>/routes.txt`.
`--app <dir>` picks the demo app (default `apps/demo-react`); its `dist/` is served.
`routes.txt` (one route per line) is the crawl of main (108 routes) plus supplemental routes the crawler does not
reliably discover, all of which render:

- `/workflows/pastry/compare-prices/runs`
- `/workflows/pastry/compare-prices/source`

`routes-by-page.json` maps the same 110 routes to page folders.

`diff` is strict by default. A change of ≤200 px with every channel within ±2 is reported as
`NEAR <file>: … px, max channel delta …` and still fails (a real 1-step border colour change looks exactly like
anti-aliasing jitter). `--tolerant` makes NEAR non-failing; use it only after inspecting the `diff-*.png`.

Captures: 1440 px wide, full page, dark and light, `reduced_motion=reduce` and `animations=disabled`. Query strings are
stripped from crawled links: use `states` for query-string routes.

All commands below accept `--app <dir>` and `--no-build` like `shoot`; `probe` and `leak` default to `routes.txt`.

### states — interaction states

```sh
python3 -I tools/fidelity/snap.py states . ../pix/st-base [--only cockpit-cmdk,services-filter] [--file states.json]
python3 -I tools/fidelity/snap.py states . ../pix/st-after --no-build
python3 -I tools/fidelity/snap.py diff ../pix/st-base ../pix/st-after
```

Why: `shoot` only sees the default render of each route; an open ⌘K palette, a filtered list, a non-default tab or a
query-string route (`?run=14&step=patchPastry`) are never captured. `states.json` lists them:

```json
{ "id": "admin-secrets-tab", "route": "/admin", "focus": { "role": "tab", "name": "Secrets , 5" }, "keys": ["Enter"] }
```

`route` is opened as-is (query kept), then `focus` (`page.get_by_role(role, name=…, exact=true)`; add `"exact": false`
for a substring), then each `keys` entry (`keyboard.press`), then `type` (`keyboard.type`). Targets are by role +
accessible name only: read them with `page.locator('body').aria_snapshot()`, don't guess. Same capture settings as
`shoot`, written to `<id>--<theme>.png`; a state whose target is missing prints `FAILED <id>` and exits 1.

### probe — animation inventory

```sh
python3 -I tools/fidelity/snap.py probe . ../pix/base [--routes /,/services]
```

Why: `shoot` disables animations and reduces motion, so a refactor that drops or renames a keyframe (e.g. the cockpit
`.top-live` dot using `deep-ink-pulse`) is invisible to pixels. `probe` loads each route in dark WITHOUT reduced motion and
writes `<out>/anim/<safe-route>.json`: the sorted `{path, animationName, animationDuration}` of every element (and
`::before`/`::after`) whose computed `animation-name` is not `none` (`path` is a short CSS path, ≤4 levels or up to an id).
When both dirs have `anim/`, `diff` compares the JSON files too: any difference, missing or extra file is `ANIM <file>`
and fails.

### leak — page CSS bleeding across routes

```sh
python3 -I tools/fidelity/snap.py leak . ../pix/leak [--routes …] [--tolerant]
```

Why: the demo is code-split; Vite injects each page's CSS chunk on first visit and never removes it. Unlayered page CSS
(`.facts`, `.projection-pill`, …) can then restyle components on pages visited later, which a fresh-page `shoot` never
sees. In ONE page per theme `leak` visits every route by hash navigation (no reload), then re-visits each one and
captures `<out>/leak/<safe>--<theme>.png`, compared (same strict rules as `diff`) with a fresh-page capture in
`<out>/fresh/`. Each difference is re-checked on a fresh page whose stylesheets are replaced by the accumulated ones (same
order, `<out>/leak/<safe>--<theme>--css.png`): `LEAK <route> <theme> css: …` means the CSS alone reproduces it,
`state` means it comes from in-memory app state instead. Exit 1 on any LEAK (NEAR included unless `--tolerant`). Before
judging, a second fresh capture is taken: if the two fresh captures already differ (live counters, e.g. `/traces`), the
route prints `FLAKY <route> <theme>` and is not judged (does not fail).

Chromium quirk: once a document took a full-page screenshot taller than the viewport, its fallback monospace text
measures wider (`Ctrl K` kbd 50 → 57 px) until reload. The single leak page is in that state after its first tall
route, so every leak page and fresh reference is "primed" with one throwaway tall full-page screenshot first; the
`fresh/` captures are therefore not byte-identical to `shoot`'s.

## compare.py — prototype vs demo

```sh
PROTO_DIR=/path/to/proto-render python3 -I tools/fidelity/compare.py . Catalogue.dc.html /services ../pix/cmp [--theme light] [--no-build]
```

Serves `$PROTO_DIR` (default `tools/fidelity/proto`, not committed) and the demo `dist/`, writes `proto.png` and `demo.png`.
Builds the deep-ink package then the demo unless `--no-build`.

## cssdiff.py — built CSS before/after

```sh
python3 -I tools/fidelity/cssdiff.py <dist-before> <dist-after>
```

Compares `assets/*.css` by name (hash stripped) and prints the first differing offset with context.

## automerge.sh

```sh
bash tools/fidelity/automerge.sh --dry-run --once   # print what would be merged, single pass
bash tools/fidelity/automerge.sh --once             # merge once, then exit
bash tools/fidelity/automerge.sh [seconds]          # loop every 90 s (default 5400 s)
```

Merges open PRs (oldest first) only when `mergeable_state=clean` and every check run on the head is completed with
success/skipped. Squash, pinned on the checked head sha. PRs labelled `hold` are skipped. Exits 0 as soon as no PR is open
(with or without `--once`).

## registry-selectors.py

```sh
python3 -I tools/fidelity/registry-selectors.py .                    # counts per page folder and per registry class
python3 -I tools/fidelity/registry-selectors.py . --check allow.tsv  # exit 1 on a selector not in the allowlist
```

Counts page CSS selectors (`apps/demo-react/src/ui/pages`) that reach into registry classes (`packages/registry/src/css`).

## Known flaky

- Caret-sized change (≤3 px wide × ≤40 px tall) is reported as `NOISE` and ignored.
- Anti-aliasing jitter (a few edge pixels, ±1) occurs occasionally on rounded corners: it shows as `NEAR` and fails;
  re-shoot, or pass `--tolerant` once the `diff-*.png` is checked.
- `/tests` light: full-page height varies between 1766 and 1795 px.
- `/tests/runner/119`: a11y counts are unstable.
