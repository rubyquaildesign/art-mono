/* eslint-disable unicorn/prefer-module */
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [],
	build: {
		lib: {
			entry: path.resolve(__dirname, 'src/main.ts'),
			name: 'rupertofly-h',
			fileName: format => `h.${format}.js`,
		},
	},
	resolve: {
		alias: {
			'xmlhttprequest-ssl':
				'./node_modules/engine.io-client/lib/xmlhttprequest.js',
		},
	},
});
