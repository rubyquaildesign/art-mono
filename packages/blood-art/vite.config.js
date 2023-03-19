import { defineConfig } from 'vite';
import glslify from 'vite-plugin-glslify';
// Const __dirname = path.resolve();
// https://vitejs.dev/config/
export default defineConfig({
	plugins: [glslify()],
	build: { target: 'chrome90' },
	resolve: {
		alias: {
			'xmlhttprequest-ssl':
				'../../../node_modules/engine.io-client/lib/xmlhttprequest.js',
		},
	},
});
