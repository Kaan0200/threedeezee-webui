import './camera.css';

import type { Meta, StoryObj } from '@storybook/html-vite';

import type { Canvas } from './camera';
import { createCanvas } from './camera';
import type { PinOptions } from './pin';
import { createPin } from './pin';

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
    flag?.addEventListener('click', () => {
      const on = flag.style.background === 'white';
      flag.style.background = on ? options.color ?? 'currentColor' : 'white';
    });
    return container;
  },
  args: { x: 2500, y: 2500, height: 300, width: 2 },
  argTypes: {
    x: { control: 'number' },
    y: { control: 'number' },
    height: { control: { type: 'range', min: 0, max: 1000, step: 10 } },
    width: { control: { type: 'range', min: 1, max: 40, step: 1 } },
    color: { control: 'color' },
    flag: { control: 'boolean' },
  },
};

export default meta;

export const Red: StoryObj<PinOptions> = {
  args: { color: 'red', flag: true },
};
