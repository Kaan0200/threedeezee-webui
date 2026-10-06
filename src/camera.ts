/**
 * Tilted (2.5D) camera rig, copied from dept-of-joined-game (squad-mgmt-tuari).
 * createCanvas builds this stack inside the container it's given:
 *
 *   .tdz-viewport   the lens — establishes the perspective frustum
 *   .tdz-camera     viewport-sized rig carrying the fixed rotateX tilt + the dolly (z)
 *   .tdz-world      the pannable content layer, on the ground plane
 *   .tdz-ground     the ground plane's dot field (wraps, so it never runs out)
 *   .tdz-backdrop   parallax plane pushed back along the tilt normal (also wraps)
 *
 * Wheel dollies the rig toward/away from the surface; a drag anywhere pans the
 * world across the tilted ground plane. Pan is unbounded: the patterned planes
 * only ever translate by the pan modulo their tile pitch, so they stay put
 * under the lens while the content layer takes the real pan. Structural CSS
 * lives in camera.css.
 */
import gsap from 'gsap';

import { trackDrag } from './drag';
import type { ToPlaneDelta } from './drag';

/** A wrapping surface: one SVG tile, repeated every `pitch` px. */
export type Surface = {
  /** Tile size, px. Also the wrap step as the surface pans. */
  pitch: number;
  /** SVG markup for one tile, drawn in a pitch × pitch box (it's stretched to
      fit). The shape and its colour live here. */
  tile: string;
};

// Dark grey dots on a tighter pitch than the backdrop's crossmark cell, so the
// two planes read at clearly different densities on top of their parallax.
const DEFAULT_GROUND: Surface = {
  pitch: 40,
  tile: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
    <circle cx="20" cy="20" r="1.5" fill="#555555"/>
  </svg>`,
};

// Corner registration ticks: each tile draws L-ticks at its four corners;
// adjacent tiles complete the marks, in a darker grey than the dots.
const DEFAULT_BACKDROP: Surface = {
  pitch: 100,
  tile: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
    <path d="M0 0h6M0 0v6M100 0h-6M100 0v6M0 100h6M0 100v-6M100 100h-6M100 100v-6"
      stroke="#333333" stroke-width="1"/>
  </svg>`,
};

export type CanvasOptions = {
  /** Fixed camera pitch, degrees. 0 = top-down, 90 = horizon. */
  tilt?: number;
  /** Lens distance, px. Smaller = stronger foreshortening. */
  perspective?: number;
  /** px of dolly travel per mouse-wheel notch (100px of wheel delta).
      Touchpads scroll in smaller deltas, so they dolly proportionally. */
  dollyStep?: number;
  /** Dollied fully out (far from the surface). */
  zMin?: number;
  /** Dollied fully in. Capped below `perspective` to avoid clipping through
      the lens. */
  zMax?: number;
  /** How far the backdrop sits behind the board along the tilt normal.
      Deeper = stronger parallax. */
  backdropDepth?: number;
  /** World point centred in the viewport on load. */
  centerX?: number;
  centerY?: number;
  /** Pannable extent in world px from world (0, 0): the world point under the
      screen centre stays within [0, worldWidth] × [0, worldHeight]. Omit
      either to leave pan unbounded on that axis. */
  worldWidth?: number;
  worldHeight?: number;
  /** Pattern on the ground plane, under the content. Default: dark grey dots. */
  ground?: Surface;
  /** Pattern on the parallax backdrop. Default: darker grey corner ticks. */
  backdrop?: Surface;
};

export type Canvas = {
  /** The content layer: append content here, positioned in world px. */
  world: HTMLElement;
  /** Screen-space pointer delta → delta on the tilted ground plane, at the
      current dolly. Hand this to trackDrag for anything draggable on the
      world plane, so its motion stays 1:1 with the cursor at any zoom. */
  screenToPlaneDelta: ToPlaneDelta;
  /** Stop all motion and listeners, and remove the rig from the container. */
  destroy(): void;
};

type CameraState = {
  panX: number; // world translation along the ground (screen-horizontal)
  panY: number; // world translation along the ground (into/out of the tilt)

  z: number; // dolly: distance of the camera rig from the lens
};

/** Build the camera rig inside `container`, which must have a size (for a
    shadow root, its host must). */
