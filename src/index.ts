/**
 * threedeezee — a tilted (2.5D) camera rig for ordinary DOM content.
 *
 * Import 'threedeezee/camera.css' for the structural CSS (required) and
 * 'threedeezee/theme.css' for the default look (optional).
 */
export type { CameraConfig, CameraRig } from './camera';
export { createCamera, initCamera } from './camera';
export type { DragOptions, ToPlaneDelta } from './drag';
export { trackDrag } from './drag';
