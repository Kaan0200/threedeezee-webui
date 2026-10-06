/**
 * The library as custom elements — a thin layer over the engine, for anything
 * that renders HTML (Lit, plain markup, Vue, React 19, ...):
 *
 *   <tdz-canvas center-x="2500" center-y="2500">
 *     <tdz-panel x="2200" y="2380" width="600">...</tdz-panel>
 *     <tdz-pin x="2150" y="2300" height="200" color="#e5484d" flag></tdz-pin>
 *   </tdz-canvas>
 *
 * Importing this module registers the three tags. The canvas builds the rig in
 * its shadow root and slots its children onto the world plane, so they stay
 * where the consumer's renderer put them: nothing is ever re-parented.
 * Panels and pins are the positioned elements themselves, placed through
 * their shadow `:host` rule — their own `class` and `style` stay entirely the
 * consumer's, and win over it.
 */
import type { Canvas, CanvasOptions, Surface } from './camera';
import { createCanvas } from './camera';
import cameraCss from './camera.css?inline';
import type { ToPlaneDelta } from './drag';
import { trackDrag } from './drag';

/** Give `host` a shadow root of `html` styled by `css`, and return the style
    of the sheet's first rule (its `:host`), to place the element through. */
function attachPlacement(
  host: HTMLElement,
  css: string,
  html: string,
): CSSStyleDeclaration {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(css);
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.adoptedStyleSheets = [sheet];
  shadow.innerHTML = html;
  return (sheet.cssRules[0] as CSSStyleRule).style;
}

/** A numeric attribute as a px length; '' (no declaration) when it's absent. */
function px(el: Element, name: string): string {
  const value = el.getAttribute(name);
  return value === null ? '' : `${Number(value)}px`;
}

/** The canvas an element sits on, looking out through any shadow roots (a
    consumer's own component may wrap a panel or pin). */
function canvasOf(el: Element): TdzCanvasElement | null {
  for (let node: Element | null = el; node; ) {
    const canvas = node.closest('tdz-canvas');
    if (canvas) return canvas;
    const root = node.getRootNode();
    node = root instanceof ShadowRoot ? root.host : null;
  }
  return null;
}

// CanvasOptions' numbers, each read from its kebab-case attribute: centerX is
// center-x, and so on.
const NUMERIC_OPTIONS = [
  'tilt',
  'perspective',
  'dollyStep',
  'zMin',
  'zMax',
  'backdropDepth',
  'centerX',
  'centerY',
  'worldWidth',
  'worldHeight',
] as const;

/**
 * The camera rig. Must have a height, like createCanvas's container. Options
 * are read once, on connect (the rig has no reconfigure): the numeric ones
 * from attributes, the two surfaces from properties.
 */
export class TdzCanvasElement extends HTMLElement {
  /** Pattern on the ground plane, under the content. */
  declare ground?: Surface;
  /** Pattern on the parallax backdrop. */
  declare backdrop?: Surface;

