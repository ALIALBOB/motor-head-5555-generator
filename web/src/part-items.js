// Item-fitting system: place an ITEM (hat / clothes / background) onto the 2D machine at the right anchor,
// auto-positioned + scaled per token from the layout. Real 3D-render item PNGs (Runway) drop into placeItemImage();
// drawCrown() is a hand-drawn PLACEHOLDER just to prove the fit until real item art exists.
import { partBounds } from "./parts.js";

// Find the head: the widest big part sitting in the upper region of the machine.
export function findHead(layout) {
  const ps = layout.placements || [];
  if (!ps.length) return null;
  const ys = ps.map((p) => p.y), minY = Math.min(...ys), maxY = Math.max(...ys), cut = minY + (maxY - minY) * 0.5;
  let head = null, best = -1;
  for (const p of ps) {
    const b = partBounds({ ...p, scaleX: 1, scaleY: 1 });
    const w = Math.abs(b.w * (p.scaleX || 1));
    if (w < 90 || p.y > cut) continue;
    if (w > best) { best = w; head = { cx: p.x, topY: p.y + b.y * (p.scaleY || 1), w }; }
  }
  return head;
}

// Find the body/chest: the widest big part in the lower region (for clothes).
export function findBody(layout) {
  const ps = layout.placements || [];
  if (!ps.length) return null;
  const ys = ps.map((p) => p.y), minY = Math.min(...ys), maxY = Math.max(...ys), cut = minY + (maxY - minY) * 0.45;
  let body = null, best = -1;
  for (const p of ps) {
    const b = partBounds({ ...p, scaleX: 1, scaleY: 1 });
    const w = Math.abs(b.w * (p.scaleX || 1));
    if (w < 110 || p.y < cut) continue;
    if (w > best) { best = w; body = { cx: p.x, topY: p.y + b.y * (p.scaleY || 1), w }; }
  }
  return body;
}

// Composite a real item image at an anchor (this is the path real 3D item PNGs use).
export function placeItemImage(ctx, img, anchor, opts = {}) {
  if (!img || !anchor) return;
  const scale = opts.scale || 0.9;
  const w = anchor.w * scale, h = w * (img.height / img.width);
  const x = anchor.cx - w / 2;
  const y = anchor.topY - h * (opts.sit ?? 0.82); // sit mostly above the anchor's top edge
  ctx.drawImage(img, x, y, w, h);
}

// ---- PLACEHOLDER hand-drawn crown (until real 3D item art exists) ----
function drawCrown(ctx, cx, baseY, w) {
  const h = w * 0.62, left = cx - w / 2, right = cx + w / 2, bandH = h * 0.34, bandTop = baseY - bandH, peakY = bandTop - (h - bandH), n = 5, sw = w / n;
  ctx.save();
  const grd = ctx.createLinearGradient(0, peakY, 0, baseY);
  grd.addColorStop(0, "#ffe98a"); grd.addColorStop(0.5, "#f0b429"); grd.addColorStop(1, "#a86a12");
  ctx.beginPath(); ctx.moveTo(left, baseY); ctx.lineTo(left, bandTop);
  for (let i = 0; i < n; i++) { const x0 = left + i * sw; ctx.lineTo(x0, bandTop); ctx.lineTo(x0 + sw / 2, peakY); ctx.lineTo(x0 + sw, bandTop); }
  ctx.lineTo(right, bandTop); ctx.lineTo(right, baseY); ctx.closePath();
  ctx.fillStyle = grd; ctx.fill();
  ctx.strokeStyle = "#8a5410"; ctx.lineWidth = Math.max(1, w * 0.012); ctx.stroke();
  const gems = ["#e0455a", "#3f7de0", "#3fbf7a", "#a06fe0", "#e0455a"];
  for (let i = 0; i < n; i++) { const gx = left + (i + 0.5) * sw, gy = bandTop + bandH * 0.5; ctx.fillStyle = gems[i]; ctx.beginPath(); ctx.arc(gx, gy, bandH * 0.24, 0, 7); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.beginPath(); ctx.arc(gx - bandH * 0.08, gy - bandH * 0.08, bandH * 0.08, 0, 7); ctx.fill(); }
  ctx.fillStyle = "rgba(255,255,255,0.32)"; ctx.fillRect(left + w * 0.06, bandTop + bandH * 0.15, w * 0.1, bandH * 0.6);
  for (let i = 0; i < n; i++) { ctx.fillStyle = "#fff2a0"; ctx.beginPath(); ctx.arc(left + (i + 0.5) * sw, peakY + 3, w * 0.022, 0, 7); ctx.fill(); }
  ctx.restore();
}

export function placeHat(ctx, layout) {
  const head = findHead(layout);
  if (head) drawCrown(ctx, head.cx, head.topY + head.w * 0.02, head.w * 0.72);
}
