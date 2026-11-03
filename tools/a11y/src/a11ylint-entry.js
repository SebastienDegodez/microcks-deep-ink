// Browser entry of the a11ylint bundle. Exposes `window.__a11ylint.run(options)`.
import Core from '@a11ylint/core';

window.__a11ylint = {
  run: (options) => new Core().run(options),
};
