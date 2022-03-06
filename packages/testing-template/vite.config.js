import { defineConfig } from 'vite';

// Const __dirname = path.resolve();
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  build: { target: 'chrome90' },
  resolve: {
    alias: {
      'xmlhttprequest-ssl':
        '../../node_modules/engine.io-client/lib/xmlhttprequest.js',
    },
  },
});
