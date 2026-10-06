import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Two kinds of test, one `vitest` run:
//   unit       src/**/*.test.ts in happy-dom — logic that needs a DOM but no
//              layout or rendering (drag bookkeeping, option handling).
//   storybook  every story, in headless Chromium. A story passes if it renders
//              and its `play` function's assertions hold; these are the ones
//              Storybook's sidebar and Interactions panel show and replay.
export default defineConfig({
  test: {
    // Measured across both projects and merged. Only what ships counts: the
    // stories, tests and the dev-server entry (main.ts) are not the library.
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.stories.ts',
        'src/**/*.test.ts',
        'src/story-utils.ts',
        'src/main.ts',
      ],
      // A ratchet, not a target: set just under today's numbers so a change
      // that drops tests or adds untested code fails. elements.ts has no
      // tests yet and drags these down — raise them as that's filled in.
      thresholds: { statements: 65, branches: 62, functions: 55, lines: 65 },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'happy-dom',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: fileURLToPath(new URL('.storybook', import.meta.url)),
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
