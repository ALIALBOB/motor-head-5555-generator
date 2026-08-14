// Per-part FIRE effect, v2 — SILHOUETTE-MATCHED.
// For each big plate/gear/head, we render the part's exact shape, then fill that exact silhouette with
// flames (transparent everywhere else) + a few flames licking above its top edge. Overlaid on the base
// part at the same position/scale, so the fire fits every plate and every head shape precisely.
import { drawPart, partBounds } from "./parts.js";

export const FIRE_BG = "#1a0f08";
const rnd = (s) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const PAD = 96; // must match drawPart's pad so the composite aligns exactly

function makeCanvas(w, h) {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(w, h);
  const c = document.createElement("canvas"); c.width = w; c.height = h; return c;
}
function isFireable(part) {
  const k = (part.key || "").toLowerCase(), r = (part.role || "").toLowerCase();
  return k.includes("plate") || k.includes("gear") || k.includes("panel") || k.includes("grille") || k.includes("mesh") || k.includes("shell") || r === "chassis";
}
function localPart(part) { return { ...part, x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false, opacity: 1 }; }

function flameTongue(ctx, x, baseY, h, seed) {
  const wob = (rnd(seed) - 0.5) * h * 0.3, wd = h * 0.34;
  for (const [col, sc] of [["rgba(196,38,0,0.92)", 1.0], ["rgba(255,122,31,0.94)", 0.7], ["rgba(255,214,74,0.98)", 0.42]]) {
    ctx.fillStyle = col; ctx.beginPath();
    ctx.moveTo(x - wd * sc, baseY);
    ctx.quadraticCurveTo(x - wd * sc * 0.7, baseY - h * sc * 0.5, x + wob * sc, baseY - h * sc);
    ctx.quadraticCurveTo(x + wd * sc * 0.7, baseY - h * sc * 0.5, x + wd * sc, baseY);
    ctx.quadraticCurveTo(x, baseY + h * 0.06, x - wd * sc, baseY); ctx.closePath(); ctx.fill();
  }
}

// Build a fire canvas for one part, shaped to its exact silhouette. Returns { fire, b } or null.
function firePartLayer(part, scale) {
  const b = partBounds({ ...part, scaleX: 1, scaleY: 1 });
  const W = Math.max(1, Math.ceil(b.w + PAD * 2)), H = Math.max(1, Math.ceil(b.h + PAD * 2));
  // 1) render the part's exact shape (we only use its alpha as a mask)
  const sil = makeCanvas(W, H), sctx = sil.getContext("2d");
  sctx.save(); sctx.translate(PAD - b.x, PAD - b.y); drawPart(sctx, localPart(part), { fastStill: true }); sctx.restore();
  let alpha;
  try { alpha = sctx.getImageData(0, 0, W, H).data; } catch (e) { return null; }
  const left = PAD, right = PAD + b.w, top = PAD, bottom = PAD + b.h, seed = (part.id || part.placementId || 1) * 97 + 13;

  const fire = makeCanvas(W, H), f = fire.getContext("2d");
  // 2) fill the bbox with flame tongues rising from the bottom (this becomes the on-plate fire once masked)
  const step = Math.max(12, Math.round(b.w / 14));
  for (let x = left; x <= right; x += step) {
    const hx = (bottom - top) * (0.55 + rnd(seed + x) * 0.5) * scale;
    flameTongue(f, x + (rnd(seed + x * 3) - 0.5) * 6, bottom - 2, hx, seed + x);
    if (rnd(seed + x * 5) > 0.5) flameTongue(f, x + step * 0.5, bottom - (bottom - top) * 0.35, hx * 0.7, seed + x * 7);
  }
  // 3) mask the fill to the part's EXACT silhouette → fire only on the plate, transparent elsewhere
  f.globalCompositeOperation = "destination-in"; f.drawImage(sil, 0, 0);
  f.globalCompositeOperation = "source-over";
  // 4) flames licking ABOVE the real top edge (follow the silhouette's top contour), not masked
  for (let x = left; x <= right; x += Math.max(14, step)) {
    let topY = -1;
    for (let y = 0; y < H; y += 3) { if (alpha[(y * W + (x | 0)) * 4 + 3] > 40) { topY = y; break; } }
    if (topY < 0) continue;
    const h = (b.w * 0.16 + rnd(seed + x * 2) * b.w * 0.2) * scale;
    flameTongue(f, x, topY + 4, h, seed + x + 99);
  }
  // 5) warm glow behind
  f.globalCompositeOperation = "lighter";
  const cx = (left + right) / 2, g = f.createRadialGradient(cx, (top + bottom) / 2, 6, cx, (top + bottom) / 2, b.w * 0.75);
  g.addColorStop(0, "rgba(255,140,30,0.22)"); g.addColorStop(1, "rgba(255,80,0,0)");
  f.fillStyle = g; f.fillRect(0, 0, W, H);
  f.globalCompositeOperation = "source-over";
  return { fire, b };
}

export function perPartFire(ctx, layout, opts = {}) {
  const minW = opts.minW || 70, scale = opts.scale || 0.85;
  const placements = [...(layout.placements || [])].sort((a, b) => (a.z ?? a.zIndex ?? 0) - (b.z ?? b.zIndex ?? 0));
  for (const part of placements) {
    if (!isFireable(part)) continue;
    const bw = Math.abs(partBounds({ ...part, scaleX: 1, scaleY: 1 }).w * (part.scaleX || 1));
    if (bw < minW) continue; // big parts only
    const layer = firePartLayer(part, scale);
    if (!layer) continue;
    ctx.save();
    ctx.translate(part.x, part.y);
    ctx.rotate(part.rotation || 0);
    ctx.scale((part.flipX ? -1 : 1) * (part.scaleX || 1), (part.flipY ? -1 : 1) * (part.scaleY || 1));
    ctx.drawImage(layer.fire, layer.b.x - PAD, layer.b.y - PAD); // same composite as drawPart → exact alignment
    ctx.restore();
  }
}
