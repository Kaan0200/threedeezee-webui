import './camera.css';

import type { Meta, StoryObj } from '@storybook/html-vite';

import type { Canvas } from './camera';
import { createCanvas } from './camera';
import type { PanelOptions } from './panel';
import { createPanel } from './panel';

// Plain-HTML stories get no cleanup hook, and every control change re-renders,
// so tear down the previous canvas before building the next.
let current: Canvas | undefined;

const PANEL_STYLE =
  'padding: 16px; background: #fff; border: 1px solid #333; font: 16px system-ui;';

// One controllable panel, plus a fixed neighbour to drag it against. The
// camera centres on world (1000, 1000).
const meta: Meta<PanelOptions> = {
  title: 'Panel',
  parameters: { layout: 'fullscreen' },
  render: (options) => {
    current?.destroy();
    const container = document.createElement('div');
    container.style.height = '100vh';
    current = createCanvas(container, { centerX: 1000, centerY: 1000 });

    createPanel(current, {
      x: 1100,
      y: 1150,
      attributes: { style: PANEL_STYLE },
    }).el.textContent = 'Fixed neighbour at (1100, 1150), sized to content';

    const { el } = createPanel(current, {
      ...options,
      attributes: { style: PANEL_STYLE },
    });
    el.textContent = options.draggable
      ? 'Drag me'
      : `Panel at (${options.x}, ${options.y})`;
    return container;
  },
  args: { x: 800, y: 850, width: 300, height: 200, draggable: false },
  argTypes: {
    x: { control: 'number' },
    y: { control: 'number' },
    // Clear either field to size that axis to content.
    width: { control: 'number' },
    height: { control: 'number' },
    draggable: { control: 'boolean' },
  },
};

export default meta;

export const Default: StoryObj<PanelOptions> = {};

export const Draggable: StoryObj<PanelOptions> = {
  args: { draggable: true },
};
