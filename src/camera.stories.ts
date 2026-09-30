import './camera.css';

import type { Meta, StoryObj } from '@storybook/html-vite';

import type { Canvas, CanvasOptions } from './camera';
import { createCanvas } from './camera';

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
    // Outline the pannable extent so the edge stops are visible; an unbounded
    // axis spans the whole layout box.
    const { worldWidth, worldHeight } = options;
    if (worldWidth !== undefined || worldHeight !== undefined) {
      const bounds = document.createElement('div');
      bounds.style.cssText = `
        position: absolute; left: 0; top: 0;
        width: ${worldWidth !== undefined ? `${worldWidth}px` : '100%'};
        height: ${worldHeight !== undefined ? `${worldHeight}px` : '100%'};
        outline: 2px dashed rgb(var(--vital) / 0.6);
        pointer-events: none;
      `;
      current.world.appendChild(bounds);
    }
    return container;
  },
  // Defaults match createCanvas's, except the centre: mid-way across the
  // bounded stories' 5000×5000 world.
  args: {
    tilt: 30,
    perspective: 1200,
    dollyStep: 200,
    zMin: -4000,
    zMax: 900,
    backdropDepth: 500,
    centerX: 2500,
    centerY: 2500,
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

// Edge behaviour: no bounds on either axis. Pan runs forever in every
// direction; the ground and backdrop wrap, so they never run out.
export const InfiniteScroll: StoryObj<CanvasOptions> = {
  name: 'Edges: infinite scroll',
  args: { worldWidth: undefined, worldHeight: undefined },
};

// Edge behaviour: pan bounded on both axes to a 5000×5000 world (outlined).
// The world point under the screen centre stops at each edge, so up to half
// a viewport past the outline stays visible.
export const Bounded: StoryObj<CanvasOptions> = {
  name: 'Edges: bounded width and height',
  args: { worldWidth: 5000, worldHeight: 5000 },
};

// Swapped surface patterns: each is one SVG tile, so shape and colour are
// whatever the markup draws. Pitch sets both the tile size and wrap step.
export const CustomSurfaces: StoryObj<CanvasOptions> = {
  name: 'Custom surfaces',
  args: {
    // Backdrop twice as deep as the default 500, for stronger parallax.
    backdropDepth: 1000,
    ground: {
      pitch: 60,
      tile: `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60">
        <rect x="27" y="27" width="6" height="6" fill="#5b2a9e"/>
      </svg>`,
    },
    backdrop: {
      pitch: 240,
      tile: `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240">
        <path d="M0 .5h240M.5 0v240" stroke="#0a7c8c"/>
      </svg>`,
    },
  },
};
