// Per-part ICE effect — SILHOUETTE-MATCHED (mirrors part-fire.js).
// For each big plate/gear/head/panel we render the part's EXACT shape, then:
//   1) glaze that shape with a translucent frozen blue (masked to the part),
//   2) add a glossy sheen (only on the glaze),
//   3) pile a white frost/rime CRUST along the part's top contour,
//   4) hang short ICICLES from the part's bottom contour.
// Composited at the part's own position/scale/rotation → ice sits on every part precisely.
import { drawPart, partBounds } from "./parts.js";

export const ICE_BG = "#071a26";
const rnd = (s) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const PAD = 96; // must match drawPart's pad so the composite aligns exactly

function makeCanvas(w, h) {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(w, h);
  const c = document.createElement("canvas"); c.width = w; c.height = h; return c;
}
function isIceable(part) {
  // Ice EVERY sizeable part (head/face included) so the whole machine freezes evenly; tiny trims are size-gated out.
  const k = (part.key || "").toLowerCase();
  if (k.includes("shadow") || k.includes("glow") || k.includes("light")) return false;
  return true;
}
function localPart(part) { return { ...part, x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false, opacity: 1 }; }

function rimeBlob(f, x, y, r, seed) {
  const g = f.createRadialGradient(x, y - r * 0.2, 0, x, y, r);
  g.addColorStop(0, "rgba(250,253,255,0.95)"); g.addColorStop(0.55, "rgba(216,240,251,0.72)"); g.addColorStop(1, "rgba(190,226,245,0)");
  f.fillStyle = g; f.beginPath(); f.arc(x, y, r, 0, 7); f.fill();
}
function icicle(f, x, y, len, wd, seed) {
  const g = f.createLinearGradient(x, y, x, y + len);
  g.addColorStop(0, "rgba(238,250,255,0.96)"); g.addColorStop(0.5, "rgba(190,231,248,0.82)"); g.addColorStop(1, "rgba(150,205,235,0.12)");
  f.fillStyle = g; f.beginPath(); f.moveTo(x - wd, y); f.lineTo(x + wd, y); f.lineTo(x + (rnd(seed) - 0.5) * 2.4, y + len); f.closePath(); f.fill();
  f.strokeStyle = "rgba(255,255,255,0.6)"; f.lineWidth = 0.7; f.beginPath(); f.moveTo(x, y + 1); f.lineTo(x + (rnd(seed) - 0.5) * 2, y + len * 0.85); f.stroke();
}

// Build an ice canvas for one part, shaped to its exact silhouette. Returns { ice, b } or null.
function icePartLayer(part, opts) {
  const scale = opts.scale || 1;
  const b = partBounds({ ...part, scaleX: 1, scaleY: 1 });
  const W = Math.max(1, Math.ceil(b.w + PAD * 2)), H = Math.max(1, Math.ceil(b.h + PAD * 2));
  // 1) render the part's exact shape (alpha used as mask + edge scan)
  const sil = makeCanvas(W, H), sctx = sil.getContext("2d");
  sctx.save(); sctx.translate(PAD - b.x, PAD - b.y); drawPart(sctx, localPart(part), { fastStill: true }); sctx.restore();
  let alpha;
  try { alpha = sctx.getImageData(0, 0, W, H).data; } catch (e) { return null; }
  const left = PAD, right = PAD + b.w, top = PAD, bottom = PAD + b.h, seed = (part.id || part.placementId || 1) * 97 + 13;

  const ice = makeCanvas(W, H), f = ice.getContext("2d");
  // 2) frozen glaze — translucent icy blue over the part body (keeps its detail showing through)
  const gg = f.createLinearGradient(0, top, 0, bottom);
  gg.addColorStop(0, "rgba(198,235,250,0.5)"); gg.addColorStop(1, "rgba(120,186,224,0.52)");
  f.fillStyle = gg; f.fillRect(left - 2, top - 2, b.w + 4, b.h + 4);
  f.globalCompositeOperation = "destination-in"; f.drawImage(sil, 0, 0); // mask to the exact part shape
  // 3) glossy sheen — only over the glaze (source-atop) so it never spills off the part
  f.globalCompositeOperation = "source-atop";
  const sh = f.createLinearGradient(left, top, left + b.w * 0.5, bottom);
  sh.addColorStop(0, "rgba(255,255,255,0.5)"); sh.addColorStop(0.5, "rgba(255,255,255,0.04)"); sh.addColorStop(1, "rgba(214,240,252,0.24)");
  f.fillStyle = sh; f.fillRect(0, 0, W, H);
  f.globalCompositeOperation = "source-over";

  // per-column top/bottom edges of the silhouette
  const colT = new Int16Array(W).fill(-1), colB = new Int16Array(W).fill(-1);
  for (let x = left; x <= right; x++) {
    for (let y = 0; y < H; y += 2) { if (alpha[(y * W + x) * 4 + 3] > 50) { colT[x] = y; break; } }
    for (let y = H - 1; y >= 0; y -= 2) { if (alpha[(y * W + x) * 4 + 3] > 50) { colB[x] = y; break; } }
  }
  // 4) frost/rime CRUST piled on the top contour of the part
  const rStep = Math.max(4, Math.round(b.w / 52));
  for (let x = left; x <= right; x += rStep) {
    const ty = colT[x]; if (ty < 0) continue;
    rimeBlob(f, x + (rnd(seed + x) - 0.5) * 3, ty + (rnd(seed + x * 2) - 0.5) * 2, (3 + rnd(seed + x * 3) * 6) * (0.7 + scale * 0.5), seed + x);
  }
  // 5) short ICICLES hanging from the bottom contour
  if (opts.icicles !== false) {
    const iStep = Math.max(14, Math.round(b.w / 8));
    for (let x = left + iStep * 0.4; x <= right; x += iStep) {
      const by = colB[Math.round(x)]; if (by < 0) continue;
      if (rnd(seed + x * 7) > 0.82) continue; // gaps
      const len = (5 + rnd(seed + x * 5) * Math.min(24, b.h * 0.26)) * scale;
      icicle(f, x + (rnd(seed + x) - 0.5) * 4, by - 1, len, 2 + rnd(seed + x * 2) * 2.2, seed + x);
    }
  }
  return { ice, b };
}

export function perPartIce(ctx, layout, opts = {}) {
  const minW = opts.minW || 58, scale = opts.scale || 0.9;
  const placements = [...(layout.placements || [])].sort((a, b) => (a.z ?? a.zIndex ?? 0) - (b.z ?? b.zIndex ?? 0));
  for (const part of placements) {
    if (!isIceable(part)) continue;
    const bw = Math.abs(partBounds({ ...part, scaleX: 1, scaleY: 1 }).w * (part.scaleX || 1));
    if (bw < minW) continue; // big parts only
    const layer = icePartLayer(part, { scale, icicles: opts.icicles });
    if (!layer) continue;
    ctx.save();
    ctx.translate(part.x, part.y);
    ctx.rotate(part.rotation || 0);
    ctx.scale((part.flipX ? -1 : 1) * (part.scaleX || 1), (part.flipY ? -1 : 1) * (part.scaleY || 1));
    ctx.drawImage(layer.ice, layer.b.x - PAD, layer.b.y - PAD); // same composite as drawPart → exact alignment
    ctx.restore();
  }
}
