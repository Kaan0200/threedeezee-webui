import 'threedeezee/style.css';

import { createCanvas, createPanel, createPin } from 'threedeezee';

const app = document.getElementById('app')!;
const canvas = createCanvas(app, { centerX: 2500, centerY: 2500 });

const welcome = createPanel(canvas, {
  x: 2200,
  y: 2380,
  width: 600,
  attributes: {
    style:
      'padding: 32px; background: #fff; border: 1px solid #333; font: 16px/1.5 system-ui;',
  },
});
welcome.el.innerHTML = `
  <h1 style="margin: 0 0 8px; font-size: 32px;">Welcome to threedeezee</h1>
  <p style="margin: 0;">A tilted 2.5D canvas for the web. Drag to pan, scroll to zoom.</p>
`;

// A few pins around the panel; clicking a flag toggles it white.
const pins = [
  { x: 2150, y: 2300, color: '#e5484d' },
  { x: 2850, y: 2320, color: '#3e63dd' },
  { x: 2500, y: 2700, color: '#30a46c' },
];
for (const { x, y, color } of pins) {
  const { flag } = createPin(canvas, { x, y, height: 200, color, flag: true });
  flag?.addEventListener('click', () => {
    flag.style.background = flag.style.background === 'white' ? color : 'white';
  });
}
