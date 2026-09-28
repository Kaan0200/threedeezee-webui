import './camera.css';
import './demo.css';

import type { Meta, StoryObj } from '@storybook/html-vite';

import type { Canvas, CanvasOptions } from './camera';
import { createCanvas } from './camera';
import { mountVitePage } from './vite-page';

// Plain-HTML stories get no cleanup hook, and every control change re-renders,
// so tear down the previous canvas before building the next.
let current: Canvas | undefined;

const meta: Meta<CanvasOptions> = {
  title: 'Canvas',
  parameters: { layout: 'fullscreen' },
  render: (options) => {
    current?.destroy();
    const container = document.createElement('div');
    container.style.height = '100vh';
    current = createCanvas(container, options);
    current.world.innerHTML = `
      <div id="origin-axis"></div>
      <div id="plate"></div>
    `;
    mountVitePage(current.world.querySelector<HTMLElement>('#plate')!);
    return container;
  },
  // Defaults match createCanvas's, except the centre, which lands on the plate.
  args: {
    tilt: 30,
    perspective: 1200,
    dollyStep: 200,
    zMin: -4000,
    zMax: 900,
    backdropDepth: 500,
    centerX: 2500,
    centerY: 2400,
  },
  argTypes: {
    // Past ~60° the far edge of a tall viewport starts reaching the horizon.
    tilt: { control: { type: 'range', min: 0, max: 60, step: 1 } },
    perspective: { control: { type: 'range', min: 400, max: 3000, step: 50 } },
    dollyStep: { control: { type: 'range', min: 50, max: 600, step: 25 } },
    zMin: { control: { type: 'range', min: -10000, max: 0, step: 100 } },
    zMax: { control: { type: 'range', min: 0, max: 2000, step: 50 } },
    backdropDepth: { control: { type: 'range', min: 0, max: 2000, step: 50 } },
    centerX: { control: 'number' },
    centerY: { control: 'number' },
    // Clear either field to make that axis infinite again.
    worldWidth: { control: 'number' },
    worldHeight: { control: 'number' },
  },
};

export default meta;

export const Default: StoryObj<CanvasOptions> = {};

// Zoom locked by collapsing the dolly range to a single height: pulled back
// enough to see around the plate while panning, close enough to read it.
export const PanOnly: StoryObj<CanvasOptions> = {
  name: 'Pan only (zoom locked)',
  args: { zMin: -800, zMax: -800 },
};

// Pan bounded left/right to a 5000px-wide world; height is left unset, so it
// stays infinite up/down. Set worldHeight to bound that axis too.
export const LockedSize: StoryObj<CanvasOptions> = {
  name: 'Locked size (width only)',
  args: { worldWidth: 5000 },
};
