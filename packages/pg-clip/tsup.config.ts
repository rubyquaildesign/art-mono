import type { Options } from 'tsup';

export const tsup: Options = {
	splitting: false,
	sourcemap: true,
	target: 'esnext',
	entryPoints: ['src/main.ts'],
	format: ['esm'],
	dts: { entry: 'src/main.ts' },
};
