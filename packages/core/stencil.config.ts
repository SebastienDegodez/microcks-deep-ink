import { Config } from '@stencil/core';
import { reactOutputTarget } from '@stencil/react-output-target';
import { angularOutputTarget } from '@stencil/angular-output-target';

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
    reactOutputTarget({
      outDir: '../react/src/components/stencil-generated/',
    }),
    angularOutputTarget({
      componentCorePackage: '@microcks-deep-ink/core',
      outputType: 'standalone',
      directivesProxyFile: '../angular/projects/library/src/lib/stencil-generated/components.ts',
      directivesArrayFile: '../angular/projects/library/src/lib/stencil-generated/index.ts',
      valueAccessorConfigs: [
        {
          elementSelectors: ['mk-input'],
          event: 'mkInput',
          targetAttr: 'value',
          type: 'text',
        },
      ],
    }),
  ],
};
