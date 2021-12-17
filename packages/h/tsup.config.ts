import type { Options } from 'tsup';

export const tsup: Options = {
  splitting: false,
  sourcemap: true,
  entryPoints: ['src/main.ts'],
  format: ['cjs', 'esm'],
  dts: { entry: 'src/main.ts' },
};
