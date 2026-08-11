# threedeezee

A tilted (2.5D) camera rig for ordinary DOM content. Wrap your normal HTML in a
container, call `createCamera`, and it gains a pannable, zoomable, parallaxed
"holoboard" view — without the library dictating how you draw.

Built with [Vite](https://vitejs.dev/) and
[TypeScript](https://www.typescriptlang.org/); zero runtime dependencies.

## Usage

```html
<div id="scene" style="width: 100vw; height: 100vh">
  <!-- any normal markup -->
</div>
```

```ts
import { createCamera } from 'threedeezee';
import 'threedeezee/camera.css'; // structural CSS (required)
import 'threedeezee/theme.css'; // default look (optional — bring your own)

const rig = createCamera(document.querySelector('#scene')!, {
  // all optional; defaults shown in CameraConfig's docs
  tilt: 30,
  wheel: true, // false leaves scrolling to the page
  panButton: 0, // pan on primary button only; right click stays yours
});
```

`createCamera` adopts the container's existing children onto a plate at the
world centre — reposition the plate from your own stylesheet (`.tdz-plate`).
The rig fills its container, so sizing is the app's call.

## What the engine owns (and what it doesn't)

The engine does three things: the projection stack (lens → tilt/dolly rig →
world plane → parallax backdrop), camera state with configurable input
bindings (wheel dolly, drag pan), and screen↔plane coordinate conversion
(`rig.screenToPlaneDelta`, `rig.screenToPlanePoint`).

Everything else — drag & drop of content, popovers, context menus, theming —
is deliberately left to the consumer, built on the exported `trackDrag`
primitive and the rig's conversion functions. `initCamera` is the
bring-your-own-markup alternative for full control over the DOM stack.

## Development

- `pnpm dev` — serve the demo playground (`demo/`)
- `pnpm build` — build the library to `dist/` (ESM + type declarations + CSS)
- `pnpm lint` — format with Prettier and lint with ESLint
- `pnpm type-check` — run the TypeScript compiler
