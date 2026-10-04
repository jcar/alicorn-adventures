import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';

/** Writes sw.js (the offline service worker) with this build's version and file list. */
function serviceWorker(): Plugin {
  return {
    name: 'service-worker',
    apply: 'build',
    generateBundle(_options, bundle) {
      const files = ['./', 'index.html', 'manifest.webmanifest', 'favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png', ...Object.keys(bundle).filter((f) => !f.endsWith('.map'))];
      const source = readFileSync('tools/sw-template.js', 'utf8')
        .replace('__VERSION__', String(Date.now()))
        .replace('__PRECACHE__', JSON.stringify([...new Set(files)]));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

export default defineConfig({
  base: './',
  server: { port: 5173 },
  build: { chunkSizeWarningLimit: 2000 },
  plugins: [serviceWorker()],
});
