/**
 * Pins: thin divs standing straight up out of the canvas world, along the
 * ground plane's z axis (toward the lens). Each is laid out flat along -y from
 * its base, then swung 90° about that edge to stand up — which way round
 * keeps its front face toward the camera and its local "up" pointing up, so
 * anything on it (like the flag) reads upright, not mirrored.
 */
import type { Canvas } from './camera';

const FLAG_WIDTH = 24;
const FLAG_HEIGHT = 16;

export type PinOptions = {
  /** World px of the pin's base, where it meets the ground. */
  x: number;
  y: number;
  /** How far it stands up, px. */
  height: number;
  /** Thickness, px. Default 2. */
  width?: number;
  /** Any CSS colour. Default: currentColor. */
  color?: string;
  /** Hang a small clickable flag off the tip, in the pin's colour. */
  flag?: boolean;
  /** Passed straight through as HTML attributes: class, id, style, data-*,
      aria-*, ... Placement, size and colour above win over any in `style`. */
  attributes?: Record<string, string>;
};

export type Pin = {
  el: HTMLDivElement;
  /** The flag, when `flag` is set: a regular div, so listen for clicks here. */
  flag?: HTMLDivElement;
};

export function createPin(canvas: Canvas, options: PinOptions): Pin {
  const {
    x,
    y,
    height,
    width = 2,
    color = 'currentColor',
    flag: withFlag = false,
    attributes = {},
  } = options;

  const el = document.createElement('div');
  for (const [name, value] of Object.entries(attributes)) {
    el.setAttribute(name, value);
  }
  Object.assign(el.style, {
    position: 'absolute',
    // Centre the thickness on x; the bottom edge is the base, at y.
    left: `${x - width / 2}px`,
    top: `${y - height}px`,
    width: `${width}px`,
    height: `${height}px`,
    background: color,
    transformOrigin: 'bottom center',
    transform: 'rotateX(-90deg)',
    // The pole itself never blocks a pan; the flag opts back in below.
    pointerEvents: 'none',
  });

  let flag: HTMLDivElement | undefined;
  if (withFlag) {
    flag = document.createElement('div');
    Object.assign(flag.style, {
      position: 'absolute',
      // Off the pole's right side, level with the tip.
      left: '100%',
      top: '0',
      width: `${FLAG_WIDTH}px`,
      height: `${FLAG_HEIGHT}px`,
      background: color,
      pointerEvents: 'auto',
      cursor: 'pointer',
    });
    // A press on the flag is a click, not the start of a camera pan.
    flag.addEventListener('pointerdown', (e) => e.stopPropagation());
    el.appendChild(flag);
  }

  canvas.world.appendChild(el);
  return { el, flag };
}
