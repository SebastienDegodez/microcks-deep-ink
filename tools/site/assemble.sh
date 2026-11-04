#!/usr/bin/env bash
# Assembles the GitHub Pages site into ./site:
#   /           landing page (DEMO marked, noindex)
#   /react/     React Storybook
#   /angular/   Angular Storybook
#   /demo/      clickable demo (hash router + relative Vite base, so it works under any sub-path)
# Run `pnpm build:storybooks && pnpm build:demo` first. CI passes the built folders (artifacts) instead, with
# REACT_STORYBOOK_DIR, ANGULAR_STORYBOOK_DIR and DEMO_DIR (relative to the repo root, or absolute).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SITE="${SITE_DIR:-$ROOT/site}"
abs() { case "$1" in /*) echo "$1" ;; *) echo "$ROOT/$1" ;; esac; }
REACT_SB="$(abs "${REACT_STORYBOOK_DIR:-react/apps/storybook/storybook-static}")"
ANGULAR_SB="$(abs "${ANGULAR_STORYBOOK_DIR:-apps/storybook-angular/storybook-static}")"
DEMO="$(abs "${DEMO_DIR:-apps/demo-react/dist}")"

need() {
  if [ ! -f "$1" ]; then
    echo "assemble.sh: missing $1 (run: $2)" >&2
    exit 1
  fi
}

need "$REACT_SB/index.html" "pnpm build:storybooks"
need "$ANGULAR_SB/index.html" "pnpm build:storybooks"
need "$DEMO/index.html" "pnpm build:demo"
need "$ROOT/tools/site/index.html" "git checkout tools/site/index.html"

rm -rf "$SITE"
mkdir -p "$SITE/react" "$SITE/angular" "$SITE/demo"
cp "$ROOT/tools/site/index.html" "$SITE/index.html"
cp -r "$REACT_SB/." "$SITE/react/"
cp -r "$ANGULAR_SB/." "$SITE/angular/"
cp -r "$DEMO/." "$SITE/demo/"
# GitHub Pages: do not run Jekyll over the Storybook/Vite output (files starting with an underscore).
touch "$SITE/.nojekyll"

echo "site assembled in $SITE"
du -sh "$SITE"/* | sed "s#$SITE/##"
