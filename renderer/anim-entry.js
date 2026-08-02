// Entry for the animation runtime bundle: re-exports the site's real render engine so a single
// immutable /anim/runtime.js can be served by the worker and imported by every token's /anim page.
export { drawMachine } from "../web/src/renderer.js";
export { getPartRadius, partBounds } from "../web/src/parts.js";
