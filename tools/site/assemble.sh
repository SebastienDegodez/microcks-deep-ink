#!/usr/bin/env bash
# Assembles the GitHub Pages site into ./site:
#   /           landing page (DEMO marked, noindex)
#   /react/     React Storybook
#   /angular/   Angular Storybook
#   /demo/      clickable demo (hash router + relative Vite base, so it works under any sub-path)
# Run `pnpm build:storybooks && pnpm build:demo` first.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SITE="${SITE_DIR:-$ROOT/site}"

need() {
  if [ ! -f "$1" ]; then
    echo "assemble.sh: missing $1 (run: $2)" >&2
    exit 1
  fi
}

need "$ROOT/apps/storybook-react/storybook-static/index.html" "pnpm build:storybooks"
need "$ROOT/apps/storybook-angular/storybook-static/index.html" "pnpm build:storybooks"
need "$ROOT/apps/demo-react/dist/index.html" "pnpm build:demo"
need "$ROOT/tools/site/index.html" "git checkout tools/site/index.html"

rm -rf "$SITE"
mkdir -p "$SITE/react" "$SITE/angular" "$SITE/demo"
cp "$ROOT/tools/site/index.html" "$SITE/index.html"
cp -r "$ROOT/apps/storybook-react/storybook-static/." "$SITE/react/"
cp -r "$ROOT/apps/storybook-angular/storybook-static/." "$SITE/angular/"
cp -r "$ROOT/apps/demo-react/dist/." "$SITE/demo/"
# GitHub Pages: do not run Jekyll over the Storybook/Vite output (files starting with an underscore).
touch "$SITE/.nojekyll"

echo "site assembled in $SITE"
du -sh "$SITE"/* | sed "s#$SITE/##"
