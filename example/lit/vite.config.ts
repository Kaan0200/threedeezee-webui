import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const src = (path: string) => fileURLToPath(new URL(`../../src/${path}`, import.meta.url));

// The Lit example site. Same wiring as the HTML example: the package's
// elements entry point resolves to the library source, so edits in src/ show
// up live; the import reads exactly as it would for a consumer. No style.css
// here — the elements carry the structural CSS in their shadow roots.
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  // Relative asset paths, so the build can be hosted from any sub-path.
  base: './',
  resolve: {
    alias: [{ find: /^threedeezee\/elements$/, replacement: src('elements.ts') }],
  },
});
