#!/usr/bin/env bash
# Assembles the GitHub Pages site into ./site:
#   /           landing page (DEMO marked, noindex)
#   /react/     React Storybook
#   /angular/   Angular Storybook
#   /svelte/    Svelte Storybook
#   /demo-svelte/ clickable Svelte demo
#   /demo/      clickable demo (hash router + relative Vite base, so it works under any sub-path)
# Build both demos and all Storybooks first. CI passes the built folders (artifacts) instead, with
# REACT_STORYBOOK_DIR, ANGULAR_STORYBOOK_DIR, SVELTE_STORYBOOK_DIR, DEMO_DIR and SVELTE_DEMO_DIR.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SITE="${SITE_DIR:-$ROOT/site}"
abs() { case "$1" in /*) echo "$1" ;; *) echo "$ROOT/$1" ;; esac; }
REACT_SB="$(abs "${REACT_STORYBOOK_DIR:-react/apps/storybook/storybook-static}")"
ANGULAR_SB="$(abs "${ANGULAR_STORYBOOK_DIR:-apps/storybook-angular/storybook-static}")"
SVELTE_SB="$(abs "${SVELTE_STORYBOOK_DIR:-svelte/apps/storybook/storybook-static}")"
DEMO="$(abs "${DEMO_DIR:-apps/demo-react/dist}")"
SVELTE_DEMO="$(abs "${SVELTE_DEMO_DIR:-svelte/apps/demo/dist}")"

need() {
  if [ ! -f "$1" ]; then
    echo "assemble.sh: missing $1 (run: $2)" >&2
    exit 1
  fi
}

need "$REACT_SB/index.html" "pnpm build:storybooks"
need "$ANGULAR_SB/index.html" "pnpm build:storybooks"
need "$SVELTE_SB/index.html" "pnpm -C svelte build:storybook"
need "$SVELTE_SB/index.json" "pnpm -C svelte build:storybook"
need "$DEMO/index.html" "pnpm build:demo"
need "$SVELTE_DEMO/index.html" "pnpm build:demo:svelte"
# The MSW worker of the demo's `http` backend (apps/demo-react/public/, copied by Vite). It must sit next to the demo's
# index.html: it is registered with a relative URL, so its scope is /demo/ only.
need "$DEMO/mockServiceWorker.js" "pnpm build:demo"
need "$ROOT/tools/site/index.html" "git checkout tools/site/index.html"

rm -rf "$SITE"
mkdir -p "$SITE/react" "$SITE/angular" "$SITE/svelte" "$SITE/demo" "$SITE/demo-svelte"
cp "$ROOT/tools/site/index.html" "$SITE/index.html"
cp -r "$REACT_SB/." "$SITE/react/"
cp -r "$ANGULAR_SB/." "$SITE/angular/"
cp -r "$SVELTE_SB/." "$SITE/svelte/"
cp -r "$DEMO/." "$SITE/demo/"
cp -r "$SVELTE_DEMO/." "$SITE/demo-svelte/"
# GitHub Pages: do not run Jekyll over the Storybook/Vite output (files starting with an underscore).
touch "$SITE/.nojekyll"

echo "site assembled in $SITE"
du -sh "$SITE"/* | sed "s#$SITE/##"
