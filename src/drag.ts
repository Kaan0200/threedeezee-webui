/**
 * Shared pointer-drag tracker.
 *
 * Every draggable surface in the game — cards, zones, and the camera pan —
 * follows the same skeleton: pointerdown claims the pointer, pointermove
 * accumulates a delta, pointerup/cancel releases. Only the reaction differs.
 * trackDrag owns the skeleton (capture bookkeeping, last-pointer tracking,
 * screen→plane conversion) and hands callers plane-space deltas; callers own
 * what a delta means (move a card, slide the world, ...).
 */

/** Converts a screen-space pointer delta into a delta on the ground plane. */
export type ToPlaneDelta = (
  dxScreen: number,
  dyScreen: number,
) => { dx: number; dy: number };

export type DragOptions = {
  /** Stop the pointerdown from bubbling, so an inner drag never also starts
      an outer one (a card grab must not pan the camera). Applied before the
      button filter — a rejected grab still swallows the event. */
  stopPropagation?: boolean;
  /** Only this pointer button starts a drag (0 = primary). Omit for any. */
  button?: number;
  /** Vet/prepare the grab; return false to reject it. Runs BEFORE pointer
      capture on purpose: re-parenting a captured element releases its
      capture, so any DOM surgery must happen here. */
  onStart?(e: PointerEvent): boolean | void;
  /** A move, as a plane-space delta since the previous one. */
  onMove(dx: number, dy: number): void;
  /** The pointer was released (or cancelled) mid-drag. */
  onEnd?(): void;
};

export function trackDrag(
  el: HTMLElement,
  toPlaneDelta: ToPlaneDelta,
  opts: DragOptions,
): void {
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  el.addEventListener('pointerdown', (e) => {
    if (opts.stopPropagation) e.stopPropagation();
    if (opts.button !== undefined && e.button !== opts.button) return;
    if (opts.onStart?.(e) === false) return;
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    el.setPointerCapture(e.pointerId);
  });

  el.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const { dx, dy } = toPlaneDelta(e.clientX - lastX, e.clientY - lastY);
    lastX = e.clientX;
    lastY = e.clientY;
    opts.onMove(dx, dy);
  });

  const end = (e: PointerEvent): void => {
    if (!dragging) return;
    dragging = false;
    el.releasePointerCapture(e.pointerId);
    opts.onEnd?.();
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
}
