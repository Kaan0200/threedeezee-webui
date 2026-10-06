/**
 * The HTML example's scene, driven from React. threedeezee is framework-free,
 * so a consumer wraps it the usual way for imperative DOM libraries: build the
 * rig in an effect, portal JSX into panels, and sync pins from state. Here the
 * welcome panel is live JSX — it counts the flags raised by clicking the pins.
 */
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Canvas, CanvasOptions } from 'threedeezee';
import { createCanvas, createPanel, createPin } from 'threedeezee';

const PINS = [
  { x: 2150, y: 2300, color: '#e5484d' },
  { x: 2850, y: 2320, color: '#3e63dd' },
  { x: 2500, y: 2700, color: '#30a46c' },
];

export default function App() {
  const [raised, setRaised] = useState<ReadonlySet<number>>(new Set());

  const toggle = (i: number) =>
    setRaised((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  return (
    <CanvasView options={{ centerX: 2500, centerY: 2500 }}>
      {(canvas) => (
        <>
          <WorldPanel canvas={canvas} x={2200} y={2380} width={600}>
            <h1 style={{ margin: '0 0 8px', fontSize: 32 }}>Welcome to threedeezee</h1>
            <p style={{ margin: 0 }}>
              A tilted 2.5D canvas for the web and React. Drag to pan, scroll to zoom —
              and click the pins: {raised.size} of {PINS.length} flags raised.
            </p>
          </WorldPanel>
          {PINS.map((pin, i) => (
            <WorldPin
              key={i}
              canvas={canvas}
              {...pin}
              raised={raised.has(i)}
              onToggle={() => toggle(i)}
            />
          ))}
        </>
      )}
    </CanvasView>
  );
}

/**
 * Owns the camera rig: creates it in the container once mounted, destroys it on
 * unmount, and hands it to the children so they can place things on the world.
 */
function CanvasView({
  options,
  children,
}: {
  options?: CanvasOptions;
  children: (canvas: Canvas) => ReactNode;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);

  // Options only apply on creation (the rig has no reconfigure), so they are
  // deliberately not a dependency: the rig lives for the component's lifetime.
  useEffect(() => {
    const canvas = createCanvas(container.current!, options);
    setCanvas(canvas);
    return () => {
      setCanvas(null);
      canvas.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The children render nothing here directly — they portal into the world.
  return (
    <div ref={container} style={{ height: '100%' }}>
      {canvas && children(canvas)}
    </div>
  );
}

/** A panel on the world plane whose content is ordinary live JSX. */
function WorldPanel({
  canvas,
  x,
  y,
  width,
  children,
}: {
  canvas: Canvas;
  x: number;
  y: number;
  width?: number;
  children: ReactNode;
}) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const panel = createPanel(canvas, {
      x,
      y,
      width,
      attributes: {
        style:
          'padding: 32px; background: #fff; border: 1px solid #333; font: 16px/1.5 system-ui;',
      },
    });
    setEl(panel.el);
    return () => {
      setEl(null);
      panel.el.remove();
    };
  }, [canvas, x, y, width]);

  return el && createPortal(children, el);
}

/** A pin whose flag raises (turns white) and lowers with React state. */
function WorldPin({
  canvas,
  x,
  y,
  color,
  raised,
  onToggle,
}: {
  canvas: Canvas;
  x: number;
  y: number;
  color: string;
  raised: boolean;
  onToggle: () => void;
}) {
  const [flag, setFlag] = useState<HTMLDivElement | null>(null);

  // The click handler closes over state, so the pin's effect reads it through
  // a ref rather than re-creating the pin on every toggle.
  const onToggleRef = useRef(onToggle);
  useEffect(() => {
    onToggleRef.current = onToggle;
  }, [onToggle]);

  useEffect(() => {
    const pin = createPin(canvas, { x, y, height: 200, color, flag: true });
    pin.flag!.addEventListener('click', () => onToggleRef.current());
    setFlag(pin.flag!);
    return () => {
      setFlag(null);
      pin.el.remove();
    };
  }, [canvas, x, y, color]);

  useEffect(() => {
    if (flag) flag.style.background = raised ? 'white' : color;
  }, [flag, raised, color]);

  return null;
}
