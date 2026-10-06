import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'threedeezee',
      cssFileName: 'style',
    },
    rollupOptions: {
      external: ['gsap'],
    },
  },
});
