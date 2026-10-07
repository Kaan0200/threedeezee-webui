/**
 * Shared steps for the stories' interaction tests (their `play` functions).
 * Everything that acts or asserts goes through storybook/test, so each call
 * shows up as a step in Storybook's Interactions panel and can be replayed.
 */
import gsap from 'gsap';
import { expect, fireEvent, waitFor } from 'storybook/test';

export type Rig = {
  viewport: HTMLElement;
  camera: HTMLElement;
  world: HTMLElement;
};

/** The rig's layers, once the canvas has laid out and centred itself. */
export async function rigOf(canvasElement: HTMLElement): Promise<Rig> {
  const viewport = canvasElement.querySelector<HTMLElement>('.tdz-viewport')!;
  const camera = viewport.querySelector<HTMLElement>('.tdz-camera')!;
  const world = viewport.querySelector<HTMLElement>('.tdz-world')!;
  // The world gets no transform until the first (centring) pan render.
  await waitFor(() => expect(world.style.transform).not.toBe(''));
  return { viewport, camera, world };
}

/** The content layer's rendered pan, px. Eases toward its target over 0.4s,
    so assert on it inside waitFor. */
export function panOf(world: HTMLElement): { x: number; y: number } {
  return {
    x: Number(gsap.getProperty(world, 'x')),
    y: Number(gsap.getProperty(world, 'y')),
  };
}

/** The camera rig's rendered dolly, px. Eases like the pan. */
export function dollyOf(camera: HTMLElement): number {
  return Number(gsap.getProperty(camera, 'z'));
}

/** Press on `el`, move (dx, dy) screen px, release. */
export async function drag(el: HTMLElement, dx: number, dy: number): Promise<void> {
  // Mouse pointer: the one id that can be captured without a real press.
  const pointer = { pointerId: 1, button: 0 };
  await fireEvent.pointerDown(el, { ...pointer, clientX: 100, clientY: 100 });
  await fireEvent.pointerMove(el, { ...pointer, clientX: 100 + dx, clientY: 100 + dy });
  await fireEvent.pointerUp(el, { ...pointer, clientX: 100 + dx, clientY: 100 + dy });
}
