/**
 * Panels: plain divs lying flat on the canvas world, placed in world px with
 * (0, 0) at the world's upper-left, like normal block flow. Beyond placement
 * they're ordinary divs — fill, style and listen to `el` as usual.
 */
import type { Canvas } from './camera';
import { trackDrag } from './drag';

export type PanelOptions = {
  /** World px of the panel's upper-left corner. */
  x: number;
  y: number;
  /** px. Omit to size to content. */
  width?: number;
  height?: number;
  /** Grab anywhere on the panel to move it (instead of panning the camera). */
  draggable?: boolean;
  /** Passed straight through as HTML attributes: class, id, style, data-*,
      aria-*, ... Placement and size above win over any in `style`. */
  attributes?: Record<string, string>;
};

export type Panel = {
  el: HTMLDivElement;
  /** Move the panel's upper-left corner to world (x, y). For drag handles. */
  moveTo(x: number, y: number): void;
};

export function createPanel(canvas: Canvas, options: PanelOptions): Panel {
  const { width, height, draggable = false, attributes = {} } = options;
  let { x, y } = options;

  const el = document.createElement('div');
  for (const [name, value] of Object.entries(attributes)) {
    el.setAttribute(name, value);
  }
  el.style.position = 'absolute';
  if (width !== undefined) el.style.width = `${width}px`;
  if (height !== undefined) el.style.height = `${height}px`;

  function moveTo(nextX: number, nextY: number) {
    x = nextX;
    y = nextY;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  }
  moveTo(x, y);

  if (draggable) {
    trackDrag(el, canvas.screenToPlaneDelta, {
      stopPropagation: true,
      onMove: (dx, dy) => moveTo(x + dx, y + dy),
    });
  }

  canvas.world.appendChild(el);
  return { el, moveTo };
}
