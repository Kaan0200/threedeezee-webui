import { defineConfig } from 'vite';

// `vite` (dev) serves the demo playground; `vite build` builds the library.
export default defineConfig(({ command }) =>
  command === 'serve'
    ? { root: 'demo' }
    : {
        build: {
          lib: {
            entry: 'src/index.ts',
            formats: ['es'],
            fileName: 'threedeezee',
          },
        },
      },
);
