import './camera.css';

import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, userEvent } from 'storybook/test';

import type { Canvas } from './camera';
import { createCanvas } from './camera';
import type { PinOptions } from './pin';
import { createPin } from './pin';
import { drag, panOf, rigOf } from './story-utils';

// Plain-HTML stories get no cleanup hook, and every control change re-renders,
// so tear down the previous canvas before building the next.
let current: Canvas | undefined;

// The camera centres on the pin's base. Clicking the flag toggles it white,
// to show it takes clicks without panning.
const meta: Meta<PinOptions> = {
  title: 'Pin',
  parameters: { layout: 'fullscreen' },
  render: (options) => {
    current?.destroy();
    const container = document.createElement('div');
    container.style.height = '100vh';
    current = createCanvas(container, { centerX: options.x, centerY: options.y });
    const { flag } = createPin(current, options);
    if (flag) {
      const original = flag.style.background;
      flag.addEventListener('click', () => {
        flag.style.background = flag.style.background === 'white' ? original : 'white';
      });
    }
    return container;
  },
  args: { x: 2500, y: 2500, height: 300, width: 2 },
  argTypes: {
    x: { control: 'number' },
    y: { control: 'number' },
    height: { control: { type: 'range', min: 0, max: 1000, step: 10 } },
    width: { control: { type: 'range', min: 1, max: 40, step: 1 } },
    color: { control: 'color' },
    // true, or { width, height, color, shape } — shape is a CSS clip-path.
    flag: { control: 'object' },
  },
};

export default meta;

export const Red: StoryObj<PinOptions> = {
  args: { color: 'red', flag: true },
};

// A custom flag: a blue triangular pennant on the red pin.
export const Pennant: StoryObj<PinOptions> = {
  args: {
    color: 'red',
    flag: {
      width: 40,
      height: 24,
      color: 'blue',
      shape: 'polygon(0 0, 100% 50%, 0 100%)',
    },
  },
};

// ── Interaction tests ──────────────────────────────────────────────────────
// See camera.stories.ts: run by `pnpm test`, replayable in Storybook.

export const TestFlagClicks: StoryObj<PinOptions> = {
  name: 'Test: flag takes clicks without panning',
  args: Red.args,
  play: async ({ canvasElement }) => {
    const { world } = await rigOf(canvasElement);
    // The pin is the world's only child here; the flag is the pin's.
    const flag = world.querySelector<HTMLElement>(':scope > div > div')!;
    const before = panOf(world);

    await userEvent.click(flag);
    expect(flag.style.background).toBe('white');

    // A press that starts on the flag is swallowed there, so moving with it
    // held never becomes a camera pan.
    await drag(flag, 150, 0);
    expect(panOf(world)).toEqual(before);
  },
};
