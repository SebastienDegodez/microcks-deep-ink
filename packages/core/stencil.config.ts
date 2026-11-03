import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'deep-ink',
  globalStyle: 'src/global/global.css',
  outputTargets: [
    { type: 'dist', esmLoaderPath: '../loader' },
    {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'single-export-module',
      externalRuntime: false,
      generateTypeDeclarations: true,
    },
  ],
};
