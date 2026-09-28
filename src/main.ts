import './index.css';
import './camera.css';
import './demo.css';

import { createCanvas } from './camera';
import { mountVitePage } from './vite-page';

const app = document.getElementById('app');

if (app) {
  const { world } = createCanvas(app, {
    // Land looking at the top of the page plate (plate top sits at 2100 —
    // see demo.css — so this centres a point a little way down the hero).
    centerX: 2500,
    centerY: 2400,
  });

  // The demo page rides the world on the #plate, positioned by demo.css,
  // with a debug axis standing up at the starting centre.
  world.innerHTML = `
    <div id="origin-axis"></div>
    <div id="plate"></div>
  `;
  mountVitePage(world.querySelector<HTMLElement>('#plate')!);
}
