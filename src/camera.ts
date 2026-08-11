/**
 * Tilted (2.5D) camera rig:
 *
 *   .tdz-viewport   the lens — establishes the perspective frustum
 *   .tdz-camera     viewport-sized rig carrying the fixed rotateX tilt + the dolly (z)
 *   .tdz-world      the pannable ground plane the content sits on
 *   .tdz-backdrop   parallax plane pushed back along the tilt normal
 *   .tdz-plate      where createCamera parks the adopted content on the world
 *
 * Wheel dollies the rig toward/away from the surface; a drag anywhere pans the
 * world across the tilted ground plane. Easing comes from the CSS transitions
 * in camera.css — this module only retargets transforms. Structural CSS lives
 * in camera.css; the (optional) default look in camera-theme.css.
 *
 * The engine owns projection, camera state + input bindings, and coordinate
 * conversion — nothing else. Content interactions (drag & drop, popovers,
 * context menus, ...) belong to the consumer, built on trackDrag and the
 * rig's conversion functions.
 */
import type { ToPlaneDelta } from './drag';
import { trackDrag } from './drag';

/** Tuning knobs, all optional — the defaults reproduce the stock feel. */
export type CameraConfig = {
  /** Fixed camera pitch, degrees. 0 = top-down, 90 = horizon. Default 30. */
  tilt?: number;
  /** Lens distance, px. Smaller = stronger foreshortening. Default 1200. */
  perspective?: number;
  /** Side length of the square world plane, px. Default 5000. */
  worldSize?: number;
  /** Side length of the square backdrop plane, px. Default 12000. */
  backdropSize?: number;
  /** How far the backdrop sits behind the board along the tilt normal.
      Deeper = stronger parallax. Default 500. */
  backdropDepth?: number;
  /** World point centred in the viewport on load. Default: world centre. */
  center?: { x: number; y: number };
  /** Wheel-to-dolly binding. Set false to leave scrolling to the page.
      Default true. */
  wheel?: boolean;
  /** Dolly travel per wheel notch, px. Default 200. */
  dollyStep?: number;
  /** Dollied fully out (far from the surface). Default -4000. */
  zMin?: number;
  /** Dollied fully in. Always capped below the lens to avoid clipping
      through it. Default 900. */
  zMax?: number;
  /** Pointer button that pans the camera: a button index, or 'any'.
      Default 0 (primary), so right/middle clicks stay free for the app. */
  panButton?: number | 'any';
};

export type CameraRig = {
  /** Screen-space pointer delta → delta on the tilted ground plane, at the
      current dolly. Hand this to trackDrag for anything draggable on the
      world plane, so its motion stays 1:1 with the cursor at any zoom. */
  screenToPlaneDelta: ToPlaneDelta;
  /** Client (event.clientX/Y) coordinates → the world point under them, at
      the current pan and dolly. The anchor for drops, popovers, hit checks.
      Same centre-of-plane approximation as screenToPlaneDelta. */
  screenToPlanePoint(clientX: number, clientY: number): { x: number; y: number };
  /** The rig's DOM, for consumers that need to reach the planes directly.
      `plate` is present when the rig was built by createCamera. */
  elements: {
    viewport: HTMLElement;
    camera: HTMLElement;
    world: HTMLElement;
    backdrop: HTMLElement;
    plate?: HTMLElement;
  };
};

/**
 * Build the camera DOM inside `container` and wire the rig onto it. Any
 * children `container` already has are adopted onto the world plate, so
 * plain markup (or JSX rendered into the container) gets camera behaviour
 * without knowing about the rig. The plate defaults to the world centre —
 * position it from your own CSS (.tdz-plate) to taste.
 */
export function createCamera(
  container: HTMLElement,
  config: CameraConfig = {},
): CameraRig {
  const el = (className: string) => {
    const div = document.createElement('div');
    div.className = className;
    return div;
  };

  const plate = el('tdz-plate');
  while (container.firstChild) plate.appendChild(container.firstChild);

  const backdrop = el('tdz-backdrop');
  const world = el('tdz-world');
  world.appendChild(plate);
  const camera = el('tdz-camera');
  camera.append(backdrop, world);
  const viewport = el('tdz-viewport');
  viewport.appendChild(camera);
  container.appendChild(viewport);

  const rig = initCamera({ viewport, camera, world, backdrop, ...config });
  rig.elements.plate = plate;
  return rig;
}

/**
 * Wire the camera onto an existing viewport/camera/world/backdrop DOM stack
 * (bring-your-own-markup alternative to createCamera).
 */
export function initCamera(
  opts: {
    viewport: HTMLElement;
    camera: HTMLElement;
    world: HTMLElement;
    backdrop: HTMLElement;
  } & CameraConfig,
): CameraRig {
  const { viewport, camera, world, backdrop } = opts;
  const tilt = opts.tilt ?? 30;
  const perspective = opts.perspective ?? 1200;
  const worldSize = opts.worldSize ?? 5000;
  const backdropSize = opts.backdropSize ?? 12000;
  const backdropDepth = opts.backdropDepth ?? 500;
  const center = opts.center ?? { x: worldSize / 2, y: worldSize / 2 };
  const dollyStep = opts.dollyStep ?? 200;
  const zMin = opts.zMin ?? -4000;
  const zMax = Math.min(opts.zMax ?? 900, perspective - 300);
  const panButton = opts.panButton ?? 0;
  const tiltRad = (tilt * Math.PI) / 180;

  // The numbers are owned here; camera.css reads them back via var().
  viewport.style.setProperty('--perspective', `${perspective}px`);
  viewport.style.setProperty('--world-size', `${worldSize}px`);
  viewport.style.setProperty('--backdrop-size', `${backdropSize}px`);
  // Centre the larger backdrop plane under the world plane.
  viewport.style.setProperty('--backdrop-offset', `${-(backdropSize - worldSize) / 2}px`);

  let z = 0; // dolly: distance of the camera rig from the lens
  // Centre the requested world point in the viewport on load. These first
  // applyDolly/applyPan writes land before first paint, so the CSS
  // transitions don't animate them.
  const startRect = viewport.getBoundingClientRect();
  let panX = startRect.width / 2 - center.x; // along the ground, screen-horizontal
  let panY = startRect.height / 2 - center.y; // along the ground, into/out of the tilt

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

  function screenToPlanePoint(clientX: number, clientY: number) {
    const rect = viewport.getBoundingClientRect();
    // The world point at the viewport centre, straight from the pan...
    const cx = rect.width / 2 - panX;
    const cy = rect.height / 2 - panY;
    // ...plus the pointer's offset from that centre, projected onto the plane.
    const { dx, dy } = screenToPlaneDelta(
      clientX - (rect.left + rect.width / 2),
      clientY - (rect.top + rect.height / 2),
    );
    return { x: cx + dx, y: cy + dy };
  }

  if (opts.wheel !== false) {
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
  }

  // Camera pan: a grab anywhere slides the world across the ground plane.
  // (Content that wants its own drag should stopPropagation on pointerdown.)
  trackDrag(viewport, screenToPlaneDelta, {
    button: panButton === 'any' ? undefined : panButton,
    onMove(dx, dy) {
      panX += dx;
      panY += dy;
      applyPan();
    },
  });

  return {
    screenToPlaneDelta,
    screenToPlanePoint,
    elements: { viewport, camera, world, backdrop },
  };
}
