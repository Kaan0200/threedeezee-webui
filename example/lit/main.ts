/**
 * The HTML example's scene, as a Lit component. The custom elements need no
 * wrapping: they go straight into the template, placed by attributes, and Lit
 * keeps rendering their children as usual. Here the welcome panel is a live
 * template — it counts the flags raised by clicking the pins.
 */
import 'threedeezee/elements';

import { css, html, LitElement } from 'lit';

const PINS = [
  { x: 2150, y: 2300, color: '#e5484d' },
  { x: 2850, y: 2320, color: '#3e63dd' },
  { x: 2500, y: 2700, color: '#30a46c' },
];

class DemoApp extends LitElement {
  static properties = { raised: { state: true } };

  static styles = css`
    tdz-canvas {
      height: 100%;
    }
    tdz-panel {
      padding: 32px;
      background: #fff;
      border: 1px solid #333;
      font: 16px/1.5 system-ui;
    }
    h1 {
      margin: 0 0 8px;
      font-size: 32px;
    }
    p {
      margin: 0;
    }
    /* A raised flag turns white; the flag is the pin's one styleable part. */
    tdz-pin.raised::part(flag) {
      background: white;
    }
  `;

  // Declared, not initialised as a field: a class field would shadow the
  // reactive accessor Lit defines for it.
  declare raised: ReadonlySet<number>;

  constructor() {
    super();
    this.raised = new Set();
  }

  toggle(i: number) {
    const next = new Set(this.raised);
    next.has(i) ? next.delete(i) : next.add(i);
    this.raised = next;
  }

  render() {
    return html`
      <tdz-canvas center-x="2500" center-y="2500">
        <tdz-panel x="2200" y="2380" width="600">
          <h1>Welcome to threedeezee</h1>
          <p>
            A tilted 2.5D canvas for the web and Lit. Drag to pan, scroll to zoom — and
            click the pins: ${this.raised.size} of ${PINS.length} flags raised.
          </p>
        </tdz-panel>
        ${PINS.map(
          (pin, i) => html`
            <tdz-pin
              x=${pin.x}
              y=${pin.y}
              height="200"
              color=${pin.color}
              flag
              class=${this.raised.has(i) ? 'raised' : ''}
              @click=${() => this.toggle(i)}
            ></tdz-pin>
          `,
        )}
      </tdz-canvas>
    `;
  }
}

customElements.define('demo-app', DemoApp);
