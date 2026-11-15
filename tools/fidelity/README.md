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

Time is frozen: each page gets a paused Playwright fake clock (`Date`, timers, rAF) at a fixed instant, advanced only by
fixed steps (2 s after load in 4 rounds of real wait + fake step, 200 ms after each key, 800 ms after typing). The
cockpit traffic ticker (a JS interval, untouched by `animations=disabled`) therefore shows the same rows on every run.
Chromium runs with software raster on one thread and no partial raster (`DETERMINISTIC_ARGS`), which removes the
1-step anti-aliasing jitter (`NEAR` on table borders, tab underlines) seen with the default raster; `shoot` is unchanged.

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
`<out>/fresh/`. Both run on the frozen clock and raster flags of `states`.

A pixel difference alone also comes from in-memory app state (runner progress, visited filters) or 1-step
anti-aliasing, so each difference is judged by a deterministic CSS-only rule, in the fresh page itself (same DOM, app
state and clock): its computed styles are recorded, its stylesheets are replaced by the accumulated ones in the same
order (`<out>/leak/<safe>--<theme>--css.png`), then

- **LEAK** (fails, exit 1) when the swap changes the pixels AND at least one rule from a stylesheet the route does not
  load itself matches an element whose computed value changed for a property that rule declares. LEAKs are grouped by
  that set of foreign rules: `LEAK <Chunk>.css <selector> [+ …] -> <n> route-theme(s): …`. Computed styles are
  per-element maps of every property the element exposes, custom properties included, compared on the union of keys:
  a foreign `.x { --c: red }` read by the route's own `color: var(--c, black)` changes `--c` on the element the rule
  matches, so it is attributed even when `--c` is unknown to `:root`.
- **LEAK-NOISE** (reported, never fails) otherwise: `(no CSS-caused pixel change)` or `(no foreign rule involved)`.
  Gate on the exit code; read the noise lines when a page's own state behaviour is under change.

`--tolerant` skips NEAR differences at both steps. On main (110 routes) it reports exactly 3 LEAKs: `.exchange`
(AgentTestRunPage.css) on service and copilot pages, `.demo-page-header-text:has(.run-meta)` (AgentTestRunPage.css) on
workflow run pages, `.agent-split > :first-child / :last-child` (ImportPage.css) on the concierge pages.

Self-test (custom-property-only leak, must fail as LEAK):

```sh
python3 -I tools/fidelity/snap.py leak-selftest . ../pix/selftest [--no-build] [--app …]   # exit 0 = PASS
```

It copies `dist/` to `<out>/selftest/app/dist`, makes the ServicePage chunk read
`outline: 3px solid var(--selftest-leak, transparent)` on `.ex-stack`, appends `.ex-stack { --selftest-leak: #ff0000 }`
to the AdminPage chunk, runs `leak` on `/admin,/services/pastry2` and expects exit 1 with
`LEAK AdminPage.css .ex-stack`. The real `dist/` is never modified.

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
python3 -I tools/fidelity/registry-selectors.py . --check tools/fidelity/registry-selectors.allow  # exit 1, prints NEW lines
python3 -I tools/fidelity/registry-selectors.py --self-test           # allowlist parser check
```

Counts page CSS selectors (`packages/demo-styles/src/pages`, shared by the React and Svelte demos) that reach into registry classes (`packages/registry/src/css`).

CI (`root` job of `.github/workflows/storybooks.yml`, no build) runs `--check` against `registry-selectors.allow`
(one `page-folder<TAB>selector` per line, sorted; `#` lines and blank lines are ignored). A failing check prints
`NEW <folder>\t<selector>`. Prefer a component option or a page-owned class. If the selector really is needed, in the
same PR: add the exact `NEW` line to `registry-selectors.allow` (keep it sorted) and list the class in
`react/packages/deep-ink/PUBLIC-CSS.md` (it becomes public API). The reviewer must justify the addition in the review.
When a selector is removed, drop its line too (stale lines do not fail the check).

## Known flaky

- Caret-sized change (≤3 px wide × ≤40 px tall) is reported as `NOISE` and ignored.
- Anti-aliasing jitter (a few edge pixels, ±1) occurs occasionally on rounded corners: it shows as `NEAR` and fails;
  re-shoot, or pass `--tolerant` once the `diff-*.png` is checked.
- `/tests` light: full-page height varies between 1766 and 1795 px.
- `/tests/runner/119`: a11y counts are unstable.
