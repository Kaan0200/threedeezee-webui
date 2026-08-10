import './index.css';
import './camera.css';

import { initCamera } from './camera';
import { mountVitePage } from './vite-page';

const app = document.getElementById('app');

if (app) {
  // The camera rig stack (see camera.ts): lens > tilt/dolly rig > ground
  // plane, with the parallax backdrop behind it. The demo page rides the
  // world on the #plate, positioned by camera.css.
  app.innerHTML = `
    <div id="viewport">
      <div id="camera">
        <div id="backdrop"></div>
        <div id="world">
          <div id="plate"></div>
        </div>
      </div>
    </div>
  `;

  mountVitePage(app.querySelector<HTMLElement>('#plate')!);

  initCamera({
    viewport: app.querySelector<HTMLElement>('#viewport')!,
    camera: app.querySelector<HTMLElement>('#camera')!,
    world: app.querySelector<HTMLElement>('#world')!,
    backdrop: app.querySelector<HTMLElement>('#backdrop')!,
    // Land looking at the top of the page plate (plate top sits at 2100 —
    // see camera.css — so this centres a point a little way down the hero).
    centerX: 2500,
    centerY: 2400,
  });
}
