import './index.css';

import { mountVitePage } from './vite-page';

const app = document.getElementById('app');

if (app) {
  app.innerHTML = `
    <div class="stage">
      <div class="surface"></div>
    </div>
  `;
  mountVitePage(app.querySelector<HTMLElement>('.surface')!);
}
