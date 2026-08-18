// Normies collab boat seascape — the client-side-only animated background (Sailboat / Yacht) that a Normies
// holder can stand their machine in front of. Shared by the SITE (Owner Canvas preview + the still/bg-layer
// bake) and the RENDERER (live OpenSea animation) so the scene is pixel-identical in both. Pure canvas-2D.

// Crisp pixel-sprite renderer (rows of chars -> palette colors), integer-aligned so edges stay sharp.
function drawPixelSprite(ctx, rows, palette, unit, ox = 0, oy = 0) {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const u = Math.max(1, Math.round(unit));
  const x0 = Math.round(ox - (w * u) / 2);
  const y0 = Math.round(oy - (h * u) / 2);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  for (let j = 0; j < h; j += 1) {
    const row = rows[j];
    for (let i = 0; i < row.length; i += 1) {
      const ch = row[i];
      if (ch === "." || ch === " ") continue;
      const col = palette[ch];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(x0 + i * u, y0 + j * u, u, u);
    }
  }
  ctx.restore();
}

const NORMIES_SAILBOAT = { pal: { F: "#141414", W: "#ffffff", K: "#2b2b2b", b: "#141414" }, rows: [
  "...........b....", "...........b....", "...........F....", "..........FFF...", ".........FFFF...",
  "........FFFFF...", ".......FFFFFF...", "......FFFFFFF...", ".....FFFFFFFF...", "....FFFFFFFFF...",
  "...FFFFFFFFFF...", "..FFFFFFFFFFF...", ".FFFFFFFFFFFF...", "...........F....", ".FFFFFFFFFFFFFF.",
  ".FWWWWWWWWWWWWF.", "..FKKKKKKKKKKF..", "...FFFFFFFFFF...",
] };
const NORMIES_YACHT = { pal: { F: "#141414", W: "#ffffff", K: "#2b2b2b", b: "#141414" }, rows: [
  ".............b...........", ".............b...........", "...........FFFFFF........", "...........FWWWWF........",
  ".......FFFFFFFFFFFF......", ".......FWKWKWKWKWWF......", "..FFFFFFFFFFFFFFFFFFF....", "..FWWWWWWWWWWWWWWWWWFF...",
  "..FWWWWWWWWWWWWWWWWWWWF..", "...FKKKKKKKKKKKKKKKKKKF..", "....FFFFFFFFFFFFFFFFFF...",
] };
const NORMIES_BOAT_BG_KEYS = new Set(["sailboat", "yacht"]);
export function isNormiesBoatBg(key) { return NORMIES_BOAT_BG_KEYS.has(key); }

function normiesSun(ctx, cx, cy, u, t) {
  ctx.fillStyle = "#141414";
  const R = 5;
  for (let gy = -R; gy <= R; gy++) for (let gx = -R; gx <= R; gx++) if (gx * gx + gy * gy <= R * R + 1) ctx.fillRect(Math.round(cx + gx * u), Math.round(cy + gy * u), u, u);
  const rays = [[8, 0], [-8, 0], [0, 8], [0, -8], [6, 6], [-6, 6], [6, -6], [-6, -6], [9, 3], [-9, -3], [3, 9], [-3, -9]];
  for (let i = 0; i < rays.length; i++) { if ((Math.floor(t * 2) + i) % 3 === 0) continue; ctx.fillRect(Math.round(cx + rays[i][0] * u), Math.round(cy + rays[i][1] * u), u, u); }
}
function normiesBird(ctx, cx, cy, u, flap) {
  ctx.fillStyle = "#141414";
  const wy = flap > 0.5 ? -1 : 0;
  for (const [dx, dy] of [[-2, wy], [-1, 0], [0, 1], [1, 0], [2, wy]]) ctx.fillRect(Math.round(cx + dx * u), Math.round(cy + dy * u), u, u);
}

// Draw the full seascape into a W×H context at time t (seconds). The machine stands in front of it.
export function drawNormiesBoatScene(ctx, W, H, which, t) {
  const boat = which === "yacht" ? NORMIES_YACHT : NORMIES_SAILBOAT;
  const horizon = H * 0.56;
  const u = Math.max(2, Math.round(H / 190));
  ctx.fillStyle = "#eef4f6"; ctx.fillRect(0, 0, W, H); // sky
  const step = u * 2;
  const seaTop = (x) => horizon + Math.round(Math.sin(x * 0.010 + t * 0.5) * 4 + Math.sin(x * 0.026 + t * 0.9) * 2) * u;
  ctx.fillStyle = "#cfe0e6";
  for (let x = 0; x < W; x += step) { const yt = seaTop(x); ctx.fillRect(x, yt, step, H - yt); }
  for (let y = horizon; y < H; y += u * 2) {
    const depth = (y - horizon) / (H - horizon);
    ctx.fillStyle = depth > 0.5 ? "#9fb8c0" : "#b9ccd2";
    const off = Math.floor((t * (12 + depth * 24)) % (u * 6));
    for (let x = -off; x < W; x += u * 6) {
      const wob = (Math.sin(x * 0.014 + y * 0.03 + t * 0.9) * 2.2 + Math.sin(x * 0.031 - t * 0.6) * 1.3) * u * (0.4 + depth * 0.8);
      const yy = Math.round(y + wob);
      if (yy <= seaTop(x)) continue;
      const len = (Math.floor(x / (u * 6) + y) % 2) ? u * 3 : u * 2;
      ctx.fillRect(x, yy, len, u);
    }
  }
  const su = Math.max(2, Math.round(H / 150));
  normiesSun(ctx, W * 0.83, H * 0.13, su, t);
  const bu = Math.max(2, Math.round(H / 180));
  for (let i = 0; i < 3; i++) { const bx = ((t * (8 + i * 4) + i * 400) % (W + 100)) - 50; const by = H * (0.09 + i * 0.045) + Math.sin(t * 0.6 + i) * 4; normiesBird(ctx, bx, by, bu, Math.sin(t * 6 + i * 2) * 0.5 + 0.5); }
  const bx = W / 2 + Math.sin(t * 0.13) * W * 0.34 + Math.sin(t * 0.071 + 1.3) * W * 0.13;
  const by = horizon + (H - horizon) * 0.14 + Math.sin(t * 0.9) * 3;
  const bunit = Math.max(2, Math.round(H / 115));
  const dir = Math.cos(t * 0.13) >= 0 ? 1 : -1;
  ctx.fillStyle = "rgba(255,255,255,0.7)"; for (let i = 0; i < 5; i++) { const wx = bx - dir * (16 + i * 7) * bunit; ctx.fillRect(wx, by + 8 * bunit + Math.sin(t * 3 + i) * 2, 4 * bunit, 3); }
  ctx.save(); ctx.translate(bx, by); ctx.rotate(Math.sin(t * 0.7) * 0.03 * dir); ctx.imageSmoothingEnabled = false;
  drawPixelSprite(ctx, boat.rows, boat.pal, bunit, 0, 0);
  ctx.restore();
}
