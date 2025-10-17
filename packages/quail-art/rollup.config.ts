import { defineConfig } from 'rollup';
import rpWesl from 'wesl-plugin/rollup';
import { staticBuildExtension } from 'wesl-plugin';
import { globSync } from 'glob';
import { fileURLToPath } from 'node:url';
export default defineConfig({
	plugins: [
		rpWesl({
			extensions: [staticBuildExtension],
		}),
	],
	input: globSync('./src/webgpu/shaders/*.wgsl').map((f) => fileURLToPath(new URL(f, import.meta.url))),
	output: {
		format: 'es',
		dir: 'dist',
	},
});
