import '../src/camera.css';
import '../src/camera-theme.css';
import './index.css';

import { createCamera } from '../src';
import { mountVitePage } from './vite-page';

const app = document.getElementById('app');

if (app) {
  // The demo page is plain content: mount it into the container, then let
  // createCamera adopt it onto the world plate (positioned by vite-page.css).
  const page = document.createElement('div');
  app.appendChild(page);
  mountVitePage(page);

  createCamera(app, {
    // Land looking at the top of the page plate (plate top sits at 2100 —
    // see vite-page.css — so this centres a point a little way down the hero).
    center: { x: 2500, y: 2400 },
  });
}
