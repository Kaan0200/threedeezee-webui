import './index.css';
import './camera.css';

import { createCanvas } from './camera';

const app = document.getElementById('app');

if (app) {
  createCanvas(app, { centerX: 2500, centerY: 2500 });
}