  #canvas?: Canvas;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<style>:host { display: block; } ${cameraCss}</style>`;
  }

  connectedCallback(): void {
    const options: CanvasOptions = { ground: this.ground, backdrop: this.backdrop };
    for (const name of NUMERIC_OPTIONS) {
      const value = this.getAttribute(
        name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`),
      );
      if (value !== null) options[name] = Number(value);
    }
    this.#canvas = createCanvas(this.shadowRoot!, options);
    // The children stay in the light DOM; the slot lays them out on the world.
    this.#canvas.world.appendChild(document.createElement('slot'));
  }

  disconnectedCallback(): void {
    this.#canvas?.destroy();
    this.#canvas = undefined;
  }

  /** Screen-space pointer delta → delta on the tilted ground plane, at the
      current dolly. Hand this to trackDrag for anything draggable on the
      world plane, so its motion stays 1:1 with the cursor at any zoom. */
  screenToPlaneDelta: ToPlaneDelta = (dx, dy) =>
    this.#canvas?.screenToPlaneDelta(dx, dy) ?? { dx, dy };
}

/**
 * A panel lying flat on the world: `x` / `y` are the world px of its
 * upper-left corner, `width` / `height` its size (omit to size to content).
 * With `movable`, a grab anywhere on it moves it instead of panning the
 * camera: the drag writes `x` / `y` back and fires `tdz-move`.
 */
export class TdzPanelElement extends HTMLElement {
  static observedAttributes = ['x', 'y', 'width', 'height'];

  #host = attachPlacement(
    this,
    ':host { position: absolute; left: 0; top: 0; }',
    '<slot></slot>',
  );

  constructor() {
    super();
    trackDrag(
      this,
      (dx, dy) => canvasOf(this)?.screenToPlaneDelta(dx, dy) ?? { dx, dy },
      {
        // Only a movable panel claims the grab; otherwise it bubbles on to
        // the canvas and pans the camera.
        onStart: (e) => {
          if (!this.hasAttribute('movable')) return false;
          e.stopPropagation();
        },
        onMove: (dx, dy) => {
          const x = Number(this.getAttribute('x')) + dx;
          const y = Number(this.getAttribute('y')) + dy;
          this.setAttribute('x', String(x));
          this.setAttribute('y', String(y));
          this.dispatchEvent(
            new CustomEvent('tdz-move', { detail: { x, y }, bubbles: true }),
          );
        },
      },
    );
  }

  attributeChangedCallback(): void {
    this.#host.left = px(this, 'x') || '0';
    this.#host.top = px(this, 'y') || '0';
    this.#host.width = px(this, 'width');
    this.#host.height = px(this, 'height');
  }
}

// Laid out flat along -y from its base, then swung 90° about that edge to
// stand up — see pin.ts.
const PIN_CSS = `
  :host {
    position: absolute;
    background: currentColor;
    transform-origin: bottom center;
    transform: rotateX(-90deg);
    /* The pole itself never blocks a pan; the flag opts back in below. */
    pointer-events: none;
  }
  [part='flag'] {
    position: absolute;
    /* Off the pole's right side, level with the tip. */
    left: 100%;
    top: 0;
    width: 24px;
    height: 16px;
    /* The pin's colour. */
    background: inherit;
    pointer-events: auto;
    cursor: pointer;
  }
  :host(:not([flag])) [part='flag'] {
    display: none;
  }
`;

/**
 * A pin standing straight up out of the world: `x` / `y` are the world px of
 * its base, `height` how far it stands up, `width` its thickness (default 2)
 * and `color` any CSS colour (default currentColor). With `flag`, a small
 * clickable flag hangs off the tip — the pole ignores the pointer, so a click
 * on the pin is a click on its flag. Restyle the flag with `::part(flag)`.
 */
export class TdzPinElement extends HTMLElement {
  static observedAttributes = ['x', 'y', 'height', 'width', 'color'];

  #host = attachPlacement(this, PIN_CSS, '<div part="flag"></div>');

  constructor() {
    super();
    // A press on the flag is a click, not the start of a camera pan.
    this.shadowRoot!.firstElementChild!.addEventListener('pointerdown', (e) =>
      e.stopPropagation(),
    );
  }

  attributeChangedCallback(): void {
    const width = Number(this.getAttribute('width') ?? 2);
    const height = Number(this.getAttribute('height'));
    // Centre the thickness on x; the bottom edge is the base, at y.
    this.#host.left = `${Number(this.getAttribute('x')) - width / 2}px`;
    this.#host.top = `${Number(this.getAttribute('y')) - height}px`;
    this.#host.width = `${width}px`;
    this.#host.height = `${height}px`;
    this.#host.background = this.getAttribute('color') ?? 'currentColor';
  }
}

// The canvas first, so it is already upgraded when its children look for it.
customElements.define('tdz-canvas', TdzCanvasElement);
customElements.define('tdz-panel', TdzPanelElement);
customElements.define('tdz-pin', TdzPinElement);

declare global {
  interface HTMLElementTagNameMap {
    'tdz-canvas': TdzCanvasElement;
    'tdz-panel': TdzPanelElement;
    'tdz-pin': TdzPinElement;
  }
  interface HTMLElementEventMap {
    /** A movable panel was dragged to world (x, y). */
    'tdz-move': CustomEvent<{ x: number; y: number }>;
  }
}
