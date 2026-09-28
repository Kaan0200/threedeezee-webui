/**
 * Tilted (2.5D) camera rig, copied from dept-of-joined-game (squad-mgmt-tuari):
 *
 *   #viewport   the lens — establishes the perspective frustum
 *   #camera     viewport-sized rig carrying the fixed rotateX tilt + the dolly (z)
 *   #world      the pannable content layer, on the ground plane
 *   #ground     the ground plane's dot field (wraps, so it never runs out)
 *   #backdrop   parallax plane pushed back along the tilt normal (also wraps)
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
const GROUND_PITCH = 40; // must match --world-dot-pitch in camera.css.
const BACKDROP_PITCH = 100; // must match #backdrop's background-size in camera.css.

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
  ground: HTMLElement;
  backdrop: HTMLElement;
  centerX: number;
  centerY: number;
}): CameraRig {
  const { viewport, camera, world, ground, backdrop } = opts;

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
  // The backdrop is pushed back along the tilt normal (-z) so perspective
  // moves its pan slower — a physical parallax under the board.
  gsap.set(backdrop, { z: -BACKDROP_DEPTH });

  // Size a wrapping plane (`depth` behind the ground along the tilt normal) to
  // cover all of it the lens can see when dollied fully out, centred under
  // the screen. Its offset snaps to the tile pitch so the pattern stays
  // registered to world coordinates across resizes.
  function fitPlane(el: HTMLElement, pitch: number, depth: number) {
    const { width, height } = viewport.getBoundingClientRect();
    // Ray/plane intersection for the lens ray through the top screen edge —
    // the farthest-reaching one: it lands t× the screen distance out.
    const t =
      (PERSPECTIVE - Z_MIN + depth / Math.cos(TILT_RAD)) /
      (PERSPECTIVE - (height / 2) * Math.tan(TILT_RAD));
    const reach = Math.max(
      (t * width) / 2,
      ((t * height) / 2 + depth * Math.sin(TILT_RAD)) / Math.cos(TILT_RAD),
    );
    // Margin: up to half a pitch of snap plus a full pitch of wrap travel.
    const half = Math.ceil(reach / pitch) * pitch + 2 * pitch;
    el.style.width = el.style.height = `${2 * half}px`;
    el.style.left = `${Math.round(width / 2 / pitch) * pitch - half}px`;
    el.style.top = `${Math.round(height / 2 / pitch) * pitch - half}px`;
  }
  function fitPlanes() {
    fitPlane(ground, GROUND_PITCH, 0);
    fitPlane(backdrop, BACKDROP_PITCH, BACKDROP_DEPTH);
  }
  fitPlanes();
  window.addEventListener('resize', fitPlanes);

  const wrapGround = gsap.utils.wrap(-GROUND_PITCH, 0);
  const wrapBackdrop = gsap.utils.wrap(-BACKDROP_PITCH, 0);

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
  renderPan();

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
  // z channel is preserved by setting only x/y. One tween drives all three
  // layers so the wrapped planes stay locked to the content mid-ease.
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
