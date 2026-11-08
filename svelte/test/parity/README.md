# Strict story parity

Build the shared CSS and both packages first. Install Python dependencies with
`python3 -m pip install -r svelte/test/parity/requirements.txt` and
`python3 -m playwright install chromium`, then `pnpm -C svelte parity`.
Set `PARITY_PYTHON` to an existing virtualenv interpreter if needed.

CSF IDs come from Storybook's own parser and ID rules. Every React component
story needs a Svelte twin; MDX docs entries are not component captures.
The browser mounts both frameworks client-side, applies local story decorators,
shared frame semantics and each package's no-fonts CSS. Locally vendored OFL
fonts are SHA256-pinned (licences alongside them). No network fonts, masks or
tolerance. Time, Chromium flags, motion, scale and viewport are fixed. Full-page captures
include content below the fold; unequal rendered sizes also fail.

`PARITY_STORIES=components-button,foundations-` selects IDs/prefixes.
`PARITY_THEMES=dark,light`, `PARITY_REPEAT=2` (minimum two self captures),
`PARITY_MOBILE=1` adds a 390px viewport to 1280x900.
Results and exact diff images live in gitignored `.artifacts/`; missing twins,
render errors, nondeterministic self-captures and pixel differences fail.
The original `test:button-parity` matrix and browser interaction checks remain unchanged.
