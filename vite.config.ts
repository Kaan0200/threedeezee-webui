import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      // Two entry points: the engine, and the custom elements built on it.
      entry: { threedeezee: 'src/index.ts', elements: 'src/elements.ts' },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.mjs`,
      cssFileName: 'style',
    },
    rollupOptions: {
      external: ['gsap'],
    },
  },
});
