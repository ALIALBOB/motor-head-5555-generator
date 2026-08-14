/*
  Real material FX drawn ON TOP of the tinted machine (demo/dev overlay).
  Fire = flames+embers, Ice = icicles+frost+crust, Electric = lightning, Cosmic = nebula+stars.
  Productionizing later = move these into the renderer's material-atmosphere pass.
*/
const rnd = (s) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const hexRgb = (h) => { h = String(h).replace("#", ""); return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) }; };
// HSL→RGB (h in degrees, s/l in 0..1).
function hsl2rgb(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const t2 = (t) => { t = (t % 1 + 1) % 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
  return [Math.round(t2(h + 1 / 3) * 255), Math.round(t2(h) * 255), Math.round(t2(h - 1 / 3) * 255)];
}
// Curated iridescent foil ramp (real holo hue order: pink→violet→blue→cyan→mint→gold), used as a GRADIENT MAP.
const HOLO_RAMP = [[255, 90, 214], [176, 107, 255], [90, 134, 255], [56, 214, 255], [79, 245, 192], [255, 226, 122]];
// The user's teal palette (001E1E→00312F→014848→005958→016764 + a light highlight) as a dark→light gradient map.
const TEAL_RAMP = [[0, 30, 30], [0, 49, 47], [1, 72, 72], [0, 89, 88], [1, 103, 100], [79, 214, 192], [200, 250, 244]];
function rampSample(ramp, p, wrap) {
  const n = ramp.length;
  if (wrap) { p = (p % 1 + 1) % 1; const f = p * n, i = Math.floor(f), t = f - i, a = ramp[i % n], b = ramp[(i + 1) % n]; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  p = Math.max(0, Math.min(0.9999, p)); const f = p * (n - 1), i = Math.floor(f), t = f - i, a = ramp[i], b = ramp[Math.min(n - 1, i + 1)];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

// scan the rendered machine: per-column top/bottom + internal "underside" edges (machine→gap going down)
function scan(ctx, size, bg) {
  try {
    const d = ctx.getImageData(0, 0, size, size).data; const b = hexRgb(bg || "#000"); const step = 4;
    const top = new Array(size).fill(-1), bot = new Array(size).fill(-1), undersides = [];
    const isM = (x, y) => { const i = (y * size + x) * 4; if (d[i + 3] < 10) return false; const dr = d[i] - b.r, dg = d[i + 1] - b.g, db = d[i + 2] - b.b; return dr * dr + dg * dg + db * db > 1500; };
    for (let x = 0; x < size; x += step) {
      let prev = false;
      for (let y = 0; y < size; y += step) {
        const m = isM(x, y);
        if (m) { if (top[x] < 0) top[x] = y; bot[x] = y; }
        else if (prev && y > size * 0.12) undersides.push({ x, y: y - step });
        prev = m;
      }
    }
    return { ok: true, step, top, bot, undersides };
  } catch (e) { return { ok: false }; }
}
function cols(c, size) { const a = []; if (c.ok) for (let x = 0; x < size; x += c.step) if (c.top[x] >= 0) a.push(x); return a; }

// ---------------- FIRE ----------------
function flame(ctx, x, y, hgt, seed) {
  const wob = (rnd(seed) - 0.5) * hgt * 0.35, wdt = hgt * 0.34;
  for (const [col, sc] of [["rgba(150,26,0,0.5)", 1.0], ["rgba(255,110,18,0.62)", 0.72], ["rgba(255,224,96,0.85)", 0.42]]) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - wdt * sc, y);
    ctx.quadraticCurveTo(x - wdt * sc * 0.7, y - hgt * sc * 0.5, x + wob * sc, y - hgt * sc);
    ctx.quadraticCurveTo(x + wdt * sc * 0.7, y - hgt * sc * 0.5, x + wdt * sc, y);
    ctx.quadraticCurveTo(x, y + hgt * 0.08, x - wdt * sc, y); ctx.closePath(); ctx.fill();
  }
}
export function fireFX(ctx, size, skin) {
  const c = scan(ctx, size, skin.background);
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  const glow = ctx.createRadialGradient(size / 2, size * 0.62, 60, size / 2, size * 0.62, size * 0.62);
  glow.addColorStop(0, "rgba(255,120,30,0.22)"); glow.addColorStop(1, "rgba(255,60,0,0)");
  ctx.fillStyle = glow; ctx.fillRect(0, 0, size, size);
  if (c.ok) { for (let x = 0; x < size; x += c.step) { if (c.top[x] < 0 || rnd(x * 1.3) > 0.5) continue; flame(ctx, x, c.top[x] + rnd(x * 3) * 26, 26 + rnd(x * 7) * 74, x); } }
  else { for (let x = 40; x < size; x += 26) flame(ctx, x, size * 0.74 + rnd(x) * 60, 40 + rnd(x * 2) * 80, x); }
  for (let i = 0; i < 90; i++) { const x = rnd(i * 13) * size, y = size * 0.25 + rnd(i * 17) * size * 0.55, r = 0.6 + rnd(i * 19) * 2.2; ctx.fillStyle = `rgba(255,${150 + Math.floor(rnd(i) * 90)},50,${0.25 + rnd(i * 5) * 0.5})`; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
  ctx.restore();
}

// ---------------- ICE ----------------
function icicle(ctx, x, y, len, wd, seed) {
  const g = ctx.createLinearGradient(x, y, x, y + len);
  g.addColorStop(0, "rgba(234,250,255,0.94)"); g.addColorStop(0.5, "rgba(178,228,247,0.72)"); g.addColorStop(1, "rgba(140,200,235,0.10)");
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - wd, y); ctx.lineTo(x + wd, y); ctx.lineTo(x + (rnd(seed) - 0.5) * 3, y + len); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (rnd(seed) - 0.5) * 3, y + len * 0.9); ctx.stroke();
}
function frostStar(ctx, x, y, r, seed) { ctx.strokeStyle = "rgba(226,247,255,0.7)"; ctx.lineWidth = 0.9; for (let a = 0; a < 6; a++) { const g = a * Math.PI / 3 + rnd(seed); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(g) * r, y + Math.sin(g) * r); ctx.stroke(); } }
function frostPatch(ctx, x, y, r, seed) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, "rgba(228,247,255,0.30)"); g.addColorStop(0.6, "rgba(190,228,246,0.14)"); g.addColorStop(1, "rgba(190,228,246,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, r, r * (0.7 + rnd(seed) * 0.5), rnd(seed * 3) * Math.PI, 0, 7); ctx.fill(); }
export function iceFX(ctx, size, skin) {
  const c = scan(ctx, size, skin.background);
  ctx.save();
  if (clipToMachine(ctx, c)) {
    // 1) recolor the WHOLE machine to icy blue — 'color' keeps its own shading/detail, only the hue turns frozen
    ctx.globalCompositeOperation = "color";
    ctx.fillStyle = "#2ea6e0";
    ctx.fillRect(0, 0, size, size);
    // 2) deepen into a richer frozen blue (multiply darkens toward cold, not muddy grey)
    ctx.globalCompositeOperation = "multiply";
    const mg = ctx.createLinearGradient(0, 0, 0, size);
    mg.addColorStop(0, "rgba(196,236,252,1)"); mg.addColorStop(1, "rgba(120,186,224,1)");
    ctx.fillStyle = mg; ctx.fillRect(0, 0, size, size);
    // 3) glossy frozen sheen — bright diagonal light sweep + cool lift so it reads like a glaze of ice
    ctx.globalCompositeOperation = "screen";
    const sg = ctx.createLinearGradient(0, 0, size * 0.42, size);
    sg.addColorStop(0, "rgba(242,253,255,0.55)"); sg.addColorStop(0.5, "rgba(196,234,250,0.12)"); sg.addColorStop(1, "rgba(150,208,238,0.34)");
    ctx.fillStyle = sg; ctx.fillRect(0, 0, size, size);
  }
  ctx.restore();
  // 4) clean cold rim-light along the top contour (no particles, no icicles)
  if (c.ok) {
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "rgba(214,246,255,0.85)"; ctx.lineWidth = 2.2;
    ctx.shadowColor = "rgba(150,225,255,0.9)"; ctx.shadowBlur = 12;
    let started = false; ctx.beginPath();
    for (let x = 0; x < size; x += c.step) { if (c.top[x] < 0) { started = false; continue; } if (!started) { ctx.moveTo(x, c.top[x]); started = true; } else ctx.lineTo(x, c.top[x]); }
    ctx.stroke(); ctx.restore();
  }
}

// ---------------- NEON ----------------
// Recolor the machine silhouette to a neon hue, then bloom it with layered blur ("lighter") for a
// glowing-tube look, on a dimmed frame so it pops. Silhouette-adaptive → works on every MotorHead.
export function neonFX(ctx, size, skin) {
  const neon = hexRgb(skin.accent || skin.edge || "#39f6ff");
  const bg = hexRgb(skin.background || "#000");
  const src = ctx.getImageData(0, 0, size, size).data;
  const oc = document.createElement("canvas"); oc.width = size; oc.height = size; const octx = oc.getContext("2d");
  const out = octx.createImageData(size, size); const o = out.data;
  for (let i = 0; i < src.length; i += 4) {
    const dr = src[i] - bg.r, dg = src[i + 1] - bg.g, db = src[i + 2] - bg.b;
    if (src[i + 3] > 10 && dr * dr + dg * dg + db * db > 1500) { o[i] = neon.r; o[i + 1] = neon.g; o[i + 2] = neon.b; o[i + 3] = 255; }
  }
  octx.putImageData(out, 0, 0);
  ctx.save();
  ctx.fillStyle = "rgba(6,8,22,0.44)"; ctx.fillRect(0, 0, size, size); // dim the frame (night)
  ctx.globalCompositeOperation = "lighter";
  for (const [blur, a] of [[30, 0.42], [15, 0.55], [6, 0.7], [1.5, 0.9]]) { ctx.filter = `blur(${blur}px)`; ctx.globalAlpha = a; ctx.drawImage(oc, 0, 0); }
  ctx.filter = "none"; ctx.globalAlpha = 1;
  for (let i = 0; i < 44; i++) { const x = rnd(i * 7) * size, y = rnd(i * 11) * size; ctx.fillStyle = `rgba(${neon.r},${neon.g},${neon.b},${0.3 + rnd(i) * 0.5})`; ctx.beginPath(); ctx.arc(x, y, 0.7 + rnd(i) * 1.7, 0, 7); ctx.fill(); }
  ctx.restore();
}

// ---------------- HOLO ----------------
// Recolor the WHOLE machine into iridescent holo-chrome: a dark chrome base with an oil-slick rainbow
// that bands across the surface and shifts on the highlights. Silhouette-adaptive like neon.
export function holoFX(ctx, size, skin = {}) {
  const bg = hexRgb(skin.background || "#000");
  const ramp = skin.ramp || HOLO_RAMP;
  const mono = !!skin.mono;                       // teal-chrome = value→ramp (no rainbow cycling)
  const ground = skin.ground || "#05060a";
  const src = ctx.getImageData(0, 0, size, size).data;
  const oc = document.createElement("canvas"); oc.width = size; oc.height = size; const octx = oc.getContext("2d");
  const out = octx.createImageData(size, size); const o = out.data;
  for (let i = 0; i < src.length; i += 4) {
    const dr = src[i] - bg.r, dg = src[i + 1] - bg.g, db = src[i + 2] - bg.b;
    if (src[i + 3] > 10 && dr * dr + dg * dg + db * db > 1500) {
      const p = i / 4, x = p % size, y = (p / size) | 0;
      const lum = (src[i] * 0.299 + src[i + 1] * 0.587 + src[i + 2] * 0.114) / 255; // 0..1 keeps the machine's form
      // GRADIENT MAP: map value (+ a little position banding for iridescence) through the curated ramp.
      const phase = mono ? lum : (lum * 1.5 + (x * 0.9 + y * 1.4) * 0.0016);
      let [r, g, b] = rampSample(ramp, phase, !mono);
      const v = mono ? 1 : (0.10 + Math.pow(lum, 1.5) * 1.02);  // holo: deep chrome shadow → full iridescence on highlights
      r = Math.min(255, r * v); g = Math.min(255, g * v); b = Math.min(255, b * v);
      if (lum > 0.9) { const w = (lum - 0.9) / 0.1; r += (255 - r) * w * 0.85; g += (255 - g) * w * 0.85; b += (255 - b) * w * 0.85; } // white-hot speculars
      o[i] = r; o[i + 1] = g; o[i + 2] = b; o[i + 3] = 255;
    }
  }
  octx.putImageData(out, 0, 0);
  ctx.save();
  ctx.fillStyle = ground; ctx.fillRect(0, 0, size, size); // dark chrome ground
  ctx.drawImage(oc, 0, 0);
  ctx.globalCompositeOperation = "lighter"; // glossy chrome bloom (screen-style, softened — the research's blur+screen)
  for (const [blur, a] of [[16, 0.22], [6, 0.32], [2, 0.4]]) { ctx.filter = `blur(${blur}px)`; ctx.globalAlpha = a; ctx.drawImage(oc, 0, 0); }
  ctx.filter = "none"; ctx.globalAlpha = 1;
  ctx.restore();
}
// Teal-chrome — the SAME gradient-map tech mapped onto the user's teal palette (dark→light), value-driven.
export function tealChromeFX(ctx, size, skin = {}) { holoFX(ctx, size, { ...skin, ramp: TEAL_RAMP, mono: true, ground: "#001414" }); }

// NEON OUTLINE — machine KEEPS its normal colors; a glowing neon halo wraps the silhouette (more recognizable).
export function neonOutlineFX(ctx, size, skin) {
  const neon = hexRgb(skin.accent || skin.edge || "#39f6ff");
  const bg = hexRgb(skin.background || "#000");
  const snap = ctx.getImageData(0, 0, size, size);
  const mc = document.createElement("canvas"); mc.width = size; mc.height = size; mc.getContext("2d").putImageData(snap, 0, 0); // machine snapshot
  const oc = document.createElement("canvas"); oc.width = size; oc.height = size; const octx = oc.getContext("2d");
  const out = octx.createImageData(size, size); const s = snap.data, o = out.data;
  for (let i = 0; i < s.length; i += 4) { const dr = s[i] - bg.r, dg = s[i + 1] - bg.g, db = s[i + 2] - bg.b; if (s[i + 3] > 10 && dr * dr + dg * dg + db * db > 1500) { o[i] = neon.r; o[i + 1] = neon.g; o[i + 2] = neon.b; o[i + 3] = 255; } }
  octx.putImageData(out, 0, 0);
  ctx.save();
  ctx.fillStyle = "rgba(6,8,22,0.5)"; ctx.fillRect(0, 0, size, size); // dim the frame
  ctx.globalCompositeOperation = "lighter"; // glow bloom (will be covered inside by the machine)
  for (const [blur, a] of [[28, 0.55], [14, 0.7], [6, 0.85]]) { ctx.filter = `blur(${blur}px)`; ctx.globalAlpha = a; ctx.drawImage(oc, 0, 0); }
  ctx.filter = "none"; ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over"; ctx.drawImage(mc, 0, 0); // machine back on top -> only the outer halo remains
  ctx.restore();
}

// ---------------- ELECTRIC ----------------
function strokePts(ctx, pts) { ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y); ctx.stroke(); }
function bolt(ctx, x1, y1, x2, y2, segs, seed, depth = 0) {
  const pts = [{ x: x1, y: y1 }];
  for (let i = 1; i < segs; i++) { const t = i / segs; const j = (rnd(seed + i) - 0.5) * (70 * (1 - Math.abs(t - 0.5) * 0.8)); pts.push({ x: x1 + (x2 - x1) * t + j, y: y1 + (y2 - y1) * t + (rnd(seed + i * 3) - 0.5) * 22 }); }
  pts.push({ x: x2, y: y2 });
  ctx.strokeStyle = "rgba(90,150,255,0.5)"; ctx.lineWidth = 5; ctx.shadowColor = "rgba(130,185,255,0.9)"; ctx.shadowBlur = 15; strokePts(ctx, pts);
  ctx.shadowBlur = 6; ctx.strokeStyle = "rgba(238,246,255,0.96)"; ctx.lineWidth = 1.7; strokePts(ctx, pts);
  if (depth < 1) for (let i = 2; i < pts.length - 1; i += 2) { if (rnd(seed + i * 5) < 0.42) { const p = pts[i]; bolt(ctx, p.x, p.y, p.x + (rnd(seed + i) - 0.5) * 130, p.y + 40 + rnd(seed + i * 2) * 80, 4, seed + i * 31, depth + 1); } }
}
export function electricFX(ctx, size, skin) {
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  const gl = ctx.createRadialGradient(size / 2, size * 0.5, 40, size / 2, size * 0.5, size * 0.62);
  gl.addColorStop(0, "rgba(120,200,255,0.12)"); gl.addColorStop(1, "rgba(80,120,255,0)"); ctx.fillStyle = gl; ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 7; i++) { const sx = size * (0.2 + rnd(i * 3) * 0.6), sy = size * (0.13 + rnd(i * 5) * 0.2), ex = size * (0.2 + rnd(i * 7) * 0.6), ey = size * (0.55 + rnd(i * 9) * 0.4); bolt(ctx, sx, sy, ex, ey, 9, i * 13); }
  ctx.shadowBlur = 0;
  for (let i = 0; i < 55; i++) { const x = rnd(i * 7) * size, y = rnd(i * 11) * size; ctx.fillStyle = `rgba(205,232,255,${0.3 + rnd(i) * 0.5})`; ctx.beginPath(); ctx.arc(x, y, 0.6 + rnd(i) * 1.8, 0, 7); ctx.fill(); }
  ctx.restore();
}

