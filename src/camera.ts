/**
 * Tilted (2.5D) camera rig:
 *
 *   #viewport   the lens — establishes the perspective frustum
 *   #camera     viewport-sized rig carrying the fixed rotateX tilt + the dolly (z)
 *   #world      the pannable ground plane the content sits on
 *   #backdrop   parallax plane pushed back along the tilt normal
 *
 * Wheel dollies the rig toward/away from the surface; a drag anywhere pans the
 * world across the tilted ground plane. Easing comes from the CSS transitions
 * in camera.css — this module only retargets transforms. Structural CSS lives
 * in camera.css; the default look in camera-theme.css.
 */
import type { ToPlaneDelta } from './drag';
import { trackDrag } from './drag';

/** Tuning knobs, all optional — the defaults reproduce the stock feel. */
export type CameraConfig = {
  /** Fixed camera pitch, degrees. 0 = top-down, 90 = horizon. Default 30. */
  tilt?: number;
  /** Lens distance, px. Smaller = stronger foreshortening. Default 1200. */
  perspective?: number;
  /** Dolly travel per wheel notch, px. Default 200. */
  dollyStep?: number;
  /** Dollied fully out (far from the surface). Default -4000. */
  zMin?: number;
  /** Dollied fully in. Always capped below the lens to avoid clipping
      through it. Default 900. */
  zMax?: number;
  /** How far the backdrop sits behind the board along the tilt normal.
      Deeper = stronger parallax. Default 500. */
  backdropDepth?: number;
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
export function initCamera(
  opts: {
    viewport: HTMLElement;
    camera: HTMLElement;
    world: HTMLElement;
    backdrop: HTMLElement;
    centerX: number;
    centerY: number;
  } & CameraConfig,
): CameraRig {
  const { viewport, camera, world, backdrop } = opts;
  const tilt = opts.tilt ?? 30;
  const perspective = opts.perspective ?? 1200;
  const dollyStep = opts.dollyStep ?? 200;
  const zMin = opts.zMin ?? -4000;
  const zMax = Math.min(opts.zMax ?? 900, perspective - 300);
  const backdropDepth = opts.backdropDepth ?? 500;
  const tiltRad = (tilt * Math.PI) / 180;

  // The lens is owned here; camera.css reads it back via var(--perspective).
  viewport.style.setProperty('--perspective', `${perspective}px`);

  let z = 0; // dolly: distance of the camera rig from the lens
  // Centre the requested world point in the viewport on load. These first
  // applyDolly/applyPan writes land before first paint, so the CSS
  // transitions don't animate them.
  const startRect = viewport.getBoundingClientRect();
  let panX = startRect.width / 2 - opts.centerX; // along the ground, screen-horizontal
  let panY = startRect.height / 2 - opts.centerY; // along the ground, into/out of the tilt

  // Dolly moves the whole tilted rig toward/away from the lens; perspective
  // does the size change, so it reads as flying in/out over the surface.
  function applyDolly() {
    camera.style.transform = `translateZ(${z}px) rotateX(${tilt}deg)`;
  }

  // Pan slides the world across the tilted ground plane. The backdrop gets
  // the same translation but, being deeper (-z along the tilt normal),
  // perspective moves it slower on screen — a physical parallax under the board.
  function applyPan() {
    world.style.transform = `translate3d(${panX}px, ${panY}px, 0)`;
    backdrop.style.transform = `translate3d(${panX}px, ${panY}px, ${-backdropDepth}px)`;
  }

  applyDolly();
  applyPan();

  // Convert a screen-space pointer delta into a delta on the tilted ground
  // plane, undoing (1) the perspective magnification from the current dolly and
  // (2) the tilt foreshortening on the vertical axis. This keeps both content
  // dragging and panning 1:1 with the cursor at any zoom level.
  // (Approximated at the plane centre — it ignores the extra depth from a
  //  point's distance toward the horizon; full accuracy needs ray/plane
  //  unprojection.)
  function screenToPlaneDelta(dxScreen: number, dyScreen: number) {
    const scale = perspective / (perspective - z);
    return {
      dx: dxScreen / scale,
      dy: dyScreen / scale / Math.cos(tiltRad),
    };
  }

  viewport.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      // Scroll up = dolly in (toward the surface); scroll down = dolly out.
      // NOTE: this dollies toward the screen centre, not the cursor — cursor-
      // anchored dolly on a tilted plane needs ray/plane un-projection (TODO).
      const deltaZ = e.deltaY > 0 ? -dollyStep : dollyStep;
      z = Math.min(Math.max(z + deltaZ, zMin), zMax);
      applyDolly();
    },
    { passive: false },
  );

  // Camera pan: a grab anywhere slides the world across the ground plane.
  // (Content that wants its own drag should stopPropagation on pointerdown.)
  trackDrag(viewport, screenToPlaneDelta, {
    onMove(dx, dy) {
      panX += dx;
      panY += dy;
      applyPan();
    },
  });

  return { screenToPlaneDelta };
}
