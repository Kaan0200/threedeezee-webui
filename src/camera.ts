/**
 * Tilted (2.5D) camera rig, copied from dept-of-joined-game (squad-mgmt-tuari):
 *
 *   #viewport   the lens — establishes the perspective frustum
 *   #camera     viewport-sized rig carrying the fixed rotateX tilt + the dolly (z)
 *   #world      the pannable ground plane the content sits on
 *   #backdrop   parallax plane pushed back along the tilt normal
 *
 * Wheel dollies the rig toward/away from the surface; a drag anywhere pans the
 * world across the tilted ground plane. Structural CSS lives in camera.css.
 */
import gsap from 'gsap';

import { trackDrag } from './drag';
import type { ToPlaneDelta } from './drag';

// --- Tilted (2.5D) camera constants --- //
const TILT = 30; // fixed camera pitch, degrees. 0 = top-down, 90 = horizon.
const PERSPECTIVE = 1200; // must match --perspective in camera.css.
const DOLLY_STEP = 200; // px of travel per wheel notch.
const TILT_RAD = (TILT * Math.PI) / 180;
const Z_MIN = -4000; // dollied fully out (far from the surface).
// Dollied fully in — capped below the lens (PERSPECTIVE) to avoid clipping through it.
const Z_MAX = Math.min(900, PERSPECTIVE - 300);
/** How far the backdrop sits behind the board along the tilt normal.
    Deeper = stronger parallax. */
const BACKDROP_DEPTH = 500;

type CameraState = {
  panX: number; // world translation along the ground (screen-horizontal)
  panY: number; // world translation along the ground (into/out of the tilt)

  z: number; // dolly: distance of the camera rig from the lens
};

export type CameraRig = {
  /** Screen-space pointer delta → delta on the tilted ground plane, at the
      current dolly. Hand this to trackDrag for anything draggable on the
      world plane, so its motion stays 1:1 with the cursor at any zoom. */
  screenToPlaneDelta: ToPlaneDelta;
};

/**
 * Wire the camera onto an existing viewport/camera/world/backdrop DOM stack.
 * `centerX`/`centerY` is the world point centred in the viewport on load.
 */
export function initCamera(opts: {
  viewport: HTMLElement;
  camera: HTMLElement;
  world: HTMLElement;
  backdrop: HTMLElement;
  centerX: number;
  centerY: number;
}): CameraRig {
  const { viewport, camera, world, backdrop } = opts;

  const state: CameraState = {
    panX: 0,
    panY: 0,
    z: 0,
  };

  // Fixed tilt lives on the camera rig; the dolly animates its z separately.
  // Tilt pivots around the screen centre (transformOrigin 50% 50%).
  gsap.set(camera, { rotationX: TILT, transformOrigin: '50% 50%' });

  // Centre the requested world point in the viewport on load.
  const startRect = viewport.getBoundingClientRect();
  state.panX = startRect.width / 2 - opts.centerX;
  state.panY = startRect.height / 2 - opts.centerY;
  gsap.set(world, { x: state.panX, y: state.panY });
  // Same pan as the world, but pushed back along the tilt normal (-z) so
  // perspective moves it slower — a physical parallax under the board.
  gsap.set(backdrop, {
    x: state.panX,
    y: state.panY,
    z: -BACKDROP_DEPTH,
  });

  // Convert a screen-space pointer delta into a delta on the tilted ground
  // plane, undoing (1) the perspective magnification from the current dolly and
  // (2) the tilt foreshortening on the vertical axis. This keeps both content
  // dragging and panning 1:1 with the cursor at any zoom level.
  // (Approximated at the plane centre — it ignores the extra depth from a
  //  point's distance toward the horizon; full accuracy needs ray/plane
  //  unprojection.)
  function screenToPlaneDelta(dxScreen: number, dyScreen: number) {
    const scale = PERSPECTIVE / (PERSPECTIVE - state.z);
    return {
      dx: dxScreen / scale,
      dy: dyScreen / scale / Math.cos(TILT_RAD),
    };
  }

  // Pan slides the world across the tilted ground plane. The backdrop gets the
  // same translation but, being deeper, moves slower on screen (parallax). Its
  // z channel is preserved by tween-ing only x/y.
  function applyPan() {
    gsap.to(world, {
      x: state.panX,
      y: state.panY,
      duration: 0.4,
      ease: 'power2.out',
      overwrite: true,
    });
    gsap.to(backdrop, {
      x: state.panX,
      y: state.panY,
      duration: 0.4,
      ease: 'power2.out',
      overwrite: true,
    });
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault();

    // Scroll up = dolly in (toward the surface); scroll down = dolly out.
    // NOTE: this dollies toward the screen centre, not the cursor — cursor-
    // anchored dolly on a tilted plane needs ray/plane un-projection (TODO).
    const deltaZ = e.deltaY > 0 ? -DOLLY_STEP : DOLLY_STEP;
    state.z = Math.min(Math.max(state.z + deltaZ, Z_MIN), Z_MAX);

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
      applyPan();
    },
  });

  return { screenToPlaneDelta };
}
