import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const src = (path: string) => fileURLToPath(new URL(`../../src/${path}`, import.meta.url));

// The React example site. Same wiring as the HTML example: the package's two
// entry points resolve to the library source, so edits in src/ show up live;
// the imports read exactly as they would for a consumer.
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  // Relative asset paths, so the build can be hosted from any sub-path.
  base: './',
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^threedeezee$/, replacement: src('index.ts') },
      { find: /^threedeezee\/style\.css$/, replacement: src('camera.css') },
    ],
  },
});