// ---------------- COSMIC ----------------
export function cosmicFX(ctx, size, skin) {
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  const clouds = [["rgba(150,90,255,", 0.17], ["rgba(80,140,255,", 0.14], ["rgba(255,90,200,", 0.11]];
  for (let i = 0; i < 7; i++) { const cx = rnd(i * 3) * size, cy = rnd(i * 5) * size, r = 120 + rnd(i * 7) * 260, [col, a] = clouds[i % 3]; const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, col + a + ")"); g.addColorStop(1, col + "0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill(); }
  for (let i = 0; i < 230; i++) { const x = rnd(i * 7) * size, y = rnd(i * 11) * size, r = 0.4 + rnd(i * 13) * 1.6, a = 0.3 + rnd(i * 5) * 0.7; ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
  for (let i = 0; i < 8; i++) { const x = rnd(i * 17) * size, y = rnd(i * 19) * size, r = 2 + rnd(i) * 3; ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - r * 3, y); ctx.lineTo(x + r * 3, y); ctx.moveTo(x, y - r * 3); ctx.lineTo(x, y + r * 3); ctx.stroke(); ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
  ctx.restore();
}

// ---------------- PREMIUM MATERIAL SHADING (fake-3D: form + specular + rim) ----------------
// reflective = chrome/glass/mirror; translucent = jelly/wet; glossy = shiny; matte = stone/cloud; emissive = fire/electric (glow only)
const FINISH = { chrome: "reflective", glass: "reflective", crystal: "reflective", gold: "reflective", ice: "glossy", jelly: "translucent", cosmic: "glossy", toxic: "glossy", fire: "emissive", electric: "emissive", rock: "matte", cloud: "matte" };
function clipToMachine(ctx, c) {
  if (!c.ok) return false;
  ctx.beginPath();
  for (let x = 0; x < 1024; x += c.step) { if (c.top[x] < 0) continue; ctx.rect(x, c.top[x], c.step + 0.5, (c.bot[x] - c.top[x]) + c.step); }
  ctx.clip(); return true;
}
export function premiumMaterial(ctx, size, skin) {
  const finish = skin.finish || FINISH[skin.id] || "glossy";
  if (finish === "emissive") return; // glow FX carries these
  const c = scan(ctx, size, skin.background);
  const spec = finish === "reflective" ? 0.6 : finish === "translucent" ? 0.46 : finish === "glossy" ? 0.32 : 0;
  ctx.save();
  clipToMachine(ctx, c);
  // rounded form: bright top, dark bottom (source-over so colors keep saturation)
  const shad = ctx.createLinearGradient(0, size * 0.3, 0, size); shad.addColorStop(0, "rgba(0,0,0,0)"); shad.addColorStop(1, "rgba(0,0,0,0.36)");
  ctx.fillStyle = shad; ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = "screen";
  const hi = ctx.createLinearGradient(0, 0, 0, size * 0.6); hi.addColorStop(0, "rgba(255,255,255,0.26)"); hi.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = hi; ctx.fillRect(0, 0, size, size);
  // specular sweeps (the "wet/reflective" read)
  if (spec > 0) {
    const s1 = ctx.createLinearGradient(size * 0.12, 0, size * 0.5, size); s1.addColorStop(0.36, "rgba(255,255,255,0)"); s1.addColorStop(0.46, `rgba(255,255,255,${spec})`); s1.addColorStop(0.5, `rgba(255,255,255,${spec})`); s1.addColorStop(0.6, "rgba(255,255,255,0)");
    ctx.fillStyle = s1; ctx.fillRect(0, 0, size, size);
    const s2 = ctx.createLinearGradient(size * 0.34, 0, size * 0.72, size); s2.addColorStop(0.24, "rgba(255,255,255,0)"); s2.addColorStop(0.31, `rgba(255,255,255,${spec * 0.7})`); s2.addColorStop(0.36, "rgba(255,255,255,0)");
    ctx.fillStyle = s2; ctx.fillRect(0, 0, size, size);
    if (finish === "translucent") { const inner = ctx.createRadialGradient(size * 0.5, size * 0.55, 20, size * 0.5, size * 0.55, size * 0.5); inner.addColorStop(0, colorGlow(skin, 0.22)); inner.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = inner; ctx.fillRect(0, 0, size, size); }
  }
  ctx.restore();
  // rim light on the top silhouette
  if (c.ok && spec > 0) {
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = skin.edge || "#fff"; ctx.lineWidth = 2.2; ctx.shadowColor = skin.edge || "#fff"; ctx.shadowBlur = 7; ctx.globalAlpha = finish === "reflective" ? 0.6 : 0.42;
    let started = false; ctx.beginPath();
    for (let x = 0; x < 1024; x += c.step) { if (c.top[x] < 0) { started = false; continue; } if (!started) { ctx.moveTo(x, c.top[x]); started = true; } else ctx.lineTo(x, c.top[x]); }
    ctx.stroke(); ctx.restore();
  }
}
function colorGlow(skin, a) { const e = hexRgb(skin.accent || skin.edge || "#ffffff"); return `rgba(${e.r},${e.g},${e.b},${a})`; }

const FX = { fire: fireFX, ice: iceFX, electric: electricFX, cosmic: cosmicFX, neon: neonFX };
const fxTypeOf = (skin) => skin && (skin.fxType || (FX[skin.id] ? skin.id : null));
export function hasFX(skin) { return !!(skin && (fxTypeOf(skin) || skin.finish || FINISH[skin.id])); }
export function applyMaterialFX(ctx, size, skin) {
  if (!skin) return;
  premiumMaterial(ctx, size, skin);   // gloss/form/rim for reflective·translucent·glossy·matte
  const ft = fxTypeOf(skin);
  if (ft && FX[ft]) FX[ft](ctx, size, skin); // flames·icicles·lightning·nebula on top
}
