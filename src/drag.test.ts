import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DragOptions } from './drag';
import { trackDrag } from './drag';

// Doubles every delta, so a test can tell plane-space values from raw ones.
const toPlaneDelta = (dx: number, dy: number): { dx: number; dy: number } => ({
  dx: dx * 2,
  dy: dy * 2,
});

function pointer(type: string, init: PointerEventInit = {}): PointerEvent {
  return new PointerEvent(type, { pointerId: 1, bubbles: true, ...init });
}

describe('trackDrag', () => {
  let el: HTMLElement;
  let onMove: ReturnType<typeof vi.fn<DragOptions['onMove']>>;

  beforeEach(() => {
    el = document.createElement('div');
    // Capture needs a live pointer, which synthetic events don't provide.
    el.setPointerCapture = vi.fn();
    el.releasePointerCapture = vi.fn();
    document.body.replaceChildren(el);
    onMove = vi.fn<DragOptions['onMove']>();
  });

  it('reports each move as a plane-space delta since the previous one', () => {
    trackDrag(el, toPlaneDelta, { onMove });
    el.dispatchEvent(pointer('pointerdown', { clientX: 10, clientY: 10 }));
    el.dispatchEvent(pointer('pointermove', { clientX: 15, clientY: 12 }));
    el.dispatchEvent(pointer('pointermove', { clientX: 16, clientY: 20 }));
    expect(onMove.mock.calls).toEqual([
      [10, 4],
      [2, 16],
    ]);
  });

  it('ignores moves with no press, and after release', () => {
    const onEnd = vi.fn();
    trackDrag(el, toPlaneDelta, { onMove, onEnd });
    el.dispatchEvent(pointer('pointermove', { clientX: 5 }));
    el.dispatchEvent(pointer('pointerdown'));
    el.dispatchEvent(pointer('pointerup'));
    el.dispatchEvent(pointer('pointermove', { clientX: 5 }));
    // A second release with no drag in progress is not another end.
    el.dispatchEvent(pointer('pointercancel'));
    expect(onMove).not.toHaveBeenCalled();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('captures the pointer for the drag and releases it at the end', () => {
    trackDrag(el, toPlaneDelta, { onMove });
    el.dispatchEvent(pointer('pointerdown', { pointerId: 7 }));
    expect(el.setPointerCapture).toHaveBeenCalledWith(7);
    el.dispatchEvent(pointer('pointercancel', { pointerId: 7 }));
    expect(el.releasePointerCapture).toHaveBeenCalledWith(7);
  });

  it('only starts on the configured button', () => {
    trackDrag(el, toPlaneDelta, { onMove, button: 0 });
    el.dispatchEvent(pointer('pointerdown', { button: 2 }));
    el.dispatchEvent(pointer('pointermove', { clientX: 5 }));
    expect(onMove).not.toHaveBeenCalled();
    expect(el.setPointerCapture).not.toHaveBeenCalled();
  });

  it('lets onStart reject a grab before the pointer is captured', () => {
    trackDrag(el, toPlaneDelta, { onMove, onStart: () => false });
    el.dispatchEvent(pointer('pointerdown'));
    el.dispatchEvent(pointer('pointermove', { clientX: 5 }));
    expect(onMove).not.toHaveBeenCalled();
    expect(el.setPointerCapture).not.toHaveBeenCalled();
  });

  it('swallows the press from outer drags, even when it rejects the grab', () => {
    const outer = vi.fn();
    document.body.addEventListener('pointerdown', outer);
    trackDrag(el, toPlaneDelta, { onMove, stopPropagation: true, button: 0 });
    el.dispatchEvent(pointer('pointerdown', { button: 2 }));
    expect(outer).not.toHaveBeenCalled();
    document.body.removeEventListener('pointerdown', outer);
  });
});
