# Fidelity tools

Pixel guard and helpers for behaviour-preserving refactors of the demo. Python 3 + Playwright (chromium) + Pillow, `gh` for
automerge. No package.json: run the scripts directly from the repo root. Paths below are relative to the repo root.

## snap.py — shoot / diff loop

```sh
# baseline (from origin/main or before editing): builds react/packages/deep-ink, then the demo (vite build)
python3 -I tools/fidelity/snap.py shoot . ../pix/base --routes "$(paste -sd, tools/fidelity/routes.txt)"
# after the change (add --no-build if nothing was rebuilt-relevant)
python3 -I tools/fidelity/snap.py shoot . ../pix/after --routes "$(paste -sd, tools/fidelity/routes.txt)"
python3 -I tools/fidelity/snap.py diff ../pix/base ../pix/after   # prints `identical`, exit 1 on any DIFF/SIZE/MISSING
```

Without `--routes` it crawls every in-app `#/` link from `/` (max 120) and writes `<out>/routes.txt`.
`--app <dir>` picks the demo app (default `apps/demo-react`); its `dist/` is served.
`routes.txt` is the crawl of main (one route per line); `routes-by-page.json` maps the same routes to page folders.

Captures: 1440 px wide, full page, dark and light, `reduced_motion=reduce` and `animations=disabled`. Query strings are
stripped from crawled links (states/probe/leak captures come later).

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
success/skipped. Squash, pinned on the checked head sha. PRs labelled `hold` are skipped. Exits cleanly when none is open.

## registry-selectors.py

```sh
python3 -I tools/fidelity/registry-selectors.py .                    # counts per page folder and per registry class
python3 -I tools/fidelity/registry-selectors.py . --check allow.tsv  # exit 1 on a selector not in the allowlist
```

Counts page CSS selectors (`apps/demo-react/src/ui/pages`) that reach into registry classes (`packages/registry/src/css`).

## Known flaky

- Caret-sized change (≤3 px wide × ≤40 px tall) is reported as `NOISE` and ignored.
- Anti-aliasing jitter (≤200 changed px, every channel within ±2) is reported as `NOISE` and ignored.
- `/tests` light: full-page height varies between 1766 and 1795 px.
- `/tests/runner/119`: a11y counts are unstable.
