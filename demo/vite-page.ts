/**
 * The out-of-the-box create-vite (react-ts template) starter page, translated
 * from the template's App.tsx to vanilla TS.
 */
import './vite-page.css';

import heroImg from './assets/hero.png';
import reactLogo from './assets/react.svg';
import viteLogo from './assets/vite.svg';

/** Render the starter page into `container` and wire up the counter. */
export function mountVitePage(container: HTMLElement): void {
  container.classList.add('vite-screen');
  container.innerHTML = `
    <section id="center">
      <div class="hero">
        <img src="${heroImg}" class="base" width="170" height="179" alt="" />
        <img src="${reactLogo}" class="framework" alt="React logo" />
        <img src="${viteLogo}" class="vite" alt="Vite logo" />
      </div>
      <div>
        <h1>Get started</h1>
        <p>
          Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
        </p>
      </div>
      <button type="button" class="counter">Count is 0</button>
    </section>

    <div class="ticks"></div>

    <section id="next-steps">
      <div id="docs">
        <svg class="icon" role="presentation" aria-hidden="true">
          <use href="/icons.svg#documentation-icon"></use>
        </svg>
        <h2>Documentation</h2>
        <p>Your questions, answered</p>
        <ul>
          <li>
            <a href="https://vite.dev/" target="_blank">
              <img class="logo" src="${viteLogo}" alt="" />
              Explore Vite
            </a>
          </li>
          <li>
            <a href="https://react.dev/" target="_blank">
              <img class="button-icon" src="${reactLogo}" alt="" />
              Learn more
            </a>
          </li>
        </ul>
      </div>
      <div id="social">
        <svg class="icon" role="presentation" aria-hidden="true">
          <use href="/icons.svg#social-icon"></use>
        </svg>
        <h2>Connect with us</h2>
        <p>Join the Vite community</p>
        <ul>
          <li>
            <a href="https://github.com/vitejs/vite" target="_blank">
              <svg class="button-icon" role="presentation" aria-hidden="true">
                <use href="/icons.svg#github-icon"></use>
              </svg>
              GitHub
            </a>
          </li>
          <li>
            <a href="https://chat.vite.dev/" target="_blank">
              <svg class="button-icon" role="presentation" aria-hidden="true">
                <use href="/icons.svg#discord-icon"></use>
              </svg>
              Discord
            </a>
          </li>
          <li>
            <a href="https://x.com/vite_js" target="_blank">
              <svg class="button-icon" role="presentation" aria-hidden="true">
                <use href="/icons.svg#x-icon"></use>
              </svg>
              X.com
            </a>
          </li>
          <li>
            <a href="https://bsky.app/profile/vite.dev" target="_blank">
              <svg class="button-icon" role="presentation" aria-hidden="true">
                <use href="/icons.svg#bluesky-icon"></use>
              </svg>
              Bluesky
            </a>
          </li>
        </ul>
      </div>
    </section>

    <div class="ticks"></div>
    <section id="spacer"></section>
  `;

  let count = 0;
  const counter = container.querySelector<HTMLButtonElement>('.counter')!;
  counter.addEventListener('click', () => {
    count += 1;
    counter.textContent = `Count is ${count}`;
  });
}