export function createCanvas(
  container: HTMLElement | ShadowRoot,
  options: CanvasOptions = {},
): Canvas {
  const {
    tilt = 30,
    perspective = 1200,
    dollyStep = 200,
    zMin = -4000,
    zMax = 900,
    backdropDepth = 500,
    centerX = 0,
    centerY = 0,
    worldWidth,
    worldHeight,
    ground: groundSurface = DEFAULT_GROUND,
    backdrop: backdropSurface = DEFAULT_BACKDROP,
  } = options;
  const tiltRad = (tilt * Math.PI) / 180;
  const zCap = Math.min(zMax, perspective - 300);

  const viewport = document.createElement('div');
  viewport.className = 'tdz-viewport';
  viewport.innerHTML = `
    <div class="tdz-camera">
      <div class="tdz-backdrop"></div>
      <div class="tdz-ground"></div>
      <div class="tdz-world"></div>
    </div>
  `;
  viewport.style.perspective = `${perspective}px`;
  container.appendChild(viewport);
  const camera = viewport.querySelector<HTMLElement>('.tdz-camera')!;
  const backdrop = viewport.querySelector<HTMLElement>('.tdz-backdrop')!;
  const ground = viewport.querySelector<HTMLElement>('.tdz-ground')!;
  const world = viewport.querySelector<HTMLElement>('.tdz-world')!;

  const state: CameraState = {
    panX: 0,
    panY: 0,
    // Start at the natural height (z 0), pulled into the dolly range so a
    // range that excludes it (e.g. zoom locked at another height) holds.
    z: Math.min(Math.max(0, zMin), zCap),
  };

  // Fixed tilt lives on the camera rig; the dolly animates its z separately.
  // Tilt pivots around the screen centre (transformOrigin 50% 50%).
  gsap.set(camera, {
    rotationX: tilt,
    z: state.z,
    transformOrigin: '50% 50%',
  });

  // The backdrop is pushed back along the tilt normal (-z) so perspective
  // moves its pan slower — a physical parallax under the board.
  gsap.set(backdrop, { z: -backdropDepth });

  function paintPlane(el: HTMLElement, { pitch, tile }: Surface) {
    el.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(tile)}")`;
    el.style.backgroundSize = `${pitch}px ${pitch}px`;
  }
  paintPlane(ground, groundSurface);
  paintPlane(backdrop, backdropSurface);

  // Size a wrapping plane (`depth` behind the ground along the tilt normal) to
  // cover all of it the lens can see when dollied fully out, centred under
  // the screen. Its offset snaps to the tile pitch so the pattern stays
  // registered to world coordinates across resizes.
  function fitPlane(el: HTMLElement, pitch: number, depth: number) {
    const { width, height } = viewport.getBoundingClientRect();
    // Ray/plane intersection for the lens ray through the top screen edge —
    // the farthest-reaching one: it lands t× the screen distance out.
    const t =
      (perspective - zMin + depth / Math.cos(tiltRad)) /
      (perspective - (height / 2) * Math.tan(tiltRad));
    const reach = Math.max(
      (t * width) / 2,
      ((t * height) / 2 + depth * Math.sin(tiltRad)) / Math.cos(tiltRad),
    );
    // Margin: up to half a pitch of snap plus a full pitch of wrap travel.
    const half = Math.ceil(reach / pitch) * pitch + 2 * pitch;
    el.style.width = el.style.height = `${2 * half}px`;
    el.style.left = `${Math.round(width / 2 / pitch) * pitch - half}px`;
    el.style.top = `${Math.round(height / 2 / pitch) * pitch - half}px`;
  }
  const wrapGround = gsap.utils.wrap(-groundSurface.pitch, 0);
  const wrapBackdrop = gsap.utils.wrap(-backdropSurface.pitch, 0);

  // The rendered pan, eased toward state.panX/panY by applyPan.
  const view = { x: state.panX, y: state.panY };

  // The content layer takes the real pan; the patterned planes take it modulo
  // their pitch, which looks identical (whole tiles are indistinguishable)
  // but keeps them from ever sliding out from under the lens.
  function renderPan() {
    gsap.set(world, { x: view.x, y: view.y });
    gsap.set(ground, { x: wrapGround(view.x), y: wrapGround(view.y) });
    gsap.set(backdrop, { x: wrapBackdrop(view.x), y: wrapBackdrop(view.y) });
  }

  // The first observation is the first moment the viewport is laid out (the
  // container may not even be in the document at createCanvas time), so it
  // also centres the requested world point. Runs before paint: no flash.
  let centred = false;
  const resizeObserver = new ResizeObserver(() => {
    fitPlane(ground, groundSurface.pitch, 0);
    fitPlane(backdrop, backdropSurface.pitch, backdropDepth);
    if (centred) return;
    centred = true;
    const { width, height } = viewport.getBoundingClientRect();
    state.panX = width / 2 - centerX;
    state.panY = height / 2 - centerY;
    clampPan();
    view.x = state.panX;
    view.y = state.panY;
    renderPan();
  });
  resizeObserver.observe(viewport);

  // Convert a screen-space pointer delta into a delta on the tilted ground
  // plane, undoing (1) the perspective magnification from the current dolly and
  // (2) the tilt foreshortening on the vertical axis. This keeps both content
  // dragging and panning 1:1 with the cursor at any zoom level.
  // (Approximated at the plane centre — it ignores the extra depth from a
  //  point's distance toward the horizon; full accuracy needs ray/plane
  //  unprojection.)
  function screenToPlaneDelta(dxScreen: number, dyScreen: number) {
    const scale = perspective / (perspective - state.z);
    return {
      dx: dxScreen / scale,
      dy: dyScreen / scale / Math.cos(tiltRad),
    };
  }

  // Pan slides the world across the tilted ground plane. The backdrop gets the
  // same translation but, being deeper, moves slower on screen (parallax). Its
  // z channel is preserved by setting only x/y. One tween drives all three
  // layers so the wrapped planes stay locked to the content mid-ease.
  // The world point under the screen centre is (viewport centre - pan): the
  // tilt pivots and the dolly travels through that centre, so this holds at
  // any zoom. Keep it inside the world extent on each bounded axis.
  function clampPan() {
    const halfW = viewport.clientWidth / 2;
    const halfH = viewport.clientHeight / 2;
    if (worldWidth !== undefined) {
      state.panX = gsap.utils.clamp(halfW - worldWidth, halfW, state.panX);
    }
    if (worldHeight !== undefined) {
      state.panY = gsap.utils.clamp(halfH - worldHeight, halfH, state.panY);
    }
  }

  function applyPan() {
    gsap.to(view, {
      x: state.panX,
      y: state.panY,
      duration: 0.4,
      ease: 'power2.out',
      overwrite: true,
      onUpdate: renderPan,
    });
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault();

    // Scroll up = dolly in (toward the surface); scroll down = dolly out.
    // NOTE: this dollies toward the screen centre, not the cursor — cursor-
    // anchored dolly on a tilted plane needs ray/plane un-projection (TODO).
    // Proportional to the wheel delta, so a touchpad's stream of small deltas
    // doesn't each count as a full notch. Line-mode deltas (Firefox mice)
    // come in ~3 per notch; scale them up to pixels.
    const deltaPx = e.deltaMode === WheelEvent.DOM_DELTA_LINE ? e.deltaY * 33 : e.deltaY;
    const deltaZ = (-deltaPx / 100) * dollyStep;
    state.z = Math.min(Math.max(state.z + deltaZ, zMin), zCap);

    // Dolly moves the whole tilted rig toward/away from the lens; perspective
    // does the size change, so it reads as flying in/out over the surface.
    gsap.to(camera, {
      z: state.z,
      duration: 0.4,
      ease: 'power2.out',
      overwrite: true,
    });
  }

  viewport.addEventListener('wheel', onWheel, { passive: false });
  // Camera pan: a grab anywhere slides the world across the ground plane.
  // (Content that wants its own drag should stopPropagation on pointerdown.)
  trackDrag(viewport, screenToPlaneDelta, {
    onMove(dx, dy) {
      state.panX += dx;
      state.panY += dy;
      clampPan();
      applyPan();
    },
  });

  // The listeners all live on the viewport, so removing it releases them.
  function destroy() {
    resizeObserver.disconnect();
    gsap.killTweensOf([view, camera]);
    viewport.remove();
  }

  return { world, screenToPlaneDelta, destroy };
}
